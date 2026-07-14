import { createServerClient } from "@/lib/supabase/server"
import type { Usuario, UserPerfil } from "@/types"

interface DbUsuario {
  id: string
  nome: string
  email: string
  senha_hash: string
  cpf: string | null
  celular: string | null
  perfil: UserPerfil
  acesso_total: boolean
  ativo: boolean
  created_at: string
}

const SELECT_SEM_SENHA = "id, nome, email, cpf, celular, perfil, acesso_total, ativo, created_at"

function toUsuario(row: DbUsuario): Usuario {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    cpf: row.cpf,
    celular: row.celular,
    perfil: row.perfil,
    acesso_total: row.acesso_total,
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

export async function getUsuarioById(id: string): Promise<Usuario | null> {
  const db = createServerClient()
  const { data, error } = await db
    .from("usuarios")
    .select(SELECT_SEM_SENHA)
    .eq("id", id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? toUsuario(data as DbUsuario) : null
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
  cpf?: string | null
  celular?: string | null
  perfil?: UserPerfil
  acesso_total?: boolean
}): Promise<Usuario> {
  const db = createServerClient()
  const { data, error } = await db
    .from("usuarios")
    .insert({
      nome: input.nome.trim(),
      email: input.email.toLowerCase().trim(),
      senha_hash: input.senha_hash,
      cpf: input.cpf ?? null,
      celular: input.celular ?? null,
      perfil: input.perfil ?? "operador",
      acesso_total: input.acesso_total ?? true,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return toUsuario(data as DbUsuario)
}

export async function updateUsuario(
  id: string,
  input: Partial<Pick<Usuario, "nome" | "email" | "cpf" | "celular" | "perfil" | "acesso_total" | "ativo">>
): Promise<Usuario> {
  const db = createServerClient()
  const { data, error } = await db
    .from("usuarios")
    .update({
      ...(input.nome !== undefined && { nome: input.nome }),
      ...(input.email !== undefined && { email: input.email.toLowerCase().trim() }),
      ...(input.cpf !== undefined && { cpf: input.cpf }),
      ...(input.celular !== undefined && { celular: input.celular }),
      ...(input.perfil !== undefined && { perfil: input.perfil }),
      ...(input.acesso_total !== undefined && { acesso_total: input.acesso_total }),
      ...(input.ativo !== undefined && { ativo: input.ativo }),
    })
    .eq("id", id)
    .select(SELECT_SEM_SENHA)
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
    .select(SELECT_SEM_SENHA)
    .order("nome")
  if (error) throw new Error(error.message)
  return (data as DbUsuario[]).map(toUsuario)
}

// ─── Escopo por condomínio (MASTER/PESSOAL) ──────────────────────────────────

export async function getCondominiosAutorizados(usuarioId: string): Promise<string[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from("usuario_condominios")
    .select("condominio_id")
    .eq("usuario_id", usuarioId)
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => r.condominio_id as string)
}

// Substitui a lista inteira de condomínios autorizados de um usuário PESSOAL
// — mais simples que calcular diff, e o volume (poucos usuários, poucos
// condomínios) não justifica a complexidade extra.
export async function setCondominiosAutorizados(
  usuarioId: string,
  condominioIds: string[]
): Promise<void> {
  const db = createServerClient()
  const { error: delError } = await db
    .from("usuario_condominios")
    .delete()
    .eq("usuario_id", usuarioId)
  if (delError) throw new Error(delError.message)

  if (condominioIds.length === 0) return

  const { error: insError } = await db
    .from("usuario_condominios")
    .insert(condominioIds.map((condominio_id) => ({ usuario_id: usuarioId, condominio_id })))
  if (insError) throw new Error(insError.message)
}
