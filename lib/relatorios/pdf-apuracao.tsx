import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { APP_NAME, APP_VERSION } from "@/lib/constants"
import type { Assembleia, AssembleiaApuracao, Condominio } from "@/types"
import { formatDateTimeBR, pctStr, statusLabelPT } from "./utils"

export interface ApuracaoPDFProps {
  assembleia: Assembleia
  condominio: Condominio
  apuracao: AssembleiaApuracao
  emitidoPor: string
  emitidoEm: string
}

const C = {
  primary: "#4F46E5",
  primaryDark: "#3730A3",
  primaryLight: "#C7D2FE",
  tableHeader: "#F9FAFB",
  border: "#E5E7EB",
  text: "#111827",
  muted: "#6B7280",
  sim: "#15803D",
  nao: "#B91C1C",
  abstencao: "#B45309",
  white: "#FFFFFF",
  simBg: "#DCFCE7",
  naoBg: "#FEE2E2",
  abstBg: "#FEF3C7",
}

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.text,
    paddingHorizontal: 36,
    paddingTop: 52,
    paddingBottom: 48,
    lineHeight: 1.45,
  },
  /* ── fixed header ─────────────────────── */
  pageHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: C.primary,
    paddingHorizontal: 36,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  phBrand: { color: C.white, fontSize: 11, fontFamily: "Helvetica-Bold" },
  phSub: { color: C.primaryLight, fontSize: 7 },
  phLabel: { color: C.primaryLight, fontSize: 7 },
  /* ── fixed footer ─────────────────────── */
  pageFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingHorizontal: 36,
    paddingVertical: 7,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: { fontSize: 7, color: C.muted },
  /* ── typography ───────────────────────── */
  reportTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  reportCondo: { fontSize: 9, color: C.muted, marginBottom: 14 },
  sectionLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    marginTop: 14,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingBottom: 3,
  },
  /* ── info grid ────────────────────────── */
  infoGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 4 },
  infoCell: { width: "50%", marginBottom: 8 },
  infoCell100: { width: "100%", marginBottom: 8 },
  infoLbl: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.muted },
  infoVal: { fontSize: 9, color: C.text, marginTop: 1 },
  /* ── participation row ────────────────── */
  partRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 3,
    marginBottom: 14,
    overflow: "hidden",
  },
  partCell: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, alignItems: "center" },
  partBorderR: { borderRightWidth: 1, borderRightColor: C.border },
  partNum: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  partLbl: { fontSize: 7, color: C.muted, marginTop: 2, textAlign: "center" },
  /* ── pauta block ──────────────────────── */
  pautaBlock: { marginBottom: 16 },
  pautaHeader: { flexDirection: "row", alignItems: "baseline", marginBottom: 3 },
  pautaIdx: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.muted, marginRight: 6 },
  pautaTitle: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  pautaDesc: { fontSize: 8, color: C.muted, marginBottom: 8, lineHeight: 1.5 },
  /* ── result tables ────────────────────── */
  tablePair: { flexDirection: "row", marginBottom: 6 },
  tableHalf: { flex: 1 },
  tableLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    marginBottom: 3,
  },
  table: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 2,
  },
  tRowHeader: {
    flexDirection: "row",
    backgroundColor: C.tableHeader,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tRowLast: { flexDirection: "row" },
  tcWide: { flex: 2, paddingVertical: 5, paddingHorizontal: 7 },
  tcNarrow: { flex: 1, paddingVertical: 5, paddingHorizontal: 7, textAlign: "right" },
  thText: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.muted },
  tdText: { fontSize: 8, color: C.text },
  tdSim: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.sim },
  tdNao: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.nao },
  tdAbst: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.abstencao },
  /* ── verdict ──────────────────────────── */
  verdict: {
    marginTop: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 3,
    alignItems: "center",
  },
  verdictText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.white },
  verdictSub: { fontSize: 7, color: C.white, marginTop: 1, opacity: 0.85 },
  /* ── divider ──────────────────────────── */
  divider: { borderBottomWidth: 1, borderBottomColor: C.border, marginVertical: 12 },
})

function verdictColor(v: string): string {
  if (v === "SIM") return C.sim
  if (v === "NÃO") return C.nao
  if (v === "EMPATE") return C.muted
  return C.muted
}

