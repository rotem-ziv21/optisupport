/*
  # Fix tickets table schema issues

  1. Schema Updates
    - Add missing `agent_actions` column to tickets table
    - Ensure `suggested_replies` column is properly configured as text array
  
  2. Changes Made
    - Add `agent_actions` text column (nullable) to store agent action history
    - Verify `suggested_replies` is configured as text[] array type
    - Ensure both columns have proper default values

  3. Notes
    - The `agent_actions` column will store serialized action data
    - The `suggested_replies` column maintains text array format for compatibility
*/

-- Add the missing agent_actions column to tickets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'agent_actions'
  ) THEN
    ALTER TABLE tickets ADD COLUMN agent_actions text;
  END IF;
END $$;

-- Ensure suggested_replies is properly configured as text array
-- This will recreate the column if it's not the correct type
DO $$
BEGIN
  -- Check if the column exists and has the wrong type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' 
    AND column_name = 'suggested_replies'
    AND data_type != 'ARRAY'
  ) THEN
    -- Drop and recreate the column with correct type
    ALTER TABLE tickets DROP COLUMN IF EXISTS suggested_replies;
    ALTER TABLE tickets ADD COLUMN suggested_replies text[] DEFAULT ARRAY[]::text[];
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'suggested_replies'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE tickets ADD COLUMN suggested_replies text[] DEFAULT ARRAY[]::text[];
  END IF;
END $$;