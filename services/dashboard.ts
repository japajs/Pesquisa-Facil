import { createServerClient } from "@/lib/supabase/server"
import type { CondoDashboardStats, VotacaoRecente } from "@/types"

// ─── Condo dashboard ─────────────────────────────────────────────────────────

export async function getCondoDashboardStats(): Promise<CondoDashboardStats> {
  const db = createServerClient()

  const [condosRes, propsRes, unidsRes, votacoesRes, enviadosRes, recebidosRes] =
    await Promise.all([
      db.from("condominios").select("*", { count: "exact", head: true }),
      db.from("proprietarios").select("*", { count: "exact", head: true }),
      db.from("unidades").select("*", { count: "exact", head: true }),
      db.from("condo_surveys").select("*", { count: "exact", head: true }),
      db.from("condo_survey_sends").select("*", { count: "exact", head: true }),
      db.from("condo_survey_responses").select("*", { count: "exact", head: true }),
    ])

  const total_condominios = condosRes.count ?? 0
  const total_proprietarios = propsRes.count ?? 0
  const total_unidades = unidsRes.count ?? 0
  const total_votacoes = votacoesRes.count ?? 0
  const total_votos_enviados = enviadosRes.count ?? 0
  const total_votos_recebidos = recebidosRes.count ?? 0
  const participacao_geral =
    total_votos_enviados > 0
      ? Math.round((total_votos_recebidos / total_votos_enviados) * 100)
      : 0

  return {
    total_condominios,
    total_proprietarios,
    total_unidades,
    total_votacoes,
    total_votos_enviados,
    total_votos_recebidos,
    participacao_geral,
  }
}

export async function getRecentVotacoes(limit = 6): Promise<VotacaoRecente[]> {
  const db = createServerClient()

  const { data, error } = await db
    .from("condo_surveys")
    .select("id, titulo, created_at, condominio_id, condominios(nome)")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  const votacaoIds = (data ?? []).map((r) => r.id)

  // Conta enviados e recebidos por votação
  const sendsByVotacao = new Map<string, number>()
  const responsesByVotacao = new Map<string, number>()

  if (votacaoIds.length > 0) {
    // Busca sends por votação
    const { data: sendsData } = await db
      .from("condo_survey_sends")
      .select("id, condo_survey_id")
      .in("condo_survey_id", votacaoIds)

    const sends = (sendsData ?? []) as { id: string; condo_survey_id: string }[]
    for (const s of sends) {
      sendsByVotacao.set(s.condo_survey_id, (sendsByVotacao.get(s.condo_survey_id) ?? 0) + 1)
    }

    // Busca respostas pelos send_ids coletados acima
    const sendIds = sends.map((s) => s.id)
    if (sendIds.length > 0) {
      const { data: responsesData } = await db
        .from("condo_survey_responses")
        .select("send_id")
        .in("send_id", sendIds)

      const sendToVotacao = new Map(sends.map((s) => [s.id, s.condo_survey_id]))
      for (const r of (responsesData ?? []) as { send_id: string }[]) {
        const vid = sendToVotacao.get(r.send_id)
        if (vid) responsesByVotacao.set(vid, (responsesByVotacao.get(vid) ?? 0) + 1)
      }
    }
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    titulo: row.titulo,
    created_at: row.created_at,
    condominio_id: row.condominio_id,
    condominio_nome:
      (row.condominios as unknown as { nome: string } | null)?.nome ?? "—",
    total_enviados: sendsByVotacao.get(row.id) ?? 0,
    total_respondidos: responsesByVotacao.get(row.id) ?? 0,
  }))
}

