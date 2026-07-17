// Filtro compartilhado pelos 3 pontos de inicialização do Sentry
// (instrumentation-client.ts, sentry.server.config.ts, sentry.edge.config.ts).
//
// Achado de auditoria LGPD: o @sentry/nextjs 10.66.0 NÃO aplica a lista de
// bloqueio de cookies/headers no caminho usado por captureRequestError (erros
// de servidor capturados via instrumentation.ts/onRequestError) — mesmo com
// sendDefaultPii desativado (o padrão), o header Cookie bruto (com o JWT de
// sessão inteiro) e um mapa { pf_session: "<jwt>" } são anexados ao evento
// sem redação nenhuma. Por isso filtramos manualmente aqui, em vez de confiar
// só na configuração padrão do SDK.
//
// Também remove o token de votação: captureRequestError grava
// contexts.nextjs.request_path sem nenhum filtro, e para a rota pública
// /v/<token> isso significa mandar o token (equivalente a uma senha de
// votação) para o Sentry em todo erro de servidor nessa página.
const TOKEN_EM_PATH = /\/v\/[^/?#]+/

interface SentryEventLike {
  request?: {
    headers?: Record<string, string>
    cookies?: Record<string, string>
    url?: string
  }
  contexts?: Record<string, Record<string, unknown> | undefined>
}

export function scrubSentryEvent<T extends SentryEventLike>(event: T): T {
  if (event.request?.headers) {
    delete event.request.headers.cookie
    delete event.request.headers.Cookie
    delete event.request.headers.authorization
    delete event.request.headers.Authorization
  }

  if (event.request?.cookies) {
    delete event.request.cookies
  }

  // event.request.url não é preenchido no caminho server-side (captureRequestError
  // só grava headers/method), mas o SDK do navegador pode preenchê-lo a partir da
  // URL da página em erros client-side — redige aqui também, por precaução.
  if (event.request?.url) {
    event.request.url = event.request.url.replace(TOKEN_EM_PATH, "/v/[token]")
  }

  const requestPath = event.contexts?.nextjs?.request_path
  if (typeof requestPath === "string") {
    event.contexts!.nextjs!.request_path = requestPath.replace(TOKEN_EM_PATH, "/v/[token]")
  }

  return event
}
