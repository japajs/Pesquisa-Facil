// ─── Send status (compartilhado entre envios) ────────────────────────────────

export type SendStatus = "sent" | "failed" | "pending"

// ─── Dashboard (condomínio) ────────────────────────────────────────────────

export interface CondoDashboardStats {
  total_condominios: number
  total_proprietarios: number
  total_unidades: number
  total_votacoes: number
  total_votos_enviados: number
  total_votos_recebidos: number
  participacao_geral: number // percentual
}

export interface VotacaoRecente {
  id: string
  titulo: string
  created_at: string
  condominio_id: string
  condominio_nome: string
  total_enviados: number
  total_respondidos: number
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}

// ─── Condomínio ────────────────────────────────────────────────────────────

export interface Condominio {
  id: string
  nome: string
  created_at: string
}

// ─── Proprietário / Unidade ───────────────────────────────────────────────
// Cadastro permanente: o peso de voto de um proprietário é sempre
// `unidades.length` — nunca um campo armazenado. Ver lib/peso.ts.

export interface Unidade {
  id: string
  proprietario_id: string
  numero: string
  bloco: string | null
  created_at: string
}

export interface Proprietario {
  id: string
  condominio_id: string
  nome: string
  email: string
  telefone: string | null
  created_at: string
  // joined
  unidades?: Unidade[]
}

// ─── Condo Survey (votação ponderada) ─────────────────────────────────────

export type CondoVotoResposta = "Sim" | "Não" | "Abstenção"
export type CondoVotoStatus = "rascunho" | "aberta" | "encerrada"

export interface CondoSurvey {
  id: string
  condominio_id: string
  titulo: string
  descricao: string | null
  pergunta: string
  status: CondoVotoStatus
  data_abertura: string | null
  data_encerramento: string | null
  created_at: string
}

export interface CondoSurveySend {
  id: string
  condo_survey_id: string
  proprietario_id: string
  token: string
  status: SendStatus
  sent_at: string | null
  created_at: string
  // joined
  condo_survey?: Pick<CondoSurvey, "id" | "titulo" | "descricao" | "pergunta" | "status">
  proprietario?: Pick<Proprietario, "id" | "nome" | "email">
}

export interface CondoSurveyResponse {
  id: string
  send_id: string
  resposta: CondoVotoResposta
  created_at: string
  // joined
  send?: Pick<CondoSurveySend, "id" | "token" | "condo_survey_id" | "proprietario_id"> & {
    proprietario?: Proprietario
  }
}

// ─── Apuração ──────────────────────────────────────────────────────────────
// Sempre calculada dinamicamente — nunca lida de um campo "peso" salvo.

export interface CondoApuracao {
  por_participantes: { sim: number; nao: number; abstencao: number }
  ponderado: { sim: number; nao: number; abstencao: number }
  total_apartamentos_representados: number
}
