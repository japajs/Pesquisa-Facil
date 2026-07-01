import type { Assembleia, AssembleiaApuracao, PautaApuracao } from "@/types"

interface Props {
  assembleia: Assembleia
  apuracao: AssembleiaApuracao
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

export function ApuracaoAssembleia({ assembleia, apuracao }: Props) {
  const { total_enviados, total_respondidos } = apuracao
  const participacao =
    total_enviados > 0 ? Math.round((total_respondidos / total_enviados) * 100) : 0

  const temVotos = apuracao.pautas.some(
    (p) =>
      p.por_participantes.sim + p.por_participantes.nao + p.por_participantes.abstencao > 0
  )

  return (
    <div className="space-y-6">
      {/* Cabeçalho da assembleia */}
      <div className="space-y-3 rounded-xl border border-border/60 bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {assembleia.descricao && (
              <p className="text-sm text-muted-foreground">{assembleia.descricao}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {assembleia.pautas?.length ?? 0}{" "}
              {(assembleia.pautas?.length ?? 0) === 1 ? "pauta" : "pautas"}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASS[assembleia.status] ?? STATUS_CLASS.rascunho}`}
          >
            {STATUS_LABEL[assembleia.status] ?? assembleia.status}
          </span>
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

function PautaApuracaoSection({ index, item }: { index: number; item: PautaApuracao }) {
  const { pauta, por_participantes, ponderado, total_apartamentos_representados } = item

  const totalP = por_participantes.sim + por_participantes.nao + por_participantes.abstencao
  const totalW = ponderado.sim + ponderado.nao + ponderado.abstencao

  const pctP = (n: number) => (totalP > 0 ? Math.round((n / totalP) * 100) : 0)
  const pctW = (n: number) => (totalW > 0 ? Math.round((n / totalW) * 100) : 0)

  return (
    <div className="space-y-3">
      {/* Título da pauta */}
      <div className="flex items-baseline gap-2">
        <span className="shrink-0 text-xs font-semibold uppercase tracking-widest text-primary/60">
          Pauta {index + 1}
        </span>
        <h2 className="text-base font-semibold tracking-tight">{pauta.titulo}</h2>
      </div>

      {pauta.descricao && (
        <p className="text-sm text-muted-foreground">{pauta.descricao}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Por participantes */}
        <div className="space-y-4 rounded-xl border border-border/60 bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Por participantes
          </p>
          <ResultBar
            sim={por_participantes.sim}
            nao={por_participantes.nao}
            abstencao={por_participantes.abstencao}
            pctSim={pctP(por_participantes.sim)}
            pctNao={pctP(por_participantes.nao)}
            pctAbstencao={pctP(por_participantes.abstencao)}
            unit="pessoa"
            unitPlural="pessoas"
          />
        </div>

        {/* Ponderado */}
        <div className="space-y-4 rounded-xl border border-border/60 bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Resultado ponderado
          </p>
          <ResultBar
            sim={ponderado.sim}
            nao={ponderado.nao}
            abstencao={ponderado.abstencao}
            pctSim={pctW(ponderado.sim)}
            pctNao={pctW(ponderado.nao)}
            pctAbstencao={pctW(ponderado.abstencao)}
            unit="apartamento"
            unitPlural="apartamentos"
          />
        </div>
      </div>

      {/* Total de apartamentos */}
      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-5 py-3.5">
        <p className="text-sm text-muted-foreground">Apartamentos representados</p>
        <p className="text-lg font-semibold tabular-nums">{total_apartamentos_representados}</p>
      </div>
    </div>
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
      <div className="flex items-center justify-between text-sm">
        <span className={`font-medium ${colorText}`}>{label}</span>
        <span className="tabular-nums text-muted-foreground">
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

function ResultBar({
  sim, nao, abstencao, pctSim, pctNao, pctAbstencao, unit, unitPlural,
}: {
  sim: number; nao: number; abstencao: number
  pctSim: number; pctNao: number; pctAbstencao: number
  unit: string; unitPlural: string
}) {
  return (
    <div className="space-y-3">
      <Bar label="SIM" count={sim} pct={pctSim} colorBar="bg-emerald-500" colorText="text-emerald-500" unit={unit} unitPlural={unitPlural} />
      <Bar label="NÃO" count={nao} pct={pctNao} colorBar="bg-rose-500" colorText="text-rose-500" unit={unit} unitPlural={unitPlural} />
      <Bar label="ABSTENÇÃO" count={abstencao} pct={pctAbstencao} colorBar="bg-amber-500" colorText="text-amber-500" unit={unit} unitPlural={unitPlural} />
    </div>
  )
}
