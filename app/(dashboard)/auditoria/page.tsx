import type { Metadata } from "next"
import Link from "next/link"
import { Shield } from "lucide-react"
import { queryAuditLogs } from "@/services/auditoria"
import { cn } from "@/lib/utils"
import type { AcaoAuditoria, AuditLog, ModuloAuditoria } from "@/types"

export const metadata: Metadata = { title: "Auditoria" }

const POR_PAGINA = 50

// ─── Labels e cores ───────────────────────────────────────────────────────────

const ACAO_LABELS: Record<AcaoAuditoria, string> = {
  login: "Login",
  logout: "Logout",
  criar: "Criar",
  editar: "Editar",
  excluir: "Excluir",
  importar: "Importar",
  exportar: "Exportar",
  enviar_email: "Enviar E-mail",
  encerrar: "Encerrar",
  reabrir: "Reabrir",
}

const MODULO_LABELS: Record<ModuloAuditoria, string> = {
  auth: "Autenticação",
  condominios: "Condomínios",
  proprietarios: "Proprietários",
  unidades: "Unidades",
  assembleias: "Assembleias",
  pautas: "Pautas",
  importacao: "Importação",
  configuracoes: "Configurações",
}

const ACAO_COLORS: Record<AcaoAuditoria, string> = {
  login: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  logout: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  criar: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  editar: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  excluir: "bg-red-500/10 text-red-600 dark:text-red-400",
  importar: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  exportar: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  enviar_email: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  encerrar: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  reabrir: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

type SearchParamsRaw = {
  modulo?: string
  acao?: string
  busca?: string
  data_inicio?: string
  data_fim?: string
  pagina?: string
}

function buildUrl(sp: SearchParamsRaw, pagina: number): string {
  const p = new URLSearchParams()
  if (sp.busca) p.set("busca", sp.busca)
  if (sp.modulo) p.set("modulo", sp.modulo)
  if (sp.acao) p.set("acao", sp.acao)
  if (sp.data_inicio) p.set("data_inicio", sp.data_inicio)
  if (sp.data_fim) p.set("data_fim", sp.data_fim)
  if (pagina > 1) p.set("pagina", String(pagina))
  const qs = p.toString()
  return `/auditoria${qs ? "?" + qs : ""}`
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  searchParams: Promise<SearchParamsRaw>
}

export default async function AuditoriaPage({ searchParams }: Props) {
  const sp = await searchParams
  const pagina = Math.max(1, parseInt(sp.pagina ?? "1", 10))
  const offset = (pagina - 1) * POR_PAGINA

  const { logs, total } = await queryAuditLogs({
    modulo: sp.modulo || undefined,
    acao: sp.acao || undefined,
    busca: sp.busca || undefined,
    dataInicio: sp.data_inicio || undefined,
    dataFim: sp.data_fim || undefined,
    limit: POR_PAGINA,
    offset,
  }).catch(() => ({ logs: [] as AuditLog[], total: 0 }))

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))
  const hasFilters = !!(sp.modulo || sp.acao || sp.busca || sp.data_inicio || sp.data_fim)

  return (
    <div className="flex flex-col gap-6 p-6 pt-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Auditoria</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Histórico de todas as ações realizadas no sistema
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
      </div>

      {/* Filtros */}
      <form
        method="GET"
        action="/auditoria"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4"
      >
        {/* Busca */}
        <div className="flex min-w-[180px] flex-1 flex-col gap-1.5">
          <label htmlFor="busca" className="text-xs font-medium text-muted-foreground">
            Descrição
          </label>
          <input
            id="busca"
            name="busca"
            type="text"
            defaultValue={sp.busca ?? ""}
            placeholder="Buscar na descrição…"
            className="h-11 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Módulo */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="modulo" className="text-xs font-medium text-muted-foreground">
            Módulo
          </label>
          <select
            id="modulo"
            name="modulo"
            defaultValue={sp.modulo ?? ""}
            className="h-11 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos</option>
            {(Object.entries(MODULO_LABELS) as [ModuloAuditoria, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        {/* Ação */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="acao" className="text-xs font-medium text-muted-foreground">
            Ação
          </label>
          <select
            id="acao"
            name="acao"
            defaultValue={sp.acao ?? ""}
            className="h-11 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todas</option>
            {(Object.entries(ACAO_LABELS) as [AcaoAuditoria, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        {/* Data início */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="data_inicio" className="text-xs font-medium text-muted-foreground">
            De
          </label>
          <input
            id="data_inicio"
            name="data_inicio"
            type="date"
            defaultValue={sp.data_inicio ?? ""}
            className="h-11 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Data fim */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="data_fim" className="text-xs font-medium text-muted-foreground">
            Até
          </label>
          <input
            id="data_fim"
            name="data_fim"
            type="date"
            defaultValue={sp.data_fim ?? ""}
            className="h-11 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Botões */}
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Filtrar
          </button>
          {hasFilters && (
            <Link
              href="/auditoria"
              className="flex h-11 items-center rounded-md border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Limpar
            </Link>
          )}
        </div>
      </form>

      {/* Tabela */}
      <div className="flex flex-col gap-3">
        {/* Contagem */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total === 0
              ? "Nenhum registro encontrado"
              : `${total} registro${total !== 1 ? "s" : ""}${hasFilters ? " filtrados" : ""}`}
          </p>
          {totalPaginas > 1 && (
            <p className="text-xs text-muted-foreground">
              Página {pagina} de {totalPaginas}
            </p>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Data / Hora
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Usuário
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Ação
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Módulo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Descrição
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Condomínio
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Nenhum registro de auditoria encontrado.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-muted/30">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{log.usuario_nome}</p>
                      {log.usuario_email && (
                        <p className="text-xs text-muted-foreground">{log.usuario_email}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
                          ACAO_COLORS[log.acao as AcaoAuditoria] ?? "bg-muted text-muted-foreground"
                        )}
                      >
                        {ACAO_LABELS[log.acao as AcaoAuditoria] ?? log.acao}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {MODULO_LABELS[log.modulo as ModuloAuditoria] ?? log.modulo}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{log.descricao}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {log.condominio_nome ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between pt-1">
            {pagina > 1 ? (
              <Link
                href={buildUrl(sp, pagina - 1)}
                className="flex min-h-[44px] items-center rounded-md border border-border px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                ← Anterior
              </Link>
            ) : (
              <div />
            )}
            <span className="text-xs text-muted-foreground">
              {pagina} / {totalPaginas}
            </span>
            {pagina < totalPaginas ? (
              <Link
                href={buildUrl(sp, pagina + 1)}
                className="flex min-h-[44px] items-center rounded-md border border-border px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                Próxima →
              </Link>
            ) : (
              <div />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
