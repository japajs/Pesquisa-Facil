"use client"

import { useTransition } from "react"
import Link from "next/link"
import { Building2, ChevronRight, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { deleteCondominioAction } from "@/app/actions/condominios"
import { ROUTES } from "@/lib/constants"
import type { Condominio } from "@/types"

interface CondominiosListProps {
  condominios: Condominio[]
}

export function CondominiosList({ condominios }: CondominiosListProps) {
  if (condominios.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-14 text-center">
        <Building2 className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Nenhum condomínio cadastrado ainda.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card">
      {condominios.map((condo, i) => (
        <CondominioRow
          key={condo.id}
          condo={condo}
          isLast={i === condominios.length - 1}
        />
      ))}
    </div>
  )
}

function CondominioRow({
  condo,
  isLast,
}: {
  condo: Condominio
  isLast: boolean
}) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`Excluir "${condo.nome}"? Proprietários e unidades vinculados também serão removidos.`)) return
    startTransition(async () => {
      const result = await deleteCondominioAction(condo.id)
      if (result.success) {
        toast.success("Condomínio excluído.")
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div
      className={`flex items-center justify-between gap-4 px-4 py-3.5 ${!isLast ? "border-b border-border/40" : ""}`}
    >
      <Link
        href={`${ROUTES.condominios}/${condo.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Building2 className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{condo.nome}</p>
        </div>
        <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground/40" />
      </Link>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={isPending}
        className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span className="sr-only">Excluir</span>
      </Button>
    </div>
  )
}
