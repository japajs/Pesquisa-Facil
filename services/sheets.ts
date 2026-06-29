import { writeSheetValues } from "@/lib/google-sheets"
import { getAllSends } from "@/services/sends"
import { createServerClient } from "@/lib/supabase/server"
import type { QuestionAnswer } from "@/types"

type ResponseRow = {
  id: string
  answers: unknown
  responded_at: string
  survey_sends: {
    surveys: { title: string } | null
    clients: { name: string; email: string; company: string | null } | null
  } | null
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "—"
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString))
}

function translateStatus(status: string): string {
  if (status === "sent") return "Enviado"
  if (status === "failed") return "Falhou"
  return "Pendente"
}

/** Exports all sends to the "Envios" sheet. Returns the row count. */
export async function exportSendsToSheets(): Promise<number> {
  const sends = await getAllSends()

  const headers = ["ID", "Pesquisa", "Cliente", "E-mail", "Empresa", "Status", "Enviado em"]
  const rows = sends.map((s) => [
    s.id,
    s.survey?.title ?? "—",
    s.client?.name ?? "—",
    s.client?.email ?? "—",
    s.client?.company ?? "—",
    translateStatus(s.status),
    formatDate(s.sent_at),
  ])

  await writeSheetValues("Envios", [headers, ...rows])
  return sends.length
}

/** Exports all survey responses to the "Respostas" sheet. Returns the response count. */
export async function exportResponsesToSheets(): Promise<number> {
  const db = createServerClient()
  const { data, error } = await db
    .from("survey_responses")
    .select(
      "id, answers, responded_at, survey_sends(surveys(title), clients(name, email, company))"
    )
    .order("responded_at", { ascending: false })

  if (error) throw new Error(error.message)

  const rows: string[][] = []
  const headers = [
    "Cliente",
    "E-mail",
    "Empresa",
    "Pesquisa",
    "Pergunta",
    "Tipo",
    "Resposta",
    "Respondido em",
  ]

  const records = (data ?? []) as unknown as ResponseRow[]

  for (const record of records) {
    const answers = (record.answers as QuestionAnswer[]) ?? []
    const send = record.survey_sends
    const clientName = send?.clients?.name ?? "—"
    const clientEmail = send?.clients?.email ?? "—"
    const clientCompany = send?.clients?.company ?? "—"
    const surveyTitle = send?.surveys?.title ?? "—"
    const respondedAt = formatDate(record.responded_at)

    for (const answer of answers) {
      rows.push([
        clientName,
        clientEmail,
        clientCompany,
        surveyTitle,
        answer.question_title,
        answer.question_type,
        answer.value,
        respondedAt,
      ])
    }
  }

  await writeSheetValues("Respostas", [headers, ...rows])
  return records.length
}
