"use client"

import { useState, useTransition } from "react"
import { Plus, X, Loader2, ChevronUp, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createAssembleiaAction } from "@/app/actions/assembleias"
import type { PautaTipo } from "@/types"

const MAX_PAUTAS = 9
const MIN_OPCOES = 2

interface PautaInput {
  titulo: string
  descricao: string
  tipo: PautaTipo
  permiteAbstencao: boolean
  opcoes: string[]
}

function novaPauta(): PautaInput {
  return { titulo: "", descricao: "", tipo: "sim_nao", permiteAbstencao: true, opcoes: [] }
}

export function CriarAssembleiaDialog({ condominioId }: { condominioId: string }) {
  const [open, setOpen] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [dataAbertura, setDataAbertura] = useState("")
  const [dataEncerramento, setDataEncerramento] = useState("")
  const [pautas, setPautas] = useState<PautaInput[]>([novaPauta()])
  const [isPending, startTransition] = useTransition()

  function reset() {
    setTitulo("")
    setDescricao("")
    setDataAbertura("")
    setDataEncerramento("")
    setPautas([novaPauta()])
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) reset()
  }

  function addPauta() {
    if (pautas.length >= MAX_PAUTAS) return
    setPautas((prev) => [...prev, novaPauta()])
  }

  function removePauta(index: number) {
    setPautas((prev) => prev.filter((_, i) => i !== index))
  }

  function updatePauta(index: number, field: "titulo" | "descricao", value: string) {
    setPautas((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
  }

  function updatePautaTipo(index: number, tipo: PautaTipo) {
    setPautas((prev) =>
      prev.map((p, i) =>
        i === index
          ? { ...p, tipo, opcoes: tipo === "multipla_escolha" && p.opcoes.length === 0 ? ["", ""] : p.opcoes }
          : p
      )
    )
  }

  function togglePermiteAbstencao(index: number) {
    setPautas((prev) =>
      prev.map((p, i) => (i === index ? { ...p, permiteAbstencao: !p.permiteAbstencao } : p))
    )
  }

  function addOpcao(pautaIndex: number) {
    setPautas((prev) =>
      prev.map((p, i) => (i === pautaIndex ? { ...p, opcoes: [...p.opcoes, ""] } : p))
    )
  }

  function removeOpcao(pautaIndex: number, opcaoIndex: number) {
    setPautas((prev) =>
      prev.map((p, i) =>
        i === pautaIndex ? { ...p, opcoes: p.opcoes.filter((_, oi) => oi !== opcaoIndex) } : p
      )
    )
  }

  function updateOpcao(pautaIndex: number, opcaoIndex: number, value: string) {
    setPautas((prev) =>
      prev.map((p, i) =>
        i === pautaIndex
          ? { ...p, opcoes: p.opcoes.map((o, oi) => (oi === opcaoIndex ? value : o)) }
          : p
      )
    )
  }

  function moveOpcao(pautaIndex: number, opcaoIndex: number, direction: -1 | 1) {
    setPautas((prev) =>
      prev.map((p, i) => {
        if (i !== pautaIndex) return p
        const target = opcaoIndex + direction
        if (target < 0 || target >= p.opcoes.length) return p
        const opcoes = [...p.opcoes]
        ;[opcoes[opcaoIndex], opcoes[target]] = [opcoes[target]!, opcoes[opcaoIndex]!]
        return { ...p, opcoes }
      })
    )
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await createAssembleiaAction({
        condominio_id: condominioId,
        titulo,
        descricao,
        data_abertura: dataAbertura ? new Date(dataAbertura).toISOString() : null,
        data_encerramento: dataEncerramento ? new Date(dataEncerramento).toISOString() : null,
        pautas: pautas.map((p) => ({
          titulo: p.titulo,
          descricao: p.descricao,
          tipo: p.tipo,
          permite_abstencao: p.permiteAbstencao,
          opcoes: p.tipo === "multipla_escolha" ? p.opcoes : undefined,
        })),
      })
      if (result.success) {
        toast.success("Assembleia criada com sucesso.")
        handleOpenChange(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  const canSubmit =
    titulo.trim() &&
    pautas.length > 0 &&
    pautas.every((p) => {
      if (!p.titulo.trim()) return false
      if (p.tipo !== "multipla_escolha") return true
      return p.opcoes.map((o) => o.trim()).filter(Boolean).length >= MIN_OPCOES
    })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Plus className="h-4 w-4" />
        Nova assembleia
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova assembleia</DialogTitle>
        </DialogHeader>

        {/* Conteúdo scrollável — header e footer ficam fixos */}
        <div className="max-h-[62vh] overflow-y-auto space-y-4 px-1">
          <div className="space-y-1.5">
            <Label htmlFor="titulo-asm">Título</Label>
            <Input
              id="titulo-asm"
              placeholder="Ex.: Assembleia Geral Ordinária 2025"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc-asm">
              Descrição{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="desc-asm"
              placeholder="Contexto adicional para os proprietários…"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="data-abertura-asm" className="text-xs">
                Abertura{" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="data-abertura-asm"
                type="datetime-local"
                value={dataAbertura}
                onChange={(e) => setDataAbertura(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="data-encerramento-asm" className="text-xs">
                Encerramento{" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="data-encerramento-asm"
                type="datetime-local"
                value={dataEncerramento}
                onChange={(e) => setDataEncerramento(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* Pautas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Pautas</Label>
              <span className="text-xs text-muted-foreground">
                {pautas.length}/{MAX_PAUTAS}
              </span>
            </div>

            <div className="space-y-2">
              {pautas.map((pauta, i) => {
                const opcoesValidas = pauta.opcoes.map((o) => o.trim()).filter(Boolean).length
                return (
                  <div
                    key={i}
                    className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Pauta {i + 1}
                      </span>
                      {pautas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePauta(i)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <Input
                      placeholder="Título da pauta"
                      value={pauta.titulo}
                      onChange={(e) => updatePauta(i, "titulo", e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Input
                      placeholder="Descrição (opcional)"
                      value={pauta.descricao}
                      onChange={(e) => updatePauta(i, "descricao", e.target.value)}
                      className="h-8 text-sm"
                    />

                    {/* Tipo da pauta */}
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => updatePautaTipo(i, "sim_nao")}
                        className={cn(
                          "flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                          pauta.tipo === "sim_nao"
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-primary/40"
                        )}
                      >
                        Sim / Não
                      </button>
                      <button
                        type="button"
                        onClick={() => updatePautaTipo(i, "multipla_escolha")}
                        className={cn(
                          "flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                          pauta.tipo === "multipla_escolha"
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-primary/40"
                        )}
                      >
                        Múltipla escolha
                      </button>
                    </div>

                    {pauta.tipo === "multipla_escolha" && (
                      <div className="space-y-2 rounded-md border border-border/50 bg-card/60 p-2">
                        <div className="space-y-1.5">
                          {pauta.opcoes.map((opcao, oi) => (
                            <div key={oi} className="flex items-center gap-1">
                              <Input
                                placeholder={`Opção ${oi + 1}`}
                                value={opcao}
                                onChange={(e) => updateOpcao(i, oi, e.target.value)}
                                className="h-8 text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => moveOpcao(i, oi, -1)}
                                disabled={oi === 0}
                                className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveOpcao(i, oi, 1)}
                                disabled={oi === pauta.opcoes.length - 1}
                                className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </button>
                              {pauta.opcoes.length > MIN_OPCOES && (
                                <button
                                  type="button"
                                  onClick={() => removeOpcao(i, oi)}
                                  className="text-muted-foreground hover:text-destructive transition-colors"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addOpcao(i)}
                          className="h-7 w-full gap-1.5 text-xs"
                        >
                          <Plus className="h-3 w-3" />
                          Adicionar opção
                        </Button>

                        {opcoesValidas < MIN_OPCOES && (
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            Adicione pelo menos {MIN_OPCOES} opções preenchidas.
                          </p>
                        )}

                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={pauta.permiteAbstencao}
                            onChange={() => togglePermiteAbstencao(i)}
                            className="accent-primary"
                          />
                          Permitir abstenção
                        </label>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPauta}
              disabled={pautas.length >= MAX_PAUTAS}
              className="w-full gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar pauta
              {pautas.length >= MAX_PAUTAS && (
                <span className="text-muted-foreground">(máximo atingido)</span>
              )}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !canSubmit} className="gap-2">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
