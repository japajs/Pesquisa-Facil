import { Resend } from "resend"
import { APP_NAME } from "@/lib/constants"

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error("RESEND_API_KEY não está configurado.")
  return new Resend(key)
}

function getFromEmail(): string {
  const from = process.env.RESEND_FROM_EMAIL
  if (!from) throw new Error("RESEND_FROM_EMAIL não está configurado.")
  return from
}

// ─── Email template ───────────────────────────────────────────────────────────

interface TemplateInput {
  clientName: string
  surveyTitle: string
  surveyDescription: string | null
  surveyUrl: string
}

function buildEmailHtml({ clientName, surveyTitle, surveyDescription, surveyUrl }: TemplateInput): string {
  const accent = "#6366f1"
  const description = surveyDescription
    ? `<p style="font-size:15px;color:#6b7280;margin:0 0 28px;line-height:1.6;">${surveyDescription}</p>`
    : ""

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${surveyTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background:#f9fafb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" role="presentation"
               style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:${accent};padding:24px 32px;">
              <p style="margin:0;font-size:16px;font-weight:600;color:#ffffff;letter-spacing:-0.01em;">
                ${APP_NAME}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 28px;">
              <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;line-height:1.3;">
                Olá, ${clientName}!
              </h1>
              <p style="font-size:15px;color:#374151;margin:0 0 20px;line-height:1.6;">
                Você foi convidado(a) a responder a pesquisa
                <strong>&ldquo;${surveyTitle}&rdquo;</strong>.
                Leva apenas alguns minutos.
              </p>
              ${description}
              <a href="${surveyUrl}"
                 style="display:inline-block;background:${accent};color:#ffffff;font-size:15px;
                        font-weight:600;padding:14px 28px;border-radius:8px;text-decoration:none;
                        letter-spacing:-0.01em;">
                Responder pesquisa →
              </a>
            </td>
          </tr>

          <!-- Fallback link -->
          <tr>
            <td style="padding:0 32px 28px;">
              <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.5;">
                Se o botão não funcionar, acesse:<br/>
                <a href="${surveyUrl}" style="color:${accent};word-break:break-all;">${surveyUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;">
              <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.5;">
                Este e-mail foi enviado por <strong>${APP_NAME}</strong>.
                Se você não esperava recebê-lo, pode ignorar esta mensagem com segurança.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── Send functions ───────────────────────────────────────────────────────────

export interface SurveyEmailInput {
  sendId: string
  to: string
  clientName: string
  surveyTitle: string
  surveyDescription: string | null
  surveyUrl: string
}

export interface EmailBatchResult {
  sent: string[]   // sendIds that succeeded
  failed: string[] // sendIds that failed
}

// ─── Condo voto email template ─────────────────────────────────────────────

interface CondoTemplateInput {
  proprietarioNome: string
  condoSurveyTitulo: string
  condoSurveyDescricao: string | null
  condoSurveyPergunta: string
  votoUrl: string
}

function buildCondoVotoEmailHtml({
  proprietarioNome,
  condoSurveyTitulo,
  condoSurveyDescricao,
  condoSurveyPergunta,
  votoUrl,
}: CondoTemplateInput): string {
  const accent = "#6366f1"
  const description = condoSurveyDescricao
    ? `<p style="font-size:15px;color:#6b7280;margin:0 0 28px;line-height:1.6;">${condoSurveyDescricao}</p>`
    : ""

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${condoSurveyTitulo}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background:#f9fafb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" role="presentation"
               style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:${accent};padding:24px 32px;">
              <p style="margin:0;font-size:16px;font-weight:600;color:#ffffff;letter-spacing:-0.01em;">
                ${APP_NAME}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 28px;">
              <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;line-height:1.3;">
                Olá, ${proprietarioNome}!
              </h1>
              <p style="font-size:15px;color:#374151;margin:0 0 20px;line-height:1.6;">
                Você foi convidado(a) a votar na votação
                <strong>&ldquo;${condoSurveyTitulo}&rdquo;</strong>:
                <br/>&ldquo;${condoSurveyPergunta}&rdquo;
              </p>
              ${description}
              <a href="${votoUrl}"
                 style="display:inline-block;background:${accent};color:#ffffff;font-size:15px;
                        font-weight:600;padding:14px 28px;border-radius:8px;text-decoration:none;
                        letter-spacing:-0.01em;">
                Votar agora →
              </a>
            </td>
          </tr>

          <!-- Fallback link -->
          <tr>
            <td style="padding:0 32px 28px;">
              <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.5;">
                Se o botão não funcionar, acesse:<br/>
                <a href="${votoUrl}" style="color:${accent};word-break:break-all;">${votoUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;">
              <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.5;">
                Este e-mail foi enviado por <strong>${APP_NAME}</strong>.
                Se você não esperava recebê-lo, pode ignorar esta mensagem com segurança.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export interface CondoVotoEmailInput {
  sendId: string
  to: string
  proprietarioNome: string
  condoSurveyTitulo: string
  condoSurveyDescricao: string | null
  condoSurveyPergunta: string
  votoUrl: string
}

// Sends emails in batches of 100 (Resend's batch limit).
export async function sendCondoVotoEmailBatch(
  emails: CondoVotoEmailInput[]
): Promise<EmailBatchResult> {
  const resend = getResend()
  const from = getFromEmail()
  const sent: string[] = []
  const failed: string[] = []

  const CHUNK = 100
  for (let i = 0; i < emails.length; i += CHUNK) {
    const chunk = emails.slice(i, i + CHUNK)

    try {
      const batch = chunk.map((e) => ({
        from,
        to: e.to,
        subject: `Votação: ${e.condoSurveyTitulo}`,
        html: buildCondoVotoEmailHtml({
          proprietarioNome: e.proprietarioNome,
          condoSurveyTitulo: e.condoSurveyTitulo,
          condoSurveyDescricao: e.condoSurveyDescricao,
          condoSurveyPergunta: e.condoSurveyPergunta,
          votoUrl: e.votoUrl,
        }),
      }))

      await resend.batch.send(batch)
      chunk.forEach((e) => sent.push(e.sendId))
    } catch {
      chunk.forEach((e) => failed.push(e.sendId))
    }
  }

  return { sent, failed }
}

// Sends emails in batches of 100 (Resend's batch limit).
export async function sendSurveyEmailBatch(emails: SurveyEmailInput[]): Promise<EmailBatchResult> {
  const resend = getResend()
  const from = getFromEmail()
  const sent: string[] = []
  const failed: string[] = []

  const CHUNK = 100
  for (let i = 0; i < emails.length; i += CHUNK) {
    const chunk = emails.slice(i, i + CHUNK)

    try {
      const batch = chunk.map((e) => ({
        from,
        to: e.to,
        subject: `Pesquisa: ${e.surveyTitle}`,
        html: buildEmailHtml({
          clientName: e.clientName,
          surveyTitle: e.surveyTitle,
          surveyDescription: e.surveyDescription,
          surveyUrl: e.surveyUrl,
        }),
      }))

      await resend.batch.send(batch)
      chunk.forEach((e) => sent.push(e.sendId))
    } catch {
      chunk.forEach((e) => failed.push(e.sendId))
    }
  }

  return { sent, failed }
}
