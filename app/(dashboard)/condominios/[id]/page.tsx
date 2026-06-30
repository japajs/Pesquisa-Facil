import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getCondominioById } from "@/services/condominios"
import { getAllProprietarios } from "@/services/proprietarios"
import { getAllCondoSurveys } from "@/services/condo-surveys"
import { CriarProprietarioDialog } from "@/components/proprietarios/criar-proprietario-dialog"
import { ProprietariosList } from "@/components/proprietarios/proprietarios-list"
import { CriarVotacaoDialog } from "@/components/votacoes/criar-votacao-dialog"
import { VotacoesList } from "@/components/votacoes/votacoes-list"
import { ROUTES } from "@/lib/constants"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const condo = await getCondominioById(id)
    return { title: condo?.nome ?? "Condomínio" }
  } catch {
    return { title: "Condomínio" }
  }
}

export default async function CondominioDetailPage({ params }: Props) {
  const { id } = await params

  const condominio = await getCondominioById(id).catch(() => null)
  if (!condominio) notFound()

  const [proprietarios, votacoes] = await Promise.all([
    getAllProprietarios(id).catch(() => []),
    getAllCondoSurveys(id).catch(() => []),
  ])

  return (
    <div className="flex flex-col gap-8 p-6 pt-8">
      {/* Back */}
      <Link
        href={ROUTES.condominios}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Condomínios
      </Link>

      {/* Heading */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{condominio.nome}</h1>
      </div>

      {/* Proprietários */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Proprietários</h2>
            <p className="text-sm text-muted-foreground">
              {proprietarios.length}{" "}
              {proprietarios.length === 1 ? "proprietário" : "proprietários"} · o peso de cada voto
              é calculado pelo número de unidades vinculadas
            </p>
          </div>
          <CriarProprietarioDialog condominioId={id} />
        </div>
        <ProprietariosList proprietarios={proprietarios} condominioId={id} />
      </section>

      {/* Votações */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Votações</h2>
            <p className="text-sm text-muted-foreground">
              {votacoes.length} {votacoes.length === 1 ? "votação criada" : "votações criadas"}
            </p>
          </div>
          <CriarVotacaoDialog condominioId={id} />
        </div>
        <VotacoesList votacoes={votacoes} condominioId={id} proprietarios={proprietarios} />
      </section>
    </div>
  )
}
