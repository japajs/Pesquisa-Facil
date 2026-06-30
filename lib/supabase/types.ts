export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
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
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          created_at?: string
        }
        Update: {
          nome?: string
        }
        Relationships: []
      }
      proprietarios: {
        Row: {
          id: string
          condominio_id: string
          nome: string
          email: string
          telefone: string | null
          created_at: string
        }
        Insert: {
          id?: string
          condominio_id: string
          nome: string
          email: string
          telefone?: string | null
          created_at?: string
        }
        Update: {
          nome?: string
          email?: string
          telefone?: string | null
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
        }
        Relationships: []
      }
      condo_surveys: {
        Row: {
          id: string
          condominio_id: string
          titulo: string
          descricao: string | null
          pergunta: string
          status: "rascunho" | "aberta" | "encerrada"
          data_abertura: string | null
          data_encerramento: string | null
          created_at: string
        }
        Insert: {
          id?: string
          condominio_id: string
          titulo: string
          descricao?: string | null
          pergunta: string
          status?: "rascunho" | "aberta" | "encerrada"
          data_abertura?: string | null
          data_encerramento?: string | null
          created_at?: string
        }
        Update: {
          titulo?: string
          descricao?: string | null
          pergunta?: string
          status?: "rascunho" | "aberta" | "encerrada"
          data_abertura?: string | null
          data_encerramento?: string | null
        }
        Relationships: []
      }
      condo_survey_sends: {
        Row: {
          id: string
          condo_survey_id: string
          proprietario_id: string
          token: string
          status: "pending" | "sent" | "failed"
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          condo_survey_id: string
          proprietario_id: string
          token: string
          status?: "pending" | "sent" | "failed"
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          status?: "pending" | "sent" | "failed"
          sent_at?: string | null
        }
        Relationships: []
      }
      condo_survey_responses: {
        Row: {
          id: string
          send_id: string
          resposta: "Sim" | "Não" | "Abstenção"
          created_at: string
        }
        Insert: {
          id?: string
          send_id: string
          resposta: "Sim" | "Não" | "Abstenção"
          created_at?: string
        }
        Update: {
          resposta?: "Sim" | "Não" | "Abstenção"
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

export type DbCondoSurvey = Database["public"]["Tables"]["condo_surveys"]["Row"]
export type DbCondoSurveyInsert = Database["public"]["Tables"]["condo_surveys"]["Insert"]

export type DbCondoSurveySend = Database["public"]["Tables"]["condo_survey_sends"]["Row"]
export type DbCondoSurveySendInsert = Database["public"]["Tables"]["condo_survey_sends"]["Insert"]

export type DbCondoSurveyResponse = Database["public"]["Tables"]["condo_survey_responses"]["Row"]
export type DbCondoSurveyResponseInsert = Database["public"]["Tables"]["condo_survey_responses"]["Insert"]
