export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string | null
          password: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          password: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          password?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          id: string
          // Pipeline Stage
          pipeline_stage: string | null
          // Details Section
          entry_id: number | null
          watchlist_id: number | null
          segment: string | null
          target: string | null
          segment_related_offerings: string | null
          company_focus: string | null
          website: string | null
          watchlist_status: string | null
          comments: string | null
          ownership: string | null
          geography: string | null
          // Revenue Section (USD Mn)
          revenue_2021_usd_mn: number | null
          revenue_2022_usd_mn: number | null
          revenue_2023_usd_mn: number | null
          revenue_2024_usd_mn: number | null
          // EBITDA Section (USD Mn)
          ebitda_2021_usd_mn: number | null
          ebitda_2022_usd_mn: number | null
          ebitda_2023_usd_mn: number | null
          ebitda_2024_usd_mn: number | null
          // EV Section
          ev_2024: number | null
          // Revenue CAGR
          revenue_cagr_2021_2022: number | null
          revenue_cagr_2022_2023: number | null
          revenue_cagr_2023_2024: number | null
          // EBITDA Margin
          ebitda_margin_2021: number | null
          ebitda_margin_2022: number | null
          ebitda_margin_2023: number | null
          ebitda_margin_2024: number | null
          // EV/EBITDA
          ev_ebitda_2024: number | null
          // Segment Details
          segment_revenue: number | null
          segment_ebitda: number | null
          segment_revenue_total_ratio: number | null
          // L0 Screening Details
          l0_ebitda_2024_usd_mn: number | null
          l0_ev_2024_usd_mn: number | null
          l0_revenue_2024_usd_mn: number | null
          l0_ev_ebitda_2024: number | null
          segment_specific_revenue_pct: number | null
          combined_segment_revenue: string | null
          revenue_from_priority_geo_flag: string | null
          pct_from_domestic: number | null
          l0_ev_usd_mn: number | null
          // L1 Analysis
          l1_revenue_cagr_l3y: number | null
          l1_revenue_drop_count: number | null
          l1_ebitda_below_threshold_count: number | null
          l1_revenue_cagr_n3y: number | null
          l1_vision_fit: string | null
          l1_priority_geo_flag: string | null
          l1_ev_below_threshold: string | null
          // L1 Screening
          l1_rationale: string | null
          l1_revenue_no_consecutive_drop_usd: string | null
          // FX Adjustment Section
          fx_revenue_2021: number | null
          fx_revenue_2022: number | null
          fx_revenue_2023: number | null
          fx_revenue_2024: number | null
          fx_currency: string | null
          fx_assumed_forex_2021: number | null
          fx_assumed_forex_2022: number | null
          fx_assumed_forex_2023: number | null
          fx_assumed_forex_2024: number | null
          fx_forex_change_2021_2022: number | null
          fx_forex_change_2022_2023: number | null
          fx_forex_change_2023_2024: number | null
          fx_revenue_cagr_domestic_2021_2022: number | null
          fx_revenue_cagr_domestic_2022_2023: number | null
          fx_revenue_cagr_domestic_2023_2024: number | null
          fx_revenue_drop_count: number | null
          fx_revenue_no_consecutive_drop_local: string | null
          fx_rationale: string | null
          fx_ebitda_above_10_l3y: string | null
          l1_screening_result: string | null
          // Metadata
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          // Pipeline Stage
          pipeline_stage?: string | null
          // Details Section
          entry_id?: number | null
          watchlist_id?: number | null
          segment?: string | null
          target?: string | null
          segment_related_offerings?: string | null
          company_focus?: string | null
          website?: string | null
          watchlist_status?: string | null
          comments?: string | null
          ownership?: string | null
          geography?: string | null
          // Revenue Section (USD Mn)
          revenue_2021_usd_mn?: number | null
          revenue_2022_usd_mn?: number | null
          revenue_2023_usd_mn?: number | null
          revenue_2024_usd_mn?: number | null
          // EBITDA Section (USD Mn)
          ebitda_2021_usd_mn?: number | null
          ebitda_2022_usd_mn?: number | null
          ebitda_2023_usd_mn?: number | null
          ebitda_2024_usd_mn?: number | null
          // EV Section
          ev_2024?: number | null
          // Revenue CAGR
          revenue_cagr_2021_2022?: number | null
          revenue_cagr_2022_2023?: number | null
          revenue_cagr_2023_2024?: number | null
          // EBITDA Margin
          ebitda_margin_2021?: number | null
          ebitda_margin_2022?: number | null
          ebitda_margin_2023?: number | null
          ebitda_margin_2024?: number | null
          // EV/EBITDA
          ev_ebitda_2024?: number | null
          // Segment Details
          segment_revenue?: number | null
          segment_ebitda?: number | null
          segment_revenue_total_ratio?: number | null
          // L0 Screening Details
          l0_ebitda_2024_usd_mn?: number | null
          l0_ev_2024_usd_mn?: number | null
          l0_revenue_2024_usd_mn?: number | null
          l0_ev_ebitda_2024?: number | null
          segment_specific_revenue_pct?: number | null
          combined_segment_revenue?: string | null
          revenue_from_priority_geo_flag?: string | null
          pct_from_domestic?: number | null
          l0_ev_usd_mn?: number | null
          // L1 Analysis
          l1_revenue_cagr_l3y?: number | null
          l1_revenue_drop_count?: number | null
          l1_ebitda_below_threshold_count?: number | null
          l1_revenue_cagr_n3y?: number | null
          l1_vision_fit?: string | null
          l1_priority_geo_flag?: string | null
          l1_ev_below_threshold?: string | null
          // L1 Screening
          l1_rationale?: string | null
          l1_revenue_no_consecutive_drop_usd?: string | null
          // FX Adjustment Section
          fx_revenue_2021?: number | null
          fx_revenue_2022?: number | null
          fx_revenue_2023?: number | null
          fx_revenue_2024?: number | null
          fx_currency?: string | null
          fx_assumed_forex_2021?: number | null
          fx_assumed_forex_2022?: number | null
          fx_assumed_forex_2023?: number | null
          fx_assumed_forex_2024?: number | null
          fx_forex_change_2021_2022?: number | null
          fx_forex_change_2022_2023?: number | null
          fx_forex_change_2023_2024?: number | null
          fx_revenue_cagr_domestic_2021_2022?: number | null
          fx_revenue_cagr_domestic_2022_2023?: number | null
          fx_revenue_cagr_domestic_2023_2024?: number | null
          fx_revenue_drop_count?: number | null
          fx_revenue_no_consecutive_drop_local?: string | null
          fx_rationale?: string | null
          fx_ebitda_above_10_l3y?: string | null
          l1_screening_result?: string | null
          // Metadata
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          // Pipeline Stage
          pipeline_stage?: string | null
          // Details Section
          entry_id?: number | null
          watchlist_id?: number | null
          segment?: string | null
          target?: string | null
          segment_related_offerings?: string | null
          company_focus?: string | null
          website?: string | null
          watchlist_status?: string | null
          comments?: string | null
          ownership?: string | null
          geography?: string | null
          // Revenue Section (USD Mn)
          revenue_2021_usd_mn?: number | null
          revenue_2022_usd_mn?: number | null
          revenue_2023_usd_mn?: number | null
          revenue_2024_usd_mn?: number | null
          // EBITDA Section (USD Mn)
          ebitda_2021_usd_mn?: number | null
          ebitda_2022_usd_mn?: number | null
          ebitda_2023_usd_mn?: number | null
          ebitda_2024_usd_mn?: number | null
          // EV Section
          ev_2024?: number | null
          // Revenue CAGR
          revenue_cagr_2021_2022?: number | null
          revenue_cagr_2022_2023?: number | null
          revenue_cagr_2023_2024?: number | null
          // EBITDA Margin
          ebitda_margin_2021?: number | null
          ebitda_margin_2022?: number | null
          ebitda_margin_2023?: number | null
          ebitda_margin_2024?: number | null
          // EV/EBITDA
          ev_ebitda_2024?: number | null
          // Segment Details
          segment_revenue?: number | null
          segment_ebitda?: number | null
          segment_revenue_total_ratio?: number | null
          // L0 Screening Details
          l0_ebitda_2024_usd_mn?: number | null
          l0_ev_2024_usd_mn?: number | null
          l0_revenue_2024_usd_mn?: number | null
          l0_ev_ebitda_2024?: number | null
          segment_specific_revenue_pct?: number | null
          combined_segment_revenue?: string | null
          revenue_from_priority_geo_flag?: string | null
          pct_from_domestic?: number | null
          l0_ev_usd_mn?: number | null
          // L1 Analysis
          l1_revenue_cagr_l3y?: number | null
          l1_revenue_drop_count?: number | null
          l1_ebitda_below_threshold_count?: number | null
          l1_revenue_cagr_n3y?: number | null
          l1_vision_fit?: string | null
          l1_priority_geo_flag?: string | null
          l1_ev_below_threshold?: string | null
          // L1 Screening
          l1_rationale?: string | null
          l1_revenue_no_consecutive_drop_usd?: string | null
          // FX Adjustment Section
          fx_revenue_2021?: number | null
          fx_revenue_2022?: number | null
          fx_revenue_2023?: number | null
          fx_revenue_2024?: number | null
          fx_currency?: string | null
          fx_assumed_forex_2021?: number | null
          fx_assumed_forex_2022?: number | null
          fx_assumed_forex_2023?: number | null
          fx_assumed_forex_2024?: number | null
          fx_forex_change_2021_2022?: number | null
          fx_forex_change_2022_2023?: number | null
          fx_forex_change_2023_2024?: number | null
          fx_revenue_cagr_domestic_2021_2022?: number | null
          fx_revenue_cagr_domestic_2022_2023?: number | null
          fx_revenue_cagr_domestic_2023_2024?: number | null
          fx_revenue_drop_count?: number | null
          fx_revenue_no_consecutive_drop_local?: string | null
          fx_rationale?: string | null
          fx_ebitda_above_10_l3y?: string | null
          l1_screening_result?: string | null
          // Metadata
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_logs: {
        Row: {
          id: string
          company_id: string | null
          action: string
          details: Json | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          action: string
          details?: Json | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          action?: string
          details?: Json | null
          user_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      criterias: {
        Row: {
          id: string
          name: string
          prompt: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          prompt: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          prompt?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_criterias: {
        Row: {
          id: string
          company_id: string
          criteria_id: string
          result: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          criteria_id: string
          result?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          criteria_id?: string
          result?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_criterias_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_criterias_criteria_id_fkey"
            columns: ["criteria_id"]
            isOneToOne: false
            referencedRelation: "criterias"
            referencedColumns: ["id"]
          }
        ]
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
