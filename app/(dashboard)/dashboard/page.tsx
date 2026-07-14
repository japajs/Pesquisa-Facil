import type { Metadata } from "next"
import { getCondoDashboardStats, getRecentAssembleias } from "@/services/dashboard"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentSurveysTable } from "@/components/dashboard/recent-surveys-table"
import type { CondoDashboardStats, AssembleiaRecente } from "@/types"

export const metadata: Metadata = { title: "Dashboard" }

const EMPTY_STATS: CondoDashboardStats = {
  total_condominios: 0,
  total_proprietarios: 0,
  total_unidades: 0,
  total_assembleias: 0,
  total_votos_enviados: 0,
  total_votos_recebidos: 0,
}

async function fetchDashboardData(): Promise<{
  stats: CondoDashboardStats
  assembleias: AssembleiaRecente[]
}> {
  try {
    const [stats, assembleias] = await Promise.all([
      getCondoDashboardStats(),
      getRecentAssembleias(6),
    ])
    return { stats, assembleias }
  } catch {
    return { stats: EMPTY_STATS, assembleias: [] }
  }
}

export default async function DashboardPage() {
  const { stats, assembleias } = await fetchDashboardData()

  return (
    <div className="flex flex-col gap-8 p-6 pt-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">CondoAssembleia</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão geral das assembleias e condomínios
        </p>
      </div>

      <StatsCards stats={stats} />

      <RecentSurveysTable assembleias={assembleias} />
    </div>
  )
}
