"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { hash } from "bcryptjs"
import { createSession } from "@/lib/auth"
import { createUsuario, hasAnyUsuario } from "@/services/usuarios"

const setupSchema = z
  .object({
    nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(8, "Senha deve ter ao menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })

export type SetupState = { error?: string; field?: string } | null

export async function setupAction(_prev: SetupState, formData: FormData): Promise<SetupState> {
  // Guard: só funciona quando não existe nenhum usuário
  const hasUsers = await hasAnyUsuario()
  if (hasUsers) redirect("/login")

  const result = setupSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!result.success) {
    const issue = result.error.issues[0]
    return { error: issue?.message ?? "Dados inválidos", field: issue?.path[0] as string }
  }

  const { nome, email, password } = result.data

  try {
    const senha_hash = await hash(password, 12)
    const user = await createUsuario({ nome, email, senha_hash, perfil: "administrador" })
    const sessionUser = { userId: user.id, email: user.email, nome: user.nome, perfil: user.perfil }
    await createSession(sessionUser)
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao criar usuário." }
  }

  redirect("/dashboard")
}
