export interface ParsedClient {
  name: string
  company: string
  email: string
}

// Splits a single CSV line respecting quoted fields.
function splitCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

// Accepts either Portuguese or English column names.
function findColumnIndex(header: string[], candidates: string[]): number {
  for (const name of candidates) {
    const idx = header.indexOf(name)
    if (idx !== -1) return idx
  }
  return -1
}

export function parseClientsCSV(text: string): { data: ParsedClient[]; error?: string } {
  const lines = text.trim().split(/\r?\n/)

  if (lines.length < 2) {
    return { data: [], error: "O arquivo está vazio ou não contém dados." }
  }

  const header = lines[0]
    .toLowerCase()
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, ""))

  const nameIdx = findColumnIndex(header, ["name", "nome"])
  const emailIdx = findColumnIndex(header, ["email", "e-mail"])
  const companyIdx = findColumnIndex(header, ["company", "empresa"])

  if (nameIdx === -1) {
    return { data: [], error: "Coluna 'nome' (ou 'name') não encontrada no CSV." }
  }
  if (emailIdx === -1) {
    return { data: [], error: "Coluna 'email' não encontrada no CSV." }
  }

  const data: ParsedClient[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const cols = splitCSVLine(line)
    const name = cols[nameIdx] ?? ""
    const email = cols[emailIdx] ?? ""
    const company = companyIdx !== -1 ? (cols[companyIdx] ?? "") : ""

    if (!name || !email) continue
    data.push({ name, company, email })
  }

  return { data }
}
