import React from "react"
import type { ReactElement } from "react"
import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import type { DocumentProps } from "@react-pdf/renderer"
import { getSession } from "@/lib/auth"
import { getAssembleiaById } from "@/services/assembleias"
import { getCondominioById } from "@/services/condominios"
import { getApuracaoAssembleia } from "@/services/assembleia-votos"
import { logAudit } from "@/services/auditoria"
import { ApuracaoPDF } from "@/lib/relatorios/pdf-apuracao"
import { safeFilename, formatDateTimeBR } from "@/lib/relatorios/utils"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ assembleiaId: string }> }
) {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })
  if (session.perfil === "visualizador")
    return new NextResponse("Forbidden", { status: 403 })

  const { assembleiaId } = await params

  const assembleia = await getAssembleiaById(assembleiaId)
  if (!assembleia) return new NextResponse("Not Found", { status: 404 })

  const [condominio, apuracao] = await Promise.all([
    getCondominioById(assembleia.condominio_id),
    getApuracaoAssembleia(assembleiaId, assembleia.pautas ?? []),
  ])

  if (!condominio) return new NextResponse("Condomínio não encontrado", { status: 404 })

  const emitidoEm = formatDateTimeBR(new Date().toISOString())

  const element = React.createElement(ApuracaoPDF, {
    assembleia,
    condominio,
    apuracao,
    emitidoPor: session.nome,
    emitidoEm,
  }) as ReactElement<DocumentProps>

  const pdfBuffer = await renderToBuffer(element)

  void logAudit({
    session,
    acao: "exportar",
    modulo: "assembleias",
    descricao: `PDF de apuração gerado: ${assembleia.titulo}`,
    entidade: "assembleia",
    entidadeId: assembleiaId,
    condominioId: assembleia.condominio_id,
    condominioNome: condominio.nome,
  })

  const condo = safeFilename(condominio.nome)
  const titulo = safeFilename(assembleia.titulo)
  const filename = `CondoAssembleia_Apuracao_${condo}_${titulo}.pdf`

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
