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
    proprietarios: { nome: string; email: string | null; telefone: string | null } | null
  }

  const { data: sends } = await db
    .from("assembleia_sends")
    .select("id, status, sent_at, proprietarios(nome, email, telefone)")
    .eq("assembleia_id", assembleiaId)

  if (!sends || sends.length === 0) return []

  const sendIds = (sends as unknown as SendRow[]).map((s) => s.id)

  const { data: respostas } = await db
    .from("assembleia_respostas")
    .select("send_id")
    .in("send_id", sendIds)

  const respondedIds = new Set<string>((respostas ?? []).map((r) => r.send_id as string))

  return (sends as unknown as SendRow[]).map((s) => ({
    nome: s.proprietarios?.nome ?? "—",
    email: s.proprietarios?.email ?? null,
    telefone: s.proprietarios?.telefone ?? null,
    respondeu: respondedIds.has(s.id),
    send_status: s.status,
    sent_at: s.sent_at,
  }))
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
