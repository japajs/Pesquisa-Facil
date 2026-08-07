import { NextRequest, NextResponse } from "next/server"
import { deleteAssembleia } from "@/services/assembleias"

// Rota temporária de limpeza: apaga as assembleias de teste criadas no
// condomínio real durante a demonstração do fluxo de e-mail/anexo. Será
// removida em seguida.
const ASSEMBLEIA_IDS = ["ae29a827-8d64-4283-a372-303ad759d867", "540849d3-a08c-4526-adbf-7b8e5f722023"]

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key")
  if (key !== "demo-fase9-cleiton-2026") {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  const resultados: Record<string, string> = {}
  for (const id of ASSEMBLEIA_IDS) {
    try {
      await deleteAssembleia(id)
      resultados[id] = "apagada"
    } catch (err) {
      resultados[id] = err instanceof Error ? err.message : String(err)
    }
  }

  return NextResponse.json({ resultados })
}
