"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APP_NAME } from "@/lib/constants"

interface Props {
  condominioId: string
  condominioNome: string
}

export function ExportarProprietariosButton({ condominioId, condominioNome }: Props) {
  function handleExport() {
    const url = `/api/condominios/${condominioId}/exportar`
    const a = document.createElement("a")
    a.href = url
    a.download = `${APP_NAME}_${condominioNome.replace(/[^a-z0-9]/gi, "_")}_Proprietarios.xlsx`
    a.click()
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
      <Download className="h-3.5 w-3.5" />
      Exportar XLSX
    </Button>
  )
}
