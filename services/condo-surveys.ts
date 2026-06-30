import { createServerClient } from "@/lib/supabase/server"
import type { CondoSurvey, CondoVotoStatus } from "@/types"

function rowToCondoSurvey(row: {
  id: string
  condominio_id: string
  titulo: string
  descricao: string | null
  pergunta: string
  status: "rascunho" | "aberta" | "encerrada"
  data_abertura: string | null
  data_encerramento: string | null
  created_at: string
}): CondoSurvey {
  return {
    id: row.id,
    condominio_id: row.condominio_id,
    titulo: row.titulo,
    descricao: row.descricao,
    pergunta: row.pergunta,
    status: row.status ?? "rascunho",
    data_abertura: row.data_abertura ?? null,
    data_encerramento: row.data_encerramento ?? null,
    created_at: row.created_at,
  }
}

export async function getAllCondoSurveys(condominioId: string): Promise<CondoSurvey[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from("condo_surveys")
    .select("*")
    .eq("condominio_id", condominioId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToCondoSurvey)
}

export async function getCondoSurveyById(id: string): Promise<CondoSurvey | null> {
  const db = createServerClient()
  const { data, error } = await db.from("condo_surveys").select("*").eq("id", id).single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(error.message)
  }
  return rowToCondoSurvey(data)
}

export async function createCondoSurvey(
  input: Pick<CondoSurvey, "condominio_id" | "titulo" | "descricao" | "pergunta">
): Promise<CondoSurvey> {
  const db = createServerClient()
  const { data, error } = await db
    .from("condo_surveys")
    .insert({
      condominio_id: input.condominio_id,
      titulo: input.titulo,
      descricao: input.descricao,
      pergunta: input.pergunta,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return rowToCondoSurvey(data)
}

export async function deleteCondoSurvey(id: string): Promise<void> {
  const db = createServerClient()
  const { error } = await db.from("condo_surveys").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

export async function updateCondoSurveyStatus(
  id: string,
  status: CondoVotoStatus
): Promise<void> {
  const db = createServerClient()
  const updates: {
    status: CondoVotoStatus
    data_abertura?: string | null
    data_encerramento?: string | null
  } = { status }

  if (status === "aberta") updates.data_abertura = new Date().toISOString()
  if (status === "encerrada") updates.data_encerramento = new Date().toISOString()

  const { error } = await db.from("condo_surveys").update(updates).eq("id", id)
  if (error) throw new Error(error.message)
}
