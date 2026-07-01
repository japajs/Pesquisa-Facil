"use server"

import { revalidatePath } from "next/cache"
import { Resend } from "resend"
import { APP_NAME, ROUTES } from "@/lib/constants"
import { getConfiguracao, setConfiguracao } from "@/services/configuracoes"

// ─── Conta ───────────────────────────────────────────────────────────────────

export async function updateAdminNomeAction(
  nome: string
): Promise<{ success: boolean; error?: string }> {
  if (!nome.trim()) return { success: false, error: "Nome obrigatório." }
  try {
    await setConfiguracao("admin_nome", nome.trim())
    revalidatePath(ROUTES.configuracoes)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao salvar." }
  }
}

export async function updateAdminEmailAction(
  email: string
): Promise<{ success: boolean; error?: string }> {
  if (!email.trim() || !email.includes("@"))
    return { success: false, error: "E-mail inválido." }
  try {
    await setConfiguracao("admin_email", email.trim())
    revalidatePath(ROUTES.configuracoes)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao salvar." }
  }
}

export async function updateSenhaAction(
  senhaAtual: string,
  novaSenha: string
): Promise<{ success: boolean; error?: string }> {
  if (!novaSenha || novaSenha.length < 8)
    return { success: false, error: "Nova senha deve ter pelo menos 8 caracteres." }

  // Verifica senha atual contra DB (se existir) ou env var
  const dbPassword = await getConfiguracao("auth_password")
  const senhaEfetiva =
    dbPassword && dbPassword.trim() ? dbPassword.trim() : process.env.AUTH_PASSWORD ?? ""

  const encoder = new TextEncoder()
  const a = encoder.encode(senhaAtual)
  const b = encoder.encode(senhaEfetiva)
  let match = a.length === b.length
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) match = false
  }

  if (!match) return { success: false, error: "Senha atual incorreta." }

  try {
    await setConfiguracao("auth_password", novaSenha)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao salvar." }
  }
}

// ─── E-mail ───────────────────────────────────────────────────────────────────

export async function updateEmailNomeRemetenteAction(
  nome: string
): Promise<{ success: boolean; error?: string }> {
  if (!nome.trim()) return { success: false, error: "Nome obrigatório." }
  try {
    await setConfiguracao("email_nome_remetente", nome.trim())
    revalidatePath(ROUTES.configuracoes)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao salvar." }
  }
}

export async function enviarEmailTesteAction(
  destinatario?: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  const fromEnv = process.env.RESEND_FROM_EMAIL
  if (!apiKey) return { success: false, error: "RESEND_API_KEY não configurado." }
  if (!fromEnv) return { success: false, error: "RESEND_FROM_EMAIL não configurado." }

  let to = destinatario?.trim()
  if (!to) {
    const adminEmail = await getConfiguracao("admin_email")
    to = adminEmail?.trim() || "admin@exemplo.com"
  }

  try {
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from: fromEnv,
      to,
      subject: `[${APP_NAME}] Teste de e-mail`,
      html: `<p>Este é um e-mail de teste enviado pelo sistema <strong>${APP_NAME}</strong>.</p><p>Se você recebeu esta mensagem, a configuração de e-mail está funcionando corretamente.</p>`,
    })
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao enviar." }
  }
}

// ─── Votação defaults ─────────────────────────────────────────────────────────

export async function updateVotacaoDefaultsAction(defaults: {
  votacao_resposta_unica: boolean
  votacao_ponderada: boolean
  votacao_permite_abstencao: boolean
  votacao_encerramento_automatico: boolean
}): Promise<{ success: boolean; error?: string }> {
  try {
    await Promise.all([
      setConfiguracao("votacao_resposta_unica", String(defaults.votacao_resposta_unica)),
      setConfiguracao("votacao_ponderada", String(defaults.votacao_ponderada)),
      setConfiguracao("votacao_permite_abstencao", String(defaults.votacao_permite_abstencao)),
      setConfiguracao(
        "votacao_encerramento_automatico",
        String(defaults.votacao_encerramento_automatico)
      ),
    ])
    revalidatePath(ROUTES.configuracoes)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao salvar." }
  }
}
