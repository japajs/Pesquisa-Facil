import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { SurveyForm } from "@/components/surveys/survey-form"
import { ROUTES } from "@/lib/constants"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Nova pesquisa" }

export default function NewSurveyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl p-6 pt-8">
      <Link
        href={ROUTES.surveys}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 mb-6 gap-1.5 text-muted-foreground"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        Pesquisas
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Nova pesquisa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preencha o título, a descrição e adicione as perguntas.
        </p>
      </div>

      <SurveyForm />
    </div>
  )
}
