import type { CondoApuracao, CondoSurvey } from "@/types"

interface ApuracaoCardProps {
  condoSurvey: CondoSurvey
  apuracao: CondoApuracao
}

export function ApuracaoCard({ condoSurvey, apuracao }: ApuracaoCardProps) {
  const { por_participantes, ponderado, total_apartamentos_representados } = apuracao

  const totalParticipantes = por_participantes.sim + por_participantes.nao
  const totalPonderado = ponderado.sim + ponderado.nao

  const pctParticipantesSim =
    totalParticipantes > 0 ? Math.round((por_participantes.sim / totalParticipantes) * 100) : 0
  const pctPonderadoSim =
    totalPonderado > 0 ? Math.round((ponderado.sim / totalPonderado) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Pergunta */}
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">Pergunta</p>
        <p className="mt-1 text-base font-medium">{condoSurvey.pergunta}</p>
        {condoSurvey.descricao && (
          <p className="mt-1 text-sm text-muted-foreground">{condoSurvey.descricao}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Resultado por participantes */}
        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Por participantes
          </p>

          <ResultBar
            simCount={por_participantes.sim}
            naoCount={por_participantes.nao}
            simPct={pctParticipantesSim}
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
            simCount={ponderado.sim}
            naoCount={ponderado.nao}
            simPct={pctPonderadoSim}
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
  simCount: number
  naoCount: number
  simPct: number
  unit: string
  unitPlural: string
}

function ResultBar({ simCount, naoCount, simPct, unit, unitPlural }: ResultBarProps) {
  const naoPct = 100 - simPct

  return (
    <div className="space-y-3">
      {/* SIM */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-emerald-500">SIM</span>
          <span className="tabular-nums text-muted-foreground">
            {simCount} {simCount === 1 ? unit : unitPlural}
            <span className="ml-1 text-xs">({simPct}%)</span>
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${simPct}%` }}
          />
        </div>
      </div>

      {/* NÃO */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-rose-500">NÃO</span>
          <span className="tabular-nums text-muted-foreground">
            {naoCount} {naoCount === 1 ? unit : unitPlural}
            <span className="ml-1 text-xs">({naoPct}%)</span>
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-rose-500 transition-all"
            style={{ width: `${naoPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
