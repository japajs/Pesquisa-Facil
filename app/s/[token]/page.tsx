import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { getSendByToken } from "@/services/sends"
import { getSurveyById } from "@/services/surveys"
import { getResponseBySendId } from "@/services/responses"
import { SurveyResponseForm } from "@/components/survey-response/survey-response-form"
import { APP_NAME } from "@/lib/constants"

interface Props {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  try {
    const send = await getSendByToken(token)
    if (!send) return { title: APP_NAME }
    const survey = await getSurveyById(send.survey_id)
    return { title: survey?.title ?? APP_NAME }
  } catch {
    return { title: APP_NAME }
  }
}

export default async function PublicSurveyPage({ params }: Props) {
  const { token } = await params

  // Validate token
  let send
  try {
    send = await getSendByToken(token)
  } catch {
    notFound()
  }
  if (!send) notFound()

  // Check for existing response
  let alreadyAnswered = false
  try {
    const existing = await getResponseBySendId(send.id)
    if (existing) alreadyAnswered = true
  } catch {
    // Treat errors as not answered — let the DB unique constraint handle duplicates
  }

  // Fetch the survey
  let survey
  try {
    survey = await getSurveyById(send.survey_id)
  } catch {
    notFound()
  }
  if (!survey) notFound()

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <div className="border-b border-border/40 bg-card/40 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">{APP_NAME}</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-10">
        {/* Survey header */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">
            Pesquisa de satisfação
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{survey.title}</h1>
          {survey.description && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {survey.description}
            </p>
          )}
        </div>

        {alreadyAnswered ? (
          /* Already answered */
          <div className="flex flex-col items-center gap-4 rounded-xl border border-border/60 bg-card px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/10 ring-1 ring-emerald-400/20">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
              <p className="font-medium">Pesquisa já respondida</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Você já enviou suas respostas para esta pesquisa. Obrigado!
              </p>
            </div>
          </div>
        ) : (
          /* Survey form */
          <SurveyResponseForm survey={survey} sendId={send.id} />
        )}
      </div>
    </div>
  )
}
