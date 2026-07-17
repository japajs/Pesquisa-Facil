import { createServerClient } from "@/lib/supabase/server"
import { RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS } from "./constants"

// Auditoria de segurança: antes disto, o contador ficava num Map em memória
// do processo — na Vercel, cada instância serverless (e cada cold start)
// tem sua própria memória, então o limite de tentativas de login era
// facilmente contornado. Agora persiste numa tabela, sobrevivendo entre
// invocações. Aceita uma pequena janela de corrida sob concorrência alta
// (mesmo padrão de leitura-e-gravação já usado no histórico de cadastro),
// o que é uma troca aceitável frente ao problema real que resolve.
// Achado de auditoria LGPD: linhas antigas (cada uma guarda um IP) nunca
// eram removidas — a tabela só crescia. Não há infraestrutura de cron neste
// projeto, então o expurgo é oportunista: a cada chamada, com baixa
// probabilidade, apaga linhas cuja janela começou há mais de 1 dia (bem
// além da janela de 1 minuto usada para decidir o limite em si).
const CLEANUP_PROBABILITY = 0.01
const STALE_AFTER_MS = 24 * 60 * 60 * 1000

export async function checkRateLimit(key: string): Promise<boolean> {
  const db = createServerClient()
  const now = Date.now()

  if (Math.random() < CLEANUP_PROBABILITY) {
    await db.from("rate_limits").delete().lt("inicio_janela", new Date(now - STALE_AFTER_MS).toISOString())
  }

  const { data } = await db
    .from("rate_limits")
    .select("contagem, inicio_janela")
    .eq("chave", key)
    .maybeSingle()

  if (!data || now - new Date(data.inicio_janela).getTime() > RATE_LIMIT_WINDOW_MS) {
    await db
      .from("rate_limits")
      .upsert({ chave: key, contagem: 1, inicio_janela: new Date(now).toISOString() })
    return true
  }

  if (data.contagem >= RATE_LIMIT_MAX_REQUESTS) return false

  await db.from("rate_limits").update({ contagem: data.contagem + 1 }).eq("chave", key)
  return true
}
