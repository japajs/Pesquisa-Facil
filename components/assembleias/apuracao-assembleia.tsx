"use client"

import { Download, FileSpreadsheet, FileText, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DonutChart } from "@/components/ui/donut-chart"
import type { Assembleia, AssembleiaApuracao, PautaApuracao } from "@/types"

interface Props {
  assembleia: Assembleia
  apuracao: AssembleiaApuracao
  canExport?: boolean
}

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  aberta: "Aberta",
  encerrada: "Encerrada",
}

const STATUS_CLASS: Record<string, string> = {
  rascunho: "bg-muted text-muted-foreground",
  aberta: "bg-emerald-500/15 text-emerald-500",
  encerrada: "bg-rose-500/15 text-rose-500",
}

function formatDate(dateString: string | null) {
  if (!dateString) return "—"
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString))
}

export function ApuracaoAssembleia({ assembleia, apuracao, canExport = false }: Props) {
  const { total_enviados, total_respondidos } = apuracao
  const participacao =
    total_enviados > 0 ? Math.round((total_respondidos / total_enviados) * 100) : 0

  const temVotos = apuracao.pautas.some(
    (p) =>
      p.por_participantes.sim + p.por_participantes.nao + p.por_participantes.abstencao > 0 ||
      (p.opcoes_resultado?.some((o) => o.participantes > 0) ?? false)
  )

  return (
    <div className="space-y-6">
      {/* Cabeçalho de impressão — visível apenas no print */}
      <div className="hidden print:flex items-center justify-between border-b border-gray-300 pb-4 mb-2">
        <span className="text-lg font-bold text-gray-900">CondoAssembleia</span>
        <span className="text-xs text-gray-500">Sistema de Assembleias Eletrônicas para Condomínios</span>
      </div>

      {/* Cabeçalho da assembleia */}
      <div className="space-y-3 rounded-xl border border-border/60 bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {assembleia.descricao && (
              <p className="text-sm text-muted-foreground">{assembleia.descricao}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {assembleia.pautas?.length ?? 0}{" "}
              {(assembleia.pautas?.length ?? 0) === 1 ? "pauta" : "pautas"}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASS[assembleia.status] ?? STATUS_CLASS.rascunho}`}
            >
              {STATUS_LABEL[assembleia.status] ?? assembleia.status}
            </span>
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              {canExport && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const a = document.createElement("a")
                      a.href = `/api/relatorios/apuracao/${assembleia.id}/pdf`
                      a.click()
                    }}
                    className="gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const a = document.createElement("a")
                      a.href = `/api/relatorios/apuracao/${assembleia.id}/xlsx`
                      a.click()
                    }}
                    className="gap-1.5"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Excel
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 border-t border-border/40 pt-3 text-xs text-muted-foreground">
          <div>
            <span className="font-medium">Abertura:</span>{" "}
            {formatDate(assembleia.data_abertura)}
          </div>
          <div>
            <span className="font-medium">Encerramento:</span>{" "}
            {formatDate(assembleia.data_encerramento)}
          </div>
        </div>
      </div>

      {/* Participação geral */}
      <div className="grid grid-cols-3 divide-x divide-border/40 rounded-xl border border-border/60 bg-card">
        <div className="px-5 py-4 text-center">
          <p className="text-2xl font-semibold tabular-nums">{total_enviados}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Convites enviados</p>
        </div>
        <div className="px-5 py-4 text-center">
          <p className="text-2xl font-semibold tabular-nums">{total_respondidos}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Responderam</p>
        </div>
        <div className="px-5 py-4 text-center">
          <p className="text-2xl font-semibold tabular-nums">{participacao}%</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Participação</p>
        </div>
      </div>

      {/* Uma seção por pauta */}
      {apuracao.pautas.map((pautaApuracao, i) => (
        <PautaApuracaoSection key={pautaApuracao.pauta.id} index={i} item={pautaApuracao} />
      ))}

      {!temVotos && (
        <p className="text-center text-sm text-muted-foreground">
          Nenhum voto registrado ainda.
        </p>
      )}
    </div>
  )
}

// Paleta cíclica para pautas de múltipla escolha (N opções variáveis).
const CORES_OPCOES = [
  { bar: "bg-indigo-500", text: "text-indigo-500", hex: "#6366f1" },
  { bar: "bg-sky-500", text: "text-sky-500", hex: "#0ea5e9" },
  { bar: "bg-emerald-500", text: "text-emerald-500", hex: "#22c55e" },
  { bar: "bg-fuchsia-500", text: "text-fuchsia-500", hex: "#d946ef" },
  { bar: "bg-orange-500", text: "text-orange-500", hex: "#f97316" },
  { bar: "bg-teal-500", text: "text-teal-500", hex: "#14b8a6" },
]

function PautaApuracaoSection({ index, item }: { index: number; item: PautaApuracao }) {
  const { pauta } = item

  return (
    <div className="space-y-3">
      {/* Título da pauta */}
      <div className="flex items-baseline gap-2">
        <span className="shrink-0 text-xs font-semibold uppercase tracking-widest text-primary/60">
          Pauta {index + 1}
        </span>
        <h2 className="text-base font-semibold tracking-tight">{pauta.titulo}</h2>
      </div>

      {pauta.descricao && <p className="text-sm text-muted-foreground">{pauta.descricao}</p>}

      {pauta.tipo === "multipla_escolha" ? (
        <MultiplaEscolhaApuracao item={item} />
      ) : (
        <SimNaoApuracao item={item} />
      )}
    </div>
  )
}

function MultiplaEscolhaApuracao({ item }: { item: PautaApuracao }) {
  const { ponderado, opcoes_resultado = [] } = item

  const ordenadas = [...opcoes_resultado].sort((a, b) => b.ponderado - a.ponderado)
  const totalW = ordenadas.reduce((sum, o) => sum + o.ponderado, 0) + ponderado.abstencao
  const totalP = ordenadas.reduce((sum, o) => sum + o.participantes, 0) + item.por_participantes.abstencao
  const pctW = (n: number) => (totalW > 0 ? Math.round((n / totalW) * 100) : 0)

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Resultado ponderado (por unidade)
        </p>
        <span className="text-xs text-muted-foreground">
          {totalP} {totalP === 1 ? "participante" : "participantes"}
        </span>
      </div>
      <div className="space-y-3">
        {ordenadas.map((opcao, i) => {
          const cor = CORES_OPCOES[i % CORES_OPCOES.length]!
          return (
            <Bar
              key={opcao.opcao_id}
              label={opcao.label}
              count={opcao.ponderado}
              pct={pctW(opcao.ponderado)}
              colorBar={cor.bar}
              colorText={cor.text}
              unit="unidade"
              unitPlural="unidades"
            />
          )
        })}
        {item.por_participantes.abstencao > 0 && (
          <Bar
            label="Abstenção"
            count={ponderado.abstencao}
            pct={pctW(ponderado.abstencao)}
            colorBar="bg-amber-500"
            colorText="text-amber-500"
            unit="unidade"
            unitPlural="unidades"
          />
        )}
      </div>
    </div>
  )
}

function SimNaoApuracao({ item }: { item: PautaApuracao }) {
  const { por_participantes, ponderado, total_apartamentos_representados } = item

  const totalP = por_participantes.sim + por_participantes.nao + por_participantes.abstencao
  const totalW = ponderado.sim + ponderado.nao + ponderado.abstencao

  const pctP = (n: number) => (totalP > 0 ? Math.round((n / totalP) * 100) : 0)
  const pctW = (n: number) => (totalW > 0 ? Math.round((n / totalW) * 100) : 0)

  const segmentsP = [
    { value: por_participantes.sim, color: "#22c55e" },
    { value: por_participantes.nao, color: "#ef4444" },
    { value: por_participantes.abstencao, color: "#f59e0b" },
  ]
  const segmentsW = [
    { value: ponderado.sim, color: "#22c55e" },
    { value: ponderado.nao, color: "#ef4444" },
    { value: ponderado.abstencao, color: "#f59e0b" },
  ]

  const vencedorP =
    totalP > 0
      ? por_participantes.sim > por_participantes.nao
        ? "SIM"
        : por_participantes.nao > por_participantes.sim
          ? "NÃO"
          : "EMPATE"
      : null
  const vencedorW =
    totalW > 0
      ? ponderado.sim > ponderado.nao
        ? "SIM"
        : ponderado.nao > ponderado.sim
          ? "NÃO"
          : "EMPATE"
      : null

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Por participantes */}
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Por participantes
          </p>
          <div className="flex items-center gap-5">
            <DonutChart
              segments={segmentsP}
              centerLabel={vencedorP ?? "—"}
              centerSub={totalP > 0 ? `${totalP} votos` : "sem votos"}
            />
            <div className="flex-1 space-y-3">
              <Bar label="SIM" count={por_participantes.sim} pct={pctP(por_participantes.sim)} colorBar="bg-emerald-500" colorText="text-emerald-500" unit="pessoa" unitPlural="pessoas" />
              <Bar label="NÃO" count={por_participantes.nao} pct={pctP(por_participantes.nao)} colorBar="bg-rose-500" colorText="text-rose-500" unit="pessoa" unitPlural="pessoas" />
              <Bar label="ABST." count={por_participantes.abstencao} pct={pctP(por_participantes.abstencao)} colorBar="bg-amber-500" colorText="text-amber-500" unit="pessoa" unitPlural="pessoas" />
            </div>
          </div>
        </div>

        {/* Ponderado */}
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Resultado ponderado
          </p>
          <div className="flex items-center gap-5">
            <DonutChart
              segments={segmentsW}
              centerLabel={vencedorW ?? "—"}
              centerSub={`${total_apartamentos_representados} apts`}
            />
            <div className="flex-1 space-y-3">
              <Bar label="SIM" count={ponderado.sim} pct={pctW(ponderado.sim)} colorBar="bg-emerald-500" colorText="text-emerald-500" unit="apt" unitPlural="apts" />
              <Bar label="NÃO" count={ponderado.nao} pct={pctW(ponderado.nao)} colorBar="bg-rose-500" colorText="text-rose-500" unit="apt" unitPlural="apts" />
              <Bar label="ABST." count={ponderado.abstencao} pct={pctW(ponderado.abstencao)} colorBar="bg-amber-500" colorText="text-amber-500" unit="apt" unitPlural="apts" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function Bar({
  label,
  count,
  pct,
  colorBar,
  colorText,
  unit,
  unitPlural,
}: {
  label: string
  count: number
  pct: number
  colorBar: string
  colorText: string
  unit: string
  unitPlural: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className={`min-w-0 truncate font-medium ${colorText}`} title={label}>
          {label}
        </span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {count} {count === 1 ? unit : unitPlural}
          <span className="ml-1 text-xs">({pct}%)</span>
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${colorBar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
