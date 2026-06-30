"use server"

import { revalidatePath } from "next/cache"
import { getCondoSurveyById } from "@/services/condo-surveys"
import { getProprietarioById } from "@/services/proprietarios"
import { createCondoSend, updateCondoSendStatus, getApuracao } from "@/services/condo-votos"
import { sendCondoVotoEmailBatch } from "@/services/email"
import { generateSurveyToken } from "@/lib/tokens"
import { ROUTES } from "@/lib/constants"
import type { CondoApuracao } from "@/types"

export interface EnviarVotacaoResult {
  sent: number
  failed: number
  error?: string
}

export async function enviarVotacaoAction(
  condoSurveyId: string,
  proprietarioIds: string[]
): Promise<EnviarVotacaoResult> {
  if (!condoSurveyId || proprietarioIds.length === 0) {
    return { sent: 0, failed: 0, error: "Selecione uma votação e pelo menos um proprietário." }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  let condoSurvey
  try {
    condoSurvey = await getCondoSurveyById(condoSurveyId)
    if (!condoSurvey) return { sent: 0, failed: 0, error: "Votação não encontrada." }
  } catch (err) {
    return {
      sent: 0,
      failed: 0,
      error: err instanceof Error ? err.message : "Erro ao buscar votação.",
    }
  }

  const emailInputs: Parameters<typeof sendCondoVotoEmailBatch>[0] = []
  const failedProprietarios: string[] = []

  await Promise.all(
    proprietarioIds.map(async (proprietarioId) => {
      try {
        const proprietario = await getProprietarioById(proprietarioId)
        if (!proprietario) { failedProprietarios.push(proprietarioId); return }

        const token = generateSurveyToken()
        const send = await createCondoSend({
          condo_survey_id: condoSurveyId,
          proprietario_id: proprietarioId,
          token,
        })

        emailInputs.push({
          sendId: send.id,
          to: proprietario.email,
          proprietarioNome: proprietario.nome,
          condoSurveyTitulo: condoSurvey.titulo,
          condoSurveyDescricao: condoSurvey.descricao,
          condoSurveyPergunta: condoSurvey.pergunta,
          votoUrl: `${appUrl}${ROUTES.publicCondoVoto(token)}`,
        })
      } catch {
        failedProprietarios.push(proprietarioId)
      }
    })
  )

  if (emailInputs.length === 0) {
    return { sent: 0, failed: failedProprietarios.length, error: "Não foi possível preparar nenhum envio." }
  }

  const now = new Date().toISOString()
  const { sent: sentIds, failed: failedIds } = await sendCondoVotoEmailBatch(emailInputs)

  await Promise.all([
    ...sentIds.map((id) => updateCondoSendStatus(id, "sent", now)),
    ...failedIds.map((id) => updateCondoSendStatus(id, "failed")),
  ])

  revalidatePath(ROUTES.dashboard)

  return {
    sent: sentIds.length,
    failed: failedIds.length + failedProprietarios.length,
  }
}

export async function getApuracaoAction(condoSurveyId: string): Promise<CondoApuracao> {
  return getApuracao(condoSurveyId)
}
