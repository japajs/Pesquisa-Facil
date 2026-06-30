export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      surveys: {
        Row: {
          id: string
          title: string
          description: string | null
          questions: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          questions?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          questions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          name: string
          company: string | null
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          company?: string | null
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          company?: string | null
          email?: string
        }
        Relationships: []
      }
      survey_sends: {
        Row: {
          id: string
          survey_id: string
          client_id: string
          token: string
          status: "pending" | "sent" | "failed"
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          survey_id: string
          client_id: string
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
      survey_responses: {
        Row: {
          id: string
          send_id: string
          answers: Json
          responded_at: string
        }
        Insert: {
          id?: string
          send_id: string
          answers: Json
          responded_at?: string
        }
        Update: {
          answers?: Json
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
          created_at: string
        }
        Insert: {
          id?: string
          condominio_id: string
          nome: string
          email: string
          created_at?: string
        }
        Update: {
          nome?: string
          email?: string
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
          created_at: string
        }
        Insert: {
          id?: string
          condominio_id: string
          titulo: string
          descricao?: string | null
          pergunta: string
          created_at?: string
        }
        Update: {
          titulo?: string
          descricao?: string | null
          pergunta?: string
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
          resposta: "Sim" | "Não"
          created_at: string
        }
        Insert: {
          id?: string
          send_id: string
          resposta: "Sim" | "Não"
          created_at?: string
        }
        Update: {
          resposta?: "Sim" | "Não"
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
export type DbSurvey = Database["public"]["Tables"]["surveys"]["Row"]
export type DbSurveyInsert = Database["public"]["Tables"]["surveys"]["Insert"]
export type DbSurveyUpdate = Database["public"]["Tables"]["surveys"]["Update"]

export type DbClient = Database["public"]["Tables"]["clients"]["Row"]
export type DbClientInsert = Database["public"]["Tables"]["clients"]["Insert"]

export type DbSurveySend = Database["public"]["Tables"]["survey_sends"]["Row"]
export type DbSurveySendInsert = Database["public"]["Tables"]["survey_sends"]["Insert"]

export type DbSurveyResponse = Database["public"]["Tables"]["survey_responses"]["Row"]
export type DbSurveyResponseInsert = Database["public"]["Tables"]["survey_responses"]["Insert"]

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
