"use client"

import { useState, useTransition } from "react"
import { FileSignature, Loader2, X, Plus } from "lucide-react"
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
import {
  getProcuracoesAction,
  getElegiveisParaProcuracaoAction,
  createProcuracaoAction,
  deleteProcuracaoAction,
} from "@/app/actions/procuracoes"
import type { ProcuracaoComNomes } from "@/types"
import type { ProprietarioSemVoto } from "@/services/assembleia-votos"

interface Props {
  assembleiaId: string
  condominioId: string
}

// Auditoria de assembleias — Fase 8: outorgante (quem delega) precisa ser
// um proprietário já cadastrado no mesmo condomínio do outorgado (quem
// recebe/vota) — nunca uma pessoa externa, de propósito (ver
// services/procuracoes.ts). Só disponível enquanto a assembleia está
// aberta e nenhum dos dois lados já votou.
export function ProcuracoesDialog({ assembleiaId, condominioId }: Props) {
  const [open, setOpen] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [procuracoes, setProcuracoes] = useState<ProcuracaoComNomes[]>([])
  const [elegiveis, setElegiveis] = useState<ProprietarioSemVoto[]>([])
  const [outorganteId, setOutorganteId] = useState("")
  const [outorgadoId, setOutorgadoId] = useState("")
  const [isPendingCriar, startCriarTransition] = useTransition()
  const [removendoId, setRemovendoId] = useState<string | null>(null)
  const [isPendingRemover, startRemoverTransition] = useTransition()

  function carregar() {
    setCarregando(true)
    Promise.all([
      getProcuracoesAction(assembleiaId, condominioId),
      getElegiveisParaProcuracaoAction(assembleiaId, condominioId),
    ]).then(([procResult, elegResult]) => {
      setCarregando(false)
      if (procResult.success) setProcuracoes(procResult.procuracoes)
      else toast.error(procResult.error)
      if (elegResult.success) setElegiveis(elegResult.proprietarios)
      else toast.error(elegResult.error)
    })
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      carregar()
    } else {
      setTimeout(() => {
        setOutorganteId("")
        setOutorgadoId("")
      }, 200)
    }
  }

  function handleCriar() {
    if (!outorganteId || !outorgadoId) return
    startCriarTransition(async () => {
      const result = await createProcuracaoAction(assembleiaId, condominioId, outorganteId, outorgadoId)
      if (result.success) {
        toast.success("Procuração registrada.")
        setOutorganteId("")
        setOutorgadoId("")
        carregar()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleRemover(id: string) {
    setRemovendoId(id)
    startRemoverTransition(async () => {
      const result = await deleteProcuracaoAction(id, assembleiaId, condominioId)
      setRemovendoId(null)
      if (result.success) {
        toast.success("Procuração removida.")
        carregar()
      } else {
        toast.error(result.error)
      }
    })
  }

  const elegiveisOutorgado = elegiveis.filter((p) => p.id !== outorganteId)
  const elegiveisOutorgante = elegiveis.filter((p) => p.id !== outorgadoId)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <FileSignature className="h-3.5 w-3.5" />
        Procurações{procuracoes.length > 0 ? ` (${procuracoes.length})` : ""}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Procurações</DialogTitle>
          <DialogDescription>
            Um proprietário pode outorgar seu voto a outro proprietário já cadastrado neste
            condomínio, pra esta assembleia. Só é possível enquanto nenhum dos dois lados já votou.
          </DialogDescription>
        </DialogHeader>

        {carregando ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {procuracoes.length > 0 && (
              <div className="space-y-1.5">
                {procuracoes.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      <span className="font-medium">{p.outorgante_nome}</span>
                      {" → "}
                      <span className="font-medium">{p.outorgado_nome}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemover(p.id)}
                      disabled={isPendingRemover}
                      className="shrink-0 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    >
                      {isPendingRemover && removendoId === p.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2 rounded-lg border border-dashed border-border/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Nova procuração
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr]">
                <select
                  value={outorganteId}
                  onChange={(e) => setOutorganteId(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="">Outorgante (quem delega)…</option>
                  {elegiveisOutorgante.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
                <span className="hidden items-center justify-center text-xs text-muted-foreground sm:flex">
                  →
                </span>
                <select
                  value={outorgadoId}
                  onChange={(e) => setOutorgadoId(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="">Outorgado (representante)…</option>
                  {elegiveisOutorgado.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>
              {elegiveis.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Ninguém disponível — todos já votaram ou não há proprietários cadastrados.
                </p>
              )}
              <Button
                size="sm"
                onClick={handleCriar}
                disabled={!outorganteId || !outorgadoId || isPendingCriar}
                className="w-full gap-1.5"
              >
                {isPendingCriar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Registrar procuração
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
