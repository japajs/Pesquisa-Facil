import type { Metadata } from "next"
import { getCondoDashboardStats, getRecentVotacoes } from "@/services/dashboard"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentSurveysTable } from "@/components/dashboard/recent-surveys-table"
import type { CondoDashboardStats, VotacaoRecente } from "@/types"

export const metadata: Metadata = { title: "Dashboard" }

const EMPTY_STATS: CondoDashboardStats = {
  total_condominios: 0,
  total_proprietarios: 0,
  total_unidades: 0,
  total_votacoes: 0,
  total_votos_enviados: 0,
  total_votos_recebidos: 0,
  participacao_geral: 0,
}

async function fetchDashboardData(): Promise<{
  stats: CondoDashboardStats
  votacoes: VotacaoRecente[]
}> {
  try {
    const [stats, votacoes] = await Promise.all([
      getCondoDashboardStats(),
      getRecentVotacoes(6),
    ])
    return { stats, votacoes }
  } catch {
    return { stats: EMPTY_STATS, votacoes: [] }
  }
}

export default async function DashboardPage() {
  const { stats, votacoes } = await fetchDashboardData()

  return (
    <div className="flex flex-col gap-8 p-6 pt-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão geral do sistema de votação eletrônica
        </p>
      </div>

      <StatsCards stats={stats} />

      <RecentSurveysTable votacoes={votacoes} />
    </div>
  )
}
