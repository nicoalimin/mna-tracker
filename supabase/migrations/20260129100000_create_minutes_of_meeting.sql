-- Migration: Create minutes_of_meeting table
-- Created: 2026-01-29

-- ============================================
-- Create Minutes of Meeting Table
-- ============================================
CREATE TABLE minutes_of_meeting (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- File information
  file_name TEXT NOT NULL,
  file_link TEXT NOT NULL,  -- S3 object key
  
  -- Notes content
  raw_notes TEXT,
  structured_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Create Indexes for Performance
-- ============================================
CREATE INDEX idx_minutes_of_meeting_created_at ON minutes_of_meeting(created_at);
CREATE INDEX idx_minutes_of_meeting_file_name ON minutes_of_meeting(file_name);

-- ============================================
-- Apply Updated At Trigger
-- ============================================
CREATE TRIGGER update_minutes_of_meeting_updated_at
  BEFORE UPDATE ON minutes_of_meeting
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE minutes_of_meeting ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Create RLS Policies (Allow all for now - adjust as needed)
-- ============================================
CREATE POLICY "Allow read access on minutes_of_meeting" ON minutes_of_meeting FOR SELECT USING (true);
CREATE POLICY "Allow insert access on minutes_of_meeting" ON minutes_of_meeting FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access on minutes_of_meeting" ON minutes_of_meeting FOR UPDATE USING (true);
CREATE POLICY "Allow delete access on minutes_of_meeting" ON minutes_of_meeting FOR DELETE USING (true);
