-- Migration: Create investment_thesis table
-- Created: 2026-01-23

-- Create investment_thesis table
CREATE TABLE investment_thesis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  scan_frequency TEXT DEFAULT 'weekly',
  last_scan_at TIMESTAMP WITH TIME ZONE,
  next_scan_at TIMESTAMP WITH TIME ZONE,
  sources_count INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_investment_thesis_is_active ON investment_thesis(is_active);
CREATE INDEX idx_investment_thesis_next_scan_at ON investment_thesis(next_scan_at);

-- Enable Row Level Security
ALTER TABLE investment_thesis ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (Allow all for now - adjust as needed)
CREATE POLICY "Allow read access on investment_thesis" ON investment_thesis FOR SELECT USING (true);
CREATE POLICY "Allow insert access on investment_thesis" ON investment_thesis FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access on investment_thesis" ON investment_thesis FOR UPDATE USING (true);
CREATE POLICY "Allow delete access on investment_thesis" ON investment_thesis FOR DELETE USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_investment_thesis_updated_at
  BEFORE UPDATE ON investment_thesis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();