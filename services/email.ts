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

// ─── Send functions ───────────────────────────────────────────────────────────

export interface EmailBatchResult {
  sent: string[]   // sendIds that succeeded
  failed: string[] // sendIds that failed
}

// ─── Assembleia email template ────────────────────────────────────────────────

interface AssembleiaTemplateInput {
  proprietarioNome: string
  assembleiaTitulo: string
  assembleiaDescricao: string | null
  pautas: { titulo: string }[]
  votoUrl: string
}

function buildAssembleiaEmailHtml({
  proprietarioNome,
  assembleiaTitulo,
  assembleiaDescricao,
  pautas,
  votoUrl,
}: AssembleiaTemplateInput): string {
  const accent = "#6366f1"
  const description = assembleiaDescricao
    ? `<p style="font-size:15px;color:#6b7280;margin:0 0 20px;line-height:1.6;">${assembleiaDescricao}</p>`
    : ""
  const pautasList = pautas
    .map(
      (p, i) =>
        `<li style="font-size:14px;color:#374151;padding:4px 0;line-height:1.5;">${i + 1}. ${p.titulo}</li>`
    )
    .join("")

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${assembleiaTitulo}</title>
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
                Você foi convidado(a) a participar da assembleia
                <strong>&ldquo;${assembleiaTitulo}&rdquo;</strong>.
              </p>
              ${description}
              <p style="font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px;">
                Pautas
              </p>
              <ul style="margin:0 0 28px;padding-left:0;list-style:none;">
                ${pautasList}
              </ul>
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

export interface AssembleiaEmailInput {
  sendId: string
  to: string
  proprietarioNome: string
  assembleiaTitulo: string
  assembleiaDescricao: string | null
  pautas: { titulo: string }[]
  votoUrl: string
}

// Sends emails in batches of 100 (Resend's batch limit).
export async function sendAssembleiaEmailBatch(
  emails: AssembleiaEmailInput[]
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
        subject: `Assembleia: ${e.assembleiaTitulo}`,
        html: buildAssembleiaEmailHtml({
          proprietarioNome: e.proprietarioNome,
          assembleiaTitulo: e.assembleiaTitulo,
          assembleiaDescricao: e.assembleiaDescricao,
          pautas: e.pautas,
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

