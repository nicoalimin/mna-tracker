-- Migration: Update company_logs to mirror companies schema for state tracking
-- Created: 2026-01-23

-- Add all columns from companies table to company_logs
ALTER TABLE company_logs
  -- Details Section
  ADD COLUMN entry_id INTEGER,
  ADD COLUMN watchlist_id INTEGER,
  ADD COLUMN segment TEXT,
  ADD COLUMN target TEXT,
  ADD COLUMN segment_related_offerings TEXT,
  ADD COLUMN company_focus TEXT,
  ADD COLUMN website TEXT,
  ADD COLUMN watchlist_status TEXT,
  ADD COLUMN comments TEXT,
  ADD COLUMN ownership TEXT,
  ADD COLUMN geography TEXT,
  
  -- Revenue Section (USD Mn)
  ADD COLUMN revenue_2021_usd_mn NUMERIC,
  ADD COLUMN revenue_2022_usd_mn NUMERIC,
  ADD COLUMN revenue_2023_usd_mn NUMERIC,
  ADD COLUMN revenue_2024_usd_mn NUMERIC,
  
  -- EBITDA Section (USD Mn)
  ADD COLUMN ebitda_2021_usd_mn NUMERIC,
  ADD COLUMN ebitda_2022_usd_mn NUMERIC,
  ADD COLUMN ebitda_2023_usd_mn NUMERIC,
  ADD COLUMN ebitda_2024_usd_mn NUMERIC,
  
  -- EV Section
  ADD COLUMN ev_2024 NUMERIC,
  
  -- Revenue CAGR
  ADD COLUMN revenue_cagr_2021_2022 NUMERIC,
  ADD COLUMN revenue_cagr_2022_2023 NUMERIC,
  ADD COLUMN revenue_cagr_2023_2024 NUMERIC,
  
  -- EBITDA Margin
  ADD COLUMN ebitda_margin_2021 NUMERIC,
  ADD COLUMN ebitda_margin_2022 NUMERIC,
  ADD COLUMN ebitda_margin_2023 NUMERIC,
  ADD COLUMN ebitda_margin_2024 NUMERIC,
  
  -- EV/EBITDA
  ADD COLUMN ev_ebitda_2024 NUMERIC,
  
  -- Segment Details
  ADD COLUMN segment_revenue NUMERIC,
  ADD COLUMN segment_ebitda NUMERIC,
  ADD COLUMN segment_revenue_total_ratio NUMERIC,
  
  -- L0 Screening Details
  ADD COLUMN l0_ebitda_2024_usd_mn NUMERIC,
  ADD COLUMN l0_ev_2024_usd_mn NUMERIC,
  ADD COLUMN l0_revenue_2024_usd_mn NUMERIC,
  ADD COLUMN l0_ev_ebitda_2024 NUMERIC,
  ADD COLUMN segment_specific_revenue_pct NUMERIC,
  ADD COLUMN combined_segment_revenue TEXT,
  ADD COLUMN revenue_from_priority_geo_flag TEXT,
  ADD COLUMN pct_from_domestic NUMERIC,
  ADD COLUMN l0_ev_usd_mn NUMERIC,
  
  -- L1 Analysis
  ADD COLUMN l1_revenue_cagr_l3y NUMERIC,
  ADD COLUMN l1_revenue_drop_count INTEGER,
  ADD COLUMN l1_ebitda_below_threshold_count INTEGER,
  ADD COLUMN l1_revenue_cagr_n3y NUMERIC,
  ADD COLUMN l1_vision_fit TEXT,
  ADD COLUMN l1_priority_geo_flag TEXT,
  ADD COLUMN l1_ev_below_threshold TEXT,
  
  -- L1 Screening
  ADD COLUMN l1_rationale TEXT,
  ADD COLUMN l1_revenue_no_consecutive_drop_usd TEXT,
  
  -- FX Adjustment Section
  ADD COLUMN fx_revenue_2021 NUMERIC,
  ADD COLUMN fx_revenue_2022 NUMERIC,
  ADD COLUMN fx_revenue_2023 NUMERIC,
  ADD COLUMN fx_revenue_2024 NUMERIC,
  ADD COLUMN fx_currency TEXT,
  ADD COLUMN fx_assumed_forex_2021 NUMERIC,
  ADD COLUMN fx_assumed_forex_2022 NUMERIC,
  ADD COLUMN fx_assumed_forex_2023 NUMERIC,
  ADD COLUMN fx_assumed_forex_2024 NUMERIC,
  ADD COLUMN fx_forex_change_2021_2022 NUMERIC,
  ADD COLUMN fx_forex_change_2022_2023 NUMERIC,
  ADD COLUMN fx_forex_change_2023_2024 NUMERIC,
  ADD COLUMN fx_revenue_cagr_domestic_2021_2022 NUMERIC,
  ADD COLUMN fx_revenue_cagr_domestic_2022_2023 NUMERIC,
  ADD COLUMN fx_revenue_cagr_domestic_2023_2024 NUMERIC,
  ADD COLUMN fx_revenue_drop_count INTEGER,
  ADD COLUMN fx_revenue_no_consecutive_drop_local TEXT,
  ADD COLUMN fx_rationale TEXT,
  ADD COLUMN fx_ebitda_above_10_l3y TEXT,
  ADD COLUMN l1_screening_result TEXT;

-- Drop the details JSONB column since data is now in structured columns
ALTER TABLE company_logs DROP COLUMN IF EXISTS details;

-- Add indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS idx_company_logs_entry_id ON company_logs(entry_id);
CREATE INDEX IF NOT EXISTS idx_company_logs_segment ON company_logs(segment);
CREATE INDEX IF NOT EXISTS idx_company_logs_watchlist_status ON company_logs(watchlist_status);
CREATE INDEX IF NOT EXISTS idx_company_logs_created_at ON company_logs(created_at);
