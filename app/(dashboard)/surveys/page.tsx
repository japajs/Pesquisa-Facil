import type { Metadata } from "next"
import Link from "next/link"
import { Plus } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { SurveysList } from "@/components/surveys/surveys-list"
import { getAllSurveys } from "@/services/surveys"
import { ROUTES } from "@/lib/constants"
import type { Survey } from "@/types"

export const metadata: Metadata = { title: "Pesquisas" }

async function fetchSurveys(): Promise<Survey[]> {
  try {
    return await getAllSurveys()
  } catch {
    return []
  }
}

export default async function SurveysPage() {
  const surveys = await fetchSurveys()

  return (
    <div className="flex flex-col gap-6 p-6 pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pesquisas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {surveys.length} {surveys.length === 1 ? "pesquisa criada" : "pesquisas criadas"}
          </p>
        </div>
        <Link href={ROUTES.surveyNew} className={buttonVariants({ size: "sm" })}>
          <Plus className="h-4 w-4" />
          Nova pesquisa
        </Link>
      </div>

      <SurveysList surveys={surveys} />
    </div>
  )
}
