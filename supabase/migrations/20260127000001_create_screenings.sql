-- Migration: Create screenings table
-- Created: 2026-01-27

-- Create enum type for screening state
CREATE TYPE screening_state AS ENUM ('pending', 'completed', 'failed');

-- Create screenings table
CREATE TABLE screenings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  criteria_id UUID NOT NULL REFERENCES criterias(id) ON DELETE CASCADE,
  state screening_state NOT NULL DEFAULT 'pending',
  result TEXT,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, criteria_id)
);

-- Create indexes for screenings
CREATE INDEX idx_screenings_company_id ON screenings(company_id);
CREATE INDEX idx_screenings_criteria_id ON screenings(criteria_id);
CREATE INDEX idx_screenings_state ON screenings(state);
CREATE INDEX idx_screenings_created_at ON screenings(created_at);

-- Enable Row Level Security
ALTER TABLE screenings ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Allow read access on screenings" ON screenings FOR SELECT USING (true);
CREATE POLICY "Allow insert access on screenings" ON screenings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access on screenings" ON screenings FOR UPDATE USING (true);
CREATE POLICY "Allow delete access on screenings" ON screenings FOR DELETE USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_screenings_updated_at
  BEFORE UPDATE ON screenings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
