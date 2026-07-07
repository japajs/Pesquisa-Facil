"use server"

import { revalidatePath } from "next/cache"
import {
  createProprietario,
  deleteProprietario,
  getProprietarioById,
  updateProprietario,
} from "@/services/proprietarios"
import {
  createUnidade,
  deleteUnidade,
  getUnidadeById,
  updateUnidade,
} from "@/services/unidades"
import { getProprietariosQueJaVotaram } from "@/services/assembleia-votos"
import { getSession } from "@/lib/auth"
import { logAudit, getHistoricoEntidade } from "@/services/auditoria"
import { ROUTES } from "@/lib/constants"
import type { AuditLog } from "@/types"

// Etapa 3 — deixa explícito, no próprio rastro de auditoria, que a correção
// de cadastro nunca reabre ou reescreve o snapshot de uma votação já
// registrada (ver services/assembleia-votos.ts::createAssembleiaRespostas).
const NOTA_INTEGRIDADE_HISTORICA =
  "Assembleias anteriores permaneceram inalteradas por regra de integridade histórica."

export async function getHistoricoProprietarioAction(proprietarioId: string): Promise<AuditLog[]> {
  try {
    return await getHistoricoEntidade(proprietarioId, 5)
  } catch {
    return []
  }
}

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

// ─── Etapa 2: correção de cadastro sem interromper a assembleia ──────────────

export async function updateProprietarioAction(input: {
  id: string
  condominioId: string
  nome: string
  email: string
  telefone: string
  cpf: string
  observacoes: string
  motivo: string
  confirmarCpfAposVoto?: boolean
}): Promise<{ success: boolean; error?: string }> {
  if (!input.motivo.trim()) return { success: false, error: "Informe o motivo da alteração." }
  if (!input.nome.trim()) return { success: false, error: "Nome obrigatório." }

  try {
    const atual = await getProprietarioById(input.id)
    if (!atual) return { success: false, error: "Proprietário não encontrado." }

    const novoNome = input.nome.trim()
    const novoEmail = input.email.trim() || null
    const novoTelefone = input.telefone.trim() || null
    const novoCpf = input.cpf.trim() || null
    const novasObservacoes = input.observacoes.trim() || null

    const cpfMudou = novoCpf !== (atual.cpf ?? null)
    if (cpfMudou) {
      const jaVotaram = await getProprietariosQueJaVotaram(input.condominioId)
      if (jaVotaram.has(input.id)) {
        const session = await getSession()
        if (!input.confirmarCpfAposVoto || session?.perfil !== "administrador") {
          return {
            success: false,
            error:
              "Este proprietário já votou em alguma assembleia. Alterar o CPF exige confirmação de um administrador.",
          }
        }
      }
    }

    const mudancas: {
      campo: string
      label: string
      valorAnterior: string | null
      valorNovo: string | null
    }[] = []
    if (novoNome !== atual.nome)
      mudancas.push({ campo: "nome", label: "Nome", valorAnterior: atual.nome, valorNovo: novoNome })
    if (novoEmail !== (atual.email ?? null))
      mudancas.push({ campo: "email", label: "E-mail", valorAnterior: atual.email, valorNovo: novoEmail })
    if (novoTelefone !== (atual.telefone ?? null))
      mudancas.push({
        campo: "telefone",
        label: "WhatsApp/Telefone",
        valorAnterior: atual.telefone,
        valorNovo: novoTelefone,
      })
    if (cpfMudou)
      mudancas.push({ campo: "cpf", label: "CPF", valorAnterior: atual.cpf, valorNovo: novoCpf })
    if (novasObservacoes !== (atual.observacoes ?? null))
      mudancas.push({
        campo: "observacoes",
        label: "Observações",
        valorAnterior: atual.observacoes,
        valorNovo: novasObservacoes,
      })

    if (mudancas.length === 0) {
      return { success: false, error: "Nenhuma alteração para salvar." }
    }

    await updateProprietario(input.id, {
      nome: novoNome,
      email: novoEmail,
      telefone: novoTelefone,
      cpf: novoCpf,
      observacoes: novasObservacoes,
    })

    revalidatePath(`${ROUTES.condominios}/${input.condominioId}`)

    const session = await getSession()
    await Promise.all(
      mudancas.map((m) =>
        logAudit({
          session,
          acao: "editar",
          modulo: "proprietarios",
          descricao: `${m.label} alterado(a): "${m.valorAnterior ?? "—"}" → "${m.valorNovo ?? "—"}". ${NOTA_INTEGRIDADE_HISTORICA}`,
          entidade: "proprietario",
          entidadeId: input.id,
          condominioId: input.condominioId,
          campo: m.campo,
          valorAnterior: m.valorAnterior,
          valorNovo: m.valorNovo,
          motivo: input.motivo.trim(),
        })
      )
    )

    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao atualizar proprietário."
    if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("duplicate")) {
      return { success: false, error: "Já existe um proprietário com esse e-mail neste condomínio." }
    }
    return { success: false, error: msg }
  }
}

