"use client"

import { useActionState, useState } from "react"
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { setupAction, type SetupState } from "./actions"

export function SetupForm() {
  const [state, action, isPending] = useActionState<SetupState, FormData>(setupAction, null)
  const [showPw, setShowPw] = useState(false)

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="nome">Nome completo</Label>
        <Input id="nome" name="nome" placeholder="Seu nome" autoFocus required disabled={isPending} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" placeholder="seu@email.com" required disabled={isPending} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPw ? "text" : "password"}
            placeholder="Mínimo 8 caracteres"
            required
            disabled={isPending}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirmar senha</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type={showPw ? "text" : "password"}
          placeholder="Repita a senha"
          required
          disabled={isPending}
        />
      </div>

      {state?.error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <Button type="submit" className="w-full gap-2" disabled={isPending}>
        {isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin" />Criando conta…</>
        ) : (
          <><ShieldCheck className="h-4 w-4" />Criar conta de administrador</>
        )}
      </Button>
    </form>
  )
}
