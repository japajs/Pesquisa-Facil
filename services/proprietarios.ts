import { createServerClient } from "@/lib/supabase/server"
import type { Proprietario, Unidade } from "@/types"

type JoinedProprietario = {
  id: string
  condominio_id: string
  nome: string
  email: string | null
  cpf: string | null
  telefone: string | null
  observacoes: string | null
  created_at: string
  unidades: Unidade[] | null
}

function rowToProprietario(row: JoinedProprietario): Proprietario {
  return {
    id: row.id,
    condominio_id: row.condominio_id,
    nome: row.nome,
    email: row.email,
    cpf: row.cpf,
    telefone: row.telefone,
    observacoes: row.observacoes,
    created_at: row.created_at,
    unidades: row.unidades ?? [],
  }
}

// Sempre traz as unidades junto — é a partir delas que o peso de voto
// (getPesoParticipante) é calculado em qualquer lugar que use este service.
const SELECT_WITH_UNIDADES = "*, unidades(*)"

export async function getAllProprietarios(condominioId: string): Promise<Proprietario[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from("proprietarios")
    .select(SELECT_WITH_UNIDADES)
    .eq("condominio_id", condominioId)
    .order("nome", { ascending: true })

  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as JoinedProprietario[]).map(rowToProprietario)
}

export async function getProprietarioById(id: string): Promise<Proprietario | null> {
  const db = createServerClient()
  const { data, error } = await db
    .from("proprietarios")
    .select(SELECT_WITH_UNIDADES)
    .eq("id", id)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(error.message)
  }
  return rowToProprietario(data as unknown as JoinedProprietario)
}

export async function createProprietario(
  input: Pick<Proprietario, "condominio_id" | "nome"> & {
    email?: string | null
    cpf?: string | null
    telefone?: string | null
  }
): Promise<Proprietario> {
  const db = createServerClient()
  const { data, error } = await db
    .from("proprietarios")
    .insert({
      condominio_id: input.condominio_id,
      nome: input.nome,
      ...(input.email ? { email: input.email } : {}),
      ...(input.cpf ? { cpf: input.cpf } : {}),
      ...(input.telefone ? { telefone: input.telefone } : {}),
    })
    .select(SELECT_WITH_UNIDADES)
    .single()

  if (error) throw new Error(error.message)
  return rowToProprietario(data as unknown as JoinedProprietario)
}

export async function updateProprietario(
  id: string,
  input: Partial<Pick<Proprietario, "nome" | "email" | "cpf" | "telefone" | "observacoes">>
): Promise<Proprietario> {
  const db = createServerClient()
  const { data, error } = await db
    .from("proprietarios")
    .update({
      ...(input.nome !== undefined && { nome: input.nome }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.cpf !== undefined && { cpf: input.cpf }),
      ...(input.telefone !== undefined && { telefone: input.telefone }),
      ...(input.observacoes !== undefined && { observacoes: input.observacoes }),
    })
    .eq("id", id)
    .select(SELECT_WITH_UNIDADES)
    .single()

  if (error) throw new Error(error.message)
  return rowToProprietario(data as unknown as JoinedProprietario)
}

export async function deleteProprietario(id: string): Promise<void> {
  const db = createServerClient()
  const { error } = await db.from("proprietarios").delete().eq("id", id)
  if (error) throw new Error(error.message)
}
