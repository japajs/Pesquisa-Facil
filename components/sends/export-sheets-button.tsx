"use client"

import { useTransition } from "react"
import { FileSpreadsheet, Loader2, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { exportSendsAction, exportResponsesAction } from "@/app/actions/sheets"

export function ExportSheetsButton() {
  const [sendsPending, startSends] = useTransition()
  const [responsesPending, startResponses] = useTransition()

  const anyPending = sendsPending || responsesPending

  function handleExportSends() {
    startSends(async () => {
      const res = await exportSendsAction()
      if (res.success) {
        toast.success(`${res.count} envios exportados para o Google Sheets.`)
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleExportResponses() {
    startResponses(async () => {
      const res = await exportResponsesAction()
      if (res.success) {
        toast.success(`${res.count} respostas exportadas para o Google Sheets.`)
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={anyPending}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
      >
        {anyPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-3.5 w-3.5" />
        )}
        Exportar
        <ChevronDown className="h-3 w-3 opacity-60" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Exportar para Google Sheets</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={sendsPending} onClick={handleExportSends}>
          <FileSpreadsheet />
          Aba &ldquo;Envios&rdquo;
        </DropdownMenuItem>
        <DropdownMenuItem disabled={responsesPending} onClick={handleExportResponses}>
          <FileSpreadsheet />
          Aba &ldquo;Respostas&rdquo;
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
