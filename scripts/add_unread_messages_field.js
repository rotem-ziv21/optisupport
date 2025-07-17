// Script to add has_unread_customer_messages field to tickets table
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tlaitqgzygbnknrrftgz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsYWl0cWd6eWdibmtucnJmdGd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU2OTgzOSwiZXhwIjoyMDY3MTQ1ODM5fQ.e_n3ukkGVI5nwlQenOrIrOBHZi5diRX0yz6FSufpp2A';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addUnreadMessagesField() {
  try {
    console.log('Adding has_unread_customer_messages field to tickets table...');
    
    // Add the column using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'tickets' AND column_name = 'has_unread_customer_messages'
          ) THEN
            ALTER TABLE tickets ADD COLUMN has_unread_customer_messages boolean DEFAULT false;
            RAISE NOTICE 'Column has_unread_customer_messages added successfully';
          ELSE
            RAISE NOTICE 'Column has_unread_customer_messages already exists';
          END IF;
        END $$;
      `
    });

    if (error) {
      console.error('Error adding column:', error);
      
      // Try alternative method if the first one fails
      console.log('Trying alternative method...');
      const { error: altError } = await supabase
        .from('tickets')
        .select('has_unread_customer_messages')
        .limit(1);
      
      if (altError && altError.message.includes('column "has_unread_customer_messages" does not exist')) {
        console.log('Column does not exist, manual execution needed');
        console.log('Please run this SQL command manually in your Supabase dashboard:');
        console.log('ALTER TABLE tickets ADD COLUMN has_unread_customer_messages boolean DEFAULT false;');
        console.log('UPDATE tickets SET has_unread_customer_messages = false WHERE has_unread_customer_messages IS NULL;');
      } else {
        console.log('Column appears to exist already');
      }
    } else {
      console.log('Success:', data);
      
      // Set default value for existing records
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ has_unread_customer_messages: false })
        .is('has_unread_customer_messages', null);
      
      if (updateError) {
        console.log('Note: Could not update existing records, but this is okay if they already have values');
      } else {
        console.log('Updated existing records with default value');
      }
    }
    
    console.log('Migration completed!');
  } catch (error) {
    console.error('Error:', error);
  }
}

addUnreadMessagesField();