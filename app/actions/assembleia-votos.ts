"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { getAssembleiaById } from "@/services/assembleias"
import { getProprietarioById } from "@/services/proprietarios"
import {
  upsertAssembleiaSend,
  updateAssembleiaSendStatus,
  createAssembleiaRespostas,
  getSendsJaVotaram,
  getSendsNaoVotaram,
  type RespostaInput,
} from "@/services/assembleia-votos"
import { sendAssembleiaEmailBatch, sendNovaPautaEmailBatch, sendLembreteVotoEmailBatch } from "@/services/email"
import { generateSurveyToken } from "@/lib/tokens"
import { requirePerfil, requireAcessoCondominio } from "@/lib/auth"
import { ROUTES } from "@/lib/constants"
import { checkRateLimit } from "@/lib/rate-limit"

export interface EnviarAssembleiaResult {
  sent: number
  failed: number
  error?: string
}

// Item 5: PDF opcional anexado ao disparo (edital/orçamento/memorial
// descritivo/convocação). Vai em Base64 porque Server Actions só aceitam
// argumentos serializáveis — o corpo decodificado é validado abaixo antes de
// seguir para o envio de e-mail.
export interface AnexoDisparo {
  filename: string
  contentBase64: string
}

const ANEXO_TAMANHO_MAXIMO = 8 * 1024 * 1024 // 8MB

function validarAnexoPdf(anexo: AnexoDisparo): { buffer: Buffer; filename: string } | { error: string } {
  if (!anexo.filename.toLowerCase().endsWith(".pdf")) {
    return { error: "O anexo precisa ser um arquivo PDF." }
  }

  let buffer: Buffer
  try {
    buffer = Buffer.from(anexo.contentBase64, "base64")
  } catch {
    return { error: "Não foi possível ler o arquivo anexado." }
  }

  if (buffer.length === 0) {
    return { error: "O arquivo anexado está vazio." }
  }
  if (buffer.length > ANEXO_TAMANHO_MAXIMO) {
    return { error: "O PDF anexado excede o limite de 8MB." }
  }
  // Confere a assinatura do PDF ("%PDF-") independente da extensão do
  // arquivo — defesa extra caso um arquivo renomeado chegue até aqui.
  if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    return { error: "O arquivo anexado não é um PDF válido." }
  }

  return { buffer, filename: anexo.filename }
}

