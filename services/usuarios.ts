import { createServerClient } from "@/lib/supabase/server"
import type { Usuario, UserPerfil } from "@/types"

interface DbUsuario {
  id: string
  nome: string
  email: string
  senha_hash: string
  perfil: UserPerfil
  ativo: boolean
  created_at: string
}

function toUsuario(row: DbUsuario): Usuario {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    perfil: row.perfil,
    ativo: row.ativo,
    created_at: row.created_at,
  }
}

export async function findUsuarioByEmail(email: string): Promise<DbUsuario | null> {
  const db = createServerClient()
  const { data } = await db
    .from("usuarios")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .eq("ativo", true)
    .maybeSingle()
  return (data as DbUsuario | null)
}

export async function hasAnyUsuario(): Promise<boolean> {
  const db = createServerClient()
  const { count } = await db
    .from("usuarios")
    .select("*", { count: "exact", head: true })
  return (count ?? 0) > 0
}

export async function createUsuario(input: {
  nome: string
  email: string
  senha_hash: string
  perfil?: UserPerfil
}): Promise<Usuario> {
  const db = createServerClient()
  const { data, error } = await db
    .from("usuarios")
    .insert({
      nome: input.nome.trim(),
      email: input.email.toLowerCase().trim(),
      senha_hash: input.senha_hash,
      perfil: input.perfil ?? "operador",
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return toUsuario(data as DbUsuario)
}

export async function updateUsuarioSenha(id: string, senha_hash: string): Promise<void> {
  const db = createServerClient()
  const { error } = await db
    .from("usuarios")
    .update({ senha_hash })
    .eq("id", id)
  if (error) throw new Error(error.message)
}

export async function listUsuarios(): Promise<Usuario[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from("usuarios")
    .select("id, nome, email, perfil, ativo, created_at")
    .order("nome")
  if (error) throw new Error(error.message)
  return (data as DbUsuario[]).map(toUsuario)
}
