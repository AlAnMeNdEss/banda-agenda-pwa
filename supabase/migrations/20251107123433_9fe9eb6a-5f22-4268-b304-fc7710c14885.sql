-- Add links field to songs table to store YouTube and other links
ALTER TABLE songs ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '[]'::jsonb;