import { createServerClient } from "@/lib/supabase/server"
import type { Client } from "@/types"

function rowToClient(row: {
  id: string
  name: string
  company: string | null
  email: string
  created_at: string
}): Client {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    email: row.email,
    created_at: row.created_at,
  }
}

export async function getAllClients(): Promise<Client[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from("clients")
    .select("*")
    .order("name", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToClient)
}

export async function getClientById(id: string): Promise<Client | null> {
  const db = createServerClient()
  const { data, error } = await db.from("clients").select("*").eq("id", id).single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(error.message)
  }
  return rowToClient(data)
}

export async function createClient(
  input: Pick<Client, "name" | "company" | "email">
): Promise<Client> {
  const db = createServerClient()
  const { data, error } = await db
    .from("clients")
    .insert({ name: input.name, company: input.company, email: input.email })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return rowToClient(data)
}

export async function createManyClients(
  inputs: Pick<Client, "name" | "company" | "email">[]
): Promise<{ inserted: number; skipped: number }> {
  if (inputs.length === 0) return { inserted: 0, skipped: 0 }

  const db = createServerClient()

  // upsert: on conflict (email) do nothing → returns only inserted rows
  const { data, error } = await db
    .from("clients")
    .upsert(
      inputs.map((c) => ({ name: c.name, company: c.company, email: c.email })),
      { onConflict: "email", ignoreDuplicates: true }
    )
    .select()

  if (error) throw new Error(error.message)

  const inserted = data?.length ?? 0
  const skipped = inputs.length - inserted
  return { inserted, skipped }
}

export async function deleteClient(id: string): Promise<void> {
  const db = createServerClient()
  const { error } = await db.from("clients").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

export async function countClients(): Promise<number> {
  const db = createServerClient()
  const { count, error } = await db
    .from("clients")
    .select("*", { count: "exact", head: true })

  if (error) throw new Error(error.message)
  return count ?? 0
}
