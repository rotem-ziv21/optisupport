/*
  # Add has_unread_customer_messages field to tickets table

  1. Schema Updates
    - Add `has_unread_customer_messages` boolean column to tickets table
    - Set default value to false for existing records
  
  2. Changes Made
    - Add `has_unread_customer_messages` boolean column (nullable, default false)
    - This field will track if there are unread customer messages for each ticket
    - Used by the agent interface to show message icons

  3. Notes
    - The field will be set to true when customers send messages
    - The field will be set to false when agents open the ticket
    - This enables real-time notification of new customer messages
*/

-- Add the has_unread_customer_messages column to tickets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'has_unread_customer_messages'
  ) THEN
    ALTER TABLE tickets ADD COLUMN has_unread_customer_messages boolean DEFAULT false;
  END IF;
END $$;

-- Set default value for existing records
UPDATE tickets SET has_unread_customer_messages = false WHERE has_unread_customer_messages IS NULL;