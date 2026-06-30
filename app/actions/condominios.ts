"use server"

import { revalidatePath } from "next/cache"
import {
  createCondominio,
  deleteCondominio,
  updateCondominio,
} from "@/services/condominios"
import { ROUTES } from "@/lib/constants"

export async function createCondominioAction(
  nome: string
): Promise<{ success: boolean; error?: string }> {
  if (!nome.trim()) return { success: false, error: "Nome obrigatório." }
  try {
    await createCondominio({ nome: nome.trim() })
    revalidatePath(ROUTES.condominios)
    return { success: true }
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
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao excluir condomínio." }
  }
}
