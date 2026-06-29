"use server"

import { createResponse, getResponseBySendId } from "@/services/responses"
import type { QuestionAnswer } from "@/types"

export async function submitResponseAction(
  sendId: string,
  answers: QuestionAnswer[]
): Promise<{ success: boolean; error?: string }> {
  if (!sendId || answers.length === 0) {
    return { success: false, error: "Respostas inválidas." }
  }

  try {
    const existing = await getResponseBySendId(sendId)
    if (existing) {
      return { success: false, error: "Esta pesquisa já foi respondida." }
    }
  } catch {
    // Let the DB unique constraint handle race conditions
  }

  try {
    await createResponse(sendId, answers)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao salvar resposta."
    if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("duplicate")) {
      return { success: false, error: "Esta pesquisa já foi respondida." }
    }
    return { success: false, error: msg }
  }
}
