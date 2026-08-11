import { createServerClient } from "@/lib/supabase/server"
import { APP_NAME } from "@/lib/constants"

export type ConfigKey =
  | "admin_nome"
  | "admin_email"
  | "auth_password"
  | "email_nome_remetente"
  | "votacao_encerramento_automatico"

export interface Configuracoes {
  admin_nome: string
  admin_email: string
  auth_password: string
  email_nome_remetente: string
  votacao_encerramento_automatico: boolean
}

const DEFAULTS: Configuracoes = {
  admin_nome: "Administrador",
  admin_email: "admin@exemplo.com",
  auth_password: "",
  email_nome_remetente: APP_NAME,
  votacao_encerramento_automatico: false,
}

export async function getAllConfiguracoes(): Promise<Configuracoes> {
  try {
    const db = createServerClient()
    const { data } = await db.from("configuracoes").select("chave, valor")
    const map = new Map(
      (data ?? []).map((r: { chave: string; valor: string }) => [r.chave, r.valor])
    )
    return {
      admin_nome: map.get("admin_nome") ?? DEFAULTS.admin_nome,
      admin_email: map.get("admin_email") ?? DEFAULTS.admin_email,
      auth_password: map.get("auth_password") ?? DEFAULTS.auth_password,
      email_nome_remetente: map.get("email_nome_remetente") ?? DEFAULTS.email_nome_remetente,
      votacao_encerramento_automatico:
        (map.get("votacao_encerramento_automatico") ?? "false") === "true",
    }
  } catch {
    return DEFAULTS
  }
}

export async function getConfiguracao(chave: ConfigKey): Promise<string | null> {
  try {
    const db = createServerClient()
    const { data } = await db
      .from("configuracoes")
      .select("valor")
      .eq("chave", chave)
      .single()
    return data?.valor ?? null
  } catch {
    return null
  }
}

export async function setConfiguracao(chave: ConfigKey, valor: string): Promise<void> {
  const db = createServerClient()
  const { error } = await db
    .from("configuracoes")
    .upsert({ chave, valor, updated_at: new Date().toISOString() }, { onConflict: "chave" })
  if (error) throw new Error(error.message)
}
