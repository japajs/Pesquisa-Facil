import { createServerClient } from "@/lib/supabase/server"
import type { CondoDashboardStats, AssembleiaRecente } from "@/types"

export async function getCondoDashboardStats(): Promise<CondoDashboardStats> {
  const db = createServerClient()

  const [condosRes, propsRes, unidsRes, assembleiaRes, sendsRes, respostasRes] =
    await Promise.all([
      db.from("condominios").select("*", { count: "exact", head: true }),
      db.from("proprietarios").select("*", { count: "exact", head: true }),
      db.from("unidades").select("*", { count: "exact", head: true }),
      db.from("assembleias").select("*", { count: "exact", head: true }),
      db.from("assembleia_sends").select("*", { count: "exact", head: true }),
      db.from("assembleia_respostas").select("send_id"),
    ])

  const total_condominios = condosRes.count ?? 0
  const total_proprietarios = propsRes.count ?? 0
  const total_unidades = unidsRes.count ?? 0
  const total_assembleias = assembleiaRes.count ?? 0
  const total_votos_enviados = sendsRes.count ?? 0

  const respondidos = new Set(
    (respostasRes.data ?? []).map((r) => (r as { send_id: string }).send_id)
  )
  const total_votos_recebidos = respondidos.size

  const participacao_geral =
    total_votos_enviados > 0
      ? Math.round((total_votos_recebidos / total_votos_enviados) * 100)
      : 0

  return {
    total_condominios,
    total_proprietarios,
    total_unidades,
    total_assembleias,
    total_votos_enviados,
    total_votos_recebidos,
    participacao_geral,
  }
}

export async function getRecentAssembleias(limit = 6): Promise<AssembleiaRecente[]> {
  const db = createServerClient()

  const { data, error } = await db
    .from("assembleias")
    .select("id, titulo, created_at, condominio_id, condominios(nome)")
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

  return (data ?? []).map((row) => ({
    id: row.id,
    titulo: row.titulo,
    created_at: row.created_at,
    condominio_id: row.condominio_id,
    condominio_nome: (row.condominios as unknown as { nome: string } | null)?.nome ?? "—",
    total_enviados: sendsByAssembleia.get(row.id) ?? 0,
    total_respondidos: respondidosByAssembleia.get(row.id) ?? 0,
  }))
}
