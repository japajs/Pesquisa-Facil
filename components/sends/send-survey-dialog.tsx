"use client"

import { useState, useTransition } from "react"
import { Send, Loader2, CheckCircle2, AlertCircle, Search } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { sendSurveyAction, type SendSurveyResult } from "@/app/actions/sends"
import type { Survey, Client } from "@/types"

type Step = "compose" | "sending" | "done"

interface SendSurveyDialogProps {
  surveys: Survey[]
  clients: Client[]
}

export function SendSurveyDialog({ surveys, clients }: SendSurveyDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("compose")
  const [surveyId, setSurveyId] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")
  const [result, setResult] = useState<SendSurveyResult | null>(null)
  const [isPending, startTransition] = useTransition()

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.company ?? "").toLowerCase().includes(search.toLowerCase())
  )

  const allVisible = filteredClients.every((c) => selectedIds.has(c.id))

  function toggleClient(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allVisible) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filteredClients.forEach((c) => next.delete(c.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filteredClients.forEach((c) => next.add(c.id))
        return next
      })
    }
  }

  function reset() {
    setStep("compose")
    setSurveyId("")
    setSelectedIds(new Set())
    setSearch("")
    setResult(null)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setTimeout(reset, 300)
  }

  function handleSend() {
    if (!surveyId || selectedIds.size === 0) {
      toast.error("Selecione uma pesquisa e pelo menos um cliente.")
      return
    }
    setStep("sending")
    startTransition(async () => {
      const res = await sendSurveyAction(surveyId, [...selectedIds])
      setResult(res)
      setStep("done")
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`${res.sent} e-mails enviados com sucesso`)
      }
    })
  }

  const canSend = surveyId && selectedIds.size > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" />}>
        <Send className="h-4 w-4" />
        Novo disparo
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo disparo de pesquisa</DialogTitle>
          <DialogDescription>
            Selecione a pesquisa e os clientes que receberão o e-mail.
          </DialogDescription>
        </DialogHeader>

        {/* Step: compose */}
        {(step === "compose" || step === "sending") && (
          <div className="space-y-5">
            {/* Survey selector */}
            <div className="space-y-1.5">
              <Label className="text-sm">Pesquisa</Label>
              {surveys.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma pesquisa criada ainda.
                </p>
              ) : (
                <Select
                  value={surveyId}
                  onValueChange={(v: string | null) => { if (v) setSurveyId(v) }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma pesquisa…" />
                  </SelectTrigger>
                  <SelectContent>
                    {surveys.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Client list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Clientes</Label>
                <span className="text-xs text-muted-foreground">
                  {selectedIds.size} selecionado{selectedIds.size !== 1 ? "s" : ""}
                </span>
              </div>

              {clients.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado.</p>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar clientes…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-8 pl-8 text-sm"
                    />
                  </div>

                  <div className="max-h-52 overflow-y-auto rounded-lg border border-border/60">
                    {/* Select all row */}
                    <label className="flex cursor-pointer items-center gap-2.5 border-b border-border/40 bg-muted/30 px-3 py-2 hover:bg-accent/30">
                      <input
                        type="checkbox"
                        checked={filteredClients.length > 0 && allVisible}
                        onChange={toggleAll}
                        className="accent-primary"
                      />
                      <span className="text-xs font-medium text-muted-foreground">
                        {allVisible ? "Desmarcar todos" : "Selecionar todos"}
                        {search && ` (${filteredClients.length} visíveis)`}
                      </span>
                    </label>

                    {filteredClients.length === 0 ? (
                      <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                        Nenhum cliente encontrado.
                      </p>
                    ) : (
                      filteredClients.map((client) => (
                        <label
                          key={client.id}
                          className="flex cursor-pointer items-center gap-2.5 border-b border-border/30 px-3 py-2 last:border-0 hover:bg-accent/30"
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.has(client.id)}
                            onChange={() => toggleClient(client.id)}
                            className="accent-primary"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{client.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{client.email}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step: done */}
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
              <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSend} disabled={!canSend} className="gap-2">
                <Send className="h-4 w-4" />
                Enviar para {selectedIds.size || "…"}
              </Button>
            </>
          )}
          {step === "sending" && (
            <Button disabled className="w-full gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando {selectedIds.size} e-mail{selectedIds.size !== 1 ? "s" : ""}…
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
