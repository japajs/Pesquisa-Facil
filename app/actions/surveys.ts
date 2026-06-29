"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createSurvey, updateSurvey, deleteSurvey } from "@/services/surveys"
import { surveyFormSchema } from "@/lib/validations"
import { ROUTES } from "@/lib/constants"

export type SurveyActionState = { error: string } | null

function parseSurveyFormData(formData: FormData) {
  return {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    questions: JSON.parse((formData.get("questions") as string) || "[]"),
  }
}

export async function createSurveyAction(
  _prev: SurveyActionState,
  formData: FormData
): Promise<SurveyActionState> {
  const result = surveyFormSchema.safeParse(parseSurveyFormData(formData))
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const { title, description, questions } = result.data
  let hasError: string | null = null

  try {
    await createSurvey({ title, description: description ?? null, questions })
    revalidatePath(ROUTES.surveys)
    revalidatePath(ROUTES.dashboard)
  } catch (err) {
    hasError = err instanceof Error ? err.message : "Erro ao criar pesquisa"
  }

  if (hasError) return { error: hasError }
  redirect(ROUTES.surveys)
}

export async function updateSurveyAction(
  id: string,
  _prev: SurveyActionState,
  formData: FormData
): Promise<SurveyActionState> {
  const result = surveyFormSchema.safeParse(parseSurveyFormData(formData))
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const { title, description, questions } = result.data
  let hasError: string | null = null

  try {
    await updateSurvey(id, { title, description: description ?? null, questions })
    revalidatePath(ROUTES.surveys)
    revalidatePath(ROUTES.dashboard)
  } catch (err) {
    hasError = err instanceof Error ? err.message : "Erro ao atualizar pesquisa"
  }

  if (hasError) return { error: hasError }
  redirect(ROUTES.surveys)
}

export async function deleteSurveyAction(id: string): Promise<{ error?: string }> {
  try {
    await deleteSurvey(id)
    revalidatePath(ROUTES.surveys)
    revalidatePath(ROUTES.dashboard)
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao excluir pesquisa" }
  }
}
