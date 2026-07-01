"use client"

import { Fragment, useRef, useState, useTransition } from "react"
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Plus,
  UploadCloud,
  X,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { parseFile } from "@/lib/importacao/parser"
import { processarLinhas } from "@/lib/importacao/processor"
import {
  executarImportacaoAction,
  type ImportacaoResultado,
} from "@/app/actions/importacao"
import { createCondominioAction } from "@/app/actions/condominios"
import { ROUTES } from "@/lib/constants"
import type { Condominio, ImportacaoErro, ImportacaoPreview } from "@/types"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Step = "upload" | "analisando" | "preview" | "importando" | "resultado"

// ─── Auxiliares ───────────────────────────────────────────────────────────────

function formatCPF(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

function stepIndex(step: Step) {
  if (step === "upload" || step === "analisando") return 0
  if (step === "preview" || step === "importando") return 1
  return 2
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: Step }) {
  const LABELS = ["Upload", "Pré-visualização", "Resultado"]
  const current = stepIndex(step)
  return (
    <div className="flex items-center">
      {LABELS.map((label, i) => (
        <Fragment key={label}>
          <div
            className={cn(
              "flex items-center gap-2",
              i < current
                ? "text-primary"
                : i === current
                  ? "text-foreground"
                  : "text-muted-foreground/50"
            )}
          >
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                i < current
                  ? "border-primary bg-primary text-primary-foreground"
                  : i === current
                    ? "border-foreground"
                    : "border-muted-foreground/30"
              )}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span className="hidden text-sm font-medium sm:inline">{label}</span>
          </div>
          {i < LABELS.length - 1 && (
            <div
              className={cn(
                "mx-3 h-px flex-1",
                i < current ? "bg-primary" : "bg-border"
              )}
            />
          )}
        </Fragment>
      ))}
    </div>
  )
}

function DropZone({
  arquivo,
  onChange,
}: {
  arquivo: File | null
  onChange: (f: File | null) => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onChange(file)
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors",
        isDragging
          ? "border-primary/60 bg-primary/5"
          : arquivo
            ? "border-emerald-500/40 bg-emerald-500/5"
            : "border-border hover:border-primary/40 hover:bg-accent/30"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null
          onChange(file)
          e.target.value = ""
        }}
      />

      {arquivo ? (
        <>
          <FileSpreadsheet className="h-8 w-8 text-emerald-500" />
          <div className="text-center">
            <p className="text-sm font-medium">{arquivo.name}</p>
            <p className="text-xs text-muted-foreground">
              {(arquivo.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
            className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      ) : (
        <>
          <UploadCloud
            className={cn(
              "h-8 w-8",
              isDragging ? "text-primary" : "text-muted-foreground/40"
            )}
          />
          <div className="text-center">
            <p className="text-sm font-medium">Arraste o arquivo aqui</p>
            <p className="text-xs text-muted-foreground">ou clique para selecionar</p>
            <p className="mt-1 text-xs text-muted-foreground/60">.xlsx ou .csv</p>
          </div>
        </>
      )}
    </div>
  )
}

