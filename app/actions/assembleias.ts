"use server"

import { revalidatePath } from "next/cache"
import { createAssembleia, deleteAssembleia, updateAssembleiaStatus } from "@/services/assembleias"
import { createPautasBatch } from "@/services/pautas"
import { requirePerfil } from "@/lib/auth"
import { ROUTES } from "@/lib/constants"
import type { AssembleiaStatus, PautaTipo } from "@/types"

interface PautaInput {
  titulo: string
  descricao: string
  tipo?: PautaTipo
  permite_abstencao?: boolean
  opcoes?: string[]
}

export async function createAssembleiaAction(input: {
  condominio_id: string
  titulo: string
  descricao: string
  data_abertura: string | null
  data_encerramento: string | null
  pautas: PautaInput[]
}): Promise<{ success: boolean; error?: string }> {
  const auth = await requirePerfil(["administrador", "operador"])
  if (!auth.ok) return { success: false, error: auth.error }
  if (!input.titulo.trim()) return { success: false, error: "Título obrigatório." }
  if (input.pautas.length === 0) return { success: false, error: "Adicione pelo menos uma pauta." }
  if (input.pautas.length > 9) return { success: false, error: "Máximo de 9 pautas por assembleia." }
  if (input.pautas.some((p) => !p.titulo.trim()))
    return { success: false, error: "Todas as pautas precisam ter título." }

  for (const p of input.pautas) {
    if (p.tipo === "multipla_escolha") {
      const opcoesValidas = (p.opcoes ?? []).map((o) => o.trim()).filter(Boolean)
      if (opcoesValidas.length < 2) {
        return {
          success: false,
          error: `A pauta "${p.titulo.trim()}" precisa de pelo menos 2 opções.`,
        }
      }
    }
  }

  let assembleiaId: string | null = null
  try {
    const assembleia = await createAssembleia({
      condominio_id: input.condominio_id,
      titulo: input.titulo.trim(),
      descricao: input.descricao.trim() || null,
      data_abertura: input.data_abertura || null,
      data_encerramento: input.data_encerramento || null,
    })
    assembleiaId = assembleia.id

    await createPautasBatch(
      input.pautas.map((p, i) => ({
        assembleia_id: assembleia.id,
        ordem: i + 1,
        titulo: p.titulo.trim(),
        descricao: p.descricao.trim() || null,
        tipo: p.tipo ?? "sim_nao",
        permite_abstencao: p.permite_abstencao ?? true,
        opcoes:
          p.tipo === "multipla_escolha"
            ? (p.opcoes ?? []).map((o) => o.trim()).filter(Boolean)
            : undefined,
      }))
    )

    revalidatePath(`${ROUTES.condominios}/${input.condominio_id}`)
    return { success: true }
  } catch (err) {
    // Auditoria funcional: criar a assembleia e depois criar as pautas são
    // duas escritas separadas (sem transação). Se a segunda falhar, desfaz a
    // primeira para não deixar uma assembleia "órfã" sem nenhuma pauta.
    if (assembleiaId) {
      await deleteAssembleia(assembleiaId).catch(() => {})
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao criar assembleia.",
    }
  }
}

export async function deleteAssembleiaAction(
  id: string,
  condominioId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requirePerfil(["administrador"])
  if (!auth.ok) return { success: false, error: auth.error }
  try {
    await deleteAssembleia(id)
    revalidatePath(`${ROUTES.condominios}/${condominioId}`)
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao excluir assembleia.",
    }
  }
}

export async function updateAssembleiaStatusAction(
  id: string,
  condominioId: string,
  status: AssembleiaStatus
): Promise<{ success: boolean; error?: string }> {
  const auth = await requirePerfil(["administrador", "operador"])
  if (!auth.ok) return { success: false, error: auth.error }
  try {
    await updateAssembleiaStatus(id, status)
    revalidatePath(`${ROUTES.condominios}/${condominioId}`)
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao atualizar status.",
    }
  }
}
