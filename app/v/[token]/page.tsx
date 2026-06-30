import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CheckCircle2, LockKeyhole } from "lucide-react"
import { getCondoSendByToken, getVotoBySendId } from "@/services/condo-votos"
import { updateCondoSurveyStatus } from "@/services/condo-surveys"
import { getConfiguracao } from "@/services/configuracoes"
import { CondoVotoForm } from "@/components/condo-voto/condo-voto-form"
import { APP_NAME } from "@/lib/constants"

interface Props {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  try {
    const send = await getCondoSendByToken(token)
    return { title: send?.condo_survey?.titulo ?? APP_NAME }
  } catch {
    return { title: APP_NAME }
  }
}

export default async function PublicCondoVotoPage({ params }: Props) {
  const { token } = await params

  // Localiza o registro de envio pelo token — é dele que vem o proprietario_id.
  // O peso de voto nunca trafega no token, só é calculado na apuração.
  let send
  try {
    send = await getCondoSendByToken(token)
  } catch {
    notFound()
  }
  if (!send || !send.condo_survey) notFound()

  let alreadyAnswered = false
  try {
    const existing = await getVotoBySendId(send.id)
    if (existing) alreadyAnswered = true
  } catch {
    // Treat errors as not answered — let the DB unique constraint handle duplicates
  }

  const condoSurvey = send.condo_survey

  // Auto-encerra se passou da data de encerramento e a opção está ativa
  if (
    condoSurvey.status === "aberta" &&
    condoSurvey.data_encerramento &&
    new Date(condoSurvey.data_encerramento) < new Date()
  ) {
    const autoClose = await getConfiguracao("votacao_encerramento_automatico").catch(() => null)
    if (autoClose === "true") {
      await updateCondoSurveyStatus(condoSurvey.id, "encerrada").catch(() => {})
      condoSurvey.status = "encerrada"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/40 bg-card/40 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">{APP_NAME}</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">
            Votação de condomínio
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{condoSurvey.titulo}</h1>
          {condoSurvey.descricao && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {condoSurvey.descricao}
            </p>
          )}
        </div>

        {condoSurvey.status === "encerrada" ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-border/60 bg-card px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/60 ring-1 ring-border">
              <LockKeyhole className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Votação encerrada</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Esta votação não está mais aceitando votos.
              </p>
            </div>
          </div>
        ) : alreadyAnswered ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-border/60 bg-card px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/10 ring-1 ring-emerald-400/20">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
              <p className="font-medium">Voto já registrado</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Você já votou nesta votação. Obrigado!
              </p>
            </div>
          </div>
        ) : (
          <CondoVotoForm
            condoSurveyTitulo={condoSurvey.titulo}
            pergunta={condoSurvey.pergunta}
            sendId={send.id}
          />
        )}
      </div>
    </div>
  )
}
