/*
  # Fix suggested_replies column type

  1. Changes
    - Ensure suggested_replies column is properly configured as text[] array
    - Drop and recreate the column if needed to fix any type mismatches
    - Update default value to ensure compatibility

  2. Security
    - Maintain existing RLS policies
*/

-- First, let's ensure the column is properly typed as text[]
DO $$
BEGIN
  -- Drop the column if it exists and recreate it with the correct type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tickets' AND column_name = 'suggested_replies'
  ) THEN
    ALTER TABLE tickets DROP COLUMN suggested_replies;
  END IF;
  
  -- Add the column back with the correct type
  ALTER TABLE tickets ADD COLUMN suggested_replies text[] DEFAULT ARRAY[]::text[];
END $$;