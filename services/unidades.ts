import { createServerClient } from "@/lib/supabase/server"
import { normalizarChaveUnidade, formatUnidade } from "@/lib/unidade-format"
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

// Padronização de unidades: a duplicidade é decidida pela CHAVE
// NORMALIZADA (ver lib/unidade-format.ts e a coluna gerada
// unidades.numero_normalizado), não pelo texto exato — "C-0502", "C0502" e
// "c 0502" são a mesma unidade para efeito de duplicidade, mesmo que
// exibidas de formas diferentes. Sem essa checagem, dois proprietários
// diferentes podiam cadastrar a "mesma" unidade só com formatação diferente
// — inflando artificialmente o peso total de votação do condomínio.
async function buscarUnidadeEquivalente(
  db: ReturnType<typeof createServerClient>,
  condominioId: string,
  numero: string,
  bloco: string | null,
  ignorarId?: string
): Promise<{ id: string; numero: string; bloco: string | null } | null> {
  const chave = normalizarChaveUnidade({ numero, bloco })

  let query = db
    .from("unidades")
    .select("id, numero, bloco")
    .eq("condominio_id", condominioId)
    .eq("numero_normalizado", chave)

  if (ignorarId) query = query.neq("id", ignorarId)

  const { data, error } = await query.limit(1).maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

async function getCondominioIdDoProprietario(
  db: ReturnType<typeof createServerClient>,
  proprietarioId: string
): Promise<string> {
  const { data, error } = await db
    .from("proprietarios")
    .select("condominio_id")
    .eq("id", proprietarioId)
    .single()
  if (error) throw new Error(error.message)
  return (data as { condominio_id: string }).condominio_id
}

export async function createUnidade(
  input: Pick<Unidade, "proprietario_id" | "numero" | "bloco">
): Promise<Unidade> {
  const db = createServerClient()

  const condominioId = await getCondominioIdDoProprietario(db, input.proprietario_id)

  const equivalente = await buscarUnidadeEquivalente(db, condominioId, input.numero, input.bloco)
  if (equivalente) {
    throw new Error(
      `A unidade ${formatUnidade({ numero: input.numero, bloco: input.bloco })} já está cadastrada neste condomínio.`
    )
  }

  const { data, error } = await db
    .from("unidades")
    .insert({
      proprietario_id: input.proprietario_id,
      numero: input.numero,
      bloco: input.bloco,
      condominio_id: condominioId,
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

  // Reconfere duplicidade (item 6) sempre que numero/bloco mudam — nunca
  // deixa uma edição "virar" outra unidade que já existe, mesmo só por
  // diferença de formatação.
  let condominioId: string | undefined
  if (input.numero !== undefined || input.bloco !== undefined) {
    const atual = await getUnidadeById(id)
    if (!atual) throw new Error("Unidade não encontrada.")

    const novoNumero = input.numero ?? atual.numero
    const novoBloco = input.bloco !== undefined ? input.bloco : atual.bloco
    condominioId = await getCondominioIdDoProprietario(
      db,
      input.proprietario_id ?? atual.proprietario_id
    )

    const equivalente = await buscarUnidadeEquivalente(db, condominioId, novoNumero, novoBloco, id)
    if (equivalente) {
      throw new Error(
        `A unidade ${formatUnidade({ numero: novoNumero, bloco: novoBloco })} já está cadastrada neste condomínio.`
      )
    }
  } else if (input.proprietario_id !== undefined) {
    condominioId = await getCondominioIdDoProprietario(db, input.proprietario_id)
  }

  const { data, error } = await db
    .from("unidades")
    .update({
      ...(input.numero !== undefined && { numero: input.numero }),
      ...(input.bloco !== undefined && { bloco: input.bloco }),
      ...(input.proprietario_id !== undefined && { proprietario_id: input.proprietario_id }),
      ...(condominioId !== undefined && { condominio_id: condominioId }),
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
