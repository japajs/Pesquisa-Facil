"use client"

import { Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { SurveySend, SendStatus } from "@/types"

const STATUS_CONFIG: Record<
  SendStatus,
  { label: string; className: string }
> = {
  sent: {
    label: "Enviado",
    className: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  },
  failed: {
    label: "Falhou",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  pending: {
    label: "Pendente",
    className: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  },
}

function formatDate(dateString: string | null) {
  if (!dateString) return "—"
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString))
}

interface SendsTableProps {
  sends: SurveySend[]
}

export function SendsTable({ sends }: SendsTableProps) {
  if (sends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 py-16 text-center">
        <Send className="h-10 w-10 text-muted-foreground/30" />
        <div>
          <p className="text-sm font-medium text-foreground">Nenhum envio realizado</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Clique em &ldquo;Novo disparo&rdquo; para enviar sua primeira pesquisa.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-border/60 hover:bg-transparent">
            <TableHead className="pl-6 text-xs">Cliente</TableHead>
            <TableHead className="text-xs">Pesquisa</TableHead>
            <TableHead className="text-xs">Status</TableHead>
            <TableHead className="hidden text-xs lg:table-cell">Enviado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sends.map((send) => {
            const status = STATUS_CONFIG[send.status]
            return (
              <TableRow
                key={send.id}
                className="border-border/60 transition-colors hover:bg-accent/30"
              >
                <TableCell className="pl-6">
                  <p className="font-medium text-foreground">{send.client?.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{send.client?.email ?? "—"}</p>
                </TableCell>

                <TableCell>
                  <p className="text-sm text-foreground">{send.survey?.title ?? "—"}</p>
                </TableCell>

                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs font-normal ${status.className}`}
                  >
                    {status.label}
                  </Badge>
                </TableCell>

                <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                  {formatDate(send.sent_at)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
