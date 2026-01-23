export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_chat_history: {
        Row: {
          companies_suggested: Json | null
          created_at: string
          id: string
          query: string
          response: string | null
          user_id: string | null
        }
        Insert: {
          companies_suggested?: Json | null
          created_at?: string
          id?: string
          query: string
          response?: string | null
          user_id?: string | null
        }
        Update: {
          companies_suggested?: Json | null
          created_at?: string
          id?: string
          query?: string
          response?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          created_by: string | null
          ebitda_year1: number | null
          ebitda_year2: number | null
          ebitda_year3: number | null
          id: string
          name: string
          revenue_year1: number | null
          revenue_year2: number | null
          revenue_year3: number | null
          sector: string
          source: string
          updated_at: string
          valuation: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ebitda_year1?: number | null
          ebitda_year2?: number | null
          ebitda_year3?: number | null
          id?: string
          name: string
          revenue_year1?: number | null
          revenue_year2?: number | null
          revenue_year3?: number | null
          sector: string
          source: string
          updated_at?: string
          valuation?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ebitda_year1?: number | null
          ebitda_year2?: number | null
          ebitda_year3?: number | null
          id?: string
          name?: string
          revenue_year1?: number | null
          revenue_year2?: number | null
          revenue_year3?: number | null
          sector?: string
          source?: string
          updated_at?: string
          valuation?: number | null
        }
        Relationships: []
      }
      deal_documents: {
        Row: {
          created_at: string
          created_by: string | null
          deal_id: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          stage: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deal_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          stage: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deal_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_links: {
        Row: {
          created_at: string
          created_by: string | null
          deal_id: string
          id: string
          stage: string
          title: string | null
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deal_id: string
          id?: string
          stage: string
          title?: string | null
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deal_id?: string
          id?: string
          stage?: string
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_links_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          deal_id: string
          id: string
          stage: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          deal_id: string
          id?: string
          stage: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          deal_id?: string
          id?: string
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_notes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_stage_history: {
        Row: {
          deal_id: string
          duration_seconds: number | null
          entered_at: string
          exited_at: string | null
          id: string
          stage: string
        }
        Insert: {
          deal_id: string
          duration_seconds?: number | null
          entered_at?: string
          exited_at?: string | null
          id?: string
          stage: string
        }
        Update: {
          deal_id?: string
          duration_seconds?: number | null
          entered_at?: string
          exited_at?: string | null
          id?: string
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_stage_history_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          company_id: string
          created_at: string
          current_stage: string
          id: string
          is_active: boolean
          l1_filter_results: Json | null
          l1_status: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          current_stage?: string
          id?: string
          is_active?: boolean
          l1_filter_results?: Json | null
          l1_status?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          current_stage?: string
          id?: string
          is_active?: boolean
          l1_filter_results?: Json | null
          l1_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_thesis: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          last_scan_at: string | null
          next_scan_at: string | null
          scan_frequency: string
          sources_count: number
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          last_scan_at?: string | null
          next_scan_at?: string | null
          scan_frequency?: string
          sources_count?: number
          title?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          last_scan_at?: string | null
          next_scan_at?: string | null
          scan_frequency?: string
          sources_count?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      market_screening_results: {
        Row: {
          company_name: string
          created_at: string
          description: string | null
          discovered_at: string
          estimated_revenue: string | null
          estimated_valuation: string | null
          id: string
          is_added_to_pipeline: boolean
          match_reason: string | null
          match_score: number | null
          sector: string | null
          thesis_id: string | null
          website: string | null
        }
        Insert: {
          company_name: string
          created_at?: string
          description?: string | null
          discovered_at?: string
          estimated_revenue?: string | null
          estimated_valuation?: string | null
          id?: string
          is_added_to_pipeline?: boolean
          match_reason?: string | null
          match_score?: number | null
          sector?: string | null
          thesis_id?: string | null
          website?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string
          description?: string | null
          discovered_at?: string
          estimated_revenue?: string | null
          estimated_valuation?: string | null
          id?: string
          is_added_to_pipeline?: boolean
          match_reason?: string | null
          match_score?: number | null
          sector?: string | null
          thesis_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_screening_results_thesis_id_fkey"
            columns: ["thesis_id"]
            isOneToOne: false
            referencedRelation: "investment_thesis"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_duplicate_company: {
        Args: { company_name: string }
        Returns: {
          existing_company_id: string
          existing_deal_id: string
          is_duplicate: boolean
          last_processed_at: string
          last_stage: string
        }[]
      }
      is_authenticated: { Args: never; Returns: boolean }
      run_l1_filters: { Args: { deal_id_param: string }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
