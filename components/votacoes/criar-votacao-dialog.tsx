"use client"

import { useState, useTransition } from "react"
import { Plus, Loader2 } from "lucide-react"
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
import { createCondoSurveyAction } from "@/app/actions/condo-surveys"

interface CriarVotacaoDialogProps {
  condominioId: string
}

export function CriarVotacaoDialog({ condominioId }: CriarVotacaoDialogProps) {
  const [open, setOpen] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [pergunta, setPergunta] = useState("")
  const [isPending, startTransition] = useTransition()

  function reset() {
    setTitulo("")
    setDescricao("")
    setPergunta("")
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) reset()
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await createCondoSurveyAction({
        condominio_id: condominioId,
        titulo,
        descricao,
        pergunta,
      })
      if (result.success) {
        toast.success("Votação criada com sucesso.")
        handleOpenChange(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  const canSubmit = titulo.trim() && pergunta.trim()

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Plus className="h-4 w-4" />
        Nova votação
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nova votação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="titulo-votacao">Título</Label>
            <Input
              id="titulo-votacao"
              placeholder="Ex.: Aprovação do fundo de reserva 2025"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descricao-votacao">
              Descrição <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="descricao-votacao"
              placeholder="Contexto adicional para os proprietários…"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pergunta-votacao">Pergunta</Label>
            <Input
              id="pergunta-votacao"
              placeholder="Ex.: Você aprova a criação do fundo de reserva?"
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Os proprietários responderão Sim ou Não a essa pergunta.
            </p>
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
