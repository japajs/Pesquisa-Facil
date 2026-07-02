import type { Metadata } from "next"
import { Suspense } from "react"
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-primary"
            >
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Pesquisa Fácil</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Entre com seu e-mail e senha para acessar o painel
          </p>
        </div>

        <Suspense fallback={<Skeleton className="h-[120px] w-full rounded-xl" />}>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Acesso restrito a administradores
        </p>
      </div>
    </div>
  )
}
