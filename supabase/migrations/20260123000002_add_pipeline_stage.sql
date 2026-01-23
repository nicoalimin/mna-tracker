-- Migration: Add pipeline_stage column to companies table
-- Created: 2026-01-23

-- Add pipeline_stage column to companies table
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'L0';

-- Create index for pipeline_stage
CREATE INDEX IF NOT EXISTS idx_companies_pipeline_stage ON companies(pipeline_stage);

-- Add comment for the column
COMMENT ON COLUMN companies.pipeline_stage IS 'Current stage in the M&A pipeline (L0, L1, L2, L3, L4, L5)';
