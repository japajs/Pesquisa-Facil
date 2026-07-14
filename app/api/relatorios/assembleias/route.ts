import { NextResponse } from "next/server"
import { requireAcessoCondominio } from "@/lib/auth"
import { getAllAssembleias } from "@/services/assembleias"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const condominioId = searchParams.get("condominioId")
  if (!condominioId) return NextResponse.json([])

  // Escopo por condomínio (MASTER/PESSOAL): sem isso, um PESSOAL conseguia
  // listar assembleias de qualquer condomínio só sabendo o ID, mesmo que a
  // tela de relatórios só mostre os condomínios autorizados no dropdown.
  const acesso = await requireAcessoCondominio(condominioId)
  if (!acesso.ok) return new NextResponse("Unauthorized", { status: 401 })

  const assembleias = await getAllAssembleias(condominioId)
  return NextResponse.json(
    assembleias.map((a) => ({ id: a.id, titulo: a.titulo, status: a.status }))
  )
}
