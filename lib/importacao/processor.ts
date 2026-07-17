import type {
  ImportacaoErro,
  ImportacaoLinha,
  ImportacaoPreview,
  ProprietarioImport,
} from "@/types"
import { dividirCandidatosContato, normalizarCelular, validarEmailFormato } from "@/lib/format"

// ─── E-mail / Celular ─────────────────────────────────────────────────────────
// Validação de formato compartilhada com o cadastro manual/edição — ver
// lib/format.ts. Aqui também é preciso lidar com célula-com-mais-de-um-valor
// (alguém colou dois contatos separados por vírgula/barra/"e" na mesma
// célula da planilha): detecta os candidatos e deixa o valor padrão como o
// primeiro válido, sinalizando a ambiguidade para o usuário resolver na
// revisão em vez de silenciosamente descartar ou concatenar os dois.

interface ResultadoCampoContato {
  valor: string | null
  candidatos?: string[]
}

function resolverEmail(valorBruto: string | null): ResultadoCampoContato {
  if (!valorBruto) return { valor: null }

  const candidatosUnicos = [...new Set(dividirCandidatosContato(valorBruto).map((v) => v.toLowerCase()))]
  const validos = candidatosUnicos.filter(validarEmailFormato)

  if (validos.length === 0) return { valor: null }
  if (validos.length === 1) return { valor: validos[0] }
  return { valor: validos[0], candidatos: validos }
}

function resolverTelefone(valorBruto: string | null): ResultadoCampoContato {
  if (!valorBruto) return { valor: null }

  const candidatos = dividirCandidatosContato(valorBruto)
  const normalizados = [...new Set(candidatos.map(normalizarCelular).filter((v): v is string => v !== null))]

  if (normalizados.length === 0) return { valor: null }
  if (normalizados.length === 1) return { valor: normalizados[0] }
  return { valor: normalizados[0], candidatos: normalizados }
}

// ─── Chave de agrupamento ─────────────────────────────────────────────────────
// Prioridade: e-mail > nome

function chaveProprietario(email: string | null, nome: string): string {
  if (email) return `email:${email.toLowerCase()}`
  return `nome:${nome.toLowerCase().trim()}`
}

// ─── Processamento principal ──────────────────────────────────────────────────

export function processarLinhas(linhas: ImportacaoLinha[]): ImportacaoPreview {
  const erros: ImportacaoErro[] = []
  const mapa = new Map<string, ProprietarioImport>()
  let duplicidades = 0
  let linhasIgnoradas = 0

  for (const linha of linhas) {
    // Normaliza nome
    const nome = linha.nome.trim().replace(/\s+/g, " ")
    if (!nome) {
      erros.push({ linha: linha._linhaOriginal, campo: "Nome", mensagem: "Nome vazio" })
      linhasIgnoradas++
      continue
    }

    // Normaliza imóvel
    const imovel = linha.imovel.trim().toUpperCase()
    if (!imovel) {
      erros.push({ linha: linha._linhaOriginal, campo: "Imóvel", mensagem: "Imóvel vazio" })
      linhasIgnoradas++
      continue
    }

    // Valida e-mail — e detecta célula com mais de um e-mail
    const { valor: email, candidatos: emailCandidatos } = resolverEmail(linha.email)
    if (linha.email && !email) {
      erros.push({
        linha: linha._linhaOriginal,
        campo: "E-mail",
        mensagem: "E-mail inválido — será ignorado",
        dados: linha.email,
      })
    } else if (emailCandidatos) {
      erros.push({
        linha: linha._linhaOriginal,
        campo: "E-mail",
        mensagem: `Mais de um e-mail encontrado nesta célula — "${emailCandidatos[0]}" será usado, selecione o correto na revisão`,
        dados: emailCandidatos.join(", "),
      })
    }

    // Valida celular — e detecta célula com mais de um celular
    const { valor: telefone, candidatos: telefoneCandidatos } = resolverTelefone(linha.whatsapp)
    if (linha.whatsapp && !telefone) {
      erros.push({
        linha: linha._linhaOriginal,
        campo: "Celular",
        mensagem: "Celular inválido — será ignorado",
        dados: linha.whatsapp,
      })
    } else if (telefoneCandidatos) {
      erros.push({
        linha: linha._linhaOriginal,
        campo: "Celular",
        mensagem: "Mais de um celular encontrado nesta célula — o primeiro será usado, selecione o correto na revisão",
        dados: telefoneCandidatos.join(", "),
      })
    }

    const chave = chaveProprietario(email, nome)

    if (mapa.has(chave)) {
      // Proprietário já existe — só adiciona a unidade
      const prop = mapa.get(chave)!

      if (prop.unidades.includes(imovel)) {
        erros.push({
          linha: linha._linhaOriginal,
          campo: "Imóvel",
          mensagem: "Unidade duplicada para este proprietário — ignorada",
          dados: imovel,
        })
        linhasIgnoradas++
        continue
      }

      // Auditoria funcional: o agrupamento é por e-mail — comum quando um
      // mesmo administrador/contador é o contato de vários donos diferentes.
      // Nesse caso o nome da linha nova diverge do proprietário já criado no
      // grupo; avisa em vez de fundir silenciosamente, para o admin decidir
      // (corrigir o e-mail antes de importar, ou aceitar).
      if (email && prop.nome.trim().toLowerCase() !== nome.trim().toLowerCase()) {
        erros.push({
          linha: linha._linhaOriginal,
          campo: "Proprietário",
          mensagem: `E-mail "${email}" já usado por "${prop.nome}" — "${nome}" será tratado como o mesmo proprietário`,
          dados: imovel,
        })
      }

      prop.unidades.push(imovel)
      prop.linhasOrigem.push(linha._linhaOriginal)
      duplicidades++
    } else {
      mapa.set(chave, {
        nome,
        email,
        telefone,
        unidades: [imovel],
        linhasOrigem: [linha._linhaOriginal],
        ...(emailCandidatos ? { emailCandidatos } : {}),
        ...(telefoneCandidatos ? { telefoneCandidatos } : {}),
      })
    }
  }

  const proprietarios = Array.from(mapa.values())

  return {
    proprietarios,
    totalLinhas: linhas.length,
    totalProprietarios: proprietarios.length,
    totalUnidades: proprietarios.reduce((sum, p) => sum + p.unidades.length, 0),
    duplicidades,
    erros,
    linhasIgnoradas,
  }
}
