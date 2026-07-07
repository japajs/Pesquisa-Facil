import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { ShieldCheck } from "lucide-react"
import { hasAnyUsuario } from "@/services/usuarios"
import { SetupForm } from "./setup-form"

export const metadata: Metadata = { title: "Primeiro acesso" }

// Esta página consulta o banco (hasAnyUsuario) no corpo do Server Component
// — precisa rodar por requisição, nunca ser pré-renderizada em build time
// (quando as variáveis de ambiente do Supabase podem não estar disponíveis).
export const dynamic = "force-dynamic"

export default async function SetupPage() {
  const hasUsers = await hasAnyUsuario()
  if (hasUsers) redirect("/login")

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Primeiro acesso</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie a conta de administrador para começar
          </p>
        </div>

        <SetupForm />

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Esta página desaparece após a criação do primeiro usuário
        </p>
      </div>
    </div>
  )
}
