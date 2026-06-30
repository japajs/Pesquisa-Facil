"use server"

import { revalidatePath } from "next/cache"
import { createCondoSurvey, deleteCondoSurvey, updateCondoSurveyStatus } from "@/services/condo-surveys"
import { ROUTES } from "@/lib/constants"
import type { CondoVotoStatus } from "@/types"

export async function createCondoSurveyAction(input: {
  condominio_id: string
  titulo: string
  descricao: string
  pergunta: string
}): Promise<{ success: boolean; error?: string }> {
  if (!input.titulo.trim()) return { success: false, error: "Título obrigatório." }
  if (!input.pergunta.trim()) return { success: false, error: "Pergunta obrigatória." }

  try {
    await createCondoSurvey({
      condominio_id: input.condominio_id,
      titulo: input.titulo.trim(),
      descricao: input.descricao.trim() || null,
      pergunta: input.pergunta.trim(),
    })
    revalidatePath(`${ROUTES.condominios}/${input.condominio_id}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao criar votação." }
  }
}

export async function deleteCondoSurveyAction(
  id: string,
  condominioId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteCondoSurvey(id)
    revalidatePath(`${ROUTES.condominios}/${condominioId}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao excluir votação." }
  }
}

export async function updateCondoSurveyStatusAction(
  id: string,
  condominioId: string,
  status: CondoVotoStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateCondoSurveyStatus(id, status)
    revalidatePath(`${ROUTES.condominios}/${condominioId}`)
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao atualizar status.",
    }
  }
}
