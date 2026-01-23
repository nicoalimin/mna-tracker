-- Migration: New schema for MNA Tracker
-- Created: 2026-01-23

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables (in correct order due to foreign key constraints)
DROP TABLE IF EXISTS market_screening_results CASCADE;
DROP TABLE IF EXISTS investment_thesis CASCADE;
DROP TABLE IF EXISTS deal_stage_history CASCADE;
DROP TABLE IF EXISTS deal_notes CASCADE;
DROP TABLE IF EXISTS deal_links CASCADE;
DROP TABLE IF EXISTS deal_documents CASCADE;
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS filters CASCADE;
DROP TABLE IF EXISTS ai_chat_history CASCADE;
DROP TABLE IF EXISTS company_criterias CASCADE;
DROP TABLE IF EXISTS criterias CASCADE;
DROP TABLE IF EXISTS company_logs CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS pipeline_stage CASCADE;

-- ============================================
-- Create Users Table
-- ============================================
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Create Companies Table
-- ============================================
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Details Section
  entry_id INTEGER,
  watchlist_id INTEGER,
  segment TEXT,
  target TEXT,
  segment_related_offerings TEXT,
  company_focus TEXT,
  website TEXT,
  watchlist_status TEXT,
  comments TEXT,
  ownership TEXT,
  geography TEXT,
  
  -- Revenue Section (USD Mn)
  revenue_2021_usd_mn NUMERIC,
  revenue_2022_usd_mn NUMERIC,
  revenue_2023_usd_mn NUMERIC,
  revenue_2024_usd_mn NUMERIC,
  
  -- EBITDA Section (USD Mn)
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
-- Create Company Logs Table
-- ============================================
CREATE TABLE company_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Create Criterias Table
-- ============================================
CREATE TABLE criterias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Create Company Criterias Table (Many-to-Many Junction)
-- ============================================
CREATE TABLE company_criterias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  criteria_id UUID NOT NULL REFERENCES criterias(id) ON DELETE CASCADE,
  result TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, criteria_id)
);

-- ============================================
-- Create Indexes for Performance
-- ============================================
CREATE INDEX idx_companies_entry_id ON companies(entry_id);
CREATE INDEX idx_companies_watchlist_id ON companies(watchlist_id);
CREATE INDEX idx_companies_segment ON companies(segment);
CREATE INDEX idx_companies_target ON companies(target);
CREATE INDEX idx_companies_watchlist_status ON companies(watchlist_status);
CREATE INDEX idx_companies_ownership ON companies(ownership);
CREATE INDEX idx_companies_geography ON companies(geography);
CREATE INDEX idx_companies_l1_screening_result ON companies(l1_screening_result);
CREATE INDEX idx_company_logs_company_id ON company_logs(company_id);
CREATE INDEX idx_company_logs_user_id ON company_logs(user_id);
CREATE INDEX idx_company_criterias_company_id ON company_criterias(company_id);
CREATE INDEX idx_company_criterias_criteria_id ON company_criterias(criteria_id);

-- ============================================
-- Create Updated At Trigger Function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- Apply Updated At Triggers
-- ============================================
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_criterias_updated_at
  BEFORE UPDATE ON criterias
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_criterias_updated_at
  BEFORE UPDATE ON company_criterias
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE criterias ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_criterias ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Create RLS Policies (Allow all for now - adjust as needed)
-- ============================================

-- Users policies
CREATE POLICY "Allow read access on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow insert access on users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access on users" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow delete access on users" ON users FOR DELETE USING (true);

-- Companies policies
CREATE POLICY "Allow read access on companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Allow insert access on companies" ON companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access on companies" ON companies FOR UPDATE USING (true);
CREATE POLICY "Allow delete access on companies" ON companies FOR DELETE USING (true);

-- Company Logs policies
CREATE POLICY "Allow read access on company_logs" ON company_logs FOR SELECT USING (true);
CREATE POLICY "Allow insert access on company_logs" ON company_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access on company_logs" ON company_logs FOR UPDATE USING (true);
CREATE POLICY "Allow delete access on company_logs" ON company_logs FOR DELETE USING (true);

-- Criterias policies
CREATE POLICY "Allow read access on criterias" ON criterias FOR SELECT USING (true);
CREATE POLICY "Allow insert access on criterias" ON criterias FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access on criterias" ON criterias FOR UPDATE USING (true);
CREATE POLICY "Allow delete access on criterias" ON criterias FOR DELETE USING (true);

-- Company Criterias policies
CREATE POLICY "Allow read access on company_criterias" ON company_criterias FOR SELECT USING (true);
CREATE POLICY "Allow insert access on company_criterias" ON company_criterias FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access on company_criterias" ON company_criterias FOR UPDATE USING (true);
CREATE POLICY "Allow delete access on company_criterias" ON company_criterias FOR DELETE USING (true);
