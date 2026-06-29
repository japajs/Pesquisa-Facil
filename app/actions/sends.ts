"use server"

import { revalidatePath } from "next/cache"
import { getSurveyById } from "@/services/surveys"
import { getClientById } from "@/services/clients"
import { createSend, updateSendStatus } from "@/services/sends"
import { sendSurveyEmailBatch } from "@/services/email"
import { generateSurveyToken } from "@/lib/tokens"
import { ROUTES } from "@/lib/constants"

export interface SendSurveyResult {
  sent: number
  failed: number
  error?: string
}

export async function sendSurveyAction(
  surveyId: string,
  clientIds: string[]
): Promise<SendSurveyResult> {
  if (!surveyId || clientIds.length === 0) {
    return { sent: 0, failed: 0, error: "Selecione uma pesquisa e pelo menos um cliente." }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  // 1. Fetch survey
  let survey
  try {
    survey = await getSurveyById(surveyId)
    if (!survey) return { sent: 0, failed: 0, error: "Pesquisa não encontrada." }
  } catch (err) {
    return { sent: 0, failed: 0, error: err instanceof Error ? err.message : "Erro ao buscar pesquisa." }
  }

  // 2. Fetch clients and create send records
  const emailInputs: Parameters<typeof sendSurveyEmailBatch>[0] = []
  const failedClients: string[] = []

  await Promise.all(
    clientIds.map(async (clientId) => {
      try {
        const client = await getClientById(clientId)
        if (!client) { failedClients.push(clientId); return }

        const token = generateSurveyToken()
        const send = await createSend({ survey_id: surveyId, client_id: clientId, token })

        emailInputs.push({
          sendId: send.id,
          to: client.email,
          clientName: client.name,
          surveyTitle: survey.title,
          surveyDescription: survey.description,
          surveyUrl: `${appUrl}${ROUTES.publicSurvey(token)}`,
        })
      } catch {
        failedClients.push(clientId)
      }
    })
  )

  if (emailInputs.length === 0) {
    return { sent: 0, failed: failedClients.length, error: "Não foi possível preparar nenhum envio." }
  }

  // 3. Send emails via Resend
  const now = new Date().toISOString()
  const { sent: sentIds, failed: failedIds } = await sendSurveyEmailBatch(emailInputs)

  // 4. Update send statuses in parallel
  await Promise.all([
    ...sentIds.map((id) => updateSendStatus(id, "sent", now)),
    ...failedIds.map((id) => updateSendStatus(id, "failed")),
  ])

  revalidatePath(ROUTES.sends)
  revalidatePath(ROUTES.dashboard)

  return {
    sent: sentIds.length,
    failed: failedIds.length + failedClients.length,
  }
}
