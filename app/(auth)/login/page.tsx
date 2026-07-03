import type { Metadata } from "next"
import { Suspense } from "react"
import { Gavel } from "lucide-react"
import { LoginForm } from "./login-form"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = { title: "Entrar" }

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
            <Gavel className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">CondoAssembleia</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sistema de Assembleias Eletrônicas para Condomínios
          </p>
        </div>

        <Suspense fallback={<Skeleton className="h-[120px] w-full rounded-xl" />}>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Acesso restrito — CondoAssembleia
        </p>
      </div>
    </div>
  )
}
