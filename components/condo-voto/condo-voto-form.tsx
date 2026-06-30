"use client"

import { useState, useTransition } from "react"
import { Loader2, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Obrigado } from "./obrigado"
import { votarAction } from "@/app/actions/condo-voto-resposta"
import type { CondoVotoResposta } from "@/types"

interface CondoVotoFormProps {
  condoSurveyTitulo: string
  pergunta: string
  sendId: string
}

export function CondoVotoForm({ condoSurveyTitulo, pergunta, sendId }: CondoVotoFormProps) {
  const [resposta, setResposta] = useState<CondoVotoResposta | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    if (!resposta) {
      setError("Selecione uma opção para votar.")
      return
    }

    startTransition(async () => {
      const result = await votarAction(sendId, resposta)
      if (result.success) {
        setDone(true)
      } else {
        setError(result.error ?? "Erro ao registrar voto. Tente novamente.")
      }
    })
  }

  if (done) return <Obrigado condoSurveyTitulo={condoSurveyTitulo} />

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <p className="mb-4 text-sm font-medium leading-snug">{pergunta}</p>

        <div className="flex flex-col gap-3 sm:flex-row">
          {(["Sim", "Não", "Abstenção"] as const).map((opt) => {
            const selected = resposta === opt
            const colorClass =
              opt === "Sim"
                ? selected
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-border bg-card text-foreground hover:border-emerald-500/60"
                : opt === "Não"
                ? selected
                  ? "border-rose-500 bg-rose-500 text-white"
                  : "border-border bg-card text-foreground hover:border-rose-500/60"
                : selected
                ? "border-amber-500 bg-amber-500 text-white"
                : "border-border bg-card text-foreground hover:border-amber-500/60"
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setResposta(opt)
                  if (error) setError(null)
                }}
                aria-pressed={selected}
                className={cn(
                  "flex flex-1 items-center justify-center rounded-xl border-2 py-4 text-sm font-medium transition-all",
                  colorClass
                )}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end pt-1">
        <Button onClick={handleSubmit} disabled={isPending} className="gap-2">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isPending ? "Enviando…" : "Confirmar voto"}
        </Button>
      </div>
    </div>
  )
}
