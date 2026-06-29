"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { createSession } from "@/lib/auth"

const loginSchema = z.object({
  password: z.string().min(1, "Senha obrigatória"),
  from: z.string().optional(),
})

export type LoginState = {
  error?: string
} | null

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const result = loginSchema.safeParse({
    password: formData.get("password"),
    from: formData.get("from"),
  })

  if (!result.success) {
    return { error: "Senha inválida" }
  }

  const { password, from } = result.data
  const expectedPassword = process.env.AUTH_PASSWORD

  if (!expectedPassword) {
    return { error: "Servidor mal configurado. Contate o administrador." }
  }

  // Constant-time comparison to prevent timing attacks
  const encoder = new TextEncoder()
  const a = encoder.encode(password)
  const b = encoder.encode(expectedPassword)

  let match = a.length === b.length
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) match = false
  }

  if (!match) {
    // Delay to slow brute-force attempts
    await new Promise((resolve) => setTimeout(resolve, 600))
    return { error: "Senha incorreta. Tente novamente." }
  }

  await createSession()

  const destination = from && from.startsWith("/") ? from : "/dashboard"
  redirect(destination)
}

export async function logoutAction(): Promise<void> {
  const { destroySession } = await import("@/lib/auth")
  await destroySession()
  redirect("/login")
}
