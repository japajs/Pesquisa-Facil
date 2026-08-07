import { createServerClient } from "@/lib/supabase/server"
import type { Coproprietario, CoproprietarioComNome } from "@/types"

function rowToCoproprietario(row: {
  id: string
  unidade_id: string
  proprietario_id: string
  created_at: string
}): Coproprietario {
  return {
    id: row.id,
    unidade_id: row.unidade_id,
    proprietario_id: row.proprietario_id,
    created_at: row.created_at,
  }
}

// Auditoria de assembleias — Fase 9: lista puramente informativa dos
// coproprietários de várias unidades de uma vez — NUNCA usada por
// lib/peso.ts ou services/assembleia-votos.ts. Quem vota pela unidade
// continua sendo só unidades.proprietario_id.
//
// Achado de auditoria: `condominioId` não é opcional — confere que TODAS as
// unidades pedidas pertencem a esse condomínio antes de buscar qualquer
// coproprietário, para que um usuário PESSOAL autorizado só no condomínio A
// não consiga ler dados de unidades de outro condomínio passando um
// `condominioId` que ele legitimamente tem acesso junto com `unidadeIds` de
// fora dele. Também resolve num só round-trip (antes era uma consulta por
// unidade).
export async function getCoproprietariosByUnidades(
  unidadeIds: string[],
  condominioId: string
): Promise<Record<string, CoproprietarioComNome[]>> {
  if (unidadeIds.length === 0) return {}

  const db = createServerClient()

  const { data: unidades, error: unidadesError } = await db
    .from("unidades")
    .select("id")
    .in("id", unidadeIds)
    .eq("condominio_id", condominioId)
  if (unidadesError) throw new Error(unidadesError.message)
  if ((unidades ?? []).length !== unidadeIds.length) {
    throw new Error("Uma ou mais unidades não pertencem a este condomínio.")
  }

  const { data, error } = await db
    .from("unidade_coproprietarios")
    .select("id, unidade_id, proprietario_id, created_at, proprietario:proprietario_id(nome)")
    .in("unidade_id", unidadeIds)
    .order("created_at", { ascending: true })

  if (error) throw new Error(error.message)

  type Row = {
    id: string
    unidade_id: string
    proprietario_id: string
    created_at: string
    proprietario: { nome: string } | null
  }

  const porUnidade: Record<string, CoproprietarioComNome[]> = Object.fromEntries(
    unidadeIds.map((id) => [id, []])
  )
  for (const r of (data ?? []) as unknown as Row[]) {
    porUnidade[r.unidade_id].push({
      ...rowToCoproprietario(r),
      proprietario_nome: r.proprietario?.nome ?? "—",
    })
  }
  return porUnidade
}

async function getUnidade(
  db: ReturnType<typeof createServerClient>,
  unidadeId: string
): Promise<{ proprietario_id: string; condominio_id: string }> {
  const { data, error } = await db
    .from("unidades")
    .select("proprietario_id, condominio_id")
    .eq("id", unidadeId)
    .single()
  if (error) throw new Error(error.message)
  return data as { proprietario_id: string; condominio_id: string }
}

// `condominioId` é o condomínio autorizado pra quem está chamando (checado
// em app/actions/coproprietarios.ts via requireAcessoCondominio) — achado de
// auditoria: antes esse parâmetro nunca era comparado com o condomínio real
// da unidade, então um usuário só precisava ter acesso a ALGUM condomínio
// pra criar um vínculo em outro que não era dele.
export async function createCoproprietario(
  unidadeId: string,
  proprietarioId: string,
  condominioId: string
): Promise<Coproprietario> {
  const db = createServerClient()

  const unidade = await getUnidade(db, unidadeId)
  if (unidade.condominio_id !== condominioId) {
    throw new Error("Unidade não encontrada neste condomínio.")
  }
  if (unidade.proprietario_id === proprietarioId) {
    throw new Error("Este proprietário já é o dono principal desta unidade.")
  }

  const { data: coproprietario, error: propError } = await db
    .from("proprietarios")
    .select("condominio_id")
    .eq("id", proprietarioId)
    .single()
  if (propError) throw new Error(propError.message)
  if ((coproprietario as { condominio_id: string }).condominio_id !== unidade.condominio_id) {
    throw new Error("Este proprietário não pertence ao mesmo condomínio da unidade.")
  }

  const { data, error } = await db
    .from("unidade_coproprietarios")
    .insert({ unidade_id: unidadeId, proprietario_id: proprietarioId })
    .select()
    .single()

  if (error) {
    if (error.message.toLowerCase().includes("unique") || error.code === "23505") {
      throw new Error("Este proprietário já está cadastrado como coproprietário desta unidade.")
    }
    throw new Error(error.message)
  }
  return rowToCoproprietario(data)
}

// Mesmo achado de auditoria do create acima: `condominioId` precisa ser
// conferido contra o condomínio real da unidade dona do registro, senão
// qualquer usuário autorizado em QUALQUER condomínio consegue apagar um
// vínculo de coproprietário em outro condomínio só sabendo o id da linha.
export async function deleteCoproprietario(id: string, condominioId: string): Promise<void> {
  const db = createServerClient()

  const { data: registro, error: fetchError } = await db
    .from("unidade_coproprietarios")
    .select("unidade_id")
    .eq("id", id)
    .single()
  if (fetchError) throw new Error(fetchError.message)

  const unidade = await getUnidade(db, (registro as { unidade_id: string }).unidade_id)
  if (unidade.condominio_id !== condominioId) {
    throw new Error("Este registro não pertence a este condomínio.")
  }

  const { error } = await db.from("unidade_coproprietarios").delete().eq("id", id)
  if (error) throw new Error(error.message)
}
