// ============================================
// User Types
// ============================================
export interface User {
  id: string;
  name: string;
  password: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// Company Types
// ============================================
export interface Company {
  id: string;
  
  // Details Section
  entry_id: number | null;
  watchlist_id: number | null;
  segment: string | null;
  target: string | null;
  segment_related_offerings: string | null;
  company_focus: string | null;
  website: string | null;
  watchlist_status: string | null;
  comments: string | null;
  ownership: string | null;
  geography: string | null;
  
  // Revenue Section (USD Mn)
  revenue_2021_usd_mn: number | null;
  revenue_2022_usd_mn: number | null;
  revenue_2023_usd_mn: number | null;
  revenue_2024_usd_mn: number | null;
  
  // EBITDA Section (USD Mn)
  ebitda_2021_usd_mn: number | null;
  ebitda_2022_usd_mn: number | null;
  ebitda_2023_usd_mn: number | null;
  ebitda_2024_usd_mn: number | null;
  
  // EV Section
  ev_2024: number | null;
  
  // Revenue CAGR
  revenue_cagr_2021_2022: number | null;
  revenue_cagr_2022_2023: number | null;
  revenue_cagr_2023_2024: number | null;
  
  // EBITDA Margin
  ebitda_margin_2021: number | null;
  ebitda_margin_2022: number | null;
  ebitda_margin_2023: number | null;
  ebitda_margin_2024: number | null;
  
  // EV/EBITDA
  ev_ebitda_2024: number | null;
  
  // Segment Details
  segment_revenue: number | null;
  segment_ebitda: number | null;
  segment_revenue_total_ratio: number | null;
  
  // L0 Screening Details
  l0_ebitda_2024_usd_mn: number | null;
  l0_ev_2024_usd_mn: number | null;
  l0_revenue_2024_usd_mn: number | null;
  l0_ev_ebitda_2024: number | null;
  segment_specific_revenue_pct: number | null;
  combined_segment_revenue: string | null;
  revenue_from_priority_geo_flag: string | null;
  pct_from_domestic: number | null;
  l0_ev_usd_mn: number | null;
  
  // L1 Analysis
  l1_revenue_cagr_l3y: number | null;
  l1_revenue_drop_count: number | null;
  l1_ebitda_below_threshold_count: number | null;
  l1_revenue_cagr_n3y: number | null;
  l1_vision_fit: string | null;
  l1_priority_geo_flag: string | null;
  l1_ev_below_threshold: string | null;
  
  // L1 Screening
  l1_rationale: string | null;
  l1_revenue_no_consecutive_drop_usd: string | null;
  
  // FX Adjustment Section
  fx_revenue_2021: number | null;
  fx_revenue_2022: number | null;
  fx_revenue_2023: number | null;
  fx_revenue_2024: number | null;
  fx_currency: string | null;
  fx_assumed_forex_2021: number | null;
  fx_assumed_forex_2022: number | null;
  fx_assumed_forex_2023: number | null;
  fx_assumed_forex_2024: number | null;
  fx_forex_change_2021_2022: number | null;
  fx_forex_change_2022_2023: number | null;
  fx_forex_change_2023_2024: number | null;
  fx_revenue_cagr_domestic_2021_2022: number | null;
  fx_revenue_cagr_domestic_2022_2023: number | null;
  fx_revenue_cagr_domestic_2023_2024: number | null;
  fx_revenue_drop_count: number | null;
  fx_revenue_no_consecutive_drop_local: string | null;
  fx_rationale: string | null;
  fx_ebitda_above_10_l3y: string | null;
  l1_screening_result: string | null;
  
  // Metadata
  created_at: string;
  updated_at: string;
  
