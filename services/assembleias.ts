import { createServerClient } from "@/lib/supabase/server"
import type { Assembleia, AssembleiaStatus, Pauta, PautaOpcao } from "@/types"

type JoinedPautaOpcao = {
  id: string
  pauta_id: string
  ordem: number
  label: string
  created_at: string
}

type JoinedPauta = {
  id: string
  assembleia_id: string
  ordem: number
  titulo: string
  descricao: string | null
  ativa: boolean
  tipo: Pauta["tipo"]
  permite_abstencao: boolean
  created_at: string
  pauta_opcoes: JoinedPautaOpcao[] | null
}

type JoinedAssembleia = {
  id: string
  condominio_id: string
  titulo: string
  descricao: string | null
  status: AssembleiaStatus
  data_abertura: string | null
  data_encerramento: string | null
  created_at: string
  updated_at: string
  pautas: JoinedPauta[] | null
}

function rowToPautaOpcao(row: JoinedPautaOpcao): PautaOpcao {
  return {
    id: row.id,
    pauta_id: row.pauta_id,
    ordem: row.ordem,
    label: row.label,
    created_at: row.created_at,
  }
}

function rowToPauta(row: JoinedPauta): Pauta {
  return {
    id: row.id,
    assembleia_id: row.assembleia_id,
    ordem: row.ordem,
    titulo: row.titulo,
    descricao: row.descricao,
    ativa: row.ativa,
    tipo: row.tipo,
    permite_abstencao: row.permite_abstencao,
    created_at: row.created_at,
    opcoes: row.pauta_opcoes
      ? [...row.pauta_opcoes].sort((a, b) => a.ordem - b.ordem).map(rowToPautaOpcao)
      : undefined,
  }
}

function rowToAssembleia(row: JoinedAssembleia): Assembleia {
  return {
    id: row.id,
    condominio_id: row.condominio_id,
    titulo: row.titulo,
    descricao: row.descricao,
    status: row.status ?? "rascunho",
    data_abertura: row.data_abertura ?? null,
    data_encerramento: row.data_encerramento ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    pautas: (row.pautas ?? []).map(rowToPauta).sort((a, b) => a.ordem - b.ordem),
  }
}

const SELECT_WITH_PAUTAS = "*, pautas(*, pauta_opcoes(*))"

export async function getAllAssembleias(condominioId: string): Promise<Assembleia[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from("assembleias")
    .select(SELECT_WITH_PAUTAS)
    .eq("condominio_id", condominioId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as JoinedAssembleia[]).map(rowToAssembleia)
}

export async function getAssembleiaById(id: string): Promise<Assembleia | null> {
  const db = createServerClient()
  const { data, error } = await db
    .from("assembleias")
    .select(SELECT_WITH_PAUTAS)
    .eq("id", id)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(error.message)
  }
  return rowToAssembleia(data as unknown as JoinedAssembleia)
}

export async function createAssembleia(
  input: Pick<Assembleia, "condominio_id" | "titulo" | "descricao" | "data_abertura" | "data_encerramento">
): Promise<Assembleia> {
  const db = createServerClient()
  const { data, error } = await db
    .from("assembleias")
    .insert({
      condominio_id: input.condominio_id,
      titulo: input.titulo,
      descricao: input.descricao,
      data_abertura: input.data_abertura,
      data_encerramento: input.data_encerramento,
    })
    .select(SELECT_WITH_PAUTAS)
    .single()

  if (error) throw new Error(error.message)
  return rowToAssembleia(data as unknown as JoinedAssembleia)
}

// Auditoria funcional: mesma proteção de deleteCondominio, aqui na exclusão
// direta de uma assembleia — sem isso, dava pra contornar aquela trava
// excluindo a assembleia em vez do condomínio inteiro.
export async function deleteAssembleia(id: string): Promise<void> {
  const db = createServerClient()

  const { data: sendsVotados, error: votosError } = await db
    .from("assembleia_sends")
    .select("id")
    .eq("assembleia_id", id)
    .not("votado_em", "is", null)
    .limit(1)

  if (votosError) throw new Error(votosError.message)
  if ((sendsVotados ?? []).length > 0) {
    throw new Error(
      "Esta assembleia possui votos registrados e não pode ser excluída, para preservar o histórico de votação."
    )
  }

  const { error } = await db.from("assembleias").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

// Auditoria funcional: transferir uma unidade enquanto há assembleia aberta
// no condomínio pode fazer o peso da unidade ser contado duas vezes (uma no
// voto do dono antigo, outra no voto do novo dono) na mesma apuração — ambos
// calculam o peso "ao vivo" a partir das unidades atuais no momento do voto.
export async function hasAssembleiaAberta(condominioId: string): Promise<boolean> {
  const db = createServerClient()
  const { data, error } = await db
    .from("assembleias")
    .select("id")
    .eq("condominio_id", condominioId)
    .eq("status", "aberta")
    .limit(1)

  if (error) throw new Error(error.message)
  return (data ?? []).length > 0
}

export async function updateAssembleiaStatus(
  id: string,
  status: AssembleiaStatus
): Promise<void> {
  const db = createServerClient()

  // Auditoria de segurança: uma assembleia encerrada é definitiva — nunca
  // pode voltar para rascunho/aberta, não importa quem chame esta função.
  // Sem essa trava, reabrir permitiria novos votos numa assembleia cujo
  // resultado já foi apurado/divulgado.
  const { data: atual, error: fetchError } = await db
    .from("assembleias")
    .select("status")
    .eq("id", id)
    .single()
  if (fetchError) throw new Error(fetchError.message)
  if ((atual as { status: AssembleiaStatus }).status === "encerrada") {
    throw new Error("Assembleia encerrada não pode ser reaberta.")
  }

  const now = new Date().toISOString()
  const updates: {
    status: AssembleiaStatus
    updated_at: string
    data_abertura?: string
    data_encerramento?: string
  } = { status, updated_at: now }

  if (status === "aberta") updates.data_abertura = now
  if (status === "encerrada") updates.data_encerramento = now

  const { error } = await db.from("assembleias").update(updates).eq("id", id)
  if (error) throw new Error(error.message)
}
