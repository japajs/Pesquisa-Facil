import type { ImportacaoLinha } from "@/types"

// Normaliza header: lowercase, sem acentos, só alfanumérico
function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "")
}

type Campo = keyof Omit<ImportacaoLinha, "_linhaOriginal">

// Mapa de headers normalizados → campo interno
const HEADER_MAP: Record<string, Campo> = {
  // Imóvel
  imovel: "imovel",
  unidade: "imovel",
  apartamento: "imovel",
  apto: "imovel",
  ap: "imovel",
  bloco: "imovel",
  // Nome
  nome: "nome",
  proprietario: "nome",
  morador: "nome",
  titular: "nome",
  // CPF
  cpf: "cpf",
  documento: "cpf",
  doc: "cpf",
  // WhatsApp / telefone
  whatsapp: "whatsapp",
  telefone: "whatsapp",
  celular: "whatsapp",
  fone: "whatsapp",
  tel: "whatsapp",
  contato: "whatsapp",
  // E-mail
  email: "email",
  mail: "email",
  correio: "email",
}

const REQUIRED_CAMPOS: Campo[] = ["imovel", "nome"]

export interface ParseResult {
  linhas: ImportacaoLinha[]
  colunasFaltando: string[]
}

export async function parseFile(file: File): Promise<ParseResult> {
  // Dynamic import — xlsx (~700 KB) é carregado só quando necessário
  const XLSX = await import("xlsx")

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: "array", raw: false })

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return { linhas: [], colunasFaltando: ["imovel", "nome"] }

  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  })

  if (rows.length < 2) return { linhas: [], colunasFaltando: ["imovel", "nome"] }

  const headerRow = (rows[0] as unknown[]).map((h) => String(h ?? "").trim())

  // Constrói mapa colIdx → campo
  const colMap = new Map<number, Campo>()
  headerRow.forEach((h, idx) => {
    const normalized = normalizeHeader(h)
    const campo = HEADER_MAP[normalized]
    if (campo) {
      const alreadyUsed = Array.from(colMap.values()).includes(campo)
      if (!alreadyUsed) colMap.set(idx, campo)
    }
  })

  // Verifica colunas obrigatórias
  const foundCampos = new Set(colMap.values())
  const colunasFaltando = REQUIRED_CAMPOS.filter((c) => !foundCampos.has(c))
  if (colunasFaltando.length > 0) {
    return { linhas: [], colunasFaltando }
  }

  const linhas: ImportacaoLinha[] = []

  rows.slice(1).forEach((rawRow, rowIdx) => {
    const row = rawRow as unknown[]

    // Extrai campos da linha
    const campos: Partial<Record<Campo, string | null>> = {}
    colMap.forEach((campo, colIdx) => {
      const val = row[colIdx]
      const str = val != null ? String(val).trim() : ""
      campos[campo] = str || null
    })

    const imovel = campos.imovel
    const nome = campos.nome
    if (!imovel || !nome) return // linha vazia ou incompleta

    linhas.push({
      imovel,
      nome,
      cpf: campos.cpf ?? null,
      whatsapp: campos.whatsapp ?? null,
      email: campos.email ?? null,
      _linhaOriginal: rowIdx + 2, // linha 1 = header; dados começam na 2
    })
  })

  return { linhas, colunasFaltando: [] }
}
