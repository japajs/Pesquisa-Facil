export const APP_NAME = "Sistema de Votação"
export const APP_VERSION = "1.0.0"

export const ROUTES = {
  login: "/login",
  dashboard: "/dashboard",
  condominios: "/condominios",
  configuracoes: "/configuracoes",
  importacao: "/importacao",
  publicCondoVoto: (token: string) => `/v/${token}`,
  condominioAssembleia: (condominioId: string, assembleiaId: string) =>
    `/condominios/${condominioId}/assembleias/${assembleiaId}`,
} as const

export const AUTH_COOKIE_NAME = "pf_session"
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export const RATE_LIMIT_WINDOW_MS = 60_000
export const RATE_LIMIT_MAX_REQUESTS = 20
