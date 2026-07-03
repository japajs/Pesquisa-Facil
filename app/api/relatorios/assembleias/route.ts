import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/auth"
import { getAllAssembleias } from "@/services/assembleias"

export async function GET(req: Request) {
  const auth = await isAuthenticated()
  if (!auth) return new NextResponse("Unauthorized", { status: 401 })

  const { searchParams } = new URL(req.url)
  const condominioId = searchParams.get("condominioId")
  if (!condominioId) return NextResponse.json([])

  const assembleias = await getAllAssembleias(condominioId)
  return NextResponse.json(
    assembleias.map((a) => ({ id: a.id, titulo: a.titulo, status: a.status }))
  )
}
