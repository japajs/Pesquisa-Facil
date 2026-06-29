import type { Metadata } from "next"
import { SendsTable } from "@/components/sends/sends-table"
import { SendSurveyDialog } from "@/components/sends/send-survey-dialog"
import { ExportSheetsButton } from "@/components/sends/export-sheets-button"
import { getAllSends } from "@/services/sends"
import { getAllSurveys } from "@/services/surveys"
import { getAllClients } from "@/services/clients"
import type { SurveySend, Survey, Client } from "@/types"

export const metadata: Metadata = { title: "Envios" }

async function fetchPageData(): Promise<{
  sends: SurveySend[]
  surveys: Survey[]
  clients: Client[]
}> {
  try {
    const [sends, surveys, clients] = await Promise.all([
      getAllSends(),
      getAllSurveys(),
      getAllClients(),
    ])
    return { sends, surveys, clients }
  } catch {
    return { sends: [], surveys: [], clients: [] }
  }
}

export default async function SendsPage() {
  const { sends, surveys, clients } = await fetchPageData()

  const sentCount = sends.filter((s) => s.status === "sent").length

  return (
    <div className="flex flex-col gap-6 p-6 pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Envios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {sends.length} {sends.length === 1 ? "disparo" : "disparos"} ·{" "}
            {sentCount} entregues
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportSheetsButton />
          <SendSurveyDialog surveys={surveys} clients={clients} />
        </div>
      </div>

      <SendsTable sends={sends} />
    </div>
  )
}
