-- Migration: Add file_date to minutes_of_meeting
-- Created: 2026-01-30

ALTER TABLE minutes_of_meeting 
ADD COLUMN file_date DATE;

-- Add index for date sorting/filtering
CREATE INDEX idx_minutes_of_meeting_file_date ON minutes_of_meeting(file_date);
