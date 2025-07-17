-- Add has_unread_customer_messages field to tickets table
-- Run this SQL command in your Supabase dashboard SQL Editor

-- Add the column if it doesn't exist
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS has_unread_customer_messages boolean DEFAULT false;

-- Set default value for existing records
UPDATE tickets SET has_unread_customer_messages = false WHERE has_unread_customer_messages IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tickets' AND column_name = 'has_unread_customer_messages';