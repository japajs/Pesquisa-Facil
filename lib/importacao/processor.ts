import type {
  ImportacaoErro,
  ImportacaoLinha,
  ImportacaoPreview,
  ProprietarioImport,
} from "@/types"

// ─── CPF ──────────────────────────────────────────────────────────────────────

function limparCPF(cpf: string): string {
  return cpf.replace(/\D/g, "")
}

function validarCPF(cpf: string): boolean {
  const d = limparCPF(cpf)
  if (d.length !== 11) return false
  if (/^(\d)\1{10}$/.test(d)) return false // todos dígitos iguais

  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(d[i]) * (10 - i)
  let resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(d[9])) return false

  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(d[i]) * (11 - i)
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  return resto === parseInt(d[10])
}

// ─── E-mail ───────────────────────────────────────────────────────────────────

function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
}

// ─── Chave de agrupamento ─────────────────────────────────────────────────────
// Prioridade: CPF > e-mail > nome

function chaveProprietario(
  cpf: string | null,
  email: string | null,
  nome: string
): string {
  if (cpf) return `cpf:${cpf}`
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

    // Valida e normaliza CPF
    let cpf: string | null = null
    if (linha.cpf) {
      const cpfLimpo = limparCPF(linha.cpf)
      if (validarCPF(cpfLimpo)) {
        cpf = cpfLimpo
      } else {
        erros.push({
          linha: linha._linhaOriginal,
          campo: "CPF",
          mensagem: "CPF inválido — será ignorado",
          dados: linha.cpf,
        })
        // Continua sem CPF; usa e-mail ou nome para agrupar
      }
    }

    // Valida e-mail
    let email: string | null = null
    if (linha.email) {
      const emailLimpo = linha.email.trim().toLowerCase()
      if (validarEmail(emailLimpo)) {
        email = emailLimpo
      } else {
        erros.push({
          linha: linha._linhaOriginal,
          campo: "E-mail",
          mensagem: "E-mail inválido — será ignorado",
          dados: linha.email,
        })
      }
    }

    const chave = chaveProprietario(cpf, email, nome)

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

      prop.unidades.push(imovel)
      prop.linhasOrigem.push(linha._linhaOriginal)
      duplicidades++
    } else {
      mapa.set(chave, {
        nome,
        email,
        cpf,
        telefone: linha.whatsapp?.trim() || null,
        unidades: [imovel],
        linhasOrigem: [linha._linhaOriginal],
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
