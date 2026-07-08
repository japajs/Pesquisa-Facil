"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { compare } from "bcryptjs"
import { headers } from "next/headers"
import { createSession } from "@/lib/auth"
import { findUsuarioByEmail, hasAnyUsuario } from "@/services/usuarios"
import { checkRateLimit } from "@/lib/rate-limit"

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
  from: z.string().optional(),
})

export type LoginState = { error?: string } | null

// Auditoria de segurança: "from" vem direto da URL (?from=...), então não
// basta checar startsWith("/") — "//evil.com" e "/\evil.com" também começam
// com "/" mas o navegador os trata como redirecionamento para outro domínio
// (Open Redirect). Só aceita um caminho relativo de verdade.
function isSafeRedirectPath(path: string): boolean {
  return /^\/(?!\/|\\)/.test(path)
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"
  if (!(await checkRateLimit(`login:${ip}`))) {
    return { error: "Muitas tentativas. Aguarde um momento e tente novamente." }
  }

  const hasUsers = await hasAnyUsuario()
  if (!hasUsers) redirect("/setup")

  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    from: formData.get("from"),
  })

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const { email, password, from } = result.data

  // Delay artificial para dificultar enumeração de usuários por tempo de resposta
  await new Promise((r) => setTimeout(r, 400))

  const user = await findUsuarioByEmail(email)
  if (!user) {
    return { error: "E-mail ou senha incorretos." }
  }

  const senhaCorreta = await compare(password, user.senha_hash)
  if (!senhaCorreta) {
    return { error: "E-mail ou senha incorretos." }
  }

  const sessionUser = { userId: user.id, email: user.email, nome: user.nome, perfil: user.perfil }

  await createSession(sessionUser)

  redirect(from && isSafeRedirectPath(from) ? from : "/dashboard")
}
