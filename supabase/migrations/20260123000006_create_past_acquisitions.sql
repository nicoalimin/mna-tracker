-- Migration: Create past_acquisitions table
-- Created: 2026-01-23

-- Create past_acquisitions table
CREATE TABLE past_acquisitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  no TEXT,
  project_name TEXT,
  project_type TEXT,
  description TEXT,
  target_co_partner TEXT,
  seller TEXT,
  target_co_company_type TEXT,
  prioritization TEXT,
  source TEXT,
  type_of_source TEXT,
  country TEXT,
  sector TEXT,
  ev_100_pct_usd_m TEXT,
  equity_value TEXT,
  estimated_debt_usd_m TEXT,
  fcf_conv TEXT,
  investment_value TEXT,
  stake TEXT,
  revenue_usd_m TEXT,
  ebitda_usd_m TEXT,
  net_income_usd_m TEXT,
  ebitda_margin_pct TEXT,
  nim_pct TEXT,
  internal_stage TEXT,
  status TEXT,
  internal_source TEXT,
  name_of_advisors TEXT,
  year TEXT,
  l0_date TEXT,
  reason_to_drop TEXT,
  on_hold_reason TEXT,
  pass_l0_screening TEXT,
  main_products TEXT,
  company_website TEXT,
  fit_with_priority_product_groups TEXT,
  details_on_product_fit TEXT,
  comments TEXT,
  revenue_2021_usd_m TEXT,
  revenue_2022_usd_m TEXT,
  revenue_2023_usd_m TEXT,
  revenue_2024_usd_m TEXT,
  ebitda_2021_usd_m TEXT,
  ebitda_2022_usd_m TEXT,
  ebitda_2023_usd_m TEXT,
  ebitda_2024_usd_m TEXT,
  ev_2024 TEXT,
  pct_revenue_from_priority_segments TEXT,
  geography_breakdown_of_revenue TEXT,
  cagr_2021_2022 TEXT,
  cagr_2022_2023 TEXT,
  cagr_2023_2024 TEXT,
  ebitda_margin_2021 TEXT,
  ebitda_margin_2022 TEXT,
  ebitda_margin_2023 TEXT,
  ebitda_margin_2024 TEXT,
  revenue_cagr_l3y TEXT,
  revenue_drop_count TEXT,
  assumption TEXT,
  vision_alignment_25pct_revenue TEXT,
  priority_geography_50pct_revenue TEXT,
  ev_value_under_1b TEXT,
  revenue_stability_no_consecutive_drop TEXT,
  ebitda_over_10pct_l3y TEXT,
  pass_all_5_l1_criteria TEXT,
  willingness_to_sell TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_past_acquisitions_project_name ON past_acquisitions(project_name);
CREATE INDEX idx_past_acquisitions_status ON past_acquisitions(status);
CREATE INDEX idx_past_acquisitions_country ON past_acquisitions(country);
CREATE INDEX idx_past_acquisitions_sector ON past_acquisitions(sector);
CREATE INDEX idx_past_acquisitions_year ON past_acquisitions(year);
CREATE INDEX idx_past_acquisitions_internal_stage ON past_acquisitions(internal_stage);

-- Enable Row Level Security
ALTER TABLE past_acquisitions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (Allow all for now - adjust as needed)
CREATE POLICY "Allow read access on past_acquisitions" ON past_acquisitions FOR SELECT USING (true);
CREATE POLICY "Allow insert access on past_acquisitions" ON past_acquisitions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access on past_acquisitions" ON past_acquisitions FOR UPDATE USING (true);
CREATE POLICY "Allow delete access on past_acquisitions" ON past_acquisitions FOR DELETE USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_past_acquisitions_updated_at
  BEFORE UPDATE ON past_acquisitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
