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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      companies: {
        Row: {
          combined_segment_revenue: string | null
          comments: string | null
          company_focus: string | null
          created_at: string | null
          ebitda_2021_usd_mn: number | null
          ebitda_2022_usd_mn: number | null
          ebitda_2023_usd_mn: number | null
          ebitda_2024_usd_mn: number | null
          ebitda_margin_2021: number | null
          ebitda_margin_2022: number | null
          ebitda_margin_2023: number | null
          ebitda_margin_2024: number | null
          entry_id: number | null
          ev_2024: number | null
          ev_ebitda_2024: number | null
          fx_assumed_forex_2021: number | null
          fx_assumed_forex_2022: number | null
          fx_assumed_forex_2023: number | null
          fx_assumed_forex_2024: number | null
          fx_currency: string | null
          fx_ebitda_above_10_l3y: string | null
          fx_forex_change_2021_2022: number | null
          fx_forex_change_2022_2023: number | null
          fx_forex_change_2023_2024: number | null
          fx_rationale: string | null
          fx_revenue_2021: number | null
          fx_revenue_2022: number | null
          fx_revenue_2023: number | null
          fx_revenue_2024: number | null
          fx_revenue_cagr_domestic_2021_2022: number | null
          fx_revenue_cagr_domestic_2022_2023: number | null
          fx_revenue_cagr_domestic_2023_2024: number | null
          fx_revenue_drop_count: number | null
          fx_revenue_no_consecutive_drop_local: string | null
          geography: string | null
          id: string
          l0_ebitda_2024_usd_mn: number | null
          l0_ev_2024_usd_mn: number | null
          l0_ev_ebitda_2024: number | null
          l0_ev_usd_mn: number | null
          l0_revenue_2024_usd_mn: number | null
          l1_ebitda_below_threshold_count: number | null
          l1_ev_below_threshold: string | null
          l1_priority_geo_flag: string | null
          l1_rationale: string | null
          l1_revenue_cagr_l3y: number | null
          l1_revenue_cagr_n3y: number | null
          l1_revenue_drop_count: number | null
          l1_revenue_no_consecutive_drop_usd: string | null
          l1_screening_result: string | null
          l1_vision_fit: string | null
          ownership: string | null
          pct_from_domestic: number | null
          pipeline_stage: string | null
          revenue_2021_usd_mn: number | null
          revenue_2022_usd_mn: number | null
          revenue_2023_usd_mn: number | null
          revenue_2024_usd_mn: number | null
          revenue_cagr_2021_2022: number | null
          revenue_cagr_2022_2023: number | null
          revenue_cagr_2023_2024: number | null
          revenue_from_priority_geo_flag: string | null
          segment: string | null
          segment_ebitda: number | null
          segment_related_offerings: string | null
          segment_revenue: number | null
          segment_revenue_total_ratio: number | null
          segment_specific_revenue_pct: number | null
          target: string | null
          updated_at: string | null
          watchlist_id: number | null
          watchlist_status: string | null
          website: string | null
        }
        Insert: {
          combined_segment_revenue?: string | null
          comments?: string | null
          company_focus?: string | null
          created_at?: string | null
          ebitda_2021_usd_mn?: number | null
          ebitda_2022_usd_mn?: number | null
          ebitda_2023_usd_mn?: number | null
          ebitda_2024_usd_mn?: number | null
          ebitda_margin_2021?: number | null
          ebitda_margin_2022?: number | null
          ebitda_margin_2023?: number | null
          ebitda_margin_2024?: number | null
          entry_id?: number | null
          ev_2024?: number | null
          ev_ebitda_2024?: number | null
          fx_assumed_forex_2021?: number | null
          fx_assumed_forex_2022?: number | null
          fx_assumed_forex_2023?: number | null
          fx_assumed_forex_2024?: number | null
          fx_currency?: string | null
          fx_ebitda_above_10_l3y?: string | null
          fx_forex_change_2021_2022?: number | null
          fx_forex_change_2022_2023?: number | null
          fx_forex_change_2023_2024?: number | null
          fx_rationale?: string | null
          fx_revenue_2021?: number | null
          fx_revenue_2022?: number | null
          fx_revenue_2023?: number | null
          fx_revenue_2024?: number | null
          fx_revenue_cagr_domestic_2021_2022?: number | null
          fx_revenue_cagr_domestic_2022_2023?: number | null
          fx_revenue_cagr_domestic_2023_2024?: number | null
          fx_revenue_drop_count?: number | null
          fx_revenue_no_consecutive_drop_local?: string | null
          geography?: string | null
          id?: string
          l0_ebitda_2024_usd_mn?: number | null
          l0_ev_2024_usd_mn?: number | null
          l0_ev_ebitda_2024?: number | null
          l0_ev_usd_mn?: number | null
          l0_revenue_2024_usd_mn?: number | null
          l1_ebitda_below_threshold_count?: number | null
          l1_ev_below_threshold?: string | null
          l1_priority_geo_flag?: string | null
          l1_rationale?: string | null
          l1_revenue_cagr_l3y?: number | null
          l1_revenue_cagr_n3y?: number | null
          l1_revenue_drop_count?: number | null
          l1_revenue_no_consecutive_drop_usd?: string | null
          l1_screening_result?: string | null
          l1_vision_fit?: string | null
          ownership?: string | null
          pct_from_domestic?: number | null
          pipeline_stage?: string | null
          revenue_2021_usd_mn?: number | null
          revenue_2022_usd_mn?: number | null
          revenue_2023_usd_mn?: number | null
          revenue_2024_usd_mn?: number | null
          revenue_cagr_2021_2022?: number | null
          revenue_cagr_2022_2023?: number | null
          revenue_cagr_2023_2024?: number | null
          revenue_from_priority_geo_flag?: string | null
          segment?: string | null
          segment_ebitda?: number | null
          segment_related_offerings?: string | null
          segment_revenue?: number | null
          segment_revenue_total_ratio?: number | null
          segment_specific_revenue_pct?: number | null
          target?: string | null
          updated_at?: string | null
          watchlist_id?: number | null
          watchlist_status?: string | null
          website?: string | null
        }
        Update: {
          combined_segment_revenue?: string | null
          comments?: string | null
          company_focus?: string | null
          created_at?: string | null
          ebitda_2021_usd_mn?: number | null
          ebitda_2022_usd_mn?: number | null
          ebitda_2023_usd_mn?: number | null
          ebitda_2024_usd_mn?: number | null
          ebitda_margin_2021?: number | null
          ebitda_margin_2022?: number | null
          ebitda_margin_2023?: number | null
          ebitda_margin_2024?: number | null
          entry_id?: number | null
          ev_2024?: number | null
          ev_ebitda_2024?: number | null
          fx_assumed_forex_2021?: number | null
          fx_assumed_forex_2022?: number | null
          fx_assumed_forex_2023?: number | null
          fx_assumed_forex_2024?: number | null
          fx_currency?: string | null
          fx_ebitda_above_10_l3y?: string | null
          fx_forex_change_2021_2022?: number | null
          fx_forex_change_2022_2023?: number | null
          fx_forex_change_2023_2024?: number | null
          fx_rationale?: string | null
          fx_revenue_2021?: number | null
          fx_revenue_2022?: number | null
          fx_revenue_2023?: number | null
          fx_revenue_2024?: number | null
          fx_revenue_cagr_domestic_2021_2022?: number | null
          fx_revenue_cagr_domestic_2022_2023?: number | null
          fx_revenue_cagr_domestic_2023_2024?: number | null
          fx_revenue_drop_count?: number | null
          fx_revenue_no_consecutive_drop_local?: string | null
          geography?: string | null
          id?: string
          l0_ebitda_2024_usd_mn?: number | null
          l0_ev_2024_usd_mn?: number | null
          l0_ev_ebitda_2024?: number | null
          l0_ev_usd_mn?: number | null
          l0_revenue_2024_usd_mn?: number | null
          l1_ebitda_below_threshold_count?: number | null
          l1_ev_below_threshold?: string | null
          l1_priority_geo_flag?: string | null
          l1_rationale?: string | null
          l1_revenue_cagr_l3y?: number | null
          l1_revenue_cagr_n3y?: number | null
          l1_revenue_drop_count?: number | null
          l1_revenue_no_consecutive_drop_usd?: string | null
          l1_screening_result?: string | null
          l1_vision_fit?: string | null
          ownership?: string | null
          pct_from_domestic?: number | null
          pipeline_stage?: string | null
          revenue_2021_usd_mn?: number | null
          revenue_2022_usd_mn?: number | null
          revenue_2023_usd_mn?: number | null
          revenue_2024_usd_mn?: number | null
          revenue_cagr_2021_2022?: number | null
          revenue_cagr_2022_2023?: number | null
          revenue_cagr_2023_2024?: number | null
          revenue_from_priority_geo_flag?: string | null
          segment?: string | null
          segment_ebitda?: number | null
          segment_related_offerings?: string | null
          segment_revenue?: number | null
          segment_revenue_total_ratio?: number | null
          segment_specific_revenue_pct?: number | null
          target?: string | null
          updated_at?: string | null
          watchlist_id?: number | null
          watchlist_status?: string | null
          website?: string | null
        }
        Relationships: []
      }
      company_criterias: {
        Row: {
          company_id: string
          created_at: string | null
          criteria_id: string
          id: string
          result: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          criteria_id: string
          id?: string
          result?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          criteria_id?: string
          id?: string
          result?: string | null
          updated_at?: string | null
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
          },
        ]
      }
      company_logs: {
        Row: {
          action: string
          combined_segment_revenue: string | null
          comments: string | null
          company_focus: string | null
          company_id: string | null
          created_at: string | null
          ebitda_2021_usd_mn: number | null
          ebitda_2022_usd_mn: number | null
          ebitda_2023_usd_mn: number | null
          ebitda_2024_usd_mn: number | null
          ebitda_margin_2021: number | null
          ebitda_margin_2022: number | null
          ebitda_margin_2023: number | null
          ebitda_margin_2024: number | null
          entry_id: number | null
          ev_2024: number | null
          ev_ebitda_2024: number | null
          fx_assumed_forex_2021: number | null
          fx_assumed_forex_2022: number | null
          fx_assumed_forex_2023: number | null
          fx_assumed_forex_2024: number | null
          fx_currency: string | null
          fx_ebitda_above_10_l3y: string | null
          fx_forex_change_2021_2022: number | null
          fx_forex_change_2022_2023: number | null
          fx_forex_change_2023_2024: number | null
          fx_rationale: string | null
          fx_revenue_2021: number | null
          fx_revenue_2022: number | null
          fx_revenue_2023: number | null
          fx_revenue_2024: number | null
          fx_revenue_cagr_domestic_2021_2022: number | null
          fx_revenue_cagr_domestic_2022_2023: number | null
          fx_revenue_cagr_domestic_2023_2024: number | null
          fx_revenue_drop_count: number | null
          fx_revenue_no_consecutive_drop_local: string | null
          geography: string | null
          id: string
          l0_ebitda_2024_usd_mn: number | null
          l0_ev_2024_usd_mn: number | null
          l0_ev_ebitda_2024: number | null
          l0_ev_usd_mn: number | null
          l0_revenue_2024_usd_mn: number | null
          l1_ebitda_below_threshold_count: number | null
          l1_ev_below_threshold: string | null
          l1_priority_geo_flag: string | null
          l1_rationale: string | null
          l1_revenue_cagr_l3y: number | null
          l1_revenue_cagr_n3y: number | null
          l1_revenue_drop_count: number | null
          l1_revenue_no_consecutive_drop_usd: string | null
          l1_screening_result: string | null
          l1_vision_fit: string | null
          ownership: string | null
          pct_from_domestic: number | null
          revenue_2021_usd_mn: number | null
          revenue_2022_usd_mn: number | null
          revenue_2023_usd_mn: number | null
          revenue_2024_usd_mn: number | null
          revenue_cagr_2021_2022: number | null
          revenue_cagr_2022_2023: number | null
          revenue_cagr_2023_2024: number | null
          revenue_from_priority_geo_flag: string | null
          segment: string | null
          segment_ebitda: number | null
          segment_related_offerings: string | null
          segment_revenue: number | null
          segment_revenue_total_ratio: number | null
          segment_specific_revenue_pct: number | null
          target: string | null
          user_id: string | null
          watchlist_id: number | null
          watchlist_status: string | null
          website: string | null
        }
        Insert: {
          action: string
          combined_segment_revenue?: string | null
          comments?: string | null
          company_focus?: string | null
          company_id?: string | null
          created_at?: string | null
          ebitda_2021_usd_mn?: number | null
          ebitda_2022_usd_mn?: number | null
          ebitda_2023_usd_mn?: number | null
          ebitda_2024_usd_mn?: number | null
          ebitda_margin_2021?: number | null
          ebitda_margin_2022?: number | null
          ebitda_margin_2023?: number | null
          ebitda_margin_2024?: number | null
          entry_id?: number | null
          ev_2024?: number | null
          ev_ebitda_2024?: number | null
          fx_assumed_forex_2021?: number | null
          fx_assumed_forex_2022?: number | null
          fx_assumed_forex_2023?: number | null
          fx_assumed_forex_2024?: number | null
          fx_currency?: string | null
          fx_ebitda_above_10_l3y?: string | null
          fx_forex_change_2021_2022?: number | null
          fx_forex_change_2022_2023?: number | null
          fx_forex_change_2023_2024?: number | null
          fx_rationale?: string | null
          fx_revenue_2021?: number | null
          fx_revenue_2022?: number | null
          fx_revenue_2023?: number | null
          fx_revenue_2024?: number | null
          fx_revenue_cagr_domestic_2021_2022?: number | null
          fx_revenue_cagr_domestic_2022_2023?: number | null
          fx_revenue_cagr_domestic_2023_2024?: number | null
          fx_revenue_drop_count?: number | null
          fx_revenue_no_consecutive_drop_local?: string | null
          geography?: string | null
          id?: string
          l0_ebitda_2024_usd_mn?: number | null
          l0_ev_2024_usd_mn?: number | null
          l0_ev_ebitda_2024?: number | null
          l0_ev_usd_mn?: number | null
          l0_revenue_2024_usd_mn?: number | null
          l1_ebitda_below_threshold_count?: number | null
          l1_ev_below_threshold?: string | null
          l1_priority_geo_flag?: string | null
          l1_rationale?: string | null
          l1_revenue_cagr_l3y?: number | null
          l1_revenue_cagr_n3y?: number | null
          l1_revenue_drop_count?: number | null
          l1_revenue_no_consecutive_drop_usd?: string | null
          l1_screening_result?: string | null
          l1_vision_fit?: string | null
          ownership?: string | null
          pct_from_domestic?: number | null
          revenue_2021_usd_mn?: number | null
          revenue_2022_usd_mn?: number | null
          revenue_2023_usd_mn?: number | null
          revenue_2024_usd_mn?: number | null
          revenue_cagr_2021_2022?: number | null
          revenue_cagr_2022_2023?: number | null
          revenue_cagr_2023_2024?: number | null
          revenue_from_priority_geo_flag?: string | null
          segment?: string | null
          segment_ebitda?: number | null
          segment_related_offerings?: string | null
          segment_revenue?: number | null
          segment_revenue_total_ratio?: number | null
          segment_specific_revenue_pct?: number | null
          target?: string | null
          user_id?: string | null
          watchlist_id?: number | null
          watchlist_status?: string | null
          website?: string | null
        }
        Update: {
          action?: string
          combined_segment_revenue?: string | null
          comments?: string | null
          company_focus?: string | null
          company_id?: string | null
          created_at?: string | null
          ebitda_2021_usd_mn?: number | null
          ebitda_2022_usd_mn?: number | null
          ebitda_2023_usd_mn?: number | null
          ebitda_2024_usd_mn?: number | null
          ebitda_margin_2021?: number | null
          ebitda_margin_2022?: number | null
          ebitda_margin_2023?: number | null
          ebitda_margin_2024?: number | null
          entry_id?: number | null
          ev_2024?: number | null
          ev_ebitda_2024?: number | null
          fx_assumed_forex_2021?: number | null
          fx_assumed_forex_2022?: number | null
          fx_assumed_forex_2023?: number | null
          fx_assumed_forex_2024?: number | null
          fx_currency?: string | null
          fx_ebitda_above_10_l3y?: string | null
          fx_forex_change_2021_2022?: number | null
          fx_forex_change_2022_2023?: number | null
          fx_forex_change_2023_2024?: number | null
          fx_rationale?: string | null
          fx_revenue_2021?: number | null
          fx_revenue_2022?: number | null
          fx_revenue_2023?: number | null
          fx_revenue_2024?: number | null
          fx_revenue_cagr_domestic_2021_2022?: number | null
          fx_revenue_cagr_domestic_2022_2023?: number | null
          fx_revenue_cagr_domestic_2023_2024?: number | null
          fx_revenue_drop_count?: number | null
          fx_revenue_no_consecutive_drop_local?: string | null
          geography?: string | null
          id?: string
          l0_ebitda_2024_usd_mn?: number | null
          l0_ev_2024_usd_mn?: number | null
          l0_ev_ebitda_2024?: number | null
          l0_ev_usd_mn?: number | null
          l0_revenue_2024_usd_mn?: number | null
          l1_ebitda_below_threshold_count?: number | null
          l1_ev_below_threshold?: string | null
          l1_priority_geo_flag?: string | null
          l1_rationale?: string | null
          l1_revenue_cagr_l3y?: number | null
          l1_revenue_cagr_n3y?: number | null
          l1_revenue_drop_count?: number | null
          l1_revenue_no_consecutive_drop_usd?: string | null
          l1_screening_result?: string | null
          l1_vision_fit?: string | null
          ownership?: string | null
          pct_from_domestic?: number | null
          revenue_2021_usd_mn?: number | null
          revenue_2022_usd_mn?: number | null
          revenue_2023_usd_mn?: number | null
          revenue_2024_usd_mn?: number | null
          revenue_cagr_2021_2022?: number | null
          revenue_cagr_2022_2023?: number | null
          revenue_cagr_2023_2024?: number | null
          revenue_from_priority_geo_flag?: string | null
          segment?: string | null
          segment_ebitda?: number | null
          segment_related_offerings?: string | null
          segment_revenue?: number | null
          segment_revenue_total_ratio?: number | null
          segment_specific_revenue_pct?: number | null
          target?: string | null
          user_id?: string | null
          watchlist_id?: number | null
          watchlist_status?: string | null
          website?: string | null
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
          },
        ]
      }
      criterias: {
        Row: {
          created_at: string | null
          id: string
          name: string
          prompt: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          prompt: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          prompt?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      deal_documents: {
        Row: {
          created_at: string | null
          deal_id: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          stage: string
        }
        Insert: {
          created_at?: string | null
          deal_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          stage: string
        }
        Update: {
          created_at?: string | null
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
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_links: {
        Row: {
          created_at: string | null
          deal_id: string
          id: string
          stage: string
          title: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          deal_id: string
          id?: string
          stage: string
          title?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
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
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_notes: {
        Row: {
          content: string
          created_at: string | null
          deal_id: string
          id: string
          stage: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          deal_id: string
          id?: string
          stage: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          deal_id?: string
          id?: string
          stage?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_notes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_stage_history: {
        Row: {
          created_at: string | null
          deal_id: string
          duration_seconds: number | null
          entered_at: string | null
          exited_at: string | null
          id: string
          stage: string
        }
        Insert: {
          created_at?: string | null
          deal_id: string
          duration_seconds?: number | null
          entered_at?: string | null
          exited_at?: string | null
          id?: string
          stage: string
        }
        Update: {
          created_at?: string | null
          deal_id?: string
          duration_seconds?: number | null
          entered_at?: string | null
          exited_at?: string | null
          id?: string
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_stage_history_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_thesis: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_scan_at: string | null
          next_scan_at: string | null
          scan_frequency: string | null
          sources_count: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_scan_at?: string | null
          next_scan_at?: string | null
          scan_frequency?: string | null
          sources_count?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_scan_at?: string | null
          next_scan_at?: string | null
          scan_frequency?: string | null
          sources_count?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      market_screening_results: {
        Row: {
          company_name: string
          description: string | null
          discovered_at: string | null
          estimated_revenue: string | null
          estimated_valuation: string | null
          id: string
          is_added_to_pipeline: boolean | null
          match_reason: string | null
          match_score: number | null
          sector: string | null
          website: string | null
        }
        Insert: {
          company_name: string
          description?: string | null
          discovered_at?: string | null
          estimated_revenue?: string | null
          estimated_valuation?: string | null
          id?: string
          is_added_to_pipeline?: boolean | null
          match_reason?: string | null
          match_score?: number | null
          sector?: string | null
          website?: string | null
        }
        Update: {
          company_name?: string
          description?: string | null
          discovered_at?: string | null
          estimated_revenue?: string | null
          estimated_valuation?: string | null
          id?: string
          is_added_to_pipeline?: boolean | null
          match_reason?: string | null
          match_score?: number | null
          sector?: string | null
          website?: string | null
        }
        Relationships: []
      }
      past_acquisitions: {
        Row: {
          assumption: string | null
          cagr_2021_2022: string | null
          cagr_2022_2023: string | null
          cagr_2023_2024: string | null
          comments: string | null
          company_website: string | null
          country: string | null
          created_at: string | null
          description: string | null
          details_on_product_fit: string | null
          ebitda_2021_usd_m: string | null
          ebitda_2022_usd_m: string | null
          ebitda_2023_usd_m: string | null
          ebitda_2024_usd_m: string | null
          ebitda_margin_2021: string | null
          ebitda_margin_2022: string | null
          ebitda_margin_2023: string | null
          ebitda_margin_2024: string | null
          ebitda_margin_pct: string | null
          ebitda_over_10pct_l3y: string | null
          ebitda_usd_m: string | null
          equity_value: string | null
          estimated_debt_usd_m: string | null
          ev_100_pct_usd_m: string | null
          ev_2024: string | null
          ev_value_under_1b: string | null
          fcf_conv: string | null
          fit_with_priority_product_groups: string | null
          geography_breakdown_of_revenue: string | null
          id: string
          internal_source: string | null
          internal_stage: string | null
          investment_value: string | null
          l0_date: string | null
          main_products: string | null
          name_of_advisors: string | null
          net_income_usd_m: string | null
          nim_pct: string | null
          no: string | null
          on_hold_reason: string | null
          pass_all_5_l1_criteria: string | null
          pass_l0_screening: string | null
          pct_revenue_from_priority_segments: string | null
          prioritization: string | null
          priority_geography_50pct_revenue: string | null
          project_name: string | null
          project_type: string | null
          reason_to_drop: string | null
          revenue_2021_usd_m: string | null
          revenue_2022_usd_m: string | null
          revenue_2023_usd_m: string | null
          revenue_2024_usd_m: string | null
          revenue_cagr_l3y: string | null
          revenue_drop_count: string | null
          revenue_stability_no_consecutive_drop: string | null
          revenue_usd_m: string | null
          sector: string | null
          seller: string | null
          source: string | null
          stake: string | null
          status: string | null
          target_co_company_type: string | null
          target_co_partner: string | null
          type_of_source: string | null
          updated_at: string | null
          vision_alignment_25pct_revenue: string | null
          willingness_to_sell: string | null
          year: string | null
        }
        Insert: {
          assumption?: string | null
          cagr_2021_2022?: string | null
          cagr_2022_2023?: string | null
          cagr_2023_2024?: string | null
          comments?: string | null
          company_website?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          details_on_product_fit?: string | null
          ebitda_2021_usd_m?: string | null
          ebitda_2022_usd_m?: string | null
          ebitda_2023_usd_m?: string | null
          ebitda_2024_usd_m?: string | null
          ebitda_margin_2021?: string | null
          ebitda_margin_2022?: string | null
          ebitda_margin_2023?: string | null
          ebitda_margin_2024?: string | null
          ebitda_margin_pct?: string | null
          ebitda_over_10pct_l3y?: string | null
          ebitda_usd_m?: string | null
          equity_value?: string | null
          estimated_debt_usd_m?: string | null
          ev_100_pct_usd_m?: string | null
          ev_2024?: string | null
          ev_value_under_1b?: string | null
          fcf_conv?: string | null
          fit_with_priority_product_groups?: string | null
          geography_breakdown_of_revenue?: string | null
          id?: string
          internal_source?: string | null
          internal_stage?: string | null
          investment_value?: string | null
          l0_date?: string | null
          main_products?: string | null
          name_of_advisors?: string | null
          net_income_usd_m?: string | null
          nim_pct?: string | null
          no?: string | null
          on_hold_reason?: string | null
          pass_all_5_l1_criteria?: string | null
          pass_l0_screening?: string | null
          pct_revenue_from_priority_segments?: string | null
          prioritization?: string | null
          priority_geography_50pct_revenue?: string | null
          project_name?: string | null
          project_type?: string | null
          reason_to_drop?: string | null
          revenue_2021_usd_m?: string | null
          revenue_2022_usd_m?: string | null
          revenue_2023_usd_m?: string | null
          revenue_2024_usd_m?: string | null
          revenue_cagr_l3y?: string | null
          revenue_drop_count?: string | null
          revenue_stability_no_consecutive_drop?: string | null
          revenue_usd_m?: string | null
          sector?: string | null
          seller?: string | null
          source?: string | null
          stake?: string | null
          status?: string | null
          target_co_company_type?: string | null
          target_co_partner?: string | null
          type_of_source?: string | null
          updated_at?: string | null
          vision_alignment_25pct_revenue?: string | null
          willingness_to_sell?: string | null
          year?: string | null
        }
        Update: {
          assumption?: string | null
          cagr_2021_2022?: string | null
          cagr_2022_2023?: string | null
          cagr_2023_2024?: string | null
          comments?: string | null
          company_website?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          details_on_product_fit?: string | null
          ebitda_2021_usd_m?: string | null
          ebitda_2022_usd_m?: string | null
          ebitda_2023_usd_m?: string | null
          ebitda_2024_usd_m?: string | null
          ebitda_margin_2021?: string | null
          ebitda_margin_2022?: string | null
          ebitda_margin_2023?: string | null
          ebitda_margin_2024?: string | null
          ebitda_margin_pct?: string | null
          ebitda_over_10pct_l3y?: string | null
          ebitda_usd_m?: string | null
          equity_value?: string | null
          estimated_debt_usd_m?: string | null
          ev_100_pct_usd_m?: string | null
          ev_2024?: string | null
          ev_value_under_1b?: string | null
          fcf_conv?: string | null
          fit_with_priority_product_groups?: string | null
          geography_breakdown_of_revenue?: string | null
          id?: string
          internal_source?: string | null
          internal_stage?: string | null
          investment_value?: string | null
          l0_date?: string | null
          main_products?: string | null
          name_of_advisors?: string | null
          net_income_usd_m?: string | null
          nim_pct?: string | null
          no?: string | null
          on_hold_reason?: string | null
          pass_all_5_l1_criteria?: string | null
          pass_l0_screening?: string | null
          pct_revenue_from_priority_segments?: string | null
          prioritization?: string | null
          priority_geography_50pct_revenue?: string | null
          project_name?: string | null
          project_type?: string | null
          reason_to_drop?: string | null
          revenue_2021_usd_m?: string | null
          revenue_2022_usd_m?: string | null
          revenue_2023_usd_m?: string | null
          revenue_2024_usd_m?: string | null
          revenue_cagr_l3y?: string | null
          revenue_drop_count?: string | null
          revenue_stability_no_consecutive_drop?: string | null
          revenue_usd_m?: string | null
          sector?: string | null
          seller?: string | null
          source?: string | null
          stake?: string | null
          status?: string | null
          target_co_company_type?: string | null
          target_co_partner?: string | null
          type_of_source?: string | null
          updated_at?: string | null
          vision_alignment_25pct_revenue?: string | null
          willingness_to_sell?: string | null
          year?: string | null
        }
        Relationships: []
      }
      screenings: {
        Row: {
          company_id: string
          created_at: string | null
          criteria_id: string
          id: string
          remarks: string | null
          result: string | null
          state: Database["public"]["Enums"]["screening_state"]
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          criteria_id: string
          id?: string
          remarks?: string | null
          result?: string | null
          state?: Database["public"]["Enums"]["screening_state"]
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          criteria_id?: string
          id?: string
          remarks?: string | null
          result?: string | null
          state?: Database["public"]["Enums"]["screening_state"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "screenings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screenings_criteria_id_fkey"
            columns: ["criteria_id"]
            isOneToOne: false
            referencedRelation: "criterias"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          password: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          password: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          password?: string
          updated_at?: string | null
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
      screening_state: "pending" | "completed" | "failed"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      screening_state: ["pending", "completed", "failed"],
    },
  },
} as const
