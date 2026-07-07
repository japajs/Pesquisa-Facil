import { CheckCircle2, XCircle, Building2, CalendarDays, Users } from "lucide-react"
import type { AssembleiaApuracao } from "@/types"

interface Props {
  condominio_nome: string | null
  data_abertura: string | null
  data_encerramento: string | null
  apuracao: AssembleiaApuracao
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso))
}

function pct(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      <span className={`text-xl font-semibold tabular-nums ${highlight ? "text-emerald-500" : "text-foreground"}`}>
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

type VotoBarColor = "emerald" | "rose" | "amber" | "indigo" | "sky" | "fuchsia" | "orange" | "teal"

const VOTO_BAR_CLASSES: Record<VotoBarColor, { text: string; bar: string }> = {
  emerald: { text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" },
  rose: { text: "text-rose-600 dark:text-rose-400", bar: "bg-rose-500" },
  amber: { text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500" },
  indigo: { text: "text-indigo-600 dark:text-indigo-400", bar: "bg-indigo-500" },
  sky: { text: "text-sky-600 dark:text-sky-400", bar: "bg-sky-500" },
  fuchsia: { text: "text-fuchsia-600 dark:text-fuchsia-400", bar: "bg-fuchsia-500" },
  orange: { text: "text-orange-600 dark:text-orange-400", bar: "bg-orange-500" },
  teal: { text: "text-teal-600 dark:text-teal-400", bar: "bg-teal-500" },
}

// Paleta cíclica para as opções de uma pauta de múltipla escolha.
const CORES_OPCOES: VotoBarColor[] = ["indigo", "sky", "emerald", "fuchsia", "orange", "teal"]

function VotoBar({
  label,
  participantes,
  ponderado,
  pct: pctValue,
  color,
}: {
  label: string
  participantes: number
  ponderado: number
  pct: number
  color: VotoBarColor
}) {
  const { text: textClass, bar: barClass } = VOTO_BAR_CLASSES[color]

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className={`font-semibold ${textClass}`}>{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {participantes} {participantes === 1 ? "participante" : "participantes"} ·{" "}
          {ponderado} {ponderado === 1 ? "unidade" : "unidades"} ·{" "}
          <span className="font-medium text-foreground">{pctValue}%</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pctValue}%` }} />
      </div>
    </div>
  )
}

export function ResultadoAssembleia({ condominio_nome, data_abertura, data_encerramento, apuracao }: Props) {
  const { pautas, total_enviados, total_respondidos } = apuracao
  const participacaoPct = pct(total_respondidos, total_enviados)
  const totalUnidades = pautas[0]?.total_apartamentos_representados ?? 0

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {condominio_nome && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span>{condominio_nome}</span>
            </div>
          )}
          <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-semibold text-rose-500">
            Encerrada
          </span>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1.5 border-t border-border/40 pt-3 text-xs text-muted-foreground">
          {data_abertura && (
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              <span>
                <span className="font-medium">Abertura:</span> {formatDate(data_abertura)}
              </span>
            </div>
          )}
          {data_encerramento && (
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              <span>
                <span className="font-medium">Encerramento:</span> {formatDate(data_encerramento)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Participação */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary/60" />
          <h2 className="text-sm font-semibold">Participação</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Aptos a votar" value={total_enviados} />
          <Stat label="Votaram" value={total_respondidos} />
          <Stat label="Participação" value={`${participacaoPct}%`} highlight={participacaoPct >= 50} />
          <Stat label="Unidades repr." value={totalUnidades} />
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${participacaoPct >= 50 ? "bg-emerald-500" : "bg-amber-500"}`}
            style={{ width: `${participacaoPct}%` }}
          />
        </div>
      </div>

      {/* Pautas */}
      {pautas.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma pauta registrada.</p>
        </div>
      ) : (
        pautas.map((item, i) => {
          const { pauta, por_participantes, ponderado, total_apartamentos_representados } = item
          const multiplaEscolha = pauta.tipo === "multipla_escolha"
          const opcoesOrdenadas = [...(item.opcoes_resultado ?? [])].sort(
            (a, b) => b.ponderado - a.ponderado
          )

          const totalPonderado = multiplaEscolha
            ? opcoesOrdenadas.reduce((sum, o) => sum + o.ponderado, 0) + ponderado.abstencao
            : ponderado.sim + ponderado.nao + ponderado.abstencao
          const totalParticipantes = multiplaEscolha
            ? opcoesOrdenadas.reduce((sum, o) => sum + o.participantes, 0) + por_participantes.abstencao
            : por_participantes.sim + por_participantes.nao + por_participantes.abstencao

          const aprovada = !multiplaEscolha && ponderado.sim > ponderado.nao
          const vencedora = multiplaEscolha && opcoesOrdenadas.length > 0 && opcoesOrdenadas[0]!.ponderado > 0
            ? opcoesOrdenadas[0]
            : null

          return (
            <div key={pauta.id} className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary/60">
                    Pauta {i + 1}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold leading-snug">{pauta.titulo}</h3>
                  {pauta.descricao && (
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{pauta.descricao}</p>
                  )}
                </div>
                {multiplaEscolha ? (
                  vencedora && (
                    <div className="flex shrink-0 items-center gap-1 rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {vencedora.label}
                    </div>
                  )
                ) : (
                  <div
                    className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                      aprovada
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {aprovada ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    {aprovada ? "Aprovada" : "Rejeitada"}
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t border-border/40 pt-3">
                {multiplaEscolha ? (
                  <>
                    {opcoesOrdenadas.map((opcao, oi) => (
                      <VotoBar
                        key={opcao.opcao_id}
                        label={opcao.label}
                        participantes={opcao.participantes}
                        ponderado={opcao.ponderado}
                        pct={pct(opcao.ponderado, totalPonderado)}
                        color={CORES_OPCOES[oi % CORES_OPCOES.length]!}
                      />
                    ))}
                    {ponderado.abstencao > 0 && (
                      <VotoBar
                        label="ABSTENÇÃO"
                        participantes={por_participantes.abstencao}
                        ponderado={ponderado.abstencao}
                        pct={pct(ponderado.abstencao, totalPonderado)}
                        color="amber"
                      />
                    )}
                  </>
                ) : (
                  <>
                    <VotoBar
                      label="SIM"
                      participantes={por_participantes.sim}
                      ponderado={ponderado.sim}
                      pct={pct(ponderado.sim, totalPonderado)}
                      color="emerald"
                    />
                    <VotoBar
                      label="NÃO"
                      participantes={por_participantes.nao}
                      ponderado={ponderado.nao}
                      pct={pct(ponderado.nao, totalPonderado)}
                      color="rose"
                    />
                    {ponderado.abstencao > 0 && (
                      <VotoBar
                        label="ABSTENÇÃO"
                        participantes={por_participantes.abstencao}
                        ponderado={ponderado.abstencao}
                        pct={pct(ponderado.abstencao, totalPonderado)}
                        color="amber"
                      />
                    )}
                  </>
                )}
                <p className="pt-1 text-xs text-muted-foreground">
                  {totalParticipantes} {totalParticipantes === 1 ? "participante" : "participantes"} ·{" "}
                  {total_apartamentos_representados}{" "}
                  {total_apartamentos_representados === 1 ? "unidade representada" : "unidades representadas"}
                </p>
              </div>
            </div>
          )
        })
      )}

      <p className="pb-4 text-center text-xs text-muted-foreground">
        Resultado oficial · Apenas dados consolidados são exibidos
      </p>
    </div>
  )
}
