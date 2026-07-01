import Link from "next/link"
import { ArrowRight, ClipboardList } from "lucide-react"
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
import type { AssembleiaRecente } from "@/types"

interface RecentSurveysTableProps {
  assembleias: AssembleiaRecente[]
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString))
}

export function RecentSurveysTable({ assembleias }: RecentSurveysTableProps) {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Últimas assembleias</CardTitle>
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
        {assembleias.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <ClipboardList className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhuma assembleia criada ainda.</p>
            <Link href={ROUTES.condominios} className={buttonVariants({ size: "sm" }) + " mt-2"}>
              Ir para Condomínios
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="pl-6 text-xs">Assembleia</TableHead>
                <TableHead className="text-xs">Condomínio</TableHead>
                <TableHead className="text-right text-xs">Participação</TableHead>
                <TableHead className="pr-6 text-right text-xs">Criada em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assembleias.map((a) => {
                const pct =
                  a.total_enviados > 0
                    ? Math.round((a.total_respondidos / a.total_enviados) * 100)
                    : 0
                return (
                  <TableRow
                    key={a.id}
                    className="border-border/60 transition-colors hover:bg-accent/30"
                  >
                    <TableCell className="pl-6">
                      <Link
                        href={ROUTES.condominioAssembleia(a.condominio_id, a.id)}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {a.titulo}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {a.condominio_nome}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-medium tabular-nums">
                        {a.total_respondidos}/{a.total_enviados}
                      </span>
                      <span className="ml-1 text-xs text-muted-foreground">({pct}%)</span>
                    </TableCell>
                    <TableCell className="pr-6 text-right text-xs text-muted-foreground">
                      {formatDate(a.created_at)}
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