function calcVerdict(sim: number, nao: number, total: number): string {
  if (total === 0) return "SEM VOTOS"
  if (sim > nao) return "SIM"
  if (nao > sim) return "NÃO"
  return "EMPATE"
}

const CORES_OPCOES = ["#4F46E5", "#0EA5E9", "#15803D", "#D946EF", "#EA580C", "#0D9488"]

function PautaMultiplaEscolha({ item }: { item: AssembleiaApuracao["pautas"][number] }) {
  const { ponderado, por_participantes, opcoes_resultado = [] } = item
  const opcoes = [...opcoes_resultado].sort((a, b) => b.ponderado - a.ponderado)
  const tw = opcoes.reduce((sum, o) => sum + o.ponderado, 0) + ponderado.abstencao
  const tp = opcoes.reduce((sum, o) => sum + o.participantes, 0) + por_participantes.abstencao
  const vencedora = tw > 0 && opcoes.length > 0 ? opcoes[0] : null

  return (
    <View style={s.table}>
      <View style={s.tRowHeader}>
        <View style={s.tcWide}>
          <Text style={s.thText}>OPÇÃO</Text>
        </View>
        <View style={s.tcNarrow}>
          <Text style={s.thText}>PARTIC.</Text>
        </View>
        <View style={s.tcNarrow}>
          <Text style={s.thText}>UNID.</Text>
        </View>
        <View style={s.tcNarrow}>
          <Text style={s.thText}>%</Text>
        </View>
      </View>
      {opcoes.map((o, i) => (
        <View key={o.opcao_id} style={i === opcoes.length - 1 && ponderado.abstencao === 0 ? s.tRowLast : s.tRow}>
          <View style={s.tcWide}>
            <Text style={{ ...s.tdText, color: CORES_OPCOES[i % CORES_OPCOES.length], fontFamily: "Helvetica-Bold" }}>
              {o.label}
            </Text>
          </View>
          <View style={s.tcNarrow}>
            <Text style={s.tdText}>{o.participantes}</Text>
          </View>
          <View style={s.tcNarrow}>
            <Text style={s.tdText}>{o.ponderado}</Text>
          </View>
          <View style={s.tcNarrow}>
            <Text style={s.tdText}>{pctStr(o.ponderado, tw)}</Text>
          </View>
        </View>
      ))}
      {ponderado.abstencao > 0 && (
        <View style={s.tRowLast}>
          <View style={s.tcWide}>
            <Text style={s.tdAbst}>ABSTENÇÃO</Text>
          </View>
          <View style={s.tcNarrow}>
            <Text style={s.tdText}>{por_participantes.abstencao}</Text>
          </View>
          <View style={s.tcNarrow}>
            <Text style={s.tdText}>{ponderado.abstencao}</Text>
          </View>
          <View style={s.tcNarrow}>
            <Text style={s.tdText}>{pctStr(ponderado.abstencao, tw)}</Text>
          </View>
        </View>
      )}
      {vencedora ? (
        <View style={[s.verdict, { backgroundColor: CORES_OPCOES[opcoes.indexOf(vencedora) % CORES_OPCOES.length] }]}>
          <Text style={s.verdictText}>{vencedora.label.toUpperCase()}</Text>
          <Text style={s.verdictSub}>
            {vencedora.ponderado} unid. · {tp} participante{tp === 1 ? "" : "s"}
          </Text>
        </View>
      ) : (
        <View style={[s.verdict, { backgroundColor: C.muted }]}>
          <Text style={s.verdictText}>SEM VOTOS</Text>
        </View>
      )}
    </View>
  )
}

