"use client"

import { useRef, useState, useTransition } from "react"
import Link from "next/link"
import { ClipboardList, BarChart3, Trash2, LockKeyhole, Unlock } from "lucide-react"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { DispararAssembleiaDialog } from "./disparar-assembleia-dialog"
import { deleteAssembleiaAction, updateAssembleiaStatusAction } from "@/app/actions/assembleias"
import { ROUTES } from "@/lib/constants"
import type { Assembleia, AssembleiaStatus, Proprietario } from "@/types"

interface AssembleiasListProps {
  assembleias: Assembleia[]
  condominioId: string
  proprietarios: Proprietario[]
}

const STATUS_LABEL: Record<AssembleiaStatus, string> = {
  rascunho: "Rascunho",
  aberta: "Aberta",
  encerrada: "Encerrada",
}

const STATUS_CLASS: Record<AssembleiaStatus, string> = {
  rascunho: "bg-muted text-muted-foreground",
  aberta: "bg-emerald-500/15 text-emerald-500",
  encerrada: "bg-rose-500/15 text-rose-500",
}

export function AssembleiasList({ assembleias, condominioId, proprietarios }: AssembleiasListProps) {
  if (assembleias.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
        <ClipboardList className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Nenhuma assembleia criada ainda.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border/40 rounded-xl border border-border/60 bg-card">
      {assembleias.map((a) => (
        <AssembleiaRow
          key={a.id}
          assembleia={a}
          condominioId={condominioId}
          proprietarios={proprietarios}
        />
      ))}
    </div>
  )
}

function AssembleiaRow({
  assembleia,
  condominioId,
  proprietarios,
}: {
  assembleia: Assembleia
  condominioId: string
  proprietarios: Proprietario[]
}) {
  const [isPending, startTransition] = useTransition()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [encerrarOpen, setEncerrarOpen] = useState(false)
  const pautaCount = assembleia.pautas?.length ?? 0

  // Achado de auditoria: foco inicial nos dois diálogos abaixo é o botão
  // "Cancelar", não a ação destrutiva — quem confirmar sem querer (Enter,
  // toque duplo etc.) cancela por padrão, precisa mover pra excluir/encerrar
  // de propósito.
  const cancelDeleteRef = useRef<HTMLButtonElement>(null)
  const cancelEncerrarRef = useRef<HTMLButtonElement>(null)

  function handleDelete() {
    setDeleteOpen(false)
    startTransition(async () => {
      const result = await deleteAssembleiaAction(assembleia.id, condominioId)
      if (!result.success) toast.error(result.error)
    })
  }

  function handleStatusChange(nextStatus: AssembleiaStatus) {
    startTransition(async () => {
      const result = await updateAssembleiaStatusAction(assembleia.id, condominioId, nextStatus)
      if (result.success) {
        toast.success(
          `Assembleia ${nextStatus === "aberta" ? "aberta" : "encerrada"} com sucesso.`
        )
      } else {
        toast.error(result.error)
      }
    })
  }

  // Achado de auditoria: encerrar era um clique só, sem confirmação — e é
  // uma ação irreversível (updateAssembleiaStatus bloqueia reabrir depois),
  // que trava voto de quem ainda não votou. Mesmo padrão de confirmação já
  // usado pra excluir.
  function handleEncerrar() {
    setEncerrarOpen(false)
    handleStatusChange("encerrada")
  }

  return (
    <div className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <span
          className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[assembleia.status]}`}
        >
          {STATUS_LABEL[assembleia.status]}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{assembleia.titulo}</p>
          <p className="text-xs text-muted-foreground">
            {pautaCount} {pautaCount === 1 ? "pauta" : "pautas"}
            {assembleia.quorum_minimo !== null && (
              <>
                {" · quórum mínimo "}
                {Math.round(assembleia.quorum_minimo * 100)}%
                {assembleia.data_1a_convocacao && " (1ª conv.)"}
              </>
            )}
            {assembleia.data_encerramento && (
              <>
                {" · encerra "}
                {new Date(assembleia.data_encerramento).toLocaleDateString("pt-BR")}
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {assembleia.status === "rascunho" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleStatusChange("aberta")}
            disabled={isPending}
            className="gap-1.5 px-2.5 text-xs text-emerald-500 hover:text-emerald-600"
          >
            <Unlock className="h-4 w-4" />
            Abrir
          </Button>
        )}
        {assembleia.status === "aberta" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEncerrarOpen(true)}
            disabled={isPending}
            className="gap-1.5 px-2.5 text-xs text-rose-500 hover:text-rose-600"
          >
            <LockKeyhole className="h-4 w-4" />
            Encerrar
          </Button>
        )}

        {assembleia.status !== "encerrada" && (
          <DispararAssembleiaDialog assembleia={assembleia} proprietarios={proprietarios} />
        )}

        <Link
          href={ROUTES.condominioAssembleia(condominioId, assembleia.id)}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground"
          )}
        >
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Apuração</span>
          <span className="sm:hidden sr-only">Ver apuração</span>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeleteOpen(true)}
          disabled={isPending}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Excluir assembleia</span>
        </Button>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent initialFocus={cancelDeleteRef}>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir assembleia?</AlertDialogTitle>
              <AlertDialogDescription>
                <strong>"{assembleia.titulo}"</strong> e todos os votos registrados serão removidos
                permanentemente. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel ref={cancelDeleteRef}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={encerrarOpen} onOpenChange={setEncerrarOpen}>
          <AlertDialogContent initialFocus={cancelEncerrarRef}>
            <AlertDialogHeader>
              <AlertDialogTitle>Encerrar assembleia?</AlertDialogTitle>
              <AlertDialogDescription>
                <strong>"{assembleia.titulo}"</strong> deixará de aceitar novos votos e{" "}
                <strong>não poderá ser reaberta depois</strong>. Quem ainda não votou fica de fora
                definitivamente. Confira se todos que precisavam votar já votaram antes de
                continuar.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel ref={cancelEncerrarRef}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleEncerrar}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Encerrar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
