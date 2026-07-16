import * as Sentry from "@sentry/nextjs"
import type { Instrumentation } from "next"

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config")
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config")
  }
}

// Marca o condomínio no evento a partir da própria URL (ex.:
// /condominios/<id>/...) — assim o e-mail de alerta já chega identificando
// de qual cliente é o erro, sem precisar instrumentar cada página.
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const condominioId = request.path.match(/\/condominios\/([^/]+)/)?.[1]
  Sentry.withScope((scope) => {
    if (condominioId) scope.setTag("condominio_id", condominioId)
    Sentry.captureRequestError(error, request, context)
  })
}
