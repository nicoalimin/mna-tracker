-- Migration: Create market_screening_results table
-- Created: 2026-01-23

-- Create market_screening_results table
CREATE TABLE market_screening_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  sector TEXT,
  description TEXT,
  match_score NUMERIC,
  match_reason TEXT,
  website TEXT,
  estimated_revenue TEXT,
  estimated_valuation TEXT,
  is_added_to_pipeline BOOLEAN DEFAULT FALSE,
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_market_screening_results_is_added_to_pipeline ON market_screening_results(is_added_to_pipeline);
CREATE INDEX idx_market_screening_results_match_score ON market_screening_results(match_score);
CREATE INDEX idx_market_screening_results_discovered_at ON market_screening_results(discovered_at);
CREATE INDEX idx_market_screening_results_company_name ON market_screening_results(company_name);

-- Enable Row Level Security
ALTER TABLE market_screening_results ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (Allow all for now - adjust as needed)
CREATE POLICY "Allow read access on market_screening_results" ON market_screening_results FOR SELECT USING (true);
CREATE POLICY "Allow insert access on market_screening_results" ON market_screening_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access on market_screening_results" ON market_screening_results FOR UPDATE USING (true);
CREATE POLICY "Allow delete access on market_screening_results" ON market_screening_results FOR DELETE USING (true);