import { createServerClient } from "@/lib/supabase/server"
import type {
  AcaoAuditoria,
  AuditLog,
  ModuloAuditoria,
  SessionUser,
} from "@/types"

// ─── Registro ─────────────────────────────────────────────────────────────────

interface LogAuditInput {
  session: SessionUser | null
  acao: AcaoAuditoria
  modulo: ModuloAuditoria
  descricao: string
  entidade?: string
  entidadeId?: string
  condominioId?: string | null
  condominioNome?: string | null
  // Histórico estruturado (Etapa 2) — usado por edições de cadastro.
  campo?: string
  valorAnterior?: string | null
  valorNovo?: string | null
  motivo?: string
}

export async function logAudit(input: LogAuditInput): Promise<void> {
  // Auditoria nunca deve bloquear o fluxo principal
  try {
    const db = createServerClient()
    await db.from("audit_logs").insert({
      usuario_id: input.session?.userId ?? null,
      usuario_nome: input.session?.nome ?? "Sistema",
      usuario_email: input.session?.email ?? "",
      acao: input.acao,
      modulo: input.modulo,
      descricao: input.descricao,
      entidade: input.entidade ?? null,
      entidade_id: input.entidadeId ?? null,
      condominio_id: input.condominioId ?? null,
      condominio_nome: input.condominioNome ?? null,
      campo: input.campo ?? null,
      valor_anterior: input.valorAnterior ?? null,
      valor_novo: input.valorNovo ?? null,
      motivo: input.motivo ?? null,
    })
  } catch {
    // Silencioso: falha de auditoria não deve afetar a operação principal
  }
}

// ─── Consulta ─────────────────────────────────────────────────────────────────

interface QueryAuditFilters {
  usuarioId?: string
  condominioId?: string
  modulo?: string
  acao?: string
  busca?: string
  dataInicio?: string
  dataFim?: string
  entidadeId?: string
  limit?: number
  offset?: number
}

export async function queryAuditLogs(
  filters: QueryAuditFilters = {}
): Promise<{ logs: AuditLog[]; total: number }> {
  const db = createServerClient()
  const {
    usuarioId,
    condominioId,
    modulo,
    acao,
    busca,
    dataInicio,
    dataFim,
    entidadeId,
    limit = 50,
    offset = 0,
  } = filters

  let query = db
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (usuarioId) query = query.eq("usuario_id", usuarioId)
  if (condominioId) query = query.eq("condominio_id", condominioId)
  if (modulo) query = query.eq("modulo", modulo)
  if (acao) query = query.eq("acao", acao)
  if (busca) query = query.ilike("descricao", `%${busca}%`)
  if (dataInicio) query = query.gte("created_at", dataInicio)
  if (dataFim) query = query.lte("created_at", dataFim + "T23:59:59Z")
  if (entidadeId) query = query.eq("entidade_id", entidadeId)

  const { data, count, error } = await query
  if (error) throw new Error(error.message)

  return {
    logs: (data ?? []) as AuditLog[],
    total: count ?? 0,
  }
}

// Últimas alterações registradas para uma entidade específica (ex.: um
// proprietário) — usado para exibir "Histórico recente" no modal de edição.
export async function getHistoricoEntidade(entidadeId: string, limit = 5): Promise<AuditLog[]> {
  const { logs } = await queryAuditLogs({ entidadeId, limit })
  return logs
}
