import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { SurveyForm } from "@/components/surveys/survey-form"
import { getSurveyById } from "@/services/surveys"
import { ROUTES } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface EditSurveyPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditSurveyPageProps): Promise<Metadata> {
  const { id } = await params
  const survey = await getSurveyById(id).catch(() => null)
  return { title: survey ? `Editar — ${survey.title}` : "Editar pesquisa" }
}

export default async function EditSurveyPage({ params }: EditSurveyPageProps) {
  const { id } = await params

  let survey = null
  try {
    survey = await getSurveyById(id)
  } catch {
    // Supabase not configured — redirect to not found
  }

  if (!survey) notFound()

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
        <h1 className="text-2xl font-semibold tracking-tight">Editar pesquisa</h1>
        <p className="mt-1 text-sm text-muted-foreground">{survey.title}</p>
      </div>

      <SurveyForm survey={survey} />
    </div>
  )
}
