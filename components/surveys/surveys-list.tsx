"use client"

import Link from "next/link"
import { ClipboardList, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DeleteSurveyDialog } from "./delete-survey-dialog"
import { QUESTION_TYPE_LABELS, ROUTES } from "@/lib/constants"
import type { Survey } from "@/types"

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString))
}

interface SurveysListProps {
  surveys: Survey[]
}

export function SurveysList({ surveys }: SurveysListProps) {
  if (surveys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 py-16 text-center">
        <ClipboardList className="h-10 w-10 text-muted-foreground/30" />
        <div>
          <p className="text-sm font-medium text-foreground">Nenhuma pesquisa criada</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Comece criando a sua primeira pesquisa de satisfação.
          </p>
        </div>
        <Link href={ROUTES.surveyNew} className={buttonVariants({ size: "sm" })}>
          Criar pesquisa
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/60 hover:bg-transparent">
            <TableHead className="pl-6 text-xs">Título</TableHead>
            <TableHead className="text-xs">Perguntas</TableHead>
            <TableHead className="hidden text-xs md:table-cell">Tipos</TableHead>
            <TableHead className="hidden text-xs lg:table-cell">Criada em</TableHead>
            <TableHead className="w-20 text-right pr-6 text-xs">Ações</TableHead>
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
                    <p className="mt-0.5 line-clamp-1 max-w-xs text-xs text-muted-foreground">
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

                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {types.slice(0, 2).map((type) => (
                      <Badge
                        key={type}
                        variant="outline"
                        className="border-border/60 text-xs font-normal text-muted-foreground"
                      >
                        {QUESTION_TYPE_LABELS[type]}
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

                <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                  {formatDate(survey.created_at)}
                </TableCell>

                <TableCell className="pr-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={ROUTES.surveyEdit(survey.id)}
                      className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                      aria-label={`Editar "${survey.title}"`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <DeleteSurveyDialog id={survey.id} title={survey.title} />
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
