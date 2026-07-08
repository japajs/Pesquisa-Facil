"use server"

import { revalidatePath } from "next/cache"
import { executarLoteImportacao } from "@/services/importacao"
import { requirePerfil } from "@/lib/auth"
import { ROUTES } from "@/lib/constants"
import type { ProprietarioImport } from "@/types"

export interface ImportacaoResultado {
  success: boolean
  condominioId: string
  proprietariosCriados: number
  proprietariosAtualizados: number
  unidadesCriadas: number
  unidadesIgnoradas: number
  erros: string[]
  error?: string
}

export async function executarImportacaoAction(
  condominioId: string,
  proprietarios: ProprietarioImport[]
): Promise<ImportacaoResultado> {
  const auth = await requirePerfil(["administrador", "operador"])
  if (!auth.ok) {
    return {
      success: false,
      condominioId: condominioId || "",
      proprietariosCriados: 0,
      proprietariosAtualizados: 0,
      unidadesCriadas: 0,
      unidadesIgnoradas: 0,
      erros: [],
      error: auth.error,
    }
  }
  if (!condominioId) {
    return {
      success: false,
      condominioId: "",
      proprietariosCriados: 0,
      proprietariosAtualizados: 0,
      unidadesCriadas: 0,
      unidadesIgnoradas: 0,
      erros: [],
      error: "Condomínio não selecionado.",
    }
  }

  if (!proprietarios.length) {
    return {
      success: false,
      condominioId,
      proprietariosCriados: 0,
      proprietariosAtualizados: 0,
      unidadesCriadas: 0,
      unidadesIgnoradas: 0,
      erros: [],
      error: "Nenhum proprietário para importar.",
    }
  }

  const resultado = await executarLoteImportacao(condominioId, proprietarios)

  revalidatePath(`${ROUTES.condominios}/${condominioId}`)
  revalidatePath(ROUTES.condominios)
  revalidatePath(ROUTES.dashboard)

  return {
    success: true,
    condominioId,
    ...resultado,
  }
}
