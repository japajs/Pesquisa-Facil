"use client"

import { useTransition } from "react"
import Link from "next/link"
import { ClipboardList, BarChart3, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DispararVotacaoDialog } from "./disparar-votacao-dialog"
import { deleteCondoSurveyAction } from "@/app/actions/condo-surveys"
import { ROUTES } from "@/lib/constants"
import type { CondoSurvey, Proprietario } from "@/types"

interface VotacoesListProps {
  votacoes: CondoSurvey[]
  condominioId: string
  proprietarios: Proprietario[]
}

export function VotacoesList({ votacoes, condominioId, proprietarios }: VotacoesListProps) {
  if (votacoes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
        <ClipboardList className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Nenhuma votação criada ainda.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card divide-y divide-border/40">
      {votacoes.map((v) => (
        <VotacaoRow
          key={v.id}
          votacao={v}
          condominioId={condominioId}
          proprietarios={proprietarios}
        />
      ))}
    </div>
  )
}

function VotacaoRow({
  votacao,
  condominioId,
  proprietarios,
}: {
  votacao: CondoSurvey
  condominioId: string
  proprietarios: Proprietario[]
}) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`Excluir a votação "${votacao.titulo}"? Os votos registrados também serão removidos.`)) return
    startTransition(async () => {
      const result = await deleteCondoSurveyAction(votacao.id, condominioId)
      if (!result.success) toast.error(result.error)
    })
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{votacao.titulo}</p>
        <p className="truncate text-xs text-muted-foreground">{votacao.pergunta}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <DispararVotacaoDialog condoSurvey={votacao} proprietarios={proprietarios} />

        <Link
          href={ROUTES.condominioVotacao(condominioId, votacao.id)}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 w-8 p-0 text-muted-foreground")}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span className="sr-only">Ver apuração</span>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isPending}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="sr-only">Excluir votação</span>
        </Button>
      </div>
    </div>
  )
}
