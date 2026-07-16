import { withSentryConfig } from "@sentry/nextjs"
import type { NextConfig } from "next"

// Auditoria de segurança: não há cliente Supabase no navegador (todo acesso a
// dados passa por Server Actions/Server Components) e as fontes (next/font)
// são auto-hospedadas — então não é preciso liberar domínios externos para
// script/connect/font além da própria Vercel e do Sentry (monitoramento de
// erros). 'unsafe-inline' é necessário em
// script-src e style-src porque o Next.js injeta scripts inline de
// hydration/RSC em toda página renderizada — bloquear isso quebra a própria
// aplicação (só há como evitar com CSP baseada em nonce via proxy.ts, que
// exige forçar renderização dinâmica em todas as páginas, fora de escopo
// aqui). Ainda assim, a CSP impede scripts <script src="..."> de domínios
// não listados, que é o vetor mais comum de XSS armazenado/refletido.
// vercel.live é a infraestrutura do toolbar de feedback da própria Vercel.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://vercel.live",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://vercel.live wss://vercel.live https://o4511745215823872.ingest.us.sentry.io",
  "frame-src https://vercel.live",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ")

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
]

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  experimental: {
    // Aumentado do padrão de 1MB para caber o PDF opcional (edital,
    // orçamento etc.) anexado ao disparo de e-mails da assembleia — o
    // arquivo viaja em Base64 dentro do corpo da Server Action, então o
    // limite precisa sobrar espaço além do tamanho real do PDF (~4MB, já
    // validado no servidor em app/actions/assembleia-votos.ts).
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
}

// org/project/authToken só existem para o upload de source maps (stack
// traces legíveis no painel do Sentry) — sem eles, o build funciona normal
// e a captura de erro em si (o que foi pedido) já funciona só com o DSN.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
})
