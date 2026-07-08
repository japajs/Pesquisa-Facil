import { createServerClient } from "@/lib/supabase/server"
import type { Unidade } from "@/types"

function rowToUnidade(row: {
  id: string
  proprietario_id: string
  numero: string
  bloco: string | null
  created_at: string
}): Unidade {
  return {
    id: row.id,
    proprietario_id: row.proprietario_id,
    numero: row.numero,
    bloco: row.bloco,
    created_at: row.created_at,
  }
}

export async function getUnidadeById(id: string): Promise<Unidade | null> {
  const db = createServerClient()
  const { data, error } = await db.from("unidades").select("*").eq("id", id).single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(error.message)
  }
  return rowToUnidade(data)
}

export async function getUnidadesByProprietarioId(proprietarioId: string): Promise<Unidade[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from("unidades")
    .select("*")
    .eq("proprietario_id", proprietarioId)
    .order("numero", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToUnidade)
}

// Auditoria funcional: sem essa checagem, dois proprietários diferentes
// podiam cadastrar a mesma unidade (mesmo número/bloco) no mesmo condomínio
// — inflando artificialmente o peso total de votação do condomínio.
async function unidadeJaExisteNoCondominio(
  db: ReturnType<typeof createServerClient>,
  proprietarioId: string,
  numero: string,
  bloco: string | null
): Promise<boolean> {
  const { data: proprietario, error: propError } = await db
    .from("proprietarios")
    .select("condominio_id")
    .eq("id", proprietarioId)
    .single()
  if (propError) throw new Error(propError.message)

  let query = db
    .from("unidades")
    .select("id, proprietarios!inner(condominio_id)")
    .eq("proprietarios.condominio_id", (proprietario as { condominio_id: string }).condominio_id)
    .eq("numero", numero)

  query = bloco === null ? query.is("bloco", null) : query.eq("bloco", bloco)

  const { data, error } = await query.limit(1)
  if (error) throw new Error(error.message)
  return (data ?? []).length > 0
}

export async function createUnidade(
  input: Pick<Unidade, "proprietario_id" | "numero" | "bloco">
): Promise<Unidade> {
  const db = createServerClient()

  if (await unidadeJaExisteNoCondominio(db, input.proprietario_id, input.numero, input.bloco)) {
    throw new Error("Esta unidade já está cadastrada para outro proprietário neste condomínio.")
  }

  const { data, error } = await db
    .from("unidades")
    .insert({
      proprietario_id: input.proprietario_id,
      numero: input.numero,
      bloco: input.bloco,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return rowToUnidade(data)
}

export async function updateUnidade(
  id: string,
  input: Partial<Pick<Unidade, "numero" | "bloco" | "proprietario_id">>
): Promise<Unidade> {
  const db = createServerClient()
  const { data, error } = await db
    .from("unidades")
    .update({
      ...(input.numero !== undefined && { numero: input.numero }),
      ...(input.bloco !== undefined && { bloco: input.bloco }),
      ...(input.proprietario_id !== undefined && { proprietario_id: input.proprietario_id }),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return rowToUnidade(data)
}

export async function deleteUnidade(id: string): Promise<void> {
  const db = createServerClient()
  const { error } = await db.from("unidades").delete().eq("id", id)
  if (error) throw new Error(error.message)
}
