export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string
          usuario_id: string | null
          usuario_nome: string
          usuario_email: string
          acao: string
          modulo: string
          descricao: string
          entidade: string | null
          entidade_id: string | null
          condominio_id: string | null
          condominio_nome: string | null
          campo: string | null
          valor_anterior: string | null
          valor_novo: string | null
          motivo: string | null
          created_at: string
        }
        Insert: {
          id?: string
          usuario_id?: string | null
          usuario_nome?: string
          usuario_email?: string
          acao: string
          modulo: string
          descricao: string
          entidade?: string | null
          entidade_id?: string | null
          condominio_id?: string | null
          condominio_nome?: string | null
          campo?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
          motivo?: string | null
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      usuarios: {
        Row: {
          id: string
          nome: string
          email: string
          senha_hash: string
          perfil: "administrador" | "operador" | "visualizador"
          ativo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          email: string
          senha_hash: string
          perfil?: "administrador" | "operador" | "visualizador"
          ativo?: boolean
          created_at?: string
        }
        Update: {
          nome?: string
          email?: string
          senha_hash?: string
          perfil?: "administrador" | "operador" | "visualizador"
          ativo?: boolean
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          chave: string
          valor: string
          updated_at: string
        }
        Insert: {
          chave: string
          valor: string
          updated_at?: string
        }
        Update: {
          valor?: string
          updated_at?: string
        }
        Relationships: []
      }
      condominios: {
        Row: {
          id: string
          nome: string
          endereco: string | null
          sindico_nome: string | null
          sindico_contato: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          endereco?: string | null
          sindico_nome?: string | null
          sindico_contato?: string | null
          created_at?: string
        }
        Update: {
          nome?: string
          endereco?: string | null
          sindico_nome?: string | null
          sindico_contato?: string | null
        }
        Relationships: []
      }
      proprietarios: {
        Row: {
          id: string
          condominio_id: string
          nome: string
          email: string | null
          cpf: string | null
          telefone: string | null
          observacoes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          condominio_id: string
          nome: string
          email?: string | null
          cpf?: string | null
          telefone?: string | null
          observacoes?: string | null
          created_at?: string
        }
        Update: {
          nome?: string
          email?: string | null
          cpf?: string | null
          telefone?: string | null
          observacoes?: string | null
        }
        Relationships: []
      }
      unidades: {
        Row: {
          id: string
          proprietario_id: string
          numero: string
          bloco: string | null
          created_at: string
        }
        Insert: {
          id?: string
          proprietario_id: string
          numero: string
          bloco?: string | null
          created_at?: string
        }
        Update: {
          numero?: string
          bloco?: string | null
          proprietario_id?: string
        }
        Relationships: []
      }
      assembleias: {
        Row: {
          id: string
          condominio_id: string
          titulo: string
          descricao: string | null
          status: "rascunho" | "aberta" | "encerrada"
          data_abertura: string | null
          data_encerramento: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          condominio_id: string
          titulo: string
          descricao?: string | null
          status?: "rascunho" | "aberta" | "encerrada"
          data_abertura?: string | null
          data_encerramento?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          titulo?: string
          descricao?: string | null
          status?: "rascunho" | "aberta" | "encerrada"
          data_abertura?: string | null
          data_encerramento?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pautas: {
        Row: {
          id: string
          assembleia_id: string
          ordem: number
          titulo: string
          descricao: string | null
          ativa: boolean
          tipo: "sim_nao" | "multipla_escolha"
          permite_abstencao: boolean
          created_at: string
        }
        Insert: {
          id?: string
          assembleia_id: string
          ordem: number
          titulo: string
          descricao?: string | null
          ativa?: boolean
          tipo?: "sim_nao" | "multipla_escolha"
          permite_abstencao?: boolean
          created_at?: string
        }
        Update: {
          ordem?: number
          titulo?: string
          descricao?: string | null
          ativa?: boolean
          tipo?: "sim_nao" | "multipla_escolha"
          permite_abstencao?: boolean
        }
        Relationships: []
      }
      pauta_opcoes: {
        Row: {
          id: string
          pauta_id: string
          ordem: number
          label: string
          created_at: string
        }
        Insert: {
          id?: string
          pauta_id: string
          ordem: number
          label: string
          created_at?: string
        }
        Update: {
          ordem?: number
          label?: string
        }
        Relationships: []
      }
      assembleia_sends: {
        Row: {
          id: string
          assembleia_id: string
          proprietario_id: string
          token: string
          status: "pending" | "sent" | "failed"
          sent_at: string | null
          nome_snapshot: string | null
          cpf_snapshot: string | null
          email_snapshot: string | null
          telefone_snapshot: string | null
          quantidade_unidades_snapshot: number | null
          unidades_snapshot: Json | null
          peso_snapshot: number | null
          votado_em: string | null
          ip_snapshot: string | null
          user_agent_snapshot: string | null
          created_at: string
        }
        Insert: {
          id?: string
          assembleia_id: string
          proprietario_id: string
          token: string
          status?: "pending" | "sent" | "failed"
          sent_at?: string | null
          nome_snapshot?: string | null
          cpf_snapshot?: string | null
          email_snapshot?: string | null
          telefone_snapshot?: string | null
          quantidade_unidades_snapshot?: number | null
          unidades_snapshot?: Json | null
          peso_snapshot?: number | null
          votado_em?: string | null
          ip_snapshot?: string | null
          user_agent_snapshot?: string | null
          created_at?: string
        }
        Update: {
          token?: string
          status?: "pending" | "sent" | "failed"
          sent_at?: string | null
          nome_snapshot?: string | null
          cpf_snapshot?: string | null
          email_snapshot?: string | null
          telefone_snapshot?: string | null
          quantidade_unidades_snapshot?: number | null
          unidades_snapshot?: Json | null
          peso_snapshot?: number | null
          votado_em?: string | null
          ip_snapshot?: string | null
          user_agent_snapshot?: string | null
        }
        Relationships: []
      }
      assembleia_respostas: {
        Row: {
          id: string
          send_id: string
          pauta_id: string
          resposta: "Sim" | "Não" | "Abstenção" | null
          opcao_id: string | null
          peso: number
          created_at: string
        }
        Insert: {
          id?: string
          send_id: string
          pauta_id: string
          resposta?: "Sim" | "Não" | "Abstenção" | null
          opcao_id?: string | null
          peso: number
          created_at?: string
        }
        Update: {
          resposta?: "Sim" | "Não" | "Abstenção" | null
          opcao_id?: string | null
          peso?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience aliases
export type DbConfiguracao = Database["public"]["Tables"]["configuracoes"]["Row"]
export type DbCondominio = Database["public"]["Tables"]["condominios"]["Row"]
export type DbCondominioInsert = Database["public"]["Tables"]["condominios"]["Insert"]

export type DbProprietario = Database["public"]["Tables"]["proprietarios"]["Row"]
export type DbProprietarioInsert = Database["public"]["Tables"]["proprietarios"]["Insert"]

export type DbUnidade = Database["public"]["Tables"]["unidades"]["Row"]
export type DbUnidadeInsert = Database["public"]["Tables"]["unidades"]["Insert"]

export type DbAssembleia = Database["public"]["Tables"]["assembleias"]["Row"]
export type DbAssembleiaInsert = Database["public"]["Tables"]["assembleias"]["Insert"]

export type DbPauta = Database["public"]["Tables"]["pautas"]["Row"]
export type DbPautaInsert = Database["public"]["Tables"]["pautas"]["Insert"]

export type DbPautaOpcao = Database["public"]["Tables"]["pauta_opcoes"]["Row"]
export type DbPautaOpcaoInsert = Database["public"]["Tables"]["pauta_opcoes"]["Insert"]

export type DbAssembleiaSend = Database["public"]["Tables"]["assembleia_sends"]["Row"]
export type DbAssembleiaSendInsert = Database["public"]["Tables"]["assembleia_sends"]["Insert"]

export type DbAssembleiaResposta = Database["public"]["Tables"]["assembleia_respostas"]["Row"]
export type DbAssembleiaRespostaInsert = Database["public"]["Tables"]["assembleia_respostas"]["Insert"]
