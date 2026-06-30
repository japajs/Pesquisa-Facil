export const APP_NAME = "Pesquisa Fácil"

export const ROUTES = {
  login: "/login",
  dashboard: "/dashboard",
  surveys: "/surveys",
  surveyNew: "/surveys/new",
  surveyEdit: (id: string) => `/surveys/${id}/edit`,
  clients: "/clients",
  sends: "/sends",
  publicSurvey: (token: string) => `/s/${token}`,
  publicCondoVoto: (token: string) => `/v/${token}`,
  condominios: "/condominios",
  condominioVotacao: (condominioId: string, votacaoId: string) =>
    `/condominios/${condominioId}/votacoes/${votacaoId}`,
} as const

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  text: "Resposta em texto",
  rating_5: "Nota de 1 a 5",
  rating_10: "Nota de 1 a 10",
  yes_no: "Sim ou Não",
  multiple_choice: "Múltipla escolha",
}

export const AUTH_COOKIE_NAME = "pf_session"
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export const RATE_LIMIT_WINDOW_MS = 60_000
export const RATE_LIMIT_MAX_REQUESTS = 20
