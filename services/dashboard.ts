import { createServerClient } from "@/lib/supabase/server"
import type { DashboardStats, Survey, Question } from "@/types"

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = createServerClient()

  const [surveysRes, clientsRes, sendsRes, responsesRes] = await Promise.all([
    db.from("surveys").select("*", { count: "exact", head: true }),
    db.from("clients").select("*", { count: "exact", head: true }),
    db.from("survey_sends").select("*", { count: "exact", head: true }),
    db.from("survey_responses").select("*", { count: "exact", head: true }),
  ])

  const total_surveys = surveysRes.count ?? 0
  const total_clients = clientsRes.count ?? 0
  const total_sends = sendsRes.count ?? 0
  const total_responses = responsesRes.count ?? 0
  const response_rate = total_sends > 0 ? (total_responses / total_sends) * 100 : 0

  return { total_surveys, total_clients, total_sends, total_responses, response_rate }
}

export async function getRecentSurveys(limit = 5): Promise<Survey[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from("surveys")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    questions: (row.questions as unknown as Question[]) ?? [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}
