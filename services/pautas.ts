import { createServerClient } from "@/lib/supabase/server"
import type { Pauta } from "@/types"

function rowToPauta(row: {
  id: string
  assembleia_id: string
  ordem: number
  titulo: string
  descricao: string | null
  ativa: boolean
  created_at: string
}): Pauta {
  return {
    id: row.id,
    assembleia_id: row.assembleia_id,
    ordem: row.ordem,
    titulo: row.titulo,
    descricao: row.descricao,
    ativa: row.ativa,
    created_at: row.created_at,
  }
}

export async function getPautasByAssembleiaId(assembleiaId: string): Promise<Pauta[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from("pautas")
    .select("*")
    .eq("assembleia_id", assembleiaId)
    .order("ordem", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => rowToPauta(r as unknown as Parameters<typeof rowToPauta>[0]))
}

export async function createPautasBatch(
  pautas: Pick<Pauta, "assembleia_id" | "ordem" | "titulo" | "descricao">[]
): Promise<Pauta[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from("pautas")
    .insert(
      pautas.map((p) => ({
        assembleia_id: p.assembleia_id,
        ordem: p.ordem,
        titulo: p.titulo,
        descricao: p.descricao,
      }))
    )
    .select()

  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => rowToPauta(r as unknown as Parameters<typeof rowToPauta>[0]))
}

export async function deletePauta(id: string): Promise<void> {
  const db = createServerClient()
  const { error } = await db.from("pautas").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

export async function getNextOrdem(assembleiaId: string): Promise<number> {
  const db = createServerClient()
  const { data, error } = await db
    .from("pautas")
    .select("ordem")
    .eq("assembleia_id", assembleiaId)
    .order("ordem", { ascending: false })
    .limit(1)

  if (error) throw new Error(error.message)
  const max = (data?.[0] as { ordem: number } | undefined)?.ordem ?? 0
  return max + 1
}
