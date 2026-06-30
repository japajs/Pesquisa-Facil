import { createServerClient } from "@/lib/supabase/server"
import { getPesoParticipante } from "@/lib/peso"
import type {
  CondoApuracao,
  CondoSurveyResponse,
  CondoSurveySend,
  CondoVotoResposta,
  SendStatus,
} from "@/types"

type JoinedSend = {
  id: string
  condo_survey_id: string
  proprietario_id: string
  token: string
  status: SendStatus
  sent_at: string | null
  created_at: string
  condo_surveys: { id: string; titulo: string; descricao: string | null; pergunta: string } | null
  proprietarios: { id: string; nome: string; email: string } | null
}

function rowToSend(row: JoinedSend): CondoSurveySend {
  return {
    id: row.id,
    condo_survey_id: row.condo_survey_id,
    proprietario_id: row.proprietario_id,
    token: row.token,
    status: row.status,
    sent_at: row.sent_at,
    created_at: row.created_at,
    condo_survey: row.condo_surveys ?? undefined,
    proprietario: row.proprietarios ?? undefined,
  }
}

const SELECT_SEND_JOINED =
  "*, condo_surveys(id, titulo, descricao, pergunta), proprietarios(id, nome, email)"

export async function getSendsByCondoSurveyId(condoSurveyId: string): Promise<CondoSurveySend[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from("condo_survey_sends")
    .select(SELECT_SEND_JOINED)
    .eq("condo_survey_id", condoSurveyId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as JoinedSend[]).map(rowToSend)
}

export async function getCondoSendByToken(token: string): Promise<CondoSurveySend | null> {
  const db = createServerClient()
  const { data, error } = await db
    .from("condo_survey_sends")
    .select(SELECT_SEND_JOINED)
    .eq("token", token)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(error.message)
  }
  return rowToSend(data as unknown as JoinedSend)
}

// O token enviado por e-mail só permite localizar este registro, que por sua
// vez aponta para o proprietario_id. O peso nunca trafega no token nem é
// gravado aqui — é sempre recalculado a partir das unidades do proprietário.
export async function createCondoSend(input: {
  condo_survey_id: string
  proprietario_id: string
  token: string
}): Promise<CondoSurveySend> {
  const db = createServerClient()
  const { data, error } = await db
    .from("condo_survey_sends")
    .insert({ ...input, status: "pending" as const })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return {
    id: data.id,
    condo_survey_id: data.condo_survey_id,
    proprietario_id: data.proprietario_id,
    token: data.token,
    status: data.status as SendStatus,
    sent_at: data.sent_at,
    created_at: data.created_at,
  }
}

export async function updateCondoSendStatus(
  id: string,
  status: SendStatus,
  sent_at?: string
): Promise<void> {
  const db = createServerClient()
  const { error } = await db
    .from("condo_survey_sends")
    .update({ status, ...(sent_at ? { sent_at } : {}) })
    .eq("id", id)

  if (error) throw new Error(error.message)
}

function rowToResponse(row: {
  id: string
  send_id: string
  resposta: CondoVotoResposta
  created_at: string
}): CondoSurveyResponse {
  return {
    id: row.id,
    send_id: row.send_id,
    resposta: row.resposta,
    created_at: row.created_at,
  }
}

export async function createCondoVoto(
  send_id: string,
  resposta: CondoVotoResposta
): Promise<CondoSurveyResponse> {
  const db = createServerClient()
  const { data, error } = await db
    .from("condo_survey_responses")
    .insert({ send_id, resposta })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return rowToResponse(data)
}

export async function getVotoBySendId(send_id: string): Promise<CondoSurveyResponse | null> {
  const db = createServerClient()
  const { data, error } = await db
    .from("condo_survey_responses")
    .select("*")
    .eq("send_id", send_id)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(error.message)
  }
  return rowToResponse(data)
}

type ApuracaoRow = {
  resposta: CondoVotoResposta
  condo_survey_sends: {
    proprietarios: { unidades: { id: string }[] | null } | null
  } | null
}

// Apuração 100% dinâmica: o peso de cada voto é recalculado aqui a partir das
// unidades atuais do proprietário (via getPesoParticipante). Nada de peso
// salvo em banco — venda/compra de apartamento já reflete na próxima consulta.
export async function getApuracao(condoSurveyId: string): Promise<CondoApuracao> {
  const db = createServerClient()
  const { data, error } = await db
    .from("condo_survey_responses")
    .select(
      "resposta, condo_survey_sends!inner(condo_survey_id, proprietarios(unidades(id)))"
    )
    .eq("condo_survey_sends.condo_survey_id", condoSurveyId)

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as unknown as ApuracaoRow[]

  let participantesSim = 0
  let participantesNao = 0
  let participantesAbstencao = 0
  let ponderadoSim = 0
  let ponderadoNao = 0
  let ponderadoAbstencao = 0
  let totalApartamentos = 0

  for (const row of rows) {
    const unidades = row.condo_survey_sends?.proprietarios?.unidades ?? []
    const peso = getPesoParticipante({ unidades })
    totalApartamentos += peso

    if (row.resposta === "Sim") {
      participantesSim += 1
      ponderadoSim += peso
    } else if (row.resposta === "Abstenção") {
      participantesAbstencao += 1
      ponderadoAbstencao += peso
    } else {
      participantesNao += 1
      ponderadoNao += peso
    }
  }

  return {
    por_participantes: { sim: participantesSim, nao: participantesNao, abstencao: participantesAbstencao },
    ponderado: { sim: ponderadoSim, nao: ponderadoNao, abstencao: ponderadoAbstencao },
    total_apartamentos_representados: totalApartamentos,
  }
}
