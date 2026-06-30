import { createServerClient } from "@/lib/supabase/server"
import type { Condominio } from "@/types"

function rowToCondominio(row: { id: string; nome: string; created_at: string }): Condominio {
  return { id: row.id, nome: row.nome, created_at: row.created_at }
}

export async function getAllCondominios(): Promise<Condominio[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from("condominios")
    .select("*")
    .order("nome", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToCondominio)
}

export async function getCondominioById(id: string): Promise<Condominio | null> {
  const db = createServerClient()
  const { data, error } = await db.from("condominios").select("*").eq("id", id).single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(error.message)
  }
  return rowToCondominio(data)
}

export async function createCondominio(input: Pick<Condominio, "nome">): Promise<Condominio> {
  const db = createServerClient()
  const { data, error } = await db
    .from("condominios")
    .insert({ nome: input.nome })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return rowToCondominio(data)
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
  return rowToCondominio(data)
}

export async function deleteCondominio(id: string): Promise<void> {
  const db = createServerClient()
  const { error } = await db.from("condominios").delete().eq("id", id)
  if (error) throw new Error(error.message)
}
