"use server"

import { revalidatePath } from "next/cache"
import {
  createCondominio,
  deleteCondominio,
  updateCondominio,
  updateCondominioInfo,
} from "@/services/condominios"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/services/auditoria"
import { ROUTES } from "@/lib/constants"

export async function createCondominioAction(
  nome: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!nome.trim()) return { success: false, error: "Nome obrigatório." }
  try {
    const condo = await createCondominio({ nome: nome.trim() })
    revalidatePath(ROUTES.condominios)
    const session = await getSession()
    await logAudit({
      session,
      acao: "criar",
      modulo: "condominios",
      descricao: `Condomínio criado: ${nome.trim()}`,
      entidade: "condominio",
      entidadeId: condo.id,
      condominioId: condo.id,
      condominioNome: nome.trim(),
    })
    return { success: true, id: condo.id }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao criar condomínio." }
  }
}

export async function updateCondominioAction(
  id: string,
  nome: string
): Promise<{ success: boolean; error?: string }> {
  if (!nome.trim()) return { success: false, error: "Nome obrigatório." }
  try {
    await updateCondominio(id, { nome: nome.trim() })
    revalidatePath(ROUTES.condominios)
    const session = await getSession()
    await logAudit({
      session,
      acao: "editar",
      modulo: "condominios",
      descricao: `Condomínio renomeado para: ${nome.trim()}`,
      entidade: "condominio",
      entidadeId: id,
      condominioId: id,
      condominioNome: nome.trim(),
    })
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao atualizar condomínio." }
  }
}

export async function deleteCondominioAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteCondominio(id)
    revalidatePath(ROUTES.condominios)
    const session = await getSession()
    await logAudit({
      session,
      acao: "excluir",
      modulo: "condominios",
      descricao: "Condomínio excluído",
      entidade: "condominio",
      entidadeId: id,
      condominioId: id,
    })
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao excluir condomínio." }
  }
}

export async function updateCondominioInfoAction(
  id: string,
  nome: string,
  info: { endereco: string; sindico_nome: string; sindico_contato: string }
): Promise<{ success: boolean; error?: string }> {
  if (!nome.trim()) return { success: false, error: "Nome obrigatório." }
  try {
    await updateCondominio(id, { nome: nome.trim() })
    await updateCondominioInfo(id, {
      endereco: info.endereco.trim() || null,
      sindico_nome: info.sindico_nome.trim() || null,
      sindico_contato: info.sindico_contato.trim() || null,
    })
    revalidatePath(ROUTES.condominios)
    revalidatePath(`${ROUTES.condominios}/${id}`)
    const session = await getSession()
    await logAudit({
      session,
      acao: "editar",
      modulo: "condominios",
      descricao: `Informações do condomínio atualizadas: ${nome.trim()}`,
      entidade: "condominio",
      entidadeId: id,
      condominioId: id,
      condominioNome: nome.trim(),
    })
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao atualizar." }
  }
}
