// ─── Send status (compartilhado entre envios) ────────────────────────────────

export type SendStatus = "sent" | "failed" | "pending"

// ─── Dashboard (condomínio) ────────────────────────────────────────────────

export interface CondoDashboardStats {
  total_condominios: number
  total_proprietarios: number
  total_unidades: number
  total_assembleias: number
  total_votos_enviados: number
  total_votos_recebidos: number
  participacao_geral: number // percentual
}

export interface AssembleiaRecente {
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

// ─── Assembleia ────────────────────────────────────────────────────────────

export type AssembleiaStatus = "rascunho" | "aberta" | "encerrada"
export type AssembleiaRespostaValor = "Sim" | "Não" | "Abstenção"

export interface Assembleia {
  id: string
  condominio_id: string
  titulo: string
  descricao: string | null
  status: AssembleiaStatus
  data_abertura: string | null
  data_encerramento: string | null
  created_at: string
  updated_at: string
  // joined
  pautas?: Pauta[]
}

export interface Pauta {
  id: string
  assembleia_id: string
  ordem: number
  titulo: string
  descricao: string | null
  ativa: boolean
  created_at: string
}

export interface AssembleiaSend {
  id: string
  assembleia_id: string
  proprietario_id: string
  token: string
  status: SendStatus
  sent_at: string | null
  created_at: string
  // joined
  assembleia?: Pick<Assembleia, "id" | "titulo" | "descricao" | "status" | "data_encerramento"> & {
    pautas?: Pauta[]
  }
  proprietario?: Pick<Proprietario, "id" | "nome" | "email">
}

export interface AssembleiaResposta {
  id: string
  send_id: string
  pauta_id: string
  resposta: AssembleiaRespostaValor
  created_at: string
}

// ─── Apuração de Assembleia ────────────────────────────────────────────────

export interface PautaApuracao {
  pauta: Pauta
  por_participantes: { sim: number; nao: number; abstencao: number }
  ponderado: { sim: number; nao: number; abstencao: number }
  total_apartamentos_representados: number
}

export interface AssembleiaApuracao {
  pautas: PautaApuracao[]
  total_enviados: number
  total_respondidos: number
}
