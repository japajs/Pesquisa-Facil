import { createServerClient } from "@/lib/supabase/server"
import type { Coproprietario, CoproprietarioComNome } from "@/types"

function rowToCoproprietario(row: {
  id: string
  unidade_id: string
  proprietario_id: string
  created_at: string
}): Coproprietario {
  return {
    id: row.id,
    unidade_id: row.unidade_id,
    proprietario_id: row.proprietario_id,
    created_at: row.created_at,
  }
}

// Auditoria de assembleias — Fase 9: lista puramente informativa dos
// coproprietários de uma unidade — NUNCA usada por lib/peso.ts ou
// services/assembleia-votos.ts. Quem vota pela unidade continua sendo só
// unidades.proprietario_id.
export async function getCoproprietariosByUnidade(unidadeId: string): Promise<CoproprietarioComNome[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from("unidade_coproprietarios")
    .select("id, unidade_id, proprietario_id, created_at, proprietario:proprietario_id(nome)")
    .eq("unidade_id", unidadeId)
    .order("created_at", { ascending: true })

  if (error) throw new Error(error.message)

  type Row = {
    id: string
    unidade_id: string
    proprietario_id: string
    created_at: string
    proprietario: { nome: string } | null
  }

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    ...rowToCoproprietario(r),
    proprietario_nome: r.proprietario?.nome ?? "—",
  }))
}

async function getUnidade(
  db: ReturnType<typeof createServerClient>,
  unidadeId: string
): Promise<{ proprietario_id: string; condominio_id: string }> {
  const { data, error } = await db
    .from("unidades")
    .select("proprietario_id, condominio_id")
    .eq("id", unidadeId)
    .single()
  if (error) throw new Error(error.message)
  return data as { proprietario_id: string; condominio_id: string }
}

export async function createCoproprietario(
  unidadeId: string,
  proprietarioId: string
): Promise<Coproprietario> {
  const db = createServerClient()

  const unidade = await getUnidade(db, unidadeId)
  if (unidade.proprietario_id === proprietarioId) {
    throw new Error("Este proprietário já é o dono principal desta unidade.")
  }

  const { data: coproprietario, error: propError } = await db
    .from("proprietarios")
    .select("condominio_id")
    .eq("id", proprietarioId)
    .single()
  if (propError) throw new Error(propError.message)
  if ((coproprietario as { condominio_id: string }).condominio_id !== unidade.condominio_id) {
    throw new Error("Este proprietário não pertence ao mesmo condomínio da unidade.")
  }

  const { data, error } = await db
    .from("unidade_coproprietarios")
    .insert({ unidade_id: unidadeId, proprietario_id: proprietarioId })
    .select()
    .single()

  if (error) {
    if (error.message.toLowerCase().includes("unique") || error.code === "23505") {
      throw new Error("Este proprietário já está cadastrado como coproprietário desta unidade.")
    }
    throw new Error(error.message)
  }
  return rowToCoproprietario(data)
}

export async function deleteCoproprietario(id: string): Promise<void> {
  const db = createServerClient()
  const { error } = await db.from("unidade_coproprietarios").delete().eq("id", id)
  if (error) throw new Error(error.message)
}
