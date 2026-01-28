-- Migration: Create inven_cache table
-- Created: 2026-01-29
-- Description: Cache table for Inven API data with all companies columns plus Inven-specific fields

-- ============================================
-- Create Inven Cache Table
-- ============================================
CREATE TABLE inven_cache (
  -- Primary Key: Inven Company ID
  inven_company_id TEXT PRIMARY KEY,
  
  -- Inven-specific identifiers
  domain TEXT,
  inven_company_name TEXT,
  website TEXT,
  linkedin TEXT,
  description TEXT,
  logo_url TEXT,
  
  -- Inven headcount data
  headcount_min INTEGER,
  headcount_max INTEGER,
  employee_count INTEGER,
  
  -- Inven financial estimates
  revenue_estimate_usd_millions NUMERIC,
  
  -- Inven company info
  ownership TEXT,
  founded_year INTEGER,
  headquarters_city TEXT,
  headquarters_state TEXT,
  headquarters_country_code TEXT,
  
  -- Mirror of companies table columns for enriched data
  -- Core identifiers (nullable since we may not always have matches)
  id UUID DEFAULT gen_random_uuid(),
  entry_id INTEGER,
  watchlist_id INTEGER,
  
  -- Basic info
  target TEXT,
  segment TEXT,
  segment_related_offerings TEXT,
  company_focus TEXT,
  watchlist_status TEXT,
  pipeline_stage TEXT,
  comments TEXT,
  geography TEXT,
  
  -- Revenue (USD Mn)
  revenue_2021_usd_mn NUMERIC,
  revenue_2022_usd_mn NUMERIC,
  revenue_2023_usd_mn NUMERIC,
  revenue_2024_usd_mn NUMERIC,
  
  -- EBITDA (USD Mn)
  ebitda_2021_usd_mn NUMERIC,
  ebitda_2022_usd_mn NUMERIC,
  ebitda_2023_usd_mn NUMERIC,
  ebitda_2024_usd_mn NUMERIC,
  
  -- EV Section
  ev_2024 NUMERIC,
  
  -- Revenue CAGR
  revenue_cagr_2021_2022 NUMERIC,
  revenue_cagr_2022_2023 NUMERIC,
  revenue_cagr_2023_2024 NUMERIC,
  
  -- EBITDA Margin
  ebitda_margin_2021 NUMERIC,
  ebitda_margin_2022 NUMERIC,
  ebitda_margin_2023 NUMERIC,
  ebitda_margin_2024 NUMERIC,
  
  -- EV/EBITDA
  ev_ebitda_2024 NUMERIC,
  
  -- Segment Details
  segment_revenue NUMERIC,
  segment_ebitda NUMERIC,
  segment_revenue_total_ratio NUMERIC,
  
  -- L0 Screening Details
  l0_ebitda_2024_usd_mn NUMERIC,
  l0_ev_2024_usd_mn NUMERIC,
  l0_revenue_2024_usd_mn NUMERIC,
  l0_ev_ebitda_2024 NUMERIC,
  segment_specific_revenue_pct NUMERIC,
  combined_segment_revenue TEXT,
  revenue_from_priority_geo_flag TEXT,
  pct_from_domestic NUMERIC,
  l0_ev_usd_mn NUMERIC,
  
  -- L1 Analysis
  l1_revenue_cagr_l3y NUMERIC,
  l1_revenue_drop_count INTEGER,
  l1_ebitda_below_threshold_count INTEGER,
  l1_revenue_cagr_n3y NUMERIC,
  l1_vision_fit TEXT,
  l1_priority_geo_flag TEXT,
  l1_ev_below_threshold TEXT,
  
  -- L1 Screening
  l1_rationale TEXT,
  l1_revenue_no_consecutive_drop_usd TEXT,
  
  -- FX Adjustment Section
  fx_revenue_2021 NUMERIC,
  fx_revenue_2022 NUMERIC,
  fx_revenue_2023 NUMERIC,
  fx_revenue_2024 NUMERIC,
  fx_currency TEXT,
  fx_assumed_forex_2021 NUMERIC,
  fx_assumed_forex_2022 NUMERIC,
  fx_assumed_forex_2023 NUMERIC,
  fx_assumed_forex_2024 NUMERIC,
  fx_forex_change_2021_2022 NUMERIC,
  fx_forex_change_2022_2023 NUMERIC,
  fx_forex_change_2023_2024 NUMERIC,
  fx_revenue_cagr_domestic_2021_2022 NUMERIC,
  fx_revenue_cagr_domestic_2022_2023 NUMERIC,
  fx_revenue_cagr_domestic_2023_2024 NUMERIC,
  fx_revenue_drop_count INTEGER,
  fx_revenue_no_consecutive_drop_local TEXT,
  fx_rationale TEXT,
  fx_ebitda_above_10_l3y TEXT,
  l1_screening_result TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Create Indexes for Performance
-- ============================================
CREATE INDEX idx_inven_cache_domain ON inven_cache(domain);
CREATE INDEX idx_inven_cache_inven_company_name ON inven_cache(inven_company_name);
CREATE INDEX idx_inven_cache_target ON inven_cache(target);
CREATE INDEX idx_inven_cache_segment ON inven_cache(segment);
CREATE INDEX idx_inven_cache_geography ON inven_cache(geography);

-- ============================================
-- Apply Updated At Trigger
-- ============================================
CREATE TRIGGER update_inven_cache_updated_at
  BEFORE UPDATE ON inven_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE inven_cache ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Create RLS Policies
-- ============================================
CREATE POLICY "Allow read access on inven_cache" ON inven_cache FOR SELECT USING (true);
CREATE POLICY "Allow insert access on inven_cache" ON inven_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access on inven_cache" ON inven_cache FOR UPDATE USING (true);
CREATE POLICY "Allow delete access on inven_cache" ON inven_cache FOR DELETE USING (true);
