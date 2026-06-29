"use client"

import { useRef, useState, useTransition } from "react"
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { parseClientsCSV, type ParsedClient } from "@/utils/csv"
import { importClientsAction } from "@/app/actions/clients"

type Step = "upload" | "preview" | "done"

interface ImportResult {
  inserted: number
  skipped: number
}

export function ImportCSVDialog() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("upload")
  const [parsed, setParsed] = useState<ParsedClient[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  function reset() {
    setStep("upload")
    setParsed([])
    setParseError(null)
    setResult(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setTimeout(reset, 300)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const { data, error } = parseClientsCSV(text)
      if (error || data.length === 0) {
        setParseError(error ?? "Nenhum registro válido encontrado.")
        setParsed([])
        setStep("upload")
      } else {
        setParseError(null)
        setParsed(data)
        setStep("preview")
      }
    }
    reader.readAsText(file, "UTF-8")
  }

  function handleImport() {
    startTransition(async () => {
      const res = await importClientsAction(parsed)
      if (res.error) {
        toast.error(res.error)
      } else {
        setResult({ inserted: res.inserted, skipped: res.skipped })
        setStep("done")
        toast.success(`${res.inserted} clientes importados com sucesso`)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Upload className="h-4 w-4" />
        Importar CSV
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar clientes via CSV</DialogTitle>
          <DialogDescription>
            O arquivo deve conter as colunas <code className="text-xs">nome</code>,{" "}
            <code className="text-xs">email</code> e opcionalmente{" "}
            <code className="text-xs">empresa</code>.
          </DialogDescription>
        </DialogHeader>

        {/* Step: upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <label
              htmlFor="csv-file"
              className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border/60 p-8 transition-colors hover:border-primary/50 hover:bg-accent/30"
            >
              <FileText className="h-8 w-8 text-muted-foreground/50" />
              <div className="text-center">
                <p className="text-sm font-medium">Clique para selecionar o arquivo</p>
                <p className="mt-0.5 text-xs text-muted-foreground">CSV (UTF-8)</p>
              </div>
              <input
                id="csv-file"
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>

            {parseError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {parseError}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Exemplo de cabeçalho:{" "}
              <code className="rounded bg-muted px-1 text-xs">nome,empresa,email</code>
            </p>
          </div>
        )}

        {/* Step: preview */}
        {step === "preview" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{parsed.length}</span>{" "}
              {parsed.length === 1 ? "cliente encontrado" : "clientes encontrados"} no arquivo.
              E-mails duplicados serão ignorados automaticamente.
            </p>
            <div className="max-h-52 overflow-y-auto rounded-lg border border-border/60 text-sm">
              <table className="w-full">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Nome</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Empresa</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">E-mail</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.slice(0, 50).map((client, i) => (
                    <tr key={i} className="border-t border-border/40 odd:bg-accent/10">
                      <td className="px-3 py-1.5 text-xs">{client.name}</td>
                      <td className="px-3 py-1.5 text-xs text-muted-foreground">{client.company || "—"}</td>
                      <td className="px-3 py-1.5 text-xs text-muted-foreground">{client.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsed.length > 50 && (
                <p className="border-t border-border/40 px-3 py-2 text-center text-xs text-muted-foreground">
                  … e mais {parsed.length - 50} clientes
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step: done */}
        {step === "done" && result && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            <div>
              <p className="font-medium">Importação concluída!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="text-foreground font-medium">{result.inserted}</span> importados ·{" "}
                <span className="text-foreground font-medium">{result.skipped}</span> ignorados
                (duplicados ou inválidos)
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <Button variant="ghost" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="ghost" onClick={reset} disabled={isPending}>
                Voltar
              </Button>
              <Button onClick={handleImport} disabled={isPending} className="gap-2">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Importar {parsed.length} {parsed.length === 1 ? "cliente" : "clientes"}
              </Button>
            </>
          )}
          {step === "done" && (
            <Button onClick={() => handleOpenChange(false)}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
