"use server"

import { redirect } from "next/navigation"
import { destroySession, getSession } from "@/lib/auth"
import { logAudit } from "@/services/auditoria"

export async function logoutAction(): Promise<void> {
  const session = await getSession()
  await logAudit({ session, acao: "logout", modulo: "auth", descricao: "Logout realizado" })
  await destroySession()
  redirect("/login")
}
