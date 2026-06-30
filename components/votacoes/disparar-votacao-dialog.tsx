"use client"

import { useState, useTransition } from "react"
import { Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { enviarVotacaoAction, type EnviarVotacaoResult } from "@/app/actions/condo-votos"
import { getPesoParticipante } from "@/lib/peso"
import type { CondoSurvey, Proprietario } from "@/types"

type Step = "compose" | "sending" | "done"

interface DispararVotacaoDialogProps {
  condoSurvey: CondoSurvey
  proprietarios: Proprietario[]
}

export function DispararVotacaoDialog({
  condoSurvey,
  proprietarios,
}: DispararVotacaoDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [step, setStep] = useState<Step>("compose")
  const [result, setResult] = useState<EnviarVotacaoResult | null>(null)
  const [isPending, startTransition] = useTransition()

  const allSelected = proprietarios.length > 0 && proprietarios.every((p) => selectedIds.has(p.id))

  function toggleProprietario(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(proprietarios.map((p) => p.id)))
    }
  }

  function reset() {
    setStep("compose")
    setSelectedIds(new Set())
    setResult(null)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setTimeout(reset, 300)
  }

  function handleSend() {
    if (selectedIds.size === 0) {
      toast.error("Selecione pelo menos um proprietário.")
      return
    }
    setStep("sending")
    startTransition(async () => {
      const res = await enviarVotacaoAction(condoSurvey.id, [...selectedIds])
      setResult(res)
      setStep("done")
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`${res.sent} e-mails enviados com sucesso.`)
      }
    })
  }

  const totalApartamentos = [...selectedIds]
    .map((id) => proprietarios.find((p) => p.id === id))
    .filter(Boolean)
    .reduce((sum, p) => sum + getPesoParticipante(p!), 0)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" variant="ghost" />}>
        <Send className="h-3.5 w-3.5" />
        Disparar
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Disparar votação</DialogTitle>
          <DialogDescription className="truncate">{condoSurvey.titulo}</DialogDescription>
        </DialogHeader>

        {(step === "compose" || step === "sending") && (
          <div className="space-y-3">
            <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
              {/* Select all */}
              <label className="flex cursor-pointer items-center gap-2.5 border-b border-border/40 bg-muted/30 px-3 py-2 hover:bg-accent/30">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="accent-primary"
                />
                <span className="text-xs font-medium text-muted-foreground">
                  {allSelected ? "Desmarcar todos" : "Selecionar todos"}
                </span>
              </label>

              {/* Proprietarios */}
              <div className="max-h-56 overflow-y-auto divide-y divide-border/30">
                {proprietarios.length === 0 ? (
                  <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                    Nenhum proprietário cadastrado.
                  </p>
                ) : (
                  proprietarios.map((p) => {
                    const peso = getPesoParticipante(p)
                    return (
                      <label
                        key={p.id}
                        className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5 hover:bg-accent/30"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(p.id)}
                          onChange={() => toggleProprietario(p.id)}
                          className="accent-primary"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{p.nome}</p>
                          <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {peso} {peso === 1 ? "apto" : "aptos"}
                        </span>
                      </label>
                    )
                  })
                )}
              </div>
            </div>

            {selectedIds.size > 0 && (
              <p className="text-xs text-muted-foreground text-right">
                {selectedIds.size} proprietário{selectedIds.size !== 1 ? "s" : ""} ·{" "}
                {totalApartamentos} apartamento{totalApartamentos !== 1 ? "s" : ""} representados
              </p>
            )}
          </div>
        )}

        {step === "done" && result && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            {result.error ? (
              <>
                <AlertCircle className="h-10 w-10 text-destructive" />
                <div>
                  <p className="font-medium">Erro no envio</p>
                  <p className="mt-1 text-sm text-muted-foreground">{result.error}</p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                <div>
                  <p className="font-medium">Disparo concluído!</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{result.sent}</span> enviados
                    {result.failed > 0 && (
                      <>
                        {" · "}
                        <span className="font-medium text-destructive">{result.failed}</span> falharam
                      </>
                    )}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "compose" && (
            <>
              <Button variant="ghost" onClick={() => handleOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSend} disabled={selectedIds.size === 0} className="gap-2">
                <Send className="h-4 w-4" />
                Enviar para {selectedIds.size || "…"}
              </Button>
            </>
          )}
          {step === "sending" && (
            <Button disabled className="w-full gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando…
            </Button>
          )}
          {step === "done" && (
            <Button onClick={() => handleOpenChange(false)}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
