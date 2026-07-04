import { createServerClient } from "@/lib/supabase/server"
import { getPesoParticipante } from "@/lib/peso"
import type {
  AssembleiaSend,
  AssembleiaResposta,
  AssembleiaRespostaValor,
  AssembleiaApuracao,
  AssembleiaStatus,
  Pauta,
  SendStatus,
} from "@/types"

type JoinedPauta = {
  id: string
  assembleia_id: string
  ordem: number
  titulo: string
  descricao: string | null
  ativa: boolean
  created_at: string
}

type JoinedAssembleia = {
  id: string
  titulo: string
  descricao: string | null
  status: AssembleiaStatus
  data_abertura: string | null
  data_encerramento: string | null
  condominios: { nome: string } | null
  pautas: JoinedPauta[] | null
}

type JoinedSend = {
  id: string
  assembleia_id: string
  proprietario_id: string
  token: string
  status: SendStatus
  sent_at: string | null
  created_at: string
  assembleias: JoinedAssembleia | null
  proprietarios: { id: string; nome: string; email: string } | null
}

const SELECT_SEND_JOINED =
  "*, assembleias(id, titulo, descricao, status, data_abertura, data_encerramento, condominios(nome), pautas(id, assembleia_id, ordem, titulo, descricao, ativa, created_at)), proprietarios(id, nome, email)"

function rowToSend(row: JoinedSend): AssembleiaSend {
  const a = row.assembleias
  return {
    id: row.id,
    assembleia_id: row.assembleia_id,
    proprietario_id: row.proprietario_id,
    token: row.token,
    status: row.status,
    sent_at: row.sent_at,
    created_at: row.created_at,
    assembleia: a
      ? {
          id: a.id,
          titulo: a.titulo,
          descricao: a.descricao,
          status: a.status,
          data_abertura: a.data_abertura,
          data_encerramento: a.data_encerramento,
          condominio_nome: a.condominios?.nome ?? null,
          pautas: (a.pautas ?? [])
            .map((p) => ({
              id: p.id,
              assembleia_id: p.assembleia_id,
              ordem: p.ordem,
              titulo: p.titulo,
              descricao: p.descricao,
              ativa: p.ativa,
              created_at: p.created_at,
            }))
            .sort((x, y) => x.ordem - y.ordem),
        }
      : undefined,
    proprietario: row.proprietarios ?? undefined,
  }
}

export async function getAssembleiaSendByToken(token: string): Promise<AssembleiaSend | null> {
  const db = createServerClient()
  const { data, error } = await db
    .from("assembleia_sends")
    .select(SELECT_SEND_JOINED)
    .eq("token", token)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(error.message)
  }
  return rowToSend(data as unknown as JoinedSend)
}

// Upsert garante que cada proprietário recebe no máximo um send por assembleia.
// Em caso de re-envio, atualiza o token para gerar um novo link.
export async function upsertAssembleiaSend(input: {
  assembleia_id: string
  proprietario_id: string
  token: string
}): Promise<AssembleiaSend> {
  const db = createServerClient()
  const { data, error } = await db
    .from("assembleia_sends")
    .upsert({ ...input, status: "pending" as const }, { onConflict: "assembleia_id,proprietario_id" })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return {
    id: data.id,
    assembleia_id: data.assembleia_id,
    proprietario_id: data.proprietario_id,
    token: data.token,
    status: data.status as SendStatus,
    sent_at: data.sent_at,
    created_at: data.created_at,
  }
}

export async function updateAssembleiaSendStatus(
  id: string,
  status: SendStatus,
  sent_at?: string
): Promise<void> {
  const db = createServerClient()
  const { error } = await db
    .from("assembleia_sends")
    .update({ status, ...(sent_at ? { sent_at } : {}) })
    .eq("id", id)

  if (error) throw new Error(error.message)
}

export async function getRespostasBySendId(sendId: string): Promise<AssembleiaResposta[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from("assembleia_respostas")
    .select("*")
    .eq("send_id", sendId)

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as AssembleiaResposta[]
}

export async function createAssembleiaRespostas(
  sendId: string,
  respostas: { pauta_id: string; resposta: AssembleiaRespostaValor }[]
): Promise<void> {
  const db = createServerClient()
  const { error } = await db
    .from("assembleia_respostas")
    .insert(respostas.map((r) => ({ send_id: sendId, ...r })))

  if (error) throw new Error(error.message)
}

type ApuracaoRow = {
  pauta_id: string
  resposta: AssembleiaRespostaValor
  assembleia_sends: {
    proprietarios: { unidades: { id: string }[] | null } | null
  } | null
}

// O peso de cada voto é recalculado dinamicamente a partir das unidades atuais
// do proprietário — nunca um campo salvo. Ver lib/peso.ts.
export async function getApuracaoAssembleia(
  assembleiaId: string,
  pautas: Pauta[]
): Promise<AssembleiaApuracao> {
  const db = createServerClient()

  const [respostasRes, sendsCount] = await Promise.all([
    db
      .from("assembleia_respostas")
      .select("pauta_id, resposta, assembleia_sends!inner(assembleia_id, proprietarios(unidades(id)))")
      .eq("assembleia_sends.assembleia_id", assembleiaId),
    db
      .from("assembleia_sends")
      .select("*", { count: "exact", head: true })
      .eq("assembleia_id", assembleiaId),
  ])

  if (respostasRes.error) throw new Error(respostasRes.error.message)

  const rows = (respostasRes.data ?? []) as unknown as ApuracaoRow[]
  const total_enviados = sendsCount.count ?? 0

  // Agrupa respostas por pauta
  const byPauta = new Map<string, ApuracaoRow[]>()
  for (const row of rows) {
    const list = byPauta.get(row.pauta_id) ?? []
    list.push(row)
    byPauta.set(row.pauta_id, list)
  }

  const pautaApuracoes = pautas.map((pauta) => {
    const pautaRows = byPauta.get(pauta.id) ?? []

    let participantesSim = 0
    let participantesNao = 0
    let participantesAbstencao = 0
    let ponderadoSim = 0
    let ponderadoNao = 0
    let ponderadoAbstencao = 0
    let totalApartamentos = 0

    for (const row of pautaRows) {
      const unidades = row.assembleia_sends?.proprietarios?.unidades ?? []
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
      pauta,
      por_participantes: { sim: participantesSim, nao: participantesNao, abstencao: participantesAbstencao },
      ponderado: { sim: ponderadoSim, nao: ponderadoNao, abstencao: ponderadoAbstencao },
      total_apartamentos_representados: totalApartamentos,
    }
  })

  // Total de respondidos = respostas para a primeira pauta ativa
  // (as respostas são enviadas de uma vez, todas as pautas juntas)
  const firstPauta = pautas[0]
  const total_respondidos = firstPauta
    ? (byPauta.get(firstPauta.id) ?? []).length
    : 0

  return {
    pautas: pautaApuracoes,
    total_enviados,
    total_respondidos,
  }
}
