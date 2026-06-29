import { SignJWT, importPKCS8 } from "jose"

const SCOPES = "https://www.googleapis.com/auth/spreadsheets"
const TOKEN_URI = "https://oauth2.googleapis.com/token"

async function getAccessToken(): Promise<string> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const rawKey = process.env.GOOGLE_PRIVATE_KEY

  if (!email || !rawKey) {
    throw new Error(
      "Google Sheets não configurado. Defina GOOGLE_SERVICE_ACCOUNT_EMAIL e GOOGLE_PRIVATE_KEY."
    )
  }

  // .env stores newlines as literal \n — convert back
  const pemKey = rawKey.replace(/\\n/g, "\n")
  const privateKey = await importPKCS8(pemKey, "RS256")

  const now = Math.floor(Date.now() / 1000)
  const assertion = await new SignJWT({ scope: SCOPES })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(email)
    .setAudience(TOKEN_URI)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey)

  const res = await fetch(TOKEN_URI, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth2:grant-type:jwt-bearer",
      assertion,
    }),
  })

  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Falha na autenticação do Google: ${detail}`)
  }

  const json = (await res.json()) as { access_token: string }
  return json.access_token
}

/** Overwrites a sheet tab (clears it first, then writes header + rows). */
export async function writeSheetValues(
  sheetName: string,
  rows: string[][]
): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID não configurado.")
  }

  const token = await getAccessToken()
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values`
  const range = encodeURIComponent(`${sheetName}!A1`)

  // Clear the sheet tab
  await fetch(`${base}/${range}:clear`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })

  if (rows.length === 0) return

  // Write all rows starting at A1
  const res = await fetch(`${base}/${range}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: rows }),
  })

  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Falha ao escrever no Google Sheets: ${detail}`)
  }
}
