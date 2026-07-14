import { NextResponse } from "next/server"
import { getSession, requireAcessoCondominio } from "@/lib/auth"
import { getAssembleiaById } from "@/services/assembleias"
import { getCondominioById } from "@/services/condominios"
import { getApuracaoAssembleia } from "@/services/assembleia-votos"
import {
  getParticipantesByAssembleia,
  getUnidadesRelatorio,
  getVotosDetalhados,
} from "@/services/relatorios"
import { gerarXlsxApuracao } from "@/lib/relatorios/xlsx-apuracao"
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

  const acesso = await requireAcessoCondominio(assembleia.condominio_id)
  if (!acesso.ok) return new NextResponse("Not Found", { status: 404 })

  const [condominio, apuracao, participantes, unidades, votosDetalhados] = await Promise.all([
    getCondominioById(assembleia.condominio_id),
    getApuracaoAssembleia(assembleiaId, assembleia.pautas ?? []),
    getParticipantesByAssembleia(assembleiaId),
    getUnidadesRelatorio(assembleia.condominio_id),
    getVotosDetalhados(assembleiaId),
  ])

  if (!condominio) return new NextResponse("Condomínio não encontrado", { status: 404 })

  const emitidoEm = formatDateTimeBR(new Date().toISOString())

  const buffer = gerarXlsxApuracao({
    assembleia,
    condominio,
    apuracao,
    participantes,
    unidades,
    votosDetalhados,
    emitidoPor: session.nome,
    emitidoEm,
  })

  const condo = safeFilename(condominio.nome)
  const titulo = safeFilename(assembleia.titulo)
  const filename = `CondoAssembleia_Apuracao_${condo}_${titulo}.xlsx`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
