"use client"

import { useTransition } from "react"
import Link from "next/link"
import { ClipboardList, BarChart3, Trash2, LockKeyhole, Unlock } from "lucide-react"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DispararVotacaoDialog } from "./disparar-votacao-dialog"
import { deleteCondoSurveyAction, updateCondoSurveyStatusAction } from "@/app/actions/condo-surveys"
import { ROUTES } from "@/lib/constants"
import type { CondoSurvey, CondoVotoStatus, Proprietario } from "@/types"

interface VotacoesListProps {
  votacoes: CondoSurvey[]
  condominioId: string
  proprietarios: Proprietario[]
}

const STATUS_LABEL: Record<CondoVotoStatus, string> = {
  rascunho: "Rascunho",
  aberta: "Aberta",
  encerrada: "Encerrada",
}

const STATUS_CLASS: Record<CondoVotoStatus, string> = {
  rascunho: "bg-muted text-muted-foreground",
  aberta: "bg-emerald-500/15 text-emerald-500",
  encerrada: "bg-rose-500/15 text-rose-500",
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

  function handleStatusChange(nextStatus: CondoVotoStatus) {
    const labels: Record<CondoVotoStatus, string> = {
      rascunho: "rascunho",
      aberta: "aberta",
      encerrada: "encerrada",
    }
    startTransition(async () => {
      const result = await updateCondoSurveyStatusAction(votacao.id, condominioId, nextStatus)
      if (result.success) {
        toast.success(`Votação marcada como ${labels[nextStatus]}.`)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[votacao.status]}`}
        >
          {STATUS_LABEL[votacao.status]}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{votacao.titulo}</p>
          <p className="truncate text-xs text-muted-foreground">{votacao.pergunta}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {/* Botão de status */}
        {votacao.status === "rascunho" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleStatusChange("aberta")}
            disabled={isPending}
            className="h-8 gap-1.5 px-2.5 text-xs text-emerald-500 hover:text-emerald-600"
            title="Abrir votação"
          >
            <Unlock className="h-3.5 w-3.5" />
            Abrir
          </Button>
        )}
        {votacao.status === "aberta" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleStatusChange("encerrada")}
            disabled={isPending}
            className="h-8 gap-1.5 px-2.5 text-xs text-rose-500 hover:text-rose-600"
            title="Encerrar votação"
          >
            <LockKeyhole className="h-3.5 w-3.5" />
            Encerrar
          </Button>
        )}

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
