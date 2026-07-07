import { createServerClient } from "@/lib/supabase/server"
import type { Pauta, PautaOpcao } from "@/types"

type PautaRow = {
  id: string
  assembleia_id: string
  ordem: number
  titulo: string
  descricao: string | null
  ativa: boolean
  tipo: "sim_nao" | "multipla_escolha"
  permite_abstencao: boolean
  created_at: string
  pauta_opcoes?: PautaOpcaoRow[] | null
}

type PautaOpcaoRow = {
  id: string
  pauta_id: string
  ordem: number
  label: string
  created_at: string
}

function rowToPautaOpcao(row: PautaOpcaoRow): PautaOpcao {
  return {
    id: row.id,
    pauta_id: row.pauta_id,
    ordem: row.ordem,
    label: row.label,
    created_at: row.created_at,
  }
}

function rowToPauta(row: PautaRow): Pauta {
  return {
    id: row.id,
    assembleia_id: row.assembleia_id,
    ordem: row.ordem,
    titulo: row.titulo,
    descricao: row.descricao,
    ativa: row.ativa,
    tipo: row.tipo,
    permite_abstencao: row.permite_abstencao,
    created_at: row.created_at,
    opcoes: row.pauta_opcoes
      ? row.pauta_opcoes.map(rowToPautaOpcao).sort((a, b) => a.ordem - b.ordem)
      : undefined,
  }
}

export async function getPautasByAssembleiaId(assembleiaId: string): Promise<Pauta[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from("pautas")
    .select("*, pauta_opcoes(*)")
    .eq("assembleia_id", assembleiaId)
    .order("ordem", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => rowToPauta(r as unknown as PautaRow))
}

export async function createPautasBatch(
  pautas: (Pick<Pauta, "assembleia_id" | "ordem" | "titulo" | "descricao"> & {
    tipo?: Pauta["tipo"]
    permite_abstencao?: boolean
    opcoes?: string[]
  })[]
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
        tipo: p.tipo ?? "sim_nao",
        permite_abstencao: p.permite_abstencao ?? true,
      }))
    )
    .select()

  if (error) throw new Error(error.message)
  const criadas = (data ?? []) as unknown as PautaRow[]

  // Insere as opções das pautas de múltipla escolha, casando pelo número
  // de `ordem` (único por assembleia) em vez da posição no array — mais
  // seguro do que assumir que o banco preserva a ordem do insert em lote.
  const inputPorOrdem = new Map(pautas.map((p) => [p.ordem, p]))
  const opcoesParaInserir = criadas.flatMap((pauta) => {
    const labels = inputPorOrdem.get(pauta.ordem)?.opcoes ?? []
    return labels.map((label, i) => ({ pauta_id: pauta.id, ordem: i + 1, label }))
  })

  if (opcoesParaInserir.length > 0) {
    const { error: opcoesError } = await db.from("pauta_opcoes").insert(opcoesParaInserir)
    if (opcoesError) throw new Error(opcoesError.message)
  }

  return getPautasByAssembleiaId(pautas[0]!.assembleia_id)
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
