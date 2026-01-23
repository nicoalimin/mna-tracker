-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Enum for Pipeline Stages (Safe fallback if exists)
DO $$ BEGIN
    CREATE TYPE pipeline_stage AS ENUM ('L0', 'L1', 'L2', 'L3', 'L4', 'L5');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Companies Table
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  sector TEXT,
  source TEXT,
  status pipeline_stage DEFAULT 'L0',
  revenue_y1 NUMERIC,
  revenue_y2 NUMERIC,
  revenue_y3 NUMERIC,
  trend TEXT,
  ebitda_y1 NUMERIC,
  ebitda_y2 NUMERIC,
  ebitda_y3 NUMERIC,
  valuation NUMERIC,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Filters Table
CREATE TABLE IF NOT EXISTS filters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE filters ENABLE ROW LEVEL SECURITY;

-- Create Policies (Drop first to avoid conflicts if rerunning)
DROP POLICY IF EXISTS "Allow anonymous read access" ON companies;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON companies;
DROP POLICY IF EXISTS "Allow anonymous update access" ON companies;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON companies;

DROP POLICY IF EXISTS "Allow anonymous read access" ON filters;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON filters;
DROP POLICY IF EXISTS "Allow anonymous update access" ON filters;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON filters;

CREATE POLICY "Allow anonymous read access" ON companies FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON companies FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON companies FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON filters FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON filters FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON filters FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON filters FOR DELETE USING (true);
