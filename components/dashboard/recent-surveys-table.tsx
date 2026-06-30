import Link from "next/link"
import { ArrowRight, Vote } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ROUTES } from "@/lib/constants"
import type { VotacaoRecente } from "@/types"

interface RecentVotacoesTableProps {
  votacoes: VotacaoRecente[]
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString))
}

export function RecentSurveysTable({ votacoes }: RecentVotacoesTableProps) {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Últimas votações</CardTitle>
        <Link
          href={ROUTES.condominios}
          className={
            buttonVariants({ variant: "ghost", size: "sm" }) +
            " gap-1.5 text-xs text-muted-foreground"
          }
        >
          Ver condomínios
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {votacoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Vote className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhuma votação criada ainda.</p>
            <Link href={ROUTES.condominios} className={buttonVariants({ size: "sm" }) + " mt-2"}>
              Ir para Condomínios
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="pl-6 text-xs">Votação</TableHead>
                <TableHead className="text-xs">Condomínio</TableHead>
                <TableHead className="text-right text-xs">Participação</TableHead>
                <TableHead className="pr-6 text-right text-xs">Criada em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {votacoes.map((v) => {
                const pct =
                  v.total_enviados > 0
                    ? Math.round((v.total_respondidos / v.total_enviados) * 100)
                    : 0
                return (
                  <TableRow
                    key={v.id}
                    className="border-border/60 transition-colors hover:bg-accent/30"
                  >
                    <TableCell className="pl-6">
                      <Link
                        href={ROUTES.condominioVotacao(v.condominio_id, v.id)}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {v.titulo}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {v.condominio_nome}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-medium tabular-nums">
                        {v.total_respondidos}/{v.total_enviados}
                      </span>
                      <span className="ml-1 text-xs text-muted-foreground">({pct}%)</span>
                    </TableCell>
                    <TableCell className="pr-6 text-right text-xs text-muted-foreground">
                      {formatDate(v.created_at)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
