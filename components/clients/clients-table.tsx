"use client"

import { Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DeleteClientDialog } from "./delete-client-dialog"
import type { Client } from "@/types"

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString))
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

interface ClientsTableProps {
  clients: Client[]
}

export function ClientsTable({ clients }: ClientsTableProps) {
  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 py-16 text-center">
        <Users className="h-10 w-10 text-muted-foreground/30" />
        <div>
          <p className="text-sm font-medium text-foreground">Nenhum cliente cadastrado</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Importe um arquivo CSV para adicionar clientes.
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
            <TableHead className="pl-6 text-xs">Nome</TableHead>
            <TableHead className="hidden text-xs md:table-cell">Empresa</TableHead>
            <TableHead className="text-xs">E-mail</TableHead>
            <TableHead className="hidden text-xs lg:table-cell">Cadastrado em</TableHead>
            <TableHead className="w-16 pr-6 text-right text-xs">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow
              key={client.id}
              className="border-border/60 transition-colors hover:bg-accent/30"
            >
              <TableCell className="pl-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {getInitials(client.name)}
                  </div>
                  <span className="font-medium">{client.name}</span>
                </div>
              </TableCell>

              <TableCell className="hidden md:table-cell">
                {client.company ? (
                  <Badge
                    variant="secondary"
                    className="text-xs font-normal"
                  >
                    {client.company}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>

              <TableCell className="text-sm text-muted-foreground">{client.email}</TableCell>

              <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                {formatDate(client.created_at)}
              </TableCell>

              <TableCell className="pr-4 text-right">
                <DeleteClientDialog id={client.id} name={client.name} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
