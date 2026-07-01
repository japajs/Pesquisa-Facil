"use server"

import { revalidatePath } from "next/cache"
import { getAssembleiaById } from "@/services/assembleias"
import { getProprietarioById } from "@/services/proprietarios"
import {
  upsertAssembleiaSend,
  updateAssembleiaSendStatus,
  createAssembleiaRespostas,
} from "@/services/assembleia-votos"
import { sendAssembleiaEmailBatch } from "@/services/email"
import { generateSurveyToken } from "@/lib/tokens"
import { ROUTES } from "@/lib/constants"
import type { AssembleiaRespostaValor } from "@/types"

export interface EnviarAssembleiaResult {
  sent: number
  failed: number
  error?: string
}

export async function enviarAssembleiaAction(
  assembleiaId: string,
  proprietarioIds: string[]
): Promise<EnviarAssembleiaResult> {
  if (!assembleiaId || proprietarioIds.length === 0) {
    return { sent: 0, failed: 0, error: "Selecione pelo menos um proprietário." }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  let assembleia
  try {
    assembleia = await getAssembleiaById(assembleiaId)
    if (!assembleia) return { sent: 0, failed: 0, error: "Assembleia não encontrada." }
  } catch (err) {
    return {
      sent: 0,
      failed: 0,
      error: err instanceof Error ? err.message : "Erro ao buscar assembleia.",
    }
  }

  const pautas = (assembleia.pautas ?? []).map((p) => ({ titulo: p.titulo }))

  const emailInputs: Parameters<typeof sendAssembleiaEmailBatch>[0] = []
  const failedIds: string[] = []

  await Promise.all(
    proprietarioIds.map(async (proprietarioId) => {
      try {
        const proprietario = await getProprietarioById(proprietarioId)
        if (!proprietario) { failedIds.push(proprietarioId); return }

        const token = generateSurveyToken()
        const send = await upsertAssembleiaSend({
          assembleia_id: assembleiaId,
          proprietario_id: proprietarioId,
          token,
        })

        emailInputs.push({
          sendId: send.id,
          to: proprietario.email,
          proprietarioNome: proprietario.nome,
          assembleiaTitulo: assembleia!.titulo,
          assembleiaDescricao: assembleia!.descricao,
          pautas,
          votoUrl: `${appUrl}${ROUTES.publicCondoVoto(token)}`,
        })
      } catch {
        failedIds.push(proprietarioId)
      }
    })
  )

  if (emailInputs.length === 0) {
    return {
      sent: 0,
      failed: failedIds.length,
      error: "Não foi possível preparar nenhum envio.",
    }
  }

  const now = new Date().toISOString()
  const { sent: sentIds, failed: failedEmailIds } = await sendAssembleiaEmailBatch(emailInputs)

  await Promise.all([
    ...sentIds.map((id) => updateAssembleiaSendStatus(id, "sent", now)),
    ...failedEmailIds.map((id) => updateAssembleiaSendStatus(id, "failed")),
  ])

  revalidatePath(ROUTES.dashboard)

  return {
    sent: sentIds.length,
    failed: failedEmailIds.length + failedIds.length,
  }
}

export async function registrarVotosAction(
  sendId: string,
  respostas: { pauta_id: string; resposta: AssembleiaRespostaValor }[]
): Promise<{ success: boolean; error?: string }> {
  if (!sendId || respostas.length === 0) {
    return { success: false, error: "Dados inválidos." }
  }

  try {
    await createAssembleiaRespostas(sendId, respostas)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao registrar votos."
    if (msg.includes("unique") || msg.includes("duplicate") || msg.includes("23505")) {
      return { success: false, error: "Você já votou nesta assembleia." }
    }
    return { success: false, error: msg }
  }
}