  // Relations
  criterias?: CompanyCriteria[];
}

// ============================================
// Company Log Types
// ============================================
export interface CompanyLog {
  id: string;
  company_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  user_id: string | null;
  created_at: string;
  // Relations
  company?: Company;
  user?: User;
}

// ============================================
// Criteria Types
// ============================================
export interface Criteria {
  id: string;
  name: string;
  prompt: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// Company Criteria Types (Many-to-Many Junction)
// ============================================
export interface CompanyCriteria {
  id: string;
  company_id: string;
  criteria_id: string;
  result: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  company?: Company;
  criteria?: Criteria;
}

// ============================================
// Watchlist Status Enum
// ============================================
export type WatchlistStatus = 'Active' | 'Inactive' | 'Pending' | 'Removed';

// ============================================
// Company Insert/Update Types
// ============================================
export interface CompanyInsert {
  // Details Section
  entry_id?: number | null;
  watchlist_id?: number | null;
  segment?: string | null;
  target?: string | null;
  segment_related_offerings?: string | null;
  company_focus?: string | null;
  website?: string | null;
  watchlist_status?: string | null;
  comments?: string | null;
  ownership?: string | null;
  geography?: string | null;
  
  // Revenue Section (USD Mn)
  revenue_2021_usd_mn?: number | null;
  revenue_2022_usd_mn?: number | null;
  revenue_2023_usd_mn?: number | null;
  revenue_2024_usd_mn?: number | null;
  
  // EBITDA Section (USD Mn)
  ebitda_2021_usd_mn?: number | null;
  ebitda_2022_usd_mn?: number | null;
  ebitda_2023_usd_mn?: number | null;
  ebitda_2024_usd_mn?: number | null;
  
  // EV Section
  ev_2024?: number | null;
  
  // Revenue CAGR
  revenue_cagr_2021_2022?: number | null;
  revenue_cagr_2022_2023?: number | null;
  revenue_cagr_2023_2024?: number | null;
  
  // EBITDA Margin
  ebitda_margin_2021?: number | null;
  ebitda_margin_2022?: number | null;
  ebitda_margin_2023?: number | null;
  ebitda_margin_2024?: number | null;
  
  // EV/EBITDA
  ev_ebitda_2024?: number | null;
  
  // Segment Details
  segment_revenue?: number | null;
  segment_ebitda?: number | null;
  segment_revenue_total_ratio?: number | null;
  
  // L0 Screening Details
  l0_ebitda_2024_usd_mn?: number | null;
  l0_ev_2024_usd_mn?: number | null;
  l0_revenue_2024_usd_mn?: number | null;
  l0_ev_ebitda_2024?: number | null;
  segment_specific_revenue_pct?: number | null;
  combined_segment_revenue?: string | null;
  revenue_from_priority_geo_flag?: string | null;
  pct_from_domestic?: number | null;
  l0_ev_usd_mn?: number | null;
  
  // L1 Analysis
  l1_revenue_cagr_l3y?: number | null;
  l1_revenue_drop_count?: number | null;
  l1_ebitda_below_threshold_count?: number | null;
  l1_revenue_cagr_n3y?: number | null;
  l1_vision_fit?: string | null;
  l1_priority_geo_flag?: string | null;
  l1_ev_below_threshold?: string | null;
  
  // L1 Screening
  l1_rationale?: string | null;
  l1_revenue_no_consecutive_drop_usd?: string | null;
  
  // FX Adjustment Section
  fx_revenue_2021?: number | null;
  fx_revenue_2022?: number | null;
  fx_revenue_2023?: number | null;
  fx_revenue_2024?: number | null;
  fx_currency?: string | null;
  fx_assumed_forex_2021?: number | null;
  fx_assumed_forex_2022?: number | null;
  fx_assumed_forex_2023?: number | null;
  fx_assumed_forex_2024?: number | null;
  fx_forex_change_2021_2022?: number | null;
  fx_forex_change_2022_2023?: number | null;
  fx_forex_change_2023_2024?: number | null;
  fx_revenue_cagr_domestic_2021_2022?: number | null;
  fx_revenue_cagr_domestic_2022_2023?: number | null;
  fx_revenue_cagr_domestic_2023_2024?: number | null;
  fx_revenue_drop_count?: number | null;
  fx_revenue_no_consecutive_drop_local?: string | null;
  fx_rationale?: string | null;
  fx_ebitda_above_10_l3y?: string | null;
  l1_screening_result?: string | null;
}

export interface CriteriaInsert {
  name: string;
  prompt: string;
}

export interface CompanyCriteriaInsert {
  company_id: string;
  criteria_id: string;
  result?: string | null;
}
