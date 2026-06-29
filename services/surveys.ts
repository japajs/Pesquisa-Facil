import { createServerClient } from "@/lib/supabase/server"
import type { Question, Survey } from "@/types"
import type { DbSurveyInsert, DbSurveyUpdate } from "@/lib/supabase/types"

function rowToSurvey(row: {
  id: string
  title: string
  description: string | null
  questions: unknown
  created_at: string
  updated_at: string
}): Survey {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    questions: (row.questions as Question[]) ?? [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function getAllSurveys(): Promise<Survey[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from("surveys")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToSurvey)
}

export async function getSurveyById(id: string): Promise<Survey | null> {
  const db = createServerClient()
  const { data, error } = await db.from("surveys").select("*").eq("id", id).single()

  if (error) {
    if (error.code === "PGRST116") return null // not found
    throw new Error(error.message)
  }
  return rowToSurvey(data)
}

export async function createSurvey(
  input: Pick<Survey, "title" | "description" | "questions">
): Promise<Survey> {
  const db = createServerClient()
  const insert: DbSurveyInsert = {
    title: input.title,
    description: input.description,
    questions: input.questions as unknown as DbSurveyInsert["questions"],
  }

  const { data, error } = await db.from("surveys").insert(insert).select().single()
  if (error) throw new Error(error.message)
  return rowToSurvey(data)
}

export async function updateSurvey(
  id: string,
  input: Partial<Pick<Survey, "title" | "description" | "questions">>
): Promise<Survey> {
  const db = createServerClient()
  const update: DbSurveyUpdate = {
    ...(input.title !== undefined && { title: input.title }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.questions !== undefined && {
      questions: input.questions as unknown as DbSurveyUpdate["questions"],
    }),
  }

  const { data, error } = await db
    .from("surveys")
    .update(update)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return rowToSurvey(data)
}

export async function deleteSurvey(id: string): Promise<void> {
  const db = createServerClient()
  const { error } = await db.from("surveys").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

export async function countSurveys(): Promise<number> {
  const db = createServerClient()
  const { count, error } = await db
    .from("surveys")
    .select("*", { count: "exact", head: true })

  if (error) throw new Error(error.message)
  return count ?? 0
}
