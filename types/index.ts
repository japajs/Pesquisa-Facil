// ─── Survey ─────────────────────────────────────────────────────────────────

export type QuestionType =
  | "text"
  | "rating_5"
  | "rating_10"
  | "yes_no"
  | "multiple_choice"

export interface QuestionOption {
  id: string
  label: string
}

export interface Question {
  id: string
  title: string
  type: QuestionType
  required: boolean
  options?: QuestionOption[] // only for multiple_choice
}

export interface Survey {
  id: string
  title: string
  description: string | null
  questions: Question[]
  created_at: string
  updated_at: string
}

// ─── Client ──────────────────────────────────────────────────────────────────

export interface Client {
  id: string
  name: string
  company: string | null
  email: string
  created_at: string
}

// ─── Send ────────────────────────────────────────────────────────────────────

export type SendStatus = "sent" | "failed" | "pending"

export interface SurveySend {
  id: string
  survey_id: string
  client_id: string
  token: string
  status: SendStatus
  sent_at: string | null
  created_at: string
  // joined
  survey?: Pick<Survey, "id" | "title">
  client?: Pick<Client, "id" | "name" | "email" | "company">
}

// ─── Response ────────────────────────────────────────────────────────────────

export interface QuestionAnswer {
  question_id: string
  question_title: string
  question_type: QuestionType
  value: string
}

export interface SurveyResponse {
  id: string
  send_id: string
  answers: QuestionAnswer[]
  responded_at: string
  // joined
  send?: Pick<SurveySend, "id" | "token" | "survey_id" | "client_id">
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_surveys: number
  total_clients: number
  total_sends: number
  total_responses: number
  response_rate: number
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}
