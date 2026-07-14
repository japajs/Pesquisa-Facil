import { createServerClient } from "@/lib/supabase/server"
import type { Pauta, PautaOpcao, PautaStatus } from "@/types"

type PautaRow = {
  id: string
  assembleia_id: string
  ordem: number
  titulo: string
  descricao: string | null
  ativa: boolean
  tipo: "sim_nao" | "multipla_escolha"
  permite_abstencao: boolean
  status: PautaStatus
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
    status: row.status,
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

  // Auditoria funcional: antes casava pela coluna `ordem`, mas `ordem` só é
  // garantidamente única DENTRO desta mesma chamada — se no futuro pautas
  // forem adicionadas uma a uma a uma assembleia já existente (via
  // getNextOrdem), duas chamadas concorrentes poderiam gerar o mesmo
  // `ordem` e trocar as opções entre pautas. Uma única instrução INSERT com
  // múltiplas linhas preserva a ordem de entrada no retorno — mais seguro
  // casar pela posição no array do que por um valor que pode colidir.
  const opcoesParaInserir = criadas.flatMap((pauta, idx) => {
    const labels = pautas[idx]?.opcoes ?? []
    return labels.map((label, i) => ({ pauta_id: pauta.id, ordem: i + 1, label }))
  })

  if (opcoesParaInserir.length > 0) {
    const { error: opcoesError } = await db.from("pauta_opcoes").insert(opcoesParaInserir)
    if (opcoesError) throw new Error(opcoesError.message)
  }

  return getPautasByAssembleiaId(pautas[0]!.assembleia_id)
}

// Versão por pauta de hasVotosRegistrados (services/assembleias.ts) — usada
// para travar edição/exclusão de UMA pauta específica assim que ela recebe
// o 1º voto, mesmo que a assembleia continue aberta e outras pautas ainda
// não tenham voto nenhum.
export async function hasVotoPauta(pautaId: string): Promise<boolean> {
  const db = createServerClient()
  const { data, error } = await db
    .from("assembleia_respostas")
    .select("id")
    .eq("pauta_id", pautaId)
    .limit(1)

  if (error) throw new Error(error.message)
  return (data ?? []).length > 0
}

// Chamada logo após o 1º voto de uma pauta ser gravado (services/
// assembleia-votos.ts). Só sobe rascunho/aberta → em_votacao; nunca reverte
// e nunca mexe em "encerrada" (que só acontece junto com a assembleia — ver
// updateAssembleiaStatus).
export async function marcarPautaEmVotacaoSeNecessario(pautaId: string): Promise<void> {
  const db = createServerClient()
  const { error } = await db
    .from("pautas")
    .update({ status: "em_votacao" })
    .eq("id", pautaId)
    .in("status", ["rascunho", "aberta"])

  if (error) throw new Error(error.message)
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
