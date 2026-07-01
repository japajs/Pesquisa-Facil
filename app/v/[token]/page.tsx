import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CheckCircle2, LockKeyhole } from "lucide-react"
import { getAssembleiaSendByToken, getRespostasBySendId } from "@/services/assembleia-votos"
import { updateAssembleiaStatus } from "@/services/assembleias"
import { getConfiguracao } from "@/services/configuracoes"
import { AssembleiaVotoForm } from "@/components/assembleias/assembleia-voto-form"
import { APP_NAME } from "@/lib/constants"

interface Props {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  try {
    const send = await getAssembleiaSendByToken(token)
    return { title: send?.assembleia?.titulo ?? APP_NAME }
  } catch {
    return { title: APP_NAME }
  }
}

export default async function PublicVotoPage({ params }: Props) {
  const { token } = await params

  let send
  try {
    send = await getAssembleiaSendByToken(token)
  } catch {
    notFound()
  }
  if (!send || !send.assembleia) notFound()

  const assembleia = send.assembleia
  const pautas = assembleia.pautas ?? []

  let alreadyAnswered = false
  try {
    const respostas = await getRespostasBySendId(send.id)
    if (respostas.length > 0) alreadyAnswered = true
  } catch {
    // Treat as not answered — DB unique constraint prevents double votes
  }

  let status = assembleia.status

  if (
    status === "aberta" &&
    assembleia.data_encerramento &&
    new Date(assembleia.data_encerramento) < new Date()
  ) {
    const autoClose = await getConfiguracao("votacao_encerramento_automatico").catch(() => null)
    if (autoClose === "true") {
      await updateAssembleiaStatus(assembleia.id, "encerrada").catch(() => {})
      status = "encerrada"
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
            Assembleia de condomínio
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{assembleia.titulo}</h1>
          {assembleia.descricao && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {assembleia.descricao}
            </p>
          )}
        </div>

        {status === "encerrada" ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-border/60 bg-card px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/60 ring-1 ring-border">
              <LockKeyhole className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Assembleia encerrada</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Esta assembleia não está mais aceitando votos.
              </p>
            </div>
          </div>
        ) : alreadyAnswered ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-border/60 bg-card px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/10 ring-1 ring-emerald-400/20">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
              <p className="font-medium">Votos já registrados</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Você já votou nesta assembleia. Obrigado!
              </p>
            </div>
          </div>
        ) : (
          <AssembleiaVotoForm
            sendId={send.id}
            pautas={pautas}
            assembleiaTitulo={assembleia.titulo}
          />
        )}
      </div>
    </div>
  )
}
