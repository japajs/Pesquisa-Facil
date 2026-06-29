import { createServerClient } from "@/lib/supabase/server"
import type { SurveySend, SendStatus } from "@/types"

type JoinedSend = {
  id: string
  survey_id: string
  client_id: string
  token: string
  status: SendStatus
  sent_at: string | null
  created_at: string
  surveys: { id: string; title: string } | null
  clients: { id: string; name: string; email: string; company: string | null } | null
}

function rowToSend(row: JoinedSend): SurveySend {
  return {
    id: row.id,
    survey_id: row.survey_id,
    client_id: row.client_id,
    token: row.token,
    status: row.status,
    sent_at: row.sent_at,
    created_at: row.created_at,
    survey: row.surveys ?? undefined,
    client: row.clients ?? undefined,
  }
}

export async function getAllSends(): Promise<SurveySend[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from("survey_sends")
    .select("*, surveys(id, title), clients(id, name, email, company)")
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as JoinedSend[]).map(rowToSend)
}

export async function getSendByToken(token: string): Promise<SurveySend | null> {
  const db = createServerClient()
  const { data, error } = await db
    .from("survey_sends")
    .select("*, surveys(id, title), clients(id, name, email, company)")
    .eq("token", token)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(error.message)
  }
  return rowToSend(data as unknown as JoinedSend)
}

export async function createSend(input: {
  survey_id: string
  client_id: string
  token: string
}): Promise<SurveySend> {
  const db = createServerClient()
  const { data, error } = await db
    .from("survey_sends")
    .insert({ ...input, status: "pending" as const })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return {
    id: data.id,
    survey_id: data.survey_id,
    client_id: data.client_id,
    token: data.token,
    status: data.status as SendStatus,
    sent_at: data.sent_at,
    created_at: data.created_at,
  }
}

export async function updateSendStatus(
  id: string,
  status: SendStatus,
  sent_at?: string
): Promise<void> {
  const db = createServerClient()
  const { error } = await db
    .from("survey_sends")
    .update({ status, ...(sent_at ? { sent_at } : {}) })
    .eq("id", id)

  if (error) throw new Error(error.message)
}

export async function countSends(): Promise<number> {
  const db = createServerClient()
  const { count, error } = await db
    .from("survey_sends")
    .select("*", { count: "exact", head: true })

  if (error) throw new Error(error.message)
  return count ?? 0
}
