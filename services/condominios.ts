import { createServerClient } from "@/lib/supabase/server"
import type { Condominio } from "@/types"

type DbRow = {
  id: string
  nome: string
  endereco: string | null
  sindico_nome: string | null
  sindico_contato: string | null
  created_at: string
}

function rowToCondominio(row: DbRow): Condominio {
  return {
    id: row.id,
    nome: row.nome,
    endereco: row.endereco,
    sindico_nome: row.sindico_nome,
    sindico_contato: row.sindico_contato,
    created_at: row.created_at,
  }
}

export async function getAllCondominios(): Promise<Condominio[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from("condominios")
    .select("*")
    .order("nome", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => rowToCondominio(r as DbRow))
}

export async function getCondominioById(id: string): Promise<Condominio | null> {
  const db = createServerClient()
  const { data, error } = await db.from("condominios").select("*").eq("id", id).single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(error.message)
  }
  return rowToCondominio(data as DbRow)
}

export async function createCondominio(input: Pick<Condominio, "nome">): Promise<Condominio> {
  const db = createServerClient()
  const { data, error } = await db
    .from("condominios")
    .insert({ nome: input.nome })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return rowToCondominio(data as DbRow)
}

export async function updateCondominio(
  id: string,
  input: Pick<Condominio, "nome">
): Promise<Condominio> {
  const db = createServerClient()
  const { data, error } = await db
    .from("condominios")
    .update({ nome: input.nome })
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return rowToCondominio(data as DbRow)
}

export async function updateCondominioInfo(
  id: string,
  input: {
    endereco?: string | null
    sindico_nome?: string | null
    sindico_contato?: string | null
  }
): Promise<Condominio> {
  const db = createServerClient()
  const { data, error } = await db
    .from("condominios")
    .update(input)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return rowToCondominio(data as DbRow)
}

export async function deleteCondominio(id: string): Promise<void> {
  const db = createServerClient()
  const { error } = await db.from("condominios").delete().eq("id", id)
  if (error) throw new Error(error.message)
}
