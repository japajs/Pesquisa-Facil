import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getCondoSurveyById } from "@/services/condo-surveys"
import { getCondominioById } from "@/services/condominios"
import { getApuracao } from "@/services/condo-votos"
import { ApuracaoCard } from "@/components/condo-voto/apuracao-card"
import { ROUTES } from "@/lib/constants"

interface Props {
  params: Promise<{ id: string; votacaoId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { votacaoId } = await params
  try {
    const condoSurvey = await getCondoSurveyById(votacaoId)
    return { title: condoSurvey?.titulo ?? "Apuração" }
  } catch {
    return { title: "Apuração" }
  }
}

export default async function ApuracaoPage({ params }: Props) {
  const { id: condominioId, votacaoId } = await params

  const [condominio, condoSurvey] = await Promise.all([
    getCondominioById(condominioId).catch(() => null),
    getCondoSurveyById(votacaoId).catch(() => null),
  ])

  if (!condominio || !condoSurvey) notFound()

  const apuracao = await getApuracao(votacaoId).catch(() => ({
    por_participantes: { sim: 0, nao: 0 },
    ponderado: { sim: 0, nao: 0 },
    total_apartamentos_representados: 0,
  }))

  return (
    <div className="flex flex-col gap-8 p-6 pt-8">
      {/* Back */}
      <Link
        href={ROUTES.condominios}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {condominio.nome}
      </Link>

      {/* Heading */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">Apuração</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{condoSurvey.titulo}</h1>
      </div>

      <ApuracaoCard condoSurvey={condoSurvey} apuracao={apuracao} />
    </div>
  )
}
