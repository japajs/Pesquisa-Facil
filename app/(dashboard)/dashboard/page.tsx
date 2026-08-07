import type { Metadata } from "next"
import { getCondoDashboardStats, getRecentAssembleias, getResumoPorCondominio } from "@/services/dashboard"
import { resolveCondominioScope } from "@/lib/auth"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentSurveysTable } from "@/components/dashboard/recent-surveys-table"
import { ResumoCondominiosTable } from "@/components/dashboard/resumo-condominios-table"
import type { CondoDashboardStats, AssembleiaRecente, CondominioResumo } from "@/types"

export const metadata: Metadata = { title: "Dashboard" }

const EMPTY_STATS: CondoDashboardStats = {
  total_condominios: 0,
  total_proprietarios: 0,
  total_unidades: 0,
  total_assembleias: 0,
}

// Usuário PESSOAL (acessoTotal: false) só vê os totais e o resumo dos
// condomínios vinculados a ele em usuario_condominios — mesma regra de
// escopo já usada em app/(dashboard)/condominios/page.tsx.
async function fetchDashboardData(): Promise<{
  stats: CondoDashboardStats
  assembleias: AssembleiaRecente[]
  resumoCondominios: CondominioResumo[]
}> {
  try {
    const condominioIds = await resolveCondominioScope()

    const [stats, assembleias, resumoCondominios] = await Promise.all([
      getCondoDashboardStats(condominioIds),
      getRecentAssembleias(6, condominioIds),
      getResumoPorCondominio(condominioIds),
    ])
    return { stats, assembleias, resumoCondominios }
  } catch {
    return { stats: EMPTY_STATS, assembleias: [], resumoCondominios: [] }
  }
}

export default async function DashboardPage() {
  const { stats, assembleias, resumoCondominios } = await fetchDashboardData()

  return (
    <div className="flex flex-col gap-8 p-6 pt-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão geral das assembleias e condomínios
        </p>
      </div>

      <StatsCards stats={stats} />

      <ResumoCondominiosTable condominios={resumoCondominios} />

      <RecentSurveysTable assembleias={assembleias} />
    </div>
  )
}