export async function transferUnidadeAction(input: {
  unidadeId: string
  condominioId: string
  motivo: string
  novoProprietarioId?: string
  novoProprietario?: { nome: string; email: string; telefone?: string }
}): Promise<{ success: boolean; error?: string }> {
  if (!input.motivo.trim()) return { success: false, error: "Informe o motivo da transferência." }
  if (!input.novoProprietarioId && !input.novoProprietario) {
    return { success: false, error: "Selecione o proprietário de destino ou crie um novo." }
  }

  try {
    const unidade = await getUnidadeById(input.unidadeId)
    if (!unidade) return { success: false, error: "Unidade não encontrada." }

    const proprietarioAntigo = await getProprietarioById(unidade.proprietario_id)
    const motivo = input.motivo.trim()
    const session = await getSession()

    let novoProprietarioId = input.novoProprietarioId
    let novoProprietarioNome: string

    if (!novoProprietarioId) {
      const dados = input.novoProprietario!
      if (!dados.nome.trim()) return { success: false, error: "Nome do novo proprietário obrigatório." }
      if (!dados.email.trim()) return { success: false, error: "E-mail do novo proprietário obrigatório." }

      const criado = await createProprietario({
        condominio_id: input.condominioId,
        nome: dados.nome.trim(),
        email: dados.email.trim(),
        telefone: dados.telefone?.trim() || null,
      })
      novoProprietarioId = criado.id
      novoProprietarioNome = criado.nome

      await logAudit({
        session,
        acao: "criar",
        modulo: "proprietarios",
        descricao: `Proprietário criado durante transferência de unidade: ${criado.nome}`,
        entidade: "proprietario",
        entidadeId: criado.id,
        condominioId: input.condominioId,
        motivo,
      })
    } else {
      const existente = await getProprietarioById(novoProprietarioId)
      if (!existente) return { success: false, error: "Proprietário de destino não encontrado." }
      novoProprietarioNome = existente.nome
    }

    if (novoProprietarioId === unidade.proprietario_id) {
      return { success: false, error: "A unidade já pertence a este proprietário." }
    }

    await updateUnidade(input.unidadeId, { proprietario_id: novoProprietarioId })
    revalidatePath(`${ROUTES.condominios}/${input.condominioId}`)

    const nomeAntigo = proprietarioAntigo?.nome ?? "proprietário anterior"

    await Promise.all([
      logAudit({
        session,
        acao: "editar",
        modulo: "unidades",
        descricao: `Unidade ${unidade.numero} transferida para ${novoProprietarioNome}. ${NOTA_INTEGRIDADE_HISTORICA}`,
        entidade: "proprietario",
        entidadeId: unidade.proprietario_id,
        condominioId: input.condominioId,
        campo: "titularidade_unidade",
        valorAnterior: unidade.numero,
        valorNovo: `Transferida para ${novoProprietarioNome}`,
        motivo,
      }),
      logAudit({
        session,
        acao: "editar",
        modulo: "unidades",
        descricao: `Unidade ${unidade.numero} recebida de ${nomeAntigo}. ${NOTA_INTEGRIDADE_HISTORICA}`,
        entidade: "proprietario",
        entidadeId: novoProprietarioId,
        condominioId: input.condominioId,
        campo: "titularidade_unidade",
        valorAnterior: null,
        valorNovo: `${unidade.numero} (de ${nomeAntigo})`,
        motivo,
      }),
    ])

    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao transferir unidade."
    if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("duplicate")) {
      return { success: false, error: "Já existe um proprietário com esse e-mail neste condomínio." }
    }
    return { success: false, error: msg }
  }
}
