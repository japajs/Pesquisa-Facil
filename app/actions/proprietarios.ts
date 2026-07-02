"use server"

import { revalidatePath } from "next/cache"
import {
  createProprietario,
  deleteProprietario,
} from "@/services/proprietarios"
import { createUnidade, deleteUnidade } from "@/services/unidades"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/services/auditoria"
import { ROUTES } from "@/lib/constants"

export async function createProprietarioAction(input: {
  condominio_id: string
  nome: string
  email: string
  telefone?: string
  unidades: string[] // numeros de apartamento
}): Promise<{ success: boolean; error?: string }> {
  if (!input.nome.trim()) return { success: false, error: "Nome obrigatório." }
  if (!input.email.trim()) return { success: false, error: "E-mail obrigatório." }

  try {
    const proprietario = await createProprietario({
      condominio_id: input.condominio_id,
      nome: input.nome.trim(),
      email: input.email.trim() || null,
      telefone: input.telefone?.trim() || null,
    })

    // Cria as unidades em paralelo
    await Promise.all(
      input.unidades
        .map((n) => n.trim())
        .filter(Boolean)
        .map((numero) =>
          createUnidade({ proprietario_id: proprietario.id, numero, bloco: null })
        )
    )

    revalidatePath(`${ROUTES.condominios}/${input.condominio_id}`)
    const session = await getSession()
    await logAudit({
      session,
      acao: "criar",
      modulo: "proprietarios",
      descricao: `Proprietário criado: ${input.nome.trim()} (${input.unidades.length} unidade${input.unidades.length !== 1 ? "s" : ""})`,
      entidade: "proprietario",
      entidadeId: proprietario.id,
      condominioId: input.condominio_id,
    })
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao criar proprietário."
    if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("duplicate")) {
      return { success: false, error: "Já existe um proprietário com esse e-mail neste condomínio." }
    }
    return { success: false, error: msg }
  }
}

export async function deleteProprietarioAction(
  id: string,
  condominioId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteProprietario(id)
    revalidatePath(`${ROUTES.condominios}/${condominioId}`)
    const session = await getSession()
    await logAudit({
      session,
      acao: "excluir",
      modulo: "proprietarios",
      descricao: "Proprietário excluído",
      entidade: "proprietario",
      entidadeId: id,
      condominioId,
    })
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao excluir proprietário." }
  }
}

export async function addUnidadeAction(
  proprietarioId: string,
  condominioId: string,
  numero: string
): Promise<{ success: boolean; error?: string }> {
  if (!numero.trim()) return { success: false, error: "Número da unidade obrigatório." }
  try {
    const unidade = await createUnidade({ proprietario_id: proprietarioId, numero: numero.trim(), bloco: null })
    revalidatePath(`${ROUTES.condominios}/${condominioId}`)
    const session = await getSession()
    await logAudit({
      session,
      acao: "criar",
      modulo: "unidades",
      descricao: `Unidade adicionada: ${numero.trim()}`,
      entidade: "unidade",
      entidadeId: unidade.id,
      condominioId,
    })
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao adicionar unidade." }
  }
}

export async function removeUnidadeAction(
  unidadeId: string,
  condominioId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteUnidade(unidadeId)
    revalidatePath(`${ROUTES.condominios}/${condominioId}`)
    const session = await getSession()
    await logAudit({
      session,
      acao: "excluir",
      modulo: "unidades",
      descricao: "Unidade removida",
      entidade: "unidade",
      entidadeId: unidadeId,
      condominioId,
    })
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao remover unidade." }
  }
}
