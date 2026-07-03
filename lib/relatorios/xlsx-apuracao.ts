import * as XLSX from "xlsx"
import { APP_NAME, APP_VERSION } from "@/lib/constants"
import type { Assembleia, AssembleiaApuracao, Condominio } from "@/types"
import type { ParticipanteRelatorio, UnidadeRelatorio } from "@/services/relatorios"
import {
  formatDateTimeBR,
  pctStr,
  sendStatusLabelPT,
  statusLabelPT,
} from "./utils"

export interface XlsxApuracaoData {
  assembleia: Assembleia
  condominio: Condominio
  apuracao: AssembleiaApuracao
  participantes: ParticipanteRelatorio[]
  unidades: UnidadeRelatorio[]
  emitidoPor: string
  emitidoEm: string
}

function boldRow(ws: XLSX.WorkSheet, rowIdx: number, colCount: number) {
  for (let c = 0; c < colCount; c++) {
    const addr = XLSX.utils.encode_cell({ r: rowIdx, c })
    const cell = ws[addr]
    if (cell) cell.s = { font: { bold: true } }
  }
}

export function gerarXlsxApuracao(data: XlsxApuracaoData): Buffer {
  const { assembleia, condominio, apuracao, participantes, unidades, emitidoPor, emitidoEm } =
    data
  const wb = XLSX.utils.book_new()

  /* ── Tab 1: Resumo Geral ─────────────────────────────────────────────── */
  const taxaPart = pctStr(apuracao.total_respondidos, apuracao.total_enviados)

  const resumoRows: (string | number)[][] = [
    [`RELATÓRIO DE APURAÇÃO — ${APP_NAME} v${APP_VERSION}`],
    [],
    ["DADOS DO CONDOMÍNIO"],
    ["Condomínio", condominio.nome],
    ["Endereço", condominio.endereco ?? ""],
    ["Síndico", condominio.sindico_nome ?? ""],
    ["Contato síndico", condominio.sindico_contato ?? ""],
    [],
    ["DADOS DA ASSEMBLEIA"],
    ["Título", assembleia.titulo],
    ["Descrição", assembleia.descricao ?? ""],
    ["Status", statusLabelPT(assembleia.status)],
    ["Abertura", formatDateTimeBR(assembleia.data_abertura)],
    ["Encerramento", formatDateTimeBR(assembleia.data_encerramento)],
    [],
    ["PARTICIPAÇÃO"],
    ["Convites enviados", apuracao.total_enviados],
    ["Responderam", apuracao.total_respondidos],
    ["Taxa de participação", taxaPart],
    [],
    ["PAUTAS VOTADAS", assembleia.pautas?.length ?? 0],
    ...(assembleia.pautas ?? []).map((p, i) => [`Pauta ${i + 1}`, p.titulo]),
    [],
    ["Emitido em", emitidoEm],
    ["Emitido por", emitidoPor],
  ]

  const wsResumo = XLSX.utils.aoa_to_sheet(resumoRows)
  wsResumo["!cols"] = [{ wch: 26 }, { wch: 52 }]
  boldRow(wsResumo, 0, 2)
  boldRow(wsResumo, 2, 1)
  boldRow(wsResumo, 8, 1)
  boldRow(wsResumo, 15, 1)
  boldRow(wsResumo, 20, 2)
  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo Geral")

  /* ── Tab 2: Resultados por Pauta ─────────────────────────────────────── */
  const resHeader = [
    "#",
    "Pauta",
    "SIM (part.)",
    "NÃO (part.)",
    "Abst. (part.)",
    "Total part.",
    "% SIM",
    "% NÃO",
    "% Abst.",
    "SIM (unid.)",
    "NÃO (unid.)",
    "Abst. (unid.)",
    "Total unid.",
    "% SIM (unid.)",
    "% NÃO (unid.)",
    "% Abst. (unid.)",
    "Resultado (part.)",
    "Resultado (ponderado)",
  ]

  const resRows = apuracao.pautas.map((p, i) => {
    const tp = p.por_participantes.sim + p.por_participantes.nao + p.por_participantes.abstencao
    const tw = p.ponderado.sim + p.ponderado.nao + p.ponderado.abstencao
    const vP =
      tp === 0
        ? "SEM VOTOS"
        : p.por_participantes.sim > p.por_participantes.nao
          ? "SIM"
          : p.por_participantes.nao > p.por_participantes.sim
            ? "NÃO"
            : "EMPATE"
    const vW =
      tw === 0
        ? "SEM VOTOS"
        : p.ponderado.sim > p.ponderado.nao
          ? "SIM"
          : p.ponderado.nao > p.ponderado.sim
            ? "NÃO"
            : "EMPATE"

    return [
      i + 1,
      p.pauta.titulo,
      p.por_participantes.sim,
      p.por_participantes.nao,
      p.por_participantes.abstencao,
      tp,
      pctStr(p.por_participantes.sim, tp),
      pctStr(p.por_participantes.nao, tp),
      pctStr(p.por_participantes.abstencao, tp),
      p.ponderado.sim,
      p.ponderado.nao,
      p.ponderado.abstencao,
      tw,
      pctStr(p.ponderado.sim, tw),
      pctStr(p.ponderado.nao, tw),
      pctStr(p.ponderado.abstencao, tw),
      vP,
      vW,
    ]
  })

  const wsRes = XLSX.utils.aoa_to_sheet([resHeader, ...resRows])
  wsRes["!cols"] = [
    { wch: 4 }, { wch: 40 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 8 }, { wch: 8 }, { wch: 8 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 18 }, { wch: 22 },
  ]
  boldRow(wsRes, 0, resHeader.length)
  XLSX.utils.book_append_sheet(wb, wsRes, "Resultados por Pauta")

  /* ── Tab 3: Participantes ────────────────────────────────────────────── */
  const partHeader = ["Nome", "E-mail", "Telefone", "Status envio", "Respondeu?", "Enviado em"]
  const partRows = participantes.map((p) => [
    p.nome,
    p.email ?? "",
    p.telefone ?? "",
    sendStatusLabelPT(p.send_status),
    p.respondeu ? "Sim" : "Não",
    formatDateTimeBR(p.sent_at),
  ])

  const wsPart = XLSX.utils.aoa_to_sheet([partHeader, ...partRows])
  wsPart["!cols"] = [
    { wch: 36 }, { wch: 30 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 20 },
  ]
  boldRow(wsPart, 0, partHeader.length)
  XLSX.utils.book_append_sheet(wb, wsPart, "Participantes")

  /* ── Tab 4: Unidades ─────────────────────────────────────────────────── */
  const unidHeader = ["Nº Unidade", "Bloco", "Proprietário", "E-mail"]
  const unidRows = unidades.map((u) => [u.numero, u.bloco ?? "", u.proprietario, u.email ?? ""])

  const wsUnid = XLSX.utils.aoa_to_sheet([unidHeader, ...unidRows])
  wsUnid["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 36 }, { wch: 30 }]
  boldRow(wsUnid, 0, unidHeader.length)
  XLSX.utils.book_append_sheet(wb, wsUnid, "Unidades")

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer
}
