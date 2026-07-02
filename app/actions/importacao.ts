"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import { createProprietario } from "@/services/proprietarios"
import { createUnidade } from "@/services/unidades"
import { getSession } from "@/lib/auth"
import { logAudit } from "@/services/auditoria"
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

// Busca proprietário existente no condomínio por CPF > e-mail > nome
async function findProprietarioExistente(
  condominioId: string,
  prop: ProprietarioImport
): Promise<string | null> {
  const db = createServerClient()

  if (prop.cpf) {
    const { data } = await db
      .from("proprietarios")
      .select("id")
      .eq("condominio_id", condominioId)
      .eq("cpf", prop.cpf)
      .maybeSingle()
    if (data) return (data as { id: string }).id
  }

  if (prop.email) {
    const { data } = await db
      .from("proprietarios")
      .select("id")
      .eq("condominio_id", condominioId)
      .ilike("email", prop.email)
      .maybeSingle()
    if (data) return (data as { id: string }).id
  }

  const { data } = await db
    .from("proprietarios")
    .select("id")
    .eq("condominio_id", condominioId)
    .ilike("nome", prop.nome)
    .maybeSingle()

  return data ? (data as { id: string }).id : null
}

export async function executarImportacaoAction(
  condominioId: string,
  proprietarios: ProprietarioImport[]
): Promise<ImportacaoResultado> {
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

  let proprietariosCriados = 0
  let proprietariosAtualizados = 0
  let unidadesCriadas = 0
  let unidadesIgnoradas = 0
  const erros: string[] = []

  // Processa sequencialmente para evitar race conditions na busca por nome
  for (const prop of proprietarios) {
    try {
      let proprietarioId = await findProprietarioExistente(condominioId, prop)

      if (proprietarioId) {
        proprietariosAtualizados++
      } else {
        const criado = await createProprietario({
          condominio_id: condominioId,
          nome: prop.nome,
          email: prop.email,
          cpf: prop.cpf,
          telefone: prop.telefone,
        })
        proprietarioId = criado.id
        proprietariosCriados++
      }

      // Busca unidades já existentes para este proprietário
      const db = createServerClient()
      const { data: existentes } = await db
        .from("unidades")
        .select("numero")
        .eq("proprietario_id", proprietarioId)

      const numerosExistentes = new Set(
        (existentes ?? []).map((u: { numero: string }) => u.numero.toUpperCase())
      )

      // Cria as novas unidades
      for (const numero of prop.unidades) {
        if (numerosExistentes.has(numero.toUpperCase())) {
          unidadesIgnoradas++
          continue
        }

        try {
          await createUnidade({ proprietario_id: proprietarioId, numero, bloco: null })
          unidadesCriadas++
          numerosExistentes.add(numero.toUpperCase())
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Erro desconhecido"
          erros.push(`Unidade "${numero}" (${prop.nome}): ${msg}`)
          unidadesIgnoradas++
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido"
      erros.push(`Proprietário "${prop.nome}": ${msg}`)
    }
  }

  revalidatePath(`${ROUTES.condominios}/${condominioId}`)
  revalidatePath(ROUTES.condominios)
  revalidatePath(ROUTES.dashboard)

  const session = await getSession()
  await logAudit({
    session,
    acao: "importar",
    modulo: "importacao",
    descricao: `Importação concluída: ${proprietariosCriados} criado${proprietariosCriados !== 1 ? "s" : ""}, ${proprietariosAtualizados} atualizado${proprietariosAtualizados !== 1 ? "s" : ""}, ${unidadesCriadas} unidade${unidadesCriadas !== 1 ? "s" : ""} criada${unidadesCriadas !== 1 ? "s" : ""}`,
    condominioId,
  })

  return {
    success: true,
    condominioId,
    proprietariosCriados,
    proprietariosAtualizados,
    unidadesCriadas,
    unidadesIgnoradas,
    erros,
  }
}
