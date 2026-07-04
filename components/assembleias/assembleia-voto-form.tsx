"use client"

import { useState, useTransition } from "react"
import { Loader2, Send, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { registrarVotosAction } from "@/app/actions/assembleia-votos"
import type { AssembleiaRespostaValor, Pauta } from "@/types"

const OPCOES: { valor: AssembleiaRespostaValor; colorSelected: string; colorHover: string }[] = [
  {
    valor: "Sim",
    colorSelected: "border-emerald-500 bg-emerald-500 text-white",
    colorHover: "border-border bg-card text-foreground hover:border-emerald-500/60",
  },
  {
    valor: "Não",
    colorSelected: "border-rose-500 bg-rose-500 text-white",
    colorHover: "border-border bg-card text-foreground hover:border-rose-500/60",
  },
  {
    valor: "Abstenção",
    colorSelected: "border-amber-500 bg-amber-500 text-white",
    colorHover: "border-border bg-card text-foreground hover:border-amber-500/60",
  },
]

interface Props {
  sendId: string
  pautas: Pauta[]
  assembleiaTitulo: string
}

export function AssembleiaVotoForm({ sendId, pautas, assembleiaTitulo }: Props) {
  const [respostas, setRespostas] = useState<Record<string, AssembleiaRespostaValor>>({})
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  const allAnswered = pautas.every((p) => respostas[p.id])
  const unansweredCount = pautas.filter((p) => !respostas[p.id]).length

  function pick(pautaId: string, valor: AssembleiaRespostaValor) {
    setRespostas((prev) => ({ ...prev, [pautaId]: valor }))
    if (error) setError(null)
  }

  function handleSubmit() {
    if (!allAnswered) {
      setError(
        `Responda ${unansweredCount === 1 ? "a pauta pendente" : `as ${unansweredCount} pautas pendentes`} antes de confirmar.`
      )
      return
    }
    startTransition(async () => {
      const votos = pautas.map((p) => ({ pauta_id: p.id, resposta: respostas[p.id]! }))
      const result = await registrarVotosAction(sendId, votos)
      if (result.success) {
        setDone(true)
      } else {
        setError(result.error ?? "Erro ao registrar votos. Tente novamente.")
      }
    })
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border/60 bg-card px-6 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/10 ring-1 ring-emerald-400/20">
          <CheckCircle2 className="h-7 w-7 text-emerald-400" />
        </div>
        <div>
          <p className="font-medium">Votos registrados!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sua participação em <span className="font-medium">{assembleiaTitulo}</span> foi
            registrada. Obrigado!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {pautas.map((pauta, i) => {
        const resposta = respostas[pauta.id] ?? null
        return (
          <div
            key={pauta.id}
            className="rounded-xl border border-border/60 bg-card p-5 space-y-4"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary/60">
                Pauta {i + 1}
              </p>
              <p className="mt-1 text-sm font-medium leading-snug">{pauta.titulo}</p>
              {pauta.descricao && (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {pauta.descricao}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {OPCOES.map(({ valor, colorSelected, colorHover }) => {
                const selected = resposta === valor
                return (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => pick(pauta.id, valor)}
                    aria-pressed={selected}
                    className={cn(
                      "flex flex-1 items-center justify-center rounded-xl border-2 py-3.5 text-sm font-medium transition-all",
                      selected ? colorSelected : colorHover
                    )}
                  >
                    {valor}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {allAnswered
            ? `${pautas.length} ${pautas.length === 1 ? "pauta respondida" : "pautas respondidas"}`
            : `${unansweredCount} ${unansweredCount === 1 ? "pauta pendente" : "pautas pendentes"}`}
        </p>
        <Button onClick={handleSubmit} disabled={isPending} className="w-full sm:w-auto">
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          {isPending ? "Enviando…" : "Confirmar votos"}
        </Button>
      </div>
    </div>
  )
}
