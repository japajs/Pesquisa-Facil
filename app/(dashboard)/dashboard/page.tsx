import type { Metadata } from "next"
import { getDashboardStats, getRecentSurveys } from "@/services/dashboard"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentSurveysTable } from "@/components/dashboard/recent-surveys-table"
import type { DashboardStats, Survey } from "@/types"

export const metadata: Metadata = { title: "Dashboard" }

const EMPTY_STATS: DashboardStats = {
  total_surveys: 0,
  total_clients: 0,
  total_sends: 0,
  total_responses: 0,
  response_rate: 0,
}

async function fetchDashboardData(): Promise<{ stats: DashboardStats; surveys: Survey[] }> {
  try {
    const [stats, surveys] = await Promise.all([getDashboardStats(), getRecentSurveys(6)])
    return { stats, surveys }
  } catch {
    // Supabase not configured yet — show empty state
    return { stats: EMPTY_STATS, surveys: [] }
  }
}

export default async function DashboardPage() {
  const { stats, surveys } = await fetchDashboardData()

  return (
    <div className="flex flex-col gap-8 p-6 pt-8">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visão geral da sua plataforma</p>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Recent Surveys */}
      <RecentSurveysTable surveys={surveys} />
    </div>
  )
}
