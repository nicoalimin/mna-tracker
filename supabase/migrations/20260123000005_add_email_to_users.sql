-- Migration: Add email column to users table
-- Created: 2026-01-23

-- Add email column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert a default admin user for testing (password: admin123)
INSERT INTO users (name, email, password) 
VALUES ('Admin', 'admin@example.com', 'admin123')
ON CONFLICT (email) DO NOTHING;
