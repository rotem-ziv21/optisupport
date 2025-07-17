// Quick script to check if the database field exists
// Run with: node check_database.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tlaitqgzygbnknrrftgz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsYWl0cWd6eWdibmtucnJmdGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1Njk4MzksImV4cCI6MjA2NzE0NTgzOX0.2LSrYMH8_TTKued1Jf783OMZTvXkPMHN1D_i18vg2iY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  try {
    console.log('Checking database...');
    
    const { data, error } = await supabase
      .from('tickets')
      .select('id, title, has_unread_customer_messages')
      .limit(3);
    
    if (error) {
      console.error('Error:', error);
      if (error.message.includes('has_unread_customer_messages')) {
        console.log('❌ The has_unread_customer_messages field does NOT exist in the database');
        console.log('Please run this SQL in your Supabase dashboard:');
        console.log('ALTER TABLE tickets ADD COLUMN has_unread_customer_messages boolean DEFAULT false;');
      }
    } else {
      console.log('✅ Database field exists! Data:');
      console.log(data);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkDatabase();