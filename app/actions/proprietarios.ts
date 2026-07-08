"use server"

import { revalidatePath } from "next/cache"
import {
  createProprietario,
  deleteProprietario,
  getProprietarioById,
  registrarHistoricoAlteracao,
  updateProprietario,
} from "@/services/proprietarios"
import {
  createUnidade,
  deleteUnidade,
  getUnidadeById,
  updateUnidade,
} from "@/services/unidades"
import { getProprietariosQueJaVotaram } from "@/services/assembleia-votos"
import { hasAssembleiaAberta } from "@/services/assembleias"
import { requirePerfil } from "@/lib/auth"
import { ROUTES } from "@/lib/constants"

// Auditoria funcional: antes, qualquer erro de constraint única virava
// sempre "já existe... com esse e-mail", mesmo quando o CPF é que estava
// duplicado — o usuário perdia tempo tentando corrigir o campo errado.
function mensagemErroDuplicidade(msg: string): string | null {
  const lower = msg.toLowerCase()
  if (!lower.includes("unique") && !lower.includes("duplicate")) return null
  if (lower.includes("cpf")) {
    return "Já existe um proprietário com esse CPF neste condomínio."
  }
  if (lower.includes("email")) {
    return "Já existe um proprietário com esse e-mail neste condomínio."
  }
  return "Já existe um proprietário com esses dados neste condomínio."
}

export async function createProprietarioAction(input: {
  condominio_id: string
  nome: string
  email: string
  telefone?: string
  unidades: string[] // numeros de apartamento
}): Promise<{ success: boolean; error?: string }> {
  const auth = await requirePerfil(["administrador", "operador"])
  if (!auth.ok) return { success: false, error: auth.error }
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
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao criar proprietário."
    const duplicidade = mensagemErroDuplicidade(msg)
    if (duplicidade) return { success: false, error: duplicidade }
    return { success: false, error: msg }
  }
}

export async function deleteProprietarioAction(
  id: string,
  condominioId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requirePerfil(["administrador", "operador"])
  if (!auth.ok) return { success: false, error: auth.error }
  try {
    await deleteProprietario(id)
    revalidatePath(`${ROUTES.condominios}/${condominioId}`)
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
  const auth = await requirePerfil(["administrador", "operador"])
  if (!auth.ok) return { success: false, error: auth.error }
  if (!numero.trim()) return { success: false, error: "Número da unidade obrigatório." }
  try {
    await createUnidade({ proprietario_id: proprietarioId, numero: numero.trim(), bloco: null })
    revalidatePath(`${ROUTES.condominios}/${condominioId}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao adicionar unidade." }
  }
}

export async function removeUnidadeAction(
  unidadeId: string,
  condominioId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requirePerfil(["administrador", "operador"])
  if (!auth.ok) return { success: false, error: auth.error }
  try {
    await deleteUnidade(unidadeId)
    revalidatePath(`${ROUTES.condominios}/${condominioId}`)
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
  confirmarCpfAposVoto?: boolean
}): Promise<{ success: boolean; error?: string }> {
  const auth = await requirePerfil(["administrador", "operador"])
  if (!auth.ok) return { success: false, error: auth.error }
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
        if (!input.confirmarCpfAposVoto || auth.session.perfil !== "administrador") {
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
      valorAnterior: string | null
      valorNovo: string | null
    }[] = []
    if (novoNome !== atual.nome)
      mudancas.push({ campo: "nome", valorAnterior: atual.nome, valorNovo: novoNome })
    if (novoEmail !== (atual.email ?? null))
      mudancas.push({ campo: "email", valorAnterior: atual.email, valorNovo: novoEmail })
    if (novoTelefone !== (atual.telefone ?? null))
      mudancas.push({ campo: "telefone", valorAnterior: atual.telefone, valorNovo: novoTelefone })
    if (cpfMudou)
      mudancas.push({ campo: "cpf", valorAnterior: atual.cpf, valorNovo: novoCpf })
    if (novasObservacoes !== (atual.observacoes ?? null))
      mudancas.push({
        campo: "observacoes",
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

    await registrarHistoricoAlteracao(
      input.id,
      mudancas.map((m) => ({
        campo: m.campo,
        valor_anterior: m.valorAnterior,
        valor_novo: m.valorNovo,
      }))
    )

    revalidatePath(`${ROUTES.condominios}/${input.condominioId}`)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao atualizar proprietário."
    const duplicidade = mensagemErroDuplicidade(msg)
    if (duplicidade) return { success: false, error: duplicidade }
    return { success: false, error: msg }
  }
}

export async function transferUnidadeAction(input: {
  unidadeId: string
  condominioId: string
  novoProprietarioId?: string
  novoProprietario?: { nome: string; email: string; telefone?: string }
}): Promise<{ success: boolean; error?: string }> {
  const auth = await requirePerfil(["administrador", "operador"])
  if (!auth.ok) return { success: false, error: auth.error }
  if (!input.novoProprietarioId && !input.novoProprietario) {
    return { success: false, error: "Selecione o proprietário de destino ou crie um novo." }
  }

  try {
    // Auditoria funcional: transferir unidade com assembleia aberta pode
    // fazer o peso dela ser contado duas vezes (no voto do dono antigo e no
    // do novo dono, na mesma apuração). Só permite a correção fora de uma
    // votação em andamento neste condomínio.
    if (await hasAssembleiaAberta(input.condominioId)) {
      return {
        success: false,
        error:
          "Não é possível transferir unidades enquanto houver uma assembleia aberta neste condomínio. Aguarde o encerramento da votação.",
      }
    }

    const unidade = await getUnidadeById(input.unidadeId)
    if (!unidade) return { success: false, error: "Unidade não encontrada." }

    const proprietarioAntigo = await getProprietarioById(unidade.proprietario_id)

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
      registrarHistoricoAlteracao(unidade.proprietario_id, [
        {
          campo: "unidades",
          valor_anterior: unidade.numero,
          valor_novo: `Transferida para ${novoProprietarioNome}`,
        },
      ]),
      registrarHistoricoAlteracao(novoProprietarioId, [
        {
          campo: "unidades",
          valor_anterior: null,
          valor_novo: `${unidade.numero} (de ${nomeAntigo})`,
        },
      ]),
    ])

    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao transferir unidade."
    const duplicidade = mensagemErroDuplicidade(msg)
    if (duplicidade) return { success: false, error: duplicidade }
    return { success: false, error: msg }
  }
}
