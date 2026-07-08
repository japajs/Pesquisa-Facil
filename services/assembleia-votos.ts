import { createServerClient } from "@/lib/supabase/server"
import { getPesoParticipante } from "@/lib/peso"
import type {
  AssembleiaSend,
  AssembleiaResposta,
  AssembleiaRespostaValor,
  AssembleiaApuracao,
  AssembleiaStatus,
  OpcaoApuracao,
  Pauta,
  PautaOpcao,
  SendStatus,
} from "@/types"

type JoinedPautaOpcao = {
  id: string
  pauta_id: string
  ordem: number
  label: string
  created_at: string
}

type JoinedPauta = {
  id: string
  assembleia_id: string
  ordem: number
  titulo: string
  descricao: string | null
  ativa: boolean
  tipo: Pauta["tipo"]
  permite_abstencao: boolean
  created_at: string
  pauta_opcoes: JoinedPautaOpcao[] | null
}

function rowToPautaOpcao(row: JoinedPautaOpcao): PautaOpcao {
  return {
    id: row.id,
    pauta_id: row.pauta_id,
    ordem: row.ordem,
    label: row.label,
    created_at: row.created_at,
  }
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

type RawUnidadeSnapshot = { numero: string; bloco: string | null }

type JoinedSendSnapshot = {
  nome_snapshot: string | null
  cpf_snapshot: string | null
  email_snapshot: string | null
  telefone_snapshot: string | null
  quantidade_unidades_snapshot: number | null
  unidades_snapshot: RawUnidadeSnapshot[] | null
  peso_snapshot: number | null
  votado_em: string | null
  ip_snapshot: string | null
  user_agent_snapshot: string | null
}

type JoinedSend = JoinedSendSnapshot & {
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
  "*, assembleias(id, titulo, descricao, status, data_abertura, data_encerramento, condominios(nome), pautas(id, assembleia_id, ordem, titulo, descricao, ativa, tipo, permite_abstencao, created_at, pauta_opcoes(*))), proprietarios(id, nome, email)"

function rowToSend(row: JoinedSend): AssembleiaSend {
  const a = row.assembleias
  return {
    id: row.id,
    assembleia_id: row.assembleia_id,
    proprietario_id: row.proprietario_id,
    token: row.token,
    status: row.status,
    sent_at: row.sent_at,
    nome_snapshot: row.nome_snapshot,
    cpf_snapshot: row.cpf_snapshot,
    email_snapshot: row.email_snapshot,
    telefone_snapshot: row.telefone_snapshot,
    quantidade_unidades_snapshot: row.quantidade_unidades_snapshot,
    unidades_snapshot: row.unidades_snapshot,
    peso_snapshot: row.peso_snapshot,
    votado_em: row.votado_em,
    ip_snapshot: row.ip_snapshot,
    user_agent_snapshot: row.user_agent_snapshot,
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
              tipo: p.tipo,
              permite_abstencao: p.permite_abstencao,
              created_at: p.created_at,
              opcoes: p.pauta_opcoes
                ? [...p.pauta_opcoes].sort((x, y) => x.ordem - y.ordem).map(rowToPautaOpcao)
                : undefined,
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
    nome_snapshot: data.nome_snapshot,
    cpf_snapshot: data.cpf_snapshot,
    email_snapshot: data.email_snapshot,
    telefone_snapshot: data.telefone_snapshot,
    quantidade_unidades_snapshot: data.quantidade_unidades_snapshot,
    unidades_snapshot: data.unidades_snapshot as { numero: string; bloco: string | null }[] | null,
    peso_snapshot: data.peso_snapshot,
    votado_em: data.votado_em,
    ip_snapshot: data.ip_snapshot,
    user_agent_snapshot: data.user_agent_snapshot,
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

export interface RespostaInput {
  pauta_id: string
  // Para pauta "sim_nao": `resposta` obrigatório. Para "multipla_escolha":
  // ou `opcao_id` (voto na opção), ou `resposta: "Abstenção"` — nunca os dois.
  resposta?: AssembleiaRespostaValor
  opcao_id?: string
}

type SendComProprietarioCompleto = {
  assembleia_id: string
  proprietarios: {
    nome: string
    cpf: string | null
    email: string | null
    telefone: string | null
    unidades: { numero: string; bloco: string | null }[] | null
  } | null
  assembleias: { status: AssembleiaStatus } | null
}

export interface ContextoVoto {
  ip?: string | null
  userAgent?: string | null
}

// Auditoria de segurança: garante que o voto só é aceito enquanto a
// assembleia está "aberta" e que toda pauta respondida pertence a ESSA
// assembleia (nunca a uma outra, mesmo que o chamador tente enviar um
// pauta_id de outro lugar). Sem isso, alguém com um token válido poderia
// votar depois do encerramento ou injetar respostas em pautas alheias.
async function validarVotoOuFalhar(
  db: ReturnType<typeof createServerClient>,
  assembleiaId: string,
  status: AssembleiaStatus,
  pautaIds: string[]
): Promise<void> {
  if (status !== "aberta") {
    throw new Error("Esta assembleia não está aberta para votação.")
  }

  const idsUnicos = [...new Set(pautaIds)]
  const { data: pautasValidas, error } = await db
    .from("pautas")
    .select("id")
    .eq("assembleia_id", assembleiaId)
    .in("id", idsUnicos)

  if (error) throw new Error(error.message)
  if ((pautasValidas ?? []).length !== idsUnicos.length) {
    throw new Error("Pauta inválida para esta assembleia.")
  }
}

// O peso — e, desde a Etapa 3, a identidade completa do proprietário e suas
// unidades — é capturado UMA ÚNICA VEZ aqui, no momento em que o voto é
// registrado, e gravado como snapshot definitivo (`assembleia_respostas.peso`
// e as colunas `*_snapshot` de `assembleia_sends`). Nunca mais recalculado
// depois: uma transferência de unidade ou uma edição de cadastro após o
// voto não altera nada do que já foi registrado (ver lib/peso.ts).
export async function createAssembleiaRespostas(
  sendId: string,
  respostas: RespostaInput[],
  contexto: ContextoVoto = {}
): Promise<void> {
  const db = createServerClient()

  const { data: sendRow, error: sendError } = await db
    .from("assembleia_sends")
    .select("assembleia_id, proprietarios(nome, cpf, email, telefone, unidades(numero, bloco)), assembleias(status)")
    .eq("id", sendId)
    .single()

  if (sendError) throw new Error(sendError.message)
  const send = sendRow as unknown as SendComProprietarioCompleto
  const proprietario = send.proprietarios

  await validarVotoOuFalhar(
    db,
    send.assembleia_id,
    send.assembleias?.status ?? "encerrada",
    respostas.map((r) => r.pauta_id)
  )

  const unidades = proprietario?.unidades ?? []
  const peso = getPesoParticipante({ unidades })

  const { error } = await db.from("assembleia_respostas").insert(
    respostas.map((r) => ({
      send_id: sendId,
      pauta_id: r.pauta_id,
      resposta: r.resposta ?? null,
      opcao_id: r.opcao_id ?? null,
      peso,
    }))
  )

  if (error) throw new Error(error.message)

  // Snapshot definitivo em assembleia_sends — não afeta assembleia_respostas.peso
  // acima (já gravado) nem a apuração (que só lê aquele campo).
  const { error: snapshotError } = await db
    .from("assembleia_sends")
    .update({
      nome_snapshot: proprietario?.nome ?? null,
      cpf_snapshot: proprietario?.cpf ?? null,
      email_snapshot: proprietario?.email ?? null,
      telefone_snapshot: proprietario?.telefone ?? null,
      quantidade_unidades_snapshot: unidades.length,
      unidades_snapshot: unidades,
      peso_snapshot: peso,
      votado_em: new Date().toISOString(),
      ip_snapshot: contexto.ip ?? null,
      user_agent_snapshot: contexto.userAgent ?? null,
    })
    .eq("id", sendId)

  if (snapshotError) throw new Error(snapshotError.message)
}

type ApuracaoRow = {
  pauta_id: string
  resposta: AssembleiaRespostaValor | null
  opcao_id: string | null
  peso: number
}

// Apuração de uma pauta "sim_nao" — lê o peso congelado em cada resposta
// (nunca recalculado a partir das unidades atuais do proprietário).
function apurarSimNao(pautaRows: ApuracaoRow[]) {
  let participantesSim = 0
  let participantesNao = 0
  let participantesAbstencao = 0
  let ponderadoSim = 0
  let ponderadoNao = 0
  let ponderadoAbstencao = 0
  let totalApartamentos = 0

  for (const row of pautaRows) {
    const peso = row.peso
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

// Apuração de uma pauta "multipla_escolha" — agrupa por opção votada; quem
// se absteve (resposta = "Abstenção", opcao_id nulo) entra no campo
// `abstencao`, no mesmo formato usado pelas pautas "sim_nao". Peso também
// vem congelado de `row.peso`, nunca recalculado.
function apurarMultiplaEscolha(pauta: Pauta, pautaRows: ApuracaoRow[]) {
  const porOpcao = new Map<string, { participantes: number; ponderado: number }>()
  for (const opcao of pauta.opcoes ?? []) {
    porOpcao.set(opcao.id, { participantes: 0, ponderado: 0 })
  }

  let participantesAbstencao = 0
  let ponderadoAbstencao = 0
  let totalApartamentos = 0

  for (const row of pautaRows) {
    const peso = row.peso
    totalApartamentos += peso

    if (row.opcao_id) {
      const acc = porOpcao.get(row.opcao_id) ?? { participantes: 0, ponderado: 0 }
      acc.participantes += 1
      acc.ponderado += peso
      porOpcao.set(row.opcao_id, acc)
    } else if (row.resposta === "Abstenção") {
      participantesAbstencao += 1
      ponderadoAbstencao += peso
    }
  }

  const opcoes_resultado: OpcaoApuracao[] = (pauta.opcoes ?? []).map((opcao) => {
    const acc = porOpcao.get(opcao.id) ?? { participantes: 0, ponderado: 0 }
    return { opcao_id: opcao.id, label: opcao.label, ...acc }
  })

  return {
    por_participantes: { sim: 0, nao: 0, abstencao: participantesAbstencao },
    ponderado: { sim: 0, nao: 0, abstencao: ponderadoAbstencao },
    total_apartamentos_representados: totalApartamentos,
    opcoes_resultado,
  }
}

// O peso de cada resposta já vem congelado em `peso` (ver createAssembleiaRespostas)
// — a apuração só soma o que foi gravado no momento do voto, nunca recalcula
// a partir das unidades atuais do proprietário.
export async function getApuracaoAssembleia(
  assembleiaId: string,
  pautas: Pauta[]
): Promise<AssembleiaApuracao> {
  const db = createServerClient()

  const [respostasRes, sendsCount] = await Promise.all([
    db
      .from("assembleia_respostas")
      .select("pauta_id, resposta, opcao_id, peso, assembleia_sends!inner(assembleia_id)")
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
    const resultado =
      pauta.tipo === "multipla_escolha"
        ? apurarMultiplaEscolha(pauta, pautaRows)
        : apurarSimNao(pautaRows)

    return { pauta, ...resultado }
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

// Proprietários que já registraram voto em QUALQUER assembleia deste
// condomínio (passada ou em andamento) — usado para restringir a edição de
// CPF (Etapa 2: só editável livremente antes do primeiro voto).
export async function getProprietariosQueJaVotaram(condominioId: string): Promise<Set<string>> {
  const db = createServerClient()
  const { data, error } = await db
    .from("assembleia_respostas")
    .select("assembleia_sends!inner(proprietario_id, assembleias!inner(condominio_id))")
    .eq("assembleia_sends.assembleias.condominio_id", condominioId)

  if (error) throw new Error(error.message)

  type Row = { assembleia_sends: { proprietario_id: string } | null }
  return new Set(
    ((data ?? []) as unknown as Row[])
      .map((r) => r.assembleia_sends?.proprietario_id)
      .filter((id): id is string => Boolean(id))
  )
}
