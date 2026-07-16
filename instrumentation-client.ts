import * as Sentry from "@sentry/nextjs"

// Só captura de erro — sem tracing de performance, replay ou widget de
// feedback (não é o que foi pedido, e evita gastar a cota gratuita do
// Sentry com telemetria que ninguém vai olhar).
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
