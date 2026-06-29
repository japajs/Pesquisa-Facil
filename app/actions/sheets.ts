"use server"

import { exportSendsToSheets, exportResponsesToSheets } from "@/services/sheets"

export interface ExportResult {
  success: boolean
  count?: number
  error?: string
}

export async function exportSendsAction(): Promise<ExportResult> {
  try {
    const count = await exportSendsToSheets()
    return { success: true, count }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao exportar envios." }
  }
}

export async function exportResponsesAction(): Promise<ExportResult> {
  try {
    const count = await exportResponsesToSheets()
    return { success: true, count }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro ao exportar respostas." }
  }
}