function SummaryCards({ preview }: { preview: ImportacaoPreview }) {
  const cards = [
    { label: "Linhas", value: preview.totalLinhas, color: "text-foreground" },
    { label: "Proprietários", value: preview.totalProprietarios, color: "text-blue-500" },
    { label: "Unidades", value: preview.totalUnidades, color: "text-violet-500" },
    { label: "Agrupadas", value: preview.duplicidades, color: "text-amber-500" },
    {
      label: "Avisos",
      value: preview.erros.length,
      color: preview.erros.length > 0 ? "text-rose-500" : "text-muted-foreground",
    },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {cards.map(({ label, value, color }) => (
        <div
          key={label}
          className="rounded-xl border border-border/60 bg-card px-3 py-3 text-center"
        >
          <p className={cn("text-2xl font-bold tabular-nums", color)}>{value}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  )
}

function ProprietariosTable({ preview }: { preview: ImportacaoPreview }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <div className="max-h-[38vh] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-border/60">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Nome
              </th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground sm:table-cell">
                CPF
              </th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground md:table-cell">
                E-mail
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Unidades
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                Peso
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {preview.proprietarios.map((p, i) => (
              <tr key={i} className="transition-colors hover:bg-accent/30">
                <td className="px-4 py-2.5 font-medium">{p.nome}</td>
                <td className="hidden px-4 py-2.5 font-mono text-xs text-muted-foreground sm:table-cell">
                  {p.cpf ? formatCPF(p.cpf) : "—"}
                </td>
                <td className="hidden max-w-[180px] truncate px-4 py-2.5 text-muted-foreground md:table-cell">
                  {p.email ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {p.unidades.join(", ")}
                </td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                  {p.unidades.length}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AvisosList({ erros }: { erros: ImportacaoErro[] }) {
  if (erros.length === 0) return null
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
        <AlertCircle className="h-3.5 w-3.5" />
        {erros.length} {erros.length === 1 ? "aviso" : "avisos"} encontrados
      </p>
      <ul className="space-y-1">
        {erros.slice(0, 10).map((e, i) => (
          <li key={i} className="text-xs text-muted-foreground">
            <span className="font-medium">Linha {e.linha} · {e.campo}:</span>{" "}
            {e.mensagem}
            {e.dados && <span className="ml-1 opacity-60">({e.dados})</span>}
          </li>
        ))}
        {erros.length > 10 && (
          <li className="text-xs text-muted-foreground opacity-60">
            … e mais {erros.length - 10} avisos
          </li>
        )}
      </ul>
    </div>
  )
}

function ResultadoCard({
  resultado,
  condominioNome,
  onReset,
}: {
  resultado: ImportacaoResultado
  condominioNome: string
  onReset: () => void
}) {
  const stats = [
    {
      label: "Proprietários criados",
      value: resultado.proprietariosCriados,
      color: "text-emerald-500",
    },
    {
      label: "Proprietários atualizados",
      value: resultado.proprietariosAtualizados,
      color: "text-blue-500",
    },
    {
      label: "Unidades criadas",
      value: resultado.unidadesCriadas,
      color: "text-violet-500",
    },
    {
      label: "Ignoradas",
      value: resultado.unidadesIgnoradas,
      color: "text-muted-foreground",
    },
  ]

  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
      </div>

      <div>
        <p className="text-lg font-semibold">Importação concluída!</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Condomínio:{" "}
          <span className="font-medium text-foreground">{condominioNome}</span>
        </p>
      </div>

      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl border border-border/60 bg-card px-3 py-3 text-center"
          >
            <p className={cn("text-2xl font-bold tabular-nums", color)}>{value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {resultado.erros.length > 0 && (
        <div className="w-full rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-left">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
            <AlertCircle className="h-3.5 w-3.5" />
            {resultado.erros.length} {resultado.erros.length === 1 ? "erro" : "erros"} durante a importação
          </p>
          <ul className="space-y-1">
            {resultado.erros.slice(0, 8).map((e, i) => (
              <li key={i} className="text-xs text-muted-foreground">{e}</li>
            ))}
            {resultado.erros.length > 8 && (
              <li className="text-xs text-muted-foreground opacity-60">
                … e mais {resultado.erros.length - 8} erros
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <Button
          variant="outline"
          render={<Link href={`${ROUTES.condominios}/${resultado.condominioId}`} />}
        >
          <Building2 className="h-4 w-4" />
          Ver condomínio
        </Button>
        <Button onClick={onReset} variant="ghost">
          Nova importação
        </Button>
      </div>
    </div>
  )
}

// ─── Wizard principal ─────────────────────────────────────────────────────────

interface Props {
  condominios: Condominio[]
}

export function ImportacaoWizard({ condominios }: Props) {
  const [step, setStep] = useState<Step>("upload")
  const [criarNovo, setCriarNovo] = useState(condominios.length === 0)
  const [condominioId, setCondominioId] = useState("")
  const [condominioNome, setCondominioNome] = useState("")
  const [novoNome, setNovoNome] = useState("")
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ImportacaoPreview | null>(null)
  const [resultado, setResultado] = useState<ImportacaoResultado | null>(null)
  const [isPending, startTransition] = useTransition()

  function reset() {
    setStep("upload")
    setArquivo(null)
    setParseError(null)
    setPreview(null)
    setResultado(null)
    setCondominioId("")
    setNovoNome("")
  }

  // ─── Passo 1 → 2: parsear arquivo ────────────────────────────────────────

  async function handleAnalisar() {
    setParseError(null)

    if (criarNovo && !novoNome.trim()) {
      setParseError("Informe o nome do condomínio.")
      return
    }
    if (!criarNovo && !condominioId) {
      setParseError("Selecione um condomínio.")
      return
    }
    if (!arquivo) {
      setParseError("Selecione um arquivo .xlsx ou .csv.")
      return
    }

    setStep("analisando")
    try {
      const { linhas, colunasFaltando } = await parseFile(arquivo)

      if (colunasFaltando.length > 0) {
        const nomes = colunasFaltando
          .map((c) => (c === "imovel" ? '"Imóvel"' : '"Nome"'))
          .join(" e ")
        setParseError(`Colunas obrigatórias ausentes: ${nomes}.`)
        setStep("upload")
        return
      }

      if (linhas.length === 0) {
        setParseError("O arquivo não contém dados válidos.")
        setStep("upload")
        return
      }

      const result = processarLinhas(linhas)

      if (result.proprietarios.length === 0) {
        setParseError("Nenhum proprietário pôde ser extraído do arquivo.")
        setStep("upload")
        return
      }

      setPreview(result)
      setStep("preview")
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : "Erro ao ler o arquivo."
      )
      setStep("upload")
    }
  }

  // ─── Passo 2 → 3: importar ────────────────────────────────────────────────

  function handleImportar() {
    if (!preview) return
    setStep("importando")

    startTransition(async () => {
      try {
        let targetId = condominioId
        let targetNome = condominios.find((c) => c.id === condominioId)?.nome ?? condominioId

        // Criar condomínio se necessário
        if (criarNovo) {
          const res = await createCondominioAction(novoNome.trim())
          if (!res.success || !res.id) {
            toast.error(res.error ?? "Erro ao criar condomínio.")
            setStep("preview")
            return
          }
          targetId = res.id
          targetNome = novoNome.trim()
        }

        setCondominioNome(targetNome)

        const res = await executarImportacaoAction(targetId, preview.proprietarios)

        if (!res.success) {
          toast.error(res.error ?? "Erro na importação.")
          setStep("preview")
          return
        }

        setResultado(res)
        setStep("resultado")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro inesperado.")
        setStep("preview")
      }
    })
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <StepIndicator step={step} />

      <div className="rounded-xl border border-border/60 bg-card p-6">

        {/* ── Passo 1: Upload ─────────────────────────────────────────── */}
        {(step === "upload" || step === "analisando") && (
          <div className="space-y-6">
            {/* Seleção do condomínio */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Condomínio</Label>

              <div className="flex gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="tipo-condo"
                    checked={!criarNovo}
                    onChange={() => setCriarNovo(false)}
                    disabled={condominios.length === 0}
                    className="accent-primary"
                  />
                  Selecionar existente
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="tipo-condo"
                    checked={criarNovo}
                    onChange={() => setCriarNovo(true)}
                    className="accent-primary"
                  />
                  <Plus className="h-3.5 w-3.5" />
                  Criar novo
                </label>
              </div>

              {criarNovo ? (
                <Input
                  placeholder="Nome do condomínio"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  autoFocus
                />
              ) : (
                <select
                  value={condominioId}
                  onChange={(e) => setCondominioId(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-colors focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecione um condomínio…</option>
                  {condominios.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Planilha</Label>
              <DropZone arquivo={arquivo} onChange={setArquivo} />
            </div>

            {/* Erro de parse */}
            {parseError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {parseError}
              </div>
            )}

            {/* Colunas esperadas */}
            <p className="text-xs text-muted-foreground">
              Colunas esperadas:{" "}
              <span className="font-medium text-foreground">
                Imóvel, Nome
              </span>{" "}
              (obrigatórias) e{" "}
              <span className="font-medium text-foreground">
                CPF, WhatsApp, E-mail
              </span>{" "}
              (opcionais)
            </p>

            <div className="flex justify-end">
              <Button
                onClick={handleAnalisar}
                disabled={step === "analisando" || !arquivo}
                className="gap-2"
              >
                {step === "analisando" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
                {step === "analisando" ? "Analisando…" : "Analisar planilha"}
              </Button>
            </div>
          </div>
        )}

        {/* ── Passo 2: Pré-visualização ──────────────────────────────── */}
        {(step === "preview" || step === "importando") && preview && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold">Pré-visualização</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Revise os dados antes de confirmar a importação
              </p>
            </div>

            <SummaryCards preview={preview} />
            <ProprietariosTable preview={preview} />
            <AvisosList erros={preview.erros} />

            <div className="flex items-center justify-between border-t border-border/40 pt-4">
              <Button
                variant="ghost"
                onClick={() => setStep("upload")}
                disabled={step === "importando"}
              >
                ← Voltar
              </Button>
              <Button
                onClick={handleImportar}
                disabled={step === "importando" || preview.proprietarios.length === 0}
                className="gap-2"
              >
                {step === "importando" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importando…
                  </>
                ) : (
                  <>
                    Confirmar importação
                    <CheckCircle2 className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── Passo 3: Resultado ─────────────────────────────────────── */}
        {step === "resultado" && resultado && (
          <ResultadoCard
            resultado={resultado}
            condominioNome={condominioNome}
            onReset={reset}
          />
        )}
      </div>
    </div>
  )
}
