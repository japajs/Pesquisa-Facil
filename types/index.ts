// ─── Usuários e sessão ────────────────────────────────────────────────────────

export type UserPerfil = "administrador" | "operador" | "visualizador"

export interface SessionUser {
  userId: string
  email: string
  nome: string
  perfil: UserPerfil
}

export interface Usuario {
  id: string
  nome: string
  email: string
  perfil: UserPerfil
  ativo: boolean
  created_at: string
}

// ─── Auditoria ────────────────────────────────────────────────────────────────

export type AcaoAuditoria =
  | "login"
  | "logout"
  | "criar"
  | "editar"
  | "excluir"
  | "importar"
  | "exportar"
  | "enviar_email"
  | "encerrar"
  | "reabrir"
  | "visualizar_resultado"

export type ModuloAuditoria =
  | "auth"
  | "condominios"
  | "proprietarios"
  | "unidades"
  | "assembleias"
  | "pautas"
  | "importacao"
  | "configuracoes"

export interface AuditLog {
  id: string
  usuario_id: string | null
  usuario_nome: string
  usuario_email: string
  acao: AcaoAuditoria
  modulo: ModuloAuditoria
  descricao: string
  entidade: string | null
  entidade_id: string | null
  condominio_id: string | null
  condominio_nome: string | null
  created_at: string
}

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
  endereco: string | null
  sindico_nome: string | null
  sindico_contato: string | null
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
  email: string | null
  cpf: string | null
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
  assembleia?: Pick<Assembleia, "id" | "titulo" | "descricao" | "status" | "data_abertura" | "data_encerramento"> & {
    pautas?: Pauta[]
    condominio_nome?: string | null
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

// ─── Importação de planilha ────────────────────────────────────────────────

export type CampoImportacao = "imovel" | "nome" | "cpf" | "whatsapp" | "email" | "ignorar"

export interface DeteccaoColuna {
  colIdx: number
  header: string
  campoDetetado: CampoImportacao | null
}

export interface LeituraArquivo {
  headers: string[]
  rows: string[][]
  totalLinhas: number
}

export interface ImportacaoLinha {
  imovel: string
  nome: string
  cpf: string | null
  whatsapp: string | null
  email: string | null
  _linhaOriginal: number
}

export interface ImportacaoErro {
  linha: number
  campo: string
  mensagem: string
  dados?: string
}

export interface ProprietarioImport {
  nome: string
  email: string | null
  cpf: string | null
  telefone: string | null
  unidades: string[]
  linhasOrigem: number[]
}

export interface ImportacaoPreview {
  proprietarios: ProprietarioImport[]
  totalLinhas: number
  totalProprietarios: number
  totalUnidades: number
  duplicidades: number
  erros: ImportacaoErro[]
  linhasIgnoradas: number
}