export async function enviarAssembleiaAction(
  assembleiaId: string,
  proprietarioIds: string[],
  anexo?: AnexoDisparo
): Promise<EnviarAssembleiaResult> {
  const auth = await requirePerfil(["administrador", "operador"])
  if (!auth.ok) return { sent: 0, failed: 0, error: auth.error }
  if (!assembleiaId || proprietarioIds.length === 0) {
    return { sent: 0, failed: 0, error: "Selecione pelo menos um proprietário." }
  }

  let anexoValidado: { buffer: Buffer; filename: string } | undefined
  if (anexo) {
    const resultado = validarAnexoPdf(anexo)
    if ("error" in resultado) return { sent: 0, failed: 0, error: resultado.error }
    anexoValidado = resultado
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

  const acesso = await requireAcessoCondominio(assembleia.condominio_id)
  if (!acesso.ok) return { sent: 0, failed: 0, error: acesso.error }

  const pautas = (assembleia.pautas ?? []).map((p) => ({ titulo: p.titulo }))

  const emailInputs: Parameters<typeof sendAssembleiaEmailBatch>[0] = []
  const failedIds: string[] = []

  await Promise.all(
    proprietarioIds.map(async (proprietarioId) => {
      try {
        const proprietario = await getProprietarioById(proprietarioId)
        if (!proprietario || !proprietario.email) { failedIds.push(proprietarioId); return }

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
  const { sent: sentIds, failed: failedEmailIds } = await sendAssembleiaEmailBatch(
    emailInputs,
    anexoValidado ? { filename: anexoValidado.filename, content: anexoValidado.buffer } : undefined
  )

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

export interface NotificarNovaPautaResult {
  success: boolean
  sent: number
  failed: number
  error?: string
}

// Item 5: avisa quem já votou (parcial ou totalmente) sobre uma pauta nova
// adicionada depois — chamada só após confirmação explícita na tela (ver
// AdicionarPautaDialog). Reaproveita o token já existente de cada send, sem
// rotacionar: o mesmo link volta a funcionar e passa a mostrar a pauta
// pendente automaticamente (app/v/[token]/page.tsx).
export async function notificarNovaPautaAction(
  assembleiaId: string,
  pautaId: string
): Promise<NotificarNovaPautaResult> {
  const auth = await requirePerfil(["administrador", "operador"])
  if (!auth.ok) return { success: false, sent: 0, failed: 0, error: auth.error }

  try {
    const assembleia = await getAssembleiaById(assembleiaId)
    if (!assembleia) return { success: false, sent: 0, failed: 0, error: "Assembleia não encontrada." }

    const acesso = await requireAcessoCondominio(assembleia.condominio_id)
    if (!acesso.ok) return { success: false, sent: 0, failed: 0, error: acesso.error }

    const pauta = (assembleia.pautas ?? []).find((p) => p.id === pautaId)
    if (!pauta) return { success: false, sent: 0, failed: 0, error: "Pauta não encontrada." }

    const sends = await getSendsJaVotaram(assembleiaId)
    const comEmail = sends.filter((s) => s.proprietarioEmail)
    if (comEmail.length === 0) return { success: true, sent: 0, failed: 0 }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

    const { sent, failed } = await sendNovaPautaEmailBatch(
      comEmail.map((s) => ({
        sendId: s.id,
        to: s.proprietarioEmail!,
        proprietarioNome: s.proprietarioNome,
        assembleiaTitulo: assembleia.titulo,
        pautaTitulo: pauta.titulo,
        votoUrl: `${appUrl}${ROUTES.publicCondoVoto(s.token)}`,
      }))
    )

    return {
      success: true,
      sent: sent.length,
      failed: failed.length + (sends.length - comEmail.length),
    }
  } catch (err) {
    return {
      success: false,
      sent: 0,
      failed: 0,
      error: err instanceof Error ? err.message : "Erro ao notificar participantes.",
    }
  }
}

export interface NotificarNaoVotaramResult {
  success: boolean
  sent: number
  failed: number
  error?: string
}

// Auditoria de assembleias — Fase 6: lembrete manual pra quem ainda não
// registrou nenhum voto — disparado pelo síndico clicando um botão na tela
// da assembleia (não existe cron/agendamento neste projeto). Reaproveita o
// token já existente de cada send, sem rotacionar.
export async function notificarNaoVotaramAction(
  assembleiaId: string
): Promise<NotificarNaoVotaramResult> {
  const auth = await requirePerfil(["administrador", "operador"])
  if (!auth.ok) return { success: false, sent: 0, failed: 0, error: auth.error }

  try {
    const assembleia = await getAssembleiaById(assembleiaId)
    if (!assembleia) return { success: false, sent: 0, failed: 0, error: "Assembleia não encontrada." }

    const acesso = await requireAcessoCondominio(assembleia.condominio_id)
    if (!acesso.ok) return { success: false, sent: 0, failed: 0, error: acesso.error }

    if (assembleia.status !== "aberta") {
      return {
        success: false,
        sent: 0,
        failed: 0,
        error: "Só é possível notificar enquanto a assembleia estiver aberta.",
      }
    }

    const sends = await getSendsNaoVotaram(assembleiaId)
    const comEmail = sends.filter((s) => s.proprietarioEmail)
    if (comEmail.length === 0) return { success: true, sent: 0, failed: 0 }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

    const { sent, failed } = await sendLembreteVotoEmailBatch(
      comEmail.map((s) => ({
        sendId: s.id,
        to: s.proprietarioEmail!,
        proprietarioNome: s.proprietarioNome,
        assembleiaTitulo: assembleia.titulo,
        dataEncerramento: assembleia.data_encerramento,
        votoUrl: `${appUrl}${ROUTES.publicCondoVoto(s.token)}`,
      }))
    )

    return {
      success: true,
      sent: sent.length,
      failed: failed.length + (sends.length - comEmail.length),
    }
  } catch (err) {
    return {
      success: false,
      sent: 0,
      failed: 0,
      error: err instanceof Error ? err.message : "Erro ao notificar participantes.",
    }
  }
}

export async function registrarVotosAction(
  sendId: string,
  respostas: RespostaInput[]
): Promise<{ success: boolean; error?: string }> {
  if (!sendId || respostas.length === 0) {
    return { success: false, error: "Dados inválidos." }
  }

  // Cada pauta deve ter exatamente uma resposta fixa (Sim/Não/Abstenção) OU
  // uma opção escolhida — nunca as duas, nunca nenhuma. Mesma regra que a
  // constraint XOR do banco garante, mas com uma mensagem amigável aqui.
  const invalida = respostas.some((r) => Boolean(r.resposta) === Boolean(r.opcao_id))
  if (invalida) {
    return { success: false, error: "Dados de voto inválidos." }
  }

  try {
    // Melhor esforço: IP/user-agent viram parte do snapshot histórico do
    // voto (Etapa 3), mas nunca bloqueiam o registro do voto se faltarem.
    const h = await headers()
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null
    const userAgent = h.get("user-agent") ?? null

    // Achado de auditoria LGPD: o envio de voto em si não tinha nenhum
    // limite de tentativas (só a página de leitura do token agora tem).
    if (!(await checkRateLimit(`voto-submit:${ip ?? "unknown"}`))) {
      return { success: false, error: "Muitas tentativas. Aguarde um momento e tente novamente." }
    }

    await createAssembleiaRespostas(sendId, respostas, { ip, userAgent })
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao registrar votos."
    if (msg.includes("unique") || msg.includes("duplicate") || msg.includes("23505")) {
      return { success: false, error: "Você já votou nesta assembleia." }
    }
    return { success: false, error: msg }
  }
}
