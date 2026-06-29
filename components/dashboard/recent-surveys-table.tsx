import Link from "next/link"
import { ArrowRight, ClipboardList } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { QUESTION_TYPE_LABELS, ROUTES } from "@/lib/constants"
import type { Survey } from "@/types"

interface RecentSurveysTableProps {
  surveys: Survey[]
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString))
}

export function RecentSurveysTable({ surveys }: RecentSurveysTableProps) {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Últimas pesquisas</CardTitle>
        <Link
          href={ROUTES.surveys}
          className={buttonVariants({ variant: "ghost", size: "sm" }) + " gap-1.5 text-xs text-muted-foreground"}
        >
          Ver todas
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {surveys.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <ClipboardList className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhuma pesquisa criada ainda.</p>
            <Link
              href={ROUTES.surveyNew}
              className={buttonVariants({ size: "sm" }) + " mt-2"}
            >
              Criar primeira pesquisa
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="pl-6 text-xs">Título</TableHead>
                <TableHead className="text-xs">Perguntas</TableHead>
                <TableHead className="text-xs">Tipos</TableHead>
                <TableHead className="text-right pr-6 text-xs">Criada em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveys.map((survey) => {
                const types = [...new Set(survey.questions.map((q) => q.type))]
                return (
                  <TableRow
                    key={survey.id}
                    className="border-border/60 transition-colors hover:bg-accent/30"
                  >
                    <TableCell className="pl-6">
                      <Link
                        href={ROUTES.surveyEdit(survey.id)}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {survey.title}
                      </Link>
                      {survey.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {survey.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {survey.questions.length}{" "}
                        {survey.questions.length === 1 ? "pergunta" : "perguntas"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {types.slice(0, 2).map((type) => (
                          <Badge
                            key={type}
                            variant="outline"
                            className="border-border/60 text-xs font-normal text-muted-foreground"
                          >
                            {QUESTION_TYPE_LABELS[type] ?? type}
                          </Badge>
                        ))}
                        {types.length > 2 && (
                          <Badge
                            variant="outline"
                            className="border-border/60 text-xs font-normal text-muted-foreground"
                          >
                            +{types.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="pr-6 text-right text-xs text-muted-foreground">
                      {formatDate(survey.created_at)}
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
