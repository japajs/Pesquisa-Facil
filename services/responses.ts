import { createServerClient } from "@/lib/supabase/server"
import type { SurveyResponse, QuestionAnswer } from "@/types"
import type { Json } from "@/lib/supabase/types"

function rowToResponse(row: {
  id: string
  send_id: string
  answers: unknown
  responded_at: string
}): SurveyResponse {
  return {
    id: row.id,
    send_id: row.send_id,
    answers: (row.answers as QuestionAnswer[]) ?? [],
    responded_at: row.responded_at,
  }
}

export async function createResponse(
  send_id: string,
  answers: QuestionAnswer[]
): Promise<SurveyResponse> {
  const db = createServerClient()
  const { data, error } = await db
    .from("survey_responses")
    .insert({ send_id, answers: answers as unknown as Json })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return rowToResponse(data)
}

export async function getResponseBySendId(send_id: string): Promise<SurveyResponse | null> {
  const db = createServerClient()
  const { data, error } = await db
    .from("survey_responses")
    .select("*")
    .eq("send_id", send_id)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(error.message)
  }
  return rowToResponse(data)
}

export async function countResponses(): Promise<number> {
  const db = createServerClient()
  const { count, error } = await db
    .from("survey_responses")
    .select("*", { count: "exact", head: true })

  if (error) throw new Error(error.message)
  return count ?? 0
}
