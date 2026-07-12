import { createServerClient } from "@/lib/supabase/server"
import { getAllProprietarios } from "@/services/proprietarios"

export interface ParticipanteRelatorio {
  nome: string
  email: string | null
  telefone: string | null
  respondeu: boolean
  send_status: string
  sent_at: string | null
}

export interface UnidadeRelatorio {
  numero: string
  bloco: string | null
  proprietario: string
  email: string | null
}

export async function getParticipantesByAssembleia(
  assembleiaId: string
): Promise<ParticipanteRelatorio[]> {
  const db = createServerClient()

  type SendRow = {
    id: string
    status: string
    sent_at: string | null
    nome_snapshot: string | null
    email_snapshot: string | null
    telefone_snapshot: string | null
    proprietarios: { nome: string; email: string | null; telefone: string | null } | null
  }

  const { data: sends } = await db
    .from("assembleia_sends")
    .select(
      "id, status, sent_at, nome_snapshot, email_snapshot, telefone_snapshot, proprietarios(nome, email, telefone)"
    )
    .eq("assembleia_id", assembleiaId)

  if (!sends || sends.length === 0) return []

  const sendIds = (sends as unknown as SendRow[]).map((s) => s.id)

  const { data: respostas } = await db
    .from("assembleia_respostas")
    .select("send_id")
    .in("send_id", sendIds)

  const respondedIds = new Set<string>((respostas ?? []).map((r) => r.send_id as string))

  // Etapa 3 — integridade histórica: quem já votou tem os dados congelados
  // no momento do voto (snapshot); o cadastro atual só é usado para quem
  // ainda não votou, já que não existe nenhum snapshot para congelar.
  return (sends as unknown as SendRow[]).map((s) => {
    const respondeu = respondedIds.has(s.id)
    return {
      nome: (respondeu ? s.nome_snapshot : null) ?? s.proprietarios?.nome ?? "—",
      email: (respondeu ? s.email_snapshot : null) ?? s.proprietarios?.email ?? null,
      telefone: (respondeu ? s.telefone_snapshot : null) ?? s.proprietarios?.telefone ?? null,
      respondeu,
      send_status: s.status,
      sent_at: s.sent_at,
    }
  })
}

export interface VotoDetalhado {
  pauta_id: string
  unidades: string
  nome: string
  email: string | null
  resposta: string
}

// Detalhamento de voto por pauta (Unidade/Nome/E-mail/Resposta) para os
// relatórios — usa os campos *_snapshot de Etapa 3 (nome/e-mail/unidades no
// momento do voto), nunca o cadastro atual, pelo mesmo motivo de
// getParticipantesByAssembleia: preservar a integridade histórica mesmo que
// o proprietário seja editado depois. IP, user-agent e data/hora do voto
// (ip_snapshot, user_agent_snapshot, votado_em) continuam gravados no banco
// só para auditoria técnica — nunca lidos aqui, nunca aparecem no relatório.
export async function getVotosDetalhados(assembleiaId: string): Promise<VotoDetalhado[]> {
  const db = createServerClient()

  type RawUnidadeSnapshot = { numero: string; bloco: string | null }

  type RespostaRow = {
    pauta_id: string
    resposta: "Sim" | "Não" | "Abstenção" | null
    opcao_id: string | null
    assembleia_sends: {
      nome_snapshot: string | null
      email_snapshot: string | null
      unidades_snapshot: RawUnidadeSnapshot[] | null
    } | null
    pauta_opcoes: { label: string } | null
  }

  const { data, error } = await db
    .from("assembleia_respostas")
    .select(
      "pauta_id, resposta, opcao_id, assembleia_sends!inner(assembleia_id, nome_snapshot, email_snapshot, unidades_snapshot), pauta_opcoes(label)"
    )
    .eq("assembleia_sends.assembleia_id", assembleiaId)

  if (error) throw new Error(error.message)

  const votos = ((data ?? []) as unknown as RespostaRow[]).map((r) => {
    const unidadesSnapshot = r.assembleia_sends?.unidades_snapshot ?? []
    const unidades = [...unidadesSnapshot]
      .sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }))
      .map((u) => u.numero)
      .join(", ")

    return {
      pauta_id: r.pauta_id,
      unidades: unidades || "—",
      nome: r.assembleia_sends?.nome_snapshot ?? "—",
      email: r.assembleia_sends?.email_snapshot ?? null,
      resposta: r.opcao_id ? (r.pauta_opcoes?.label ?? "—") : (r.resposta ?? "—"),
    }
  })

  return votos.sort((a, b) => a.unidades.localeCompare(b.unidades, undefined, { numeric: true }))
}

export async function getUnidadesRelatorio(condominioId: string): Promise<UnidadeRelatorio[]> {
  const proprietarios = await getAllProprietarios(condominioId)
  const unidades: UnidadeRelatorio[] = []

  for (const p of proprietarios) {
    for (const u of p.unidades ?? []) {
      unidades.push({
        numero: u.numero,
        bloco: u.bloco ?? null,
        proprietario: p.nome,
        email: p.email,
      })
    }
  }

  return unidades.sort((a, b) => {
    const blocoCmp = (a.bloco ?? "").localeCompare(b.bloco ?? "")
    if (blocoCmp !== 0) return blocoCmp
    return a.numero.localeCompare(b.numero, undefined, { numeric: true })
  })
}
