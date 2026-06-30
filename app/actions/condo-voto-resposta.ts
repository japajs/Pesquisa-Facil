"use server"

import { createCondoVoto, getVotoBySendId } from "@/services/condo-votos"
import type { CondoVotoResposta } from "@/types"

export async function votarAction(
  sendId: string,
  resposta: CondoVotoResposta
): Promise<{ success: boolean; error?: string }> {
  if (!sendId || (resposta !== "Sim" && resposta !== "Não")) {
    return { success: false, error: "Voto inválido." }
  }

  try {
    const existing = await getVotoBySendId(sendId)
    if (existing) {
      return { success: false, error: "Você já votou nesta votação." }
    }
  } catch {
    // Let the DB unique constraint handle race conditions
  }

  try {
    await createCondoVoto(sendId, resposta)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao registrar voto."
    if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("duplicate")) {
      return { success: false, error: "Você já votou nesta votação." }
    }
    return { success: false, error: msg }
  }
}
