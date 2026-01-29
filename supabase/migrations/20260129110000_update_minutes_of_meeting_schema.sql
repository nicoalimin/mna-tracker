-- Migration: Update minutes_of_meeting schema for agent processing
-- Created: 2026-01-29

-- Add new columns for agent processing
ALTER TABLE minutes_of_meeting 
ADD COLUMN tags TEXT[] DEFAULT '{}',
ADD COLUMN processing_status TEXT DEFAULT 'pending',
ADD COLUMN matched_companies JSONB DEFAULT '[]';

-- Add index for tags search
CREATE INDEX idx_minutes_of_meeting_tags ON minutes_of_meeting USING GIN (tags);

-- Add processing_status index
CREATE INDEX idx_minutes_of_meeting_processing_status ON minutes_of_meeting(processing_status);

-- Add notes column to past_acquisitions if it doesn't exist
-- Using a check to avoid errors if it already exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='past_acquisitions' AND column_name='notes') THEN
        ALTER TABLE past_acquisitions ADD COLUMN notes TEXT;
    END IF;
END $$;
