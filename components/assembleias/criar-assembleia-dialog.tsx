"use client"

import { useState, useTransition } from "react"
import { Plus, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
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

const MAX_PAUTAS = 9

interface PautaInput {
  titulo: string
  descricao: string
}

export function CriarAssembleiaDialog({ condominioId }: { condominioId: string }) {
  const [open, setOpen] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [dataAbertura, setDataAbertura] = useState("")
  const [dataEncerramento, setDataEncerramento] = useState("")
  const [pautas, setPautas] = useState<PautaInput[]>([{ titulo: "", descricao: "" }])
  const [isPending, startTransition] = useTransition()

  function reset() {
    setTitulo("")
    setDescricao("")
    setDataAbertura("")
    setDataEncerramento("")
    setPautas([{ titulo: "", descricao: "" }])
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) reset()
  }

  function addPauta() {
    if (pautas.length >= MAX_PAUTAS) return
    setPautas((prev) => [...prev, { titulo: "", descricao: "" }])
  }

  function removePauta(index: number) {
    setPautas((prev) => prev.filter((_, i) => i !== index))
  }

  function updatePauta(index: number, field: keyof PautaInput, value: string) {
    setPautas((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await createAssembleiaAction({
        condominio_id: condominioId,
        titulo,
        descricao,
        data_abertura: dataAbertura ? new Date(dataAbertura).toISOString() : null,
        data_encerramento: dataEncerramento ? new Date(dataEncerramento).toISOString() : null,
        pautas,
      })
      if (result.success) {
        toast.success("Assembleia criada com sucesso.")
        handleOpenChange(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  const canSubmit = titulo.trim() && pautas.length > 0 && pautas.every((p) => p.titulo.trim())

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Plus className="h-4 w-4" />
        Nova assembleia
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova assembleia</DialogTitle>
        </DialogHeader>

        {/* Conteúdo scrollável — header e footer ficam fixos */}
        <div className="max-h-[62vh] overflow-y-auto space-y-4 pr-1">
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

          <div className="grid grid-cols-2 gap-3">
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
              {pautas.map((pauta, i) => (
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
                </div>
              ))}
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
