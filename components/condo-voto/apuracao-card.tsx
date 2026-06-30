import type { CondoApuracao, CondoSurvey } from "@/types"

interface ApuracaoCardProps {
  condoSurvey: CondoSurvey
  apuracao: CondoApuracao
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

export function ApuracaoCard({ condoSurvey, apuracao }: ApuracaoCardProps) {
  const { por_participantes, ponderado, total_apartamentos_representados } = apuracao

  const totalParticipantes =
    por_participantes.sim + por_participantes.nao + por_participantes.abstencao
  const totalPonderado = ponderado.sim + ponderado.nao + ponderado.abstencao

  const pctP = (n: number) =>
    totalParticipantes > 0 ? Math.round((n / totalParticipantes) * 100) : 0
  const pctW = (n: number) =>
    totalPonderado > 0 ? Math.round((n / totalPonderado) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Pergunta + meta */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">Pergunta</p>
            <p className="mt-1 text-base font-medium">{condoSurvey.pergunta}</p>
            {condoSurvey.descricao && (
              <p className="mt-1 text-sm text-muted-foreground">{condoSurvey.descricao}</p>
            )}
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASS[condoSurvey.status] ?? STATUS_CLASS.rascunho}`}
          >
            {STATUS_LABEL[condoSurvey.status] ?? condoSurvey.status}
          </span>
        </div>

        <div className="flex gap-6 border-t border-border/40 pt-3 text-xs text-muted-foreground">
          <div>
            <span className="font-medium">Abertura:</span>{" "}
            {formatDate(condoSurvey.data_abertura)}
          </div>
          <div>
            <span className="font-medium">Encerramento:</span>{" "}
            {formatDate(condoSurvey.data_encerramento)}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Resultado por participantes */}
        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
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

        {/* Resultado ponderado */}
        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
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

      {/* Total de apartamentos representados */}
      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-5 py-4">
        <p className="text-sm text-muted-foreground">Total de apartamentos representados</p>
        <p className="text-lg font-semibold tabular-nums">{total_apartamentos_representados}</p>
      </div>

      {totalParticipantes === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Nenhum voto registrado ainda.
        </p>
      )}
    </div>
  )
}

interface ResultBarProps {
  sim: number
  nao: number
  abstencao: number
  pctSim: number
  pctNao: number
  pctAbstencao: number
  unit: string
  unitPlural: string
}

function Bar({ label, count, pct, colorBar, colorText, unit, unitPlural }: {
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
        <div className={`h-full rounded-full transition-all ${colorBar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function ResultBar({ sim, nao, abstencao, pctSim, pctNao, pctAbstencao, unit, unitPlural }: ResultBarProps) {
  return (
    <div className="space-y-3">
      <Bar label="SIM" count={sim} pct={pctSim} colorBar="bg-emerald-500" colorText="text-emerald-500" unit={unit} unitPlural={unitPlural} />
      <Bar label="NÃO" count={nao} pct={pctNao} colorBar="bg-rose-500" colorText="text-rose-500" unit={unit} unitPlural={unitPlural} />
      <Bar label="ABSTENÇÃO" count={abstencao} pct={pctAbstencao} colorBar="bg-amber-500" colorText="text-amber-500" unit={unit} unitPlural={unitPlural} />
    </div>
  )
}
