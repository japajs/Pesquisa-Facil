"use client"

import { memo, useMemo, useState, useTransition } from "react"
import { Users, Trash2, Plus, X, Search } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  deleteProprietarioAction,
  addUnidadeAction,
  removeUnidadeAction,
} from "@/app/actions/proprietarios"
import { getPesoParticipante } from "@/lib/peso"
import { formatUnidade, menorNumeroUnidade } from "@/lib/unidade-format"
import { EditarProprietarioDialog } from "@/components/proprietarios/editar-proprietario-dialog"
import type { Proprietario } from "@/types"

interface ProprietariosListProps {
  proprietarios: Proprietario[]
  condominioId: string
  proprietariosQueJaVotaram?: Set<string>
  isAdmin?: boolean
}

type Ordenacao = "nome" | "unidade"

// Remove acentos e caixa para a busca não exigir digitação exata
// (ex.: "joao" encontra "João").
function normalizarBusca(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

export function ProprietariosList({
  proprietarios,
  condominioId,
  proprietariosQueJaVotaram,
  isAdmin = false,
}: ProprietariosListProps) {
  const [busca, setBusca] = useState("")
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("nome")

  const proprietariosExibidos = useMemo(() => {
    const termo = normalizarBusca(busca.trim())
    const filtrados = !termo
      ? proprietarios
      : proprietarios.filter((p) => {
          const alvo = [
            p.nome,
            p.email ?? "",
            p.telefone ?? "",
            ...(p.unidades ?? []).flatMap((u) => [u.numero, u.bloco ?? ""]),
          ].join(" ")
          return normalizarBusca(alvo).includes(termo)
        })

    const ordenados = [...filtrados]
    if (ordenacao === "nome") {
      ordenados.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    } else {
      ordenados.sort((a, b) => {
        const na = menorNumeroUnidade(a.unidades ?? [])
        const nb = menorNumeroUnidade(b.unidades ?? [])
        if (na === null && nb === null) return a.nome.localeCompare(b.nome, "pt-BR")
        if (na === null) return 1
        if (nb === null) return -1
        return na.localeCompare(nb, undefined, { numeric: true })
      })
    }
    return ordenados
  }, [proprietarios, busca, ordenacao])

  if (proprietarios.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
        <Users className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Nenhum proprietário cadastrado ainda.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, e-mail, celular, unidade ou bloco…"
            className="pl-10"
            aria-label="Buscar proprietário"
          />
        </div>
        <select
          value={ordenacao}
          onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
          aria-label="Ordenar por"
          className="h-12 shrink-0 rounded-lg border border-input bg-background px-3 text-sm text-foreground sm:w-44"
        >
          <option value="nome">Ordenar por Nome</option>
          <option value="unidade">Ordenar por Unidade</option>
        </select>
      </div>

      {proprietariosExibidos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
          <Search className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Nenhum proprietário encontrado para &quot;{busca}&quot;.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card divide-y divide-border/40">
          {proprietariosExibidos.map((p) => (
            <ProprietarioRow
              key={p.id}
              proprietario={p}
              condominioId={condominioId}
              todosProprietarios={proprietarios}
              jaVotou={proprietariosQueJaVotaram?.has(p.id) ?? false}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const ProprietarioRow = memo(function ProprietarioRow({
  proprietario,
  condominioId,
  todosProprietarios,
  jaVotou,
  isAdmin,
}: {
  proprietario: Proprietario
  condominioId: string
  todosProprietarios: Proprietario[]
  jaVotou: boolean
  isAdmin: boolean
}) {
  const [novaUnidade, setNovaUnidade] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [isPendingDelete, startDeleteTransition] = useTransition()
  const [isPendingAdd, startAddTransition] = useTransition()
  const [isPendingRemove, startRemoveTransition] = useTransition()

  const peso = getPesoParticipante(proprietario)
  const unidades = proprietario.unidades ?? []

  function handleDeleteProprietario() {
    if (!confirm(`Excluir "${proprietario.nome}"? As unidades vinculadas também serão removidas.`)) return
    startDeleteTransition(async () => {
      const result = await deleteProprietarioAction(proprietario.id, condominioId)
      if (!result.success) toast.error(result.error)
    })
  }

  function handleAddUnidade() {
    if (!novaUnidade.trim()) return
    startAddTransition(async () => {
      const result = await addUnidadeAction(proprietario.id, condominioId, novaUnidade)
      if (result.success) {
        setNovaUnidade("")
        setShowAdd(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleRemoveUnidade(unidadeId: string) {
    startRemoveTransition(async () => {
      const result = await removeUnidadeAction(unidadeId, condominioId)
      if (!result.success) toast.error(result.error)
    })
  }

  return (
    <div className="px-3 py-2 space-y-1">
      {/* Linha 1: nome + ações */}
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold">{proprietario.nome}</p>
        <div className="flex shrink-0 items-center gap-1">
          <EditarProprietarioDialog
            proprietario={proprietario}
            condominioId={condominioId}
            todosProprietarios={todosProprietarios}
            jaVotou={jaVotou}
            isAdmin={isAdmin}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteProprietario}
            disabled={isPendingDelete}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only">Excluir proprietário</span>
          </Button>
        </div>
      </div>

      {/* Linha 2: e-mail · celular · peso — só o celular, nunca telefone fixo */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
        {proprietario.email && <span className="truncate">{proprietario.email}</span>}
        {proprietario.telefone && <span className="truncate">{proprietario.telefone}</span>}
        <span className="ml-auto shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
          Peso {peso}
        </span>
      </div>

      {/* Linha 3: unidades — sempre em linha própria, nunca disputando espaço */}
      <div className="flex flex-wrap items-center gap-1 pl-0.5">
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">
          Apto
        </span>
        {unidades.map((u) => (
          <span
            key={u.id}
            className="group flex items-center gap-1 rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[11px]"
          >
            {formatUnidade(u)}
            <button
              type="button"
              onClick={() => handleRemoveUnidade(u.id)}
              disabled={isPendingRemove}
              className="text-muted-foreground/40 hover:text-destructive transition-colors"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}

        {showAdd ? (
          <div className="flex items-center gap-1">
            <Input
              placeholder="Nº"
              value={novaUnidade}
              onChange={(e) => setNovaUnidade(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddUnidade()}
              className="h-8 w-20 px-2 text-xs"
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddUnidade}
              disabled={isPendingAdd || !novaUnidade.trim()}
              className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded px-2 text-xs text-primary hover:underline disabled:opacity-40"
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => { setShowAdd(false); setNovaUnidade("") }}
              className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded px-2 text-xs text-muted-foreground hover:underline"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex min-h-[28px] items-center gap-0.5 rounded border border-dashed border-border/60 px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        )}
      </div>
    </div>
  )
})
