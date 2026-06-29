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
