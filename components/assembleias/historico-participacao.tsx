import { ClipboardList } from "lucide-react"
import type { HistoricoParticipante } from "@/services/relatorios"

function formatDateHora(iso: string | null): string {
  if (!iso) return "—"
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso))
}

// Controle interno de participação (item 6) — não faz parte do PDF/XLSX
// oficial, só desta tela: quem já respondeu quantas pautas e quando foi a
// última resposta. Útil especialmente com votação parcial/complementar,
// quando "respondeu" deixa de ser um sim/não único por participante.
export function HistoricoParticipacao({ historico }: { historico: HistoricoParticipante[] }) {
  if (historico.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <ClipboardList className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Participação (controle interno)</h2>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                Proprietário
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                Pautas respondidas
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                Última resposta
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {historico.map((h, i) => {
              const completo = h.pautasRespondidas === h.totalPautas && h.totalPautas > 0
              const pendente = h.pautasRespondidas === 0
              return (
                <tr key={i}>
                  <td className="px-4 py-2 font-medium">{h.proprietarioNome}</td>
                  <td className="px-4 py-2 tabular-nums text-muted-foreground">
                    {h.pautasRespondidas}/{h.totalPautas}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        completo
                          ? "bg-emerald-500/15 text-emerald-500"
                          : pendente
                            ? "bg-muted text-muted-foreground"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {completo ? "Completo" : pendente ? "Pendente" : "Parcial"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {formatDateHora(h.ultimaResposta)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
