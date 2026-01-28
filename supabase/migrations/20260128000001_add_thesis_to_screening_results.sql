-- Migration: Add thesis_content to market_screening_results
-- Created: 2026-01-28

-- Add thesis_content column to store the thesis used when discovering companies
ALTER TABLE market_screening_results ADD COLUMN IF NOT EXISTS thesis_content TEXT;
