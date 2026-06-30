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
      setError("Selecione Sim ou Não para votar.")
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

        <div className="flex gap-3">
          {(["Sim", "Não"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                setResposta(opt)
                if (error) setError(null)
              }}
              aria-pressed={resposta === opt}
              className={cn(
                "flex flex-1 items-center justify-center rounded-xl border-2 py-4 text-sm font-medium transition-all",
                resposta === opt
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/60"
              )}
            >
              {opt}
            </button>
          ))}
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
