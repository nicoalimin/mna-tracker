-- Migration: Create deal_stage_history, deal_notes, deal_links, deal_documents tables
-- Created: 2026-01-27

-- Create deal_stage_history table
CREATE TABLE deal_stage_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  exited_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for deal_stage_history
CREATE INDEX idx_deal_stage_history_deal_id ON deal_stage_history(deal_id);
CREATE INDEX idx_deal_stage_history_stage ON deal_stage_history(stage);
CREATE INDEX idx_deal_stage_history_entered_at ON deal_stage_history(entered_at);

-- Create deal_notes table
CREATE TABLE deal_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  stage TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for deal_notes
CREATE INDEX idx_deal_notes_deal_id ON deal_notes(deal_id);
CREATE INDEX idx_deal_notes_stage ON deal_notes(stage);
CREATE INDEX idx_deal_notes_created_at ON deal_notes(created_at);

-- Create deal_links table
CREATE TABLE deal_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  stage TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for deal_links
CREATE INDEX idx_deal_links_deal_id ON deal_links(deal_id);
CREATE INDEX idx_deal_links_stage ON deal_links(stage);

-- Create deal_documents table
CREATE TABLE deal_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  stage TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for deal_documents
CREATE INDEX idx_deal_documents_deal_id ON deal_documents(deal_id);
CREATE INDEX idx_deal_documents_stage ON deal_documents(stage);

-- Enable Row Level Security
ALTER TABLE deal_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for deal_stage_history
CREATE POLICY "Allow read access on deal_stage_history" ON deal_stage_history FOR SELECT USING (true);
CREATE POLICY "Allow insert access on deal_stage_history" ON deal_stage_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access on deal_stage_history" ON deal_stage_history FOR UPDATE USING (true);
CREATE POLICY "Allow delete access on deal_stage_history" ON deal_stage_history FOR DELETE USING (true);

-- Create RLS Policies for deal_notes
CREATE POLICY "Allow read access on deal_notes" ON deal_notes FOR SELECT USING (true);
CREATE POLICY "Allow insert access on deal_notes" ON deal_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access on deal_notes" ON deal_notes FOR UPDATE USING (true);
CREATE POLICY "Allow delete access on deal_notes" ON deal_notes FOR DELETE USING (true);

-- Create RLS Policies for deal_links
CREATE POLICY "Allow read access on deal_links" ON deal_links FOR SELECT USING (true);
CREATE POLICY "Allow insert access on deal_links" ON deal_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access on deal_links" ON deal_links FOR UPDATE USING (true);
CREATE POLICY "Allow delete access on deal_links" ON deal_links FOR DELETE USING (true);

-- Create RLS Policies for deal_documents
CREATE POLICY "Allow read access on deal_documents" ON deal_documents FOR SELECT USING (true);
CREATE POLICY "Allow insert access on deal_documents" ON deal_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access on deal_documents" ON deal_documents FOR UPDATE USING (true);
CREATE POLICY "Allow delete access on deal_documents" ON deal_documents FOR DELETE USING (true);

-- Add updated_at trigger for deal_notes
CREATE TRIGGER update_deal_notes_updated_at
  BEFORE UPDATE ON deal_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