export function ApuracaoPDF({
  assembleia,
  condominio,
  apuracao,
  emitidoPor,
  emitidoEm,
}: ApuracaoPDFProps) {
  const { total_enviados, total_respondidos } = apuracao

  return (
    <Document
      title={`Apuracao - ${assembleia.titulo}`}
      author={APP_NAME}
      creator={`${APP_NAME} v${APP_VERSION}`}
    >
      <Page size="A4" style={s.page}>
        {/* ── Fixed header ──────────────────── */}
        <View style={s.pageHeader} fixed>
          <View>
            <Text style={s.phBrand}>{APP_NAME}</Text>
            <Text style={s.phSub}>Sistema de Assembleias Eletrônicas para Condomínios</Text>
          </View>
          <Text style={s.phLabel}>RELATÓRIO DE APURAÇÃO</Text>
        </View>

        {/* ── Report title ──────────────────── */}
        <Text style={s.reportTitle}>{assembleia.titulo}</Text>
        <Text style={s.reportCondo}>{condominio.nome}</Text>

        {/* ── Assembly info ─────────────────── */}
        <Text style={s.sectionLabel}>INFORMAÇÕES DA ASSEMBLEIA</Text>
        <View style={s.infoGrid}>
          <View style={s.infoCell}>
            <Text style={s.infoLbl}>CONDOMÍNIO</Text>
            <Text style={s.infoVal}>{condominio.nome}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.infoLbl}>STATUS</Text>
            <Text style={s.infoVal}>{statusLabelPT(assembleia.status)}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.infoLbl}>ABERTURA</Text>
            <Text style={s.infoVal}>{formatDateTimeBR(assembleia.data_abertura)}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.infoLbl}>ENCERRAMENTO</Text>
            <Text style={s.infoVal}>{formatDateTimeBR(assembleia.data_encerramento)}</Text>
          </View>
          {assembleia.descricao ? (
            <View style={s.infoCell100}>
              <Text style={s.infoLbl}>DESCRIÇÃO</Text>
              <Text style={s.infoVal}>{assembleia.descricao}</Text>
            </View>
          ) : null}
          {condominio.sindico_nome ? (
            <View style={s.infoCell}>
              <Text style={s.infoLbl}>SÍNDICO</Text>
              <Text style={s.infoVal}>{condominio.sindico_nome}</Text>
            </View>
          ) : null}
          {condominio.endereco ? (
            <View style={s.infoCell}>
              <Text style={s.infoLbl}>ENDEREÇO</Text>
              <Text style={s.infoVal}>{condominio.endereco}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Participation ─────────────────── */}
        <Text style={s.sectionLabel}>PARTICIPAÇÃO GERAL</Text>
        <View style={s.partRow}>
          <View style={[s.partCell, s.partBorderR]}>
            <Text style={s.partNum}>{total_enviados}</Text>
            <Text style={s.partLbl}>Convites enviados</Text>
          </View>
          <View style={[s.partCell, s.partBorderR]}>
            <Text style={s.partNum}>{total_respondidos}</Text>
            <Text style={s.partLbl}>Responderam</Text>
          </View>
          <View style={s.partCell}>
            <Text style={s.partNum}>{pctStr(total_respondidos, total_enviados)}</Text>
            <Text style={s.partLbl}>Taxa de participação</Text>
          </View>
        </View>

        {/* ── Pautas ────────────────────────── */}
        <Text style={s.sectionLabel}>RESULTADOS POR PAUTA</Text>

        {apuracao.pautas.map((item, i) => {
          const { pauta, por_participantes, ponderado, total_apartamentos_representados } = item
          const tp =
            por_participantes.sim + por_participantes.nao + por_participantes.abstencao
          const tw = ponderado.sim + ponderado.nao + ponderado.abstencao
          const vP = calcVerdict(por_participantes.sim, por_participantes.nao, tp)
          const vW = calcVerdict(ponderado.sim, ponderado.nao, tw)

          return (
            <View key={pauta.id} style={s.pautaBlock} wrap={false}>
              <View style={s.pautaHeader}>
                <Text style={s.pautaIdx}>PAUTA {i + 1}</Text>
                <Text style={s.pautaTitle}>{pauta.titulo}</Text>
              </View>
              {pauta.descricao ? (
                <Text style={s.pautaDesc}>{pauta.descricao}</Text>
              ) : null}

              {pauta.tipo === "multipla_escolha" ? (
                <PautaMultiplaEscolha item={item} />
              ) : (
              <View style={s.tablePair}>
                {/* Por participantes */}
                <View style={[s.tableHalf, { marginRight: 6 }]}>
                  <Text style={s.tableLabel}>POR PARTICIPANTES</Text>
                  <View style={s.table}>
                    <View style={s.tRowHeader}>
                      <View style={s.tcWide}>
                        <Text style={s.thText}>RESPOSTA</Text>
                      </View>
                      <View style={s.tcNarrow}>
                        <Text style={s.thText}>QTD</Text>
                      </View>
                      <View style={s.tcNarrow}>
                        <Text style={s.thText}>%</Text>
                      </View>
                    </View>
                    <View style={s.tRow}>
                      <View style={s.tcWide}>
                        <Text style={s.tdSim}>SIM</Text>
                      </View>
                      <View style={s.tcNarrow}>
                        <Text style={s.tdText}>{por_participantes.sim}</Text>
                      </View>
                      <View style={s.tcNarrow}>
                        <Text style={s.tdText}>
                          {pctStr(por_participantes.sim, tp)}
                        </Text>
                      </View>
                    </View>
                    <View style={s.tRow}>
                      <View style={s.tcWide}>
                        <Text style={s.tdNao}>NÃO</Text>
                      </View>
                      <View style={s.tcNarrow}>
                        <Text style={s.tdText}>{por_participantes.nao}</Text>
                      </View>
                      <View style={s.tcNarrow}>
                        <Text style={s.tdText}>
                          {pctStr(por_participantes.nao, tp)}
                        </Text>
                      </View>
                    </View>
                    <View style={s.tRowLast}>
                      <View style={s.tcWide}>
                        <Text style={s.tdAbst}>ABSTENÇÃO</Text>
                      </View>
                      <View style={s.tcNarrow}>
                        <Text style={s.tdText}>{por_participantes.abstencao}</Text>
                      </View>
                      <View style={s.tcNarrow}>
                        <Text style={s.tdText}>
                          {pctStr(por_participantes.abstencao, tp)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={[s.verdict, { backgroundColor: verdictColor(vP) }]}>
                    <Text style={s.verdictText}>{vP}</Text>
                  </View>
                </View>

                {/* Resultado ponderado */}
                <View style={[s.tableHalf, { marginLeft: 6 }]}>
                  <Text style={s.tableLabel}>PONDERADO POR UNIDADES</Text>
                  <View style={s.table}>
                    <View style={s.tRowHeader}>
                      <View style={s.tcWide}>
                        <Text style={s.thText}>RESPOSTA</Text>
                      </View>
                      <View style={s.tcNarrow}>
                        <Text style={s.thText}>APTS</Text>
                      </View>
                      <View style={s.tcNarrow}>
                        <Text style={s.thText}>%</Text>
                      </View>
                    </View>
                    <View style={s.tRow}>
                      <View style={s.tcWide}>
                        <Text style={s.tdSim}>SIM</Text>
                      </View>
                      <View style={s.tcNarrow}>
                        <Text style={s.tdText}>{ponderado.sim}</Text>
                      </View>
                      <View style={s.tcNarrow}>
                        <Text style={s.tdText}>{pctStr(ponderado.sim, tw)}</Text>
                      </View>
                    </View>
                    <View style={s.tRow}>
                      <View style={s.tcWide}>
                        <Text style={s.tdNao}>NÃO</Text>
                      </View>
                      <View style={s.tcNarrow}>
                        <Text style={s.tdText}>{ponderado.nao}</Text>
                      </View>
                      <View style={s.tcNarrow}>
                        <Text style={s.tdText}>{pctStr(ponderado.nao, tw)}</Text>
                      </View>
                    </View>
                    <View style={s.tRowLast}>
                      <View style={s.tcWide}>
                        <Text style={s.tdAbst}>ABSTENÇÃO</Text>
                      </View>
                      <View style={s.tcNarrow}>
                        <Text style={s.tdText}>{ponderado.abstencao}</Text>
                      </View>
                      <View style={s.tcNarrow}>
                        <Text style={s.tdText}>{pctStr(ponderado.abstencao, tw)}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={[s.verdict, { backgroundColor: verdictColor(vW) }]}>
                    <Text style={s.verdictText}>{vW}</Text>
                    {total_apartamentos_representados > 0 ? (
                      <Text style={s.verdictSub}>
                        {total_apartamentos_representados} apt(s) representado(s)
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
              )}

              {i < apuracao.pautas.length - 1 ? <View style={s.divider} /> : null}
            </View>
          )
        })}

        {/* ── Fixed footer ──────────────────── */}
        <View style={s.pageFooter} fixed>
          <Text style={s.footerText}>
            Emitido em {emitidoEm} por {emitidoPor} | {APP_NAME} v{APP_VERSION}
          </Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}
