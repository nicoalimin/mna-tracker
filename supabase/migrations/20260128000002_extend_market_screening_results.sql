-- Migration: Extend market_screening_results with all companies schema columns
-- Created: 2026-01-28
-- Purpose: Add all companiesSchema fields to capture comprehensive data from web search during market screening

-- Add new columns to market_screening_results (matching companiesSchema)
ALTER TABLE market_screening_results
  ADD COLUMN IF NOT EXISTS segment TEXT,
  ADD COLUMN IF NOT EXISTS target TEXT,
  ADD COLUMN IF NOT EXISTS segment_related_offerings TEXT,
  ADD COLUMN IF NOT EXISTS company_focus TEXT,
  ADD COLUMN IF NOT EXISTS ownership TEXT,
  ADD COLUMN IF NOT EXISTS geography TEXT,
  -- Revenue (USD Mn)
  ADD COLUMN IF NOT EXISTS revenue_2021_usd_mn NUMERIC,
  ADD COLUMN IF NOT EXISTS revenue_2022_usd_mn NUMERIC,
  ADD COLUMN IF NOT EXISTS revenue_2023_usd_mn NUMERIC,
  ADD COLUMN IF NOT EXISTS revenue_2024_usd_mn NUMERIC,
  -- EBITDA (USD Mn)
  ADD COLUMN IF NOT EXISTS ebitda_2021_usd_mn NUMERIC,
  ADD COLUMN IF NOT EXISTS ebitda_2022_usd_mn NUMERIC,
  ADD COLUMN IF NOT EXISTS ebitda_2023_usd_mn NUMERIC,
  ADD COLUMN IF NOT EXISTS ebitda_2024_usd_mn NUMERIC,
  -- Valuation
  ADD COLUMN IF NOT EXISTS ev_2024 NUMERIC,
  ADD COLUMN IF NOT EXISTS ev_ebitda_2024 NUMERIC,
  -- Growth metrics
  ADD COLUMN IF NOT EXISTS revenue_cagr_2021_2022 NUMERIC,
  ADD COLUMN IF NOT EXISTS revenue_cagr_2022_2023 NUMERIC,
  ADD COLUMN IF NOT EXISTS revenue_cagr_2023_2024 NUMERIC,
  -- Margins
  ADD COLUMN IF NOT EXISTS ebitda_margin_2021 NUMERIC,
  ADD COLUMN IF NOT EXISTS ebitda_margin_2022 NUMERIC,
  ADD COLUMN IF NOT EXISTS ebitda_margin_2023 NUMERIC,
  ADD COLUMN IF NOT EXISTS ebitda_margin_2024 NUMERIC;

-- Create indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS idx_market_screening_results_geography ON market_screening_results(geography);
CREATE INDEX IF NOT EXISTS idx_market_screening_results_ownership ON market_screening_results(ownership);
CREATE INDEX IF NOT EXISTS idx_market_screening_results_revenue_2024 ON market_screening_results(revenue_2024_usd_mn);
CREATE INDEX IF NOT EXISTS idx_market_screening_results_ev_2024 ON market_screening_results(ev_2024);
