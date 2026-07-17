import { createServerClient } from "@/lib/supabase/server"
import type { AssembleiaStatus, CondoDashboardStats, AssembleiaRecente } from "@/types"

// Prioridade de exibição no painel operacional (dashboard): abertas antes de
// encerradas, para o operador ver primeiro o que ainda exige ação.
const STATUS_PRIORIDADE: Record<AssembleiaStatus, number> = {
  aberta: 0,
  rascunho: 1,
  encerrada: 2,
}

export async function getCondoDashboardStats(): Promise<CondoDashboardStats> {
  const db = createServerClient()

  const [condosRes, propsRes, unidsRes, assembleiaRes] = await Promise.all([
    db.from("condominios").select("*", { count: "exact", head: true }),
    db.from("proprietarios").select("*", { count: "exact", head: true }),
    db.from("unidades").select("*", { count: "exact", head: true }),
    db.from("assembleias").select("*", { count: "exact", head: true }),
  ])

  return {
    total_condominios: condosRes.count ?? 0,
    total_proprietarios: propsRes.count ?? 0,
    total_unidades: unidsRes.count ?? 0,
    total_assembleias: assembleiaRes.count ?? 0,
  }
}

export async function getRecentAssembleias(limit = 6): Promise<AssembleiaRecente[]> {
  const db = createServerClient()

  const { data, error } = await db
    .from("assembleias")
    .select("id, titulo, status, created_at, data_encerramento, condominio_id, condominios(nome)")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  const assembleiaIds = (data ?? []).map((r) => r.id)

  const sendsByAssembleia = new Map<string, number>()
  const respondidosByAssembleia = new Map<string, number>()

  if (assembleiaIds.length > 0) {
    const { data: sendsData } = await db
      .from("assembleia_sends")
      .select("id, assembleia_id")
      .in("assembleia_id", assembleiaIds)

    const sends = (sendsData ?? []) as { id: string; assembleia_id: string }[]
    for (const s of sends) {
      sendsByAssembleia.set(s.assembleia_id, (sendsByAssembleia.get(s.assembleia_id) ?? 0) + 1)
    }

    const sendIds = sends.map((s) => s.id)
    if (sendIds.length > 0) {
      const { data: responsesData } = await db
        .from("assembleia_respostas")
        .select("send_id")
        .in("send_id", sendIds)

      const sendToAssembleia = new Map(sends.map((s) => [s.id, s.assembleia_id]))
      const counted = new Set<string>()
      for (const r of (responsesData ?? []) as { send_id: string }[]) {
        if (!counted.has(r.send_id)) {
          counted.add(r.send_id)
          const aid = sendToAssembleia.get(r.send_id)
          if (aid) respondidosByAssembleia.set(aid, (respondidosByAssembleia.get(aid) ?? 0) + 1)
        }
      }
    }
  }

  const resultado = (data ?? []).map((row) => ({
    id: row.id,
    titulo: row.titulo,
    status: row.status as AssembleiaStatus,
    created_at: row.created_at,
    data_encerramento: row.data_encerramento,
    condominio_id: row.condominio_id,
    condominio_nome: (row.condominios as unknown as { nome: string } | null)?.nome ?? "—",
    total_enviados: sendsByAssembleia.get(row.id) ?? 0,
    total_respondidos: respondidosByAssembleia.get(row.id) ?? 0,
  }))

  // Ordena por prioridade operacional, não por data: abertas primeiro, depois
  // menor participação (quem mais precisa de acompanhamento), e por último a
  // data de encerramento mais próxima como desempate.
  resultado.sort((a, b) => {
    const statusDiff = STATUS_PRIORIDADE[a.status] - STATUS_PRIORIDADE[b.status]
    if (statusDiff !== 0) return statusDiff

    const pctA = a.total_enviados > 0 ? a.total_respondidos / a.total_enviados : 0
    const pctB = b.total_enviados > 0 ? b.total_respondidos / b.total_enviados : 0
    if (pctA !== pctB) return pctA - pctB

    const dateA = a.data_encerramento ? new Date(a.data_encerramento).getTime() : Infinity
    const dateB = b.data_encerramento ? new Date(b.data_encerramento).getTime() : Infinity
    return dateA - dateB
  })

  return resultado
}
