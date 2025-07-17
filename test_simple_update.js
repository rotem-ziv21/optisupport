// Simple test to update the has_unread_customer_messages field directly
// Run with: node test_simple_update.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tlaitqgzygbnknrrftgz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsYWl0cWd6eWdibmtucnJmdGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1Njk4MzksImV4cCI6MjA2NzE0NTgzOX0.2LSrYMH8_TTKued1Jf783OMZTvXkPMHN1D_i18vg2iY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimpleUpdate() {
  try {
    console.log('Testing simple update...');
    
    // Get a ticket
    const { data: tickets, error: fetchError } = await supabase
      .from('tickets')
      .select('id, title, has_unread_customer_messages')
      .limit(1);
    
    if (fetchError) {
      console.error('Error fetching tickets:', fetchError);
      return;
    }
    
    if (!tickets || tickets.length === 0) {
      console.log('No tickets found');
      return;
    }
    
    const ticket = tickets[0];
    console.log('Testing with ticket:', ticket.id);
    
    // Test 1: Update only the timestamp
    console.log('\n1. Testing timestamp update...');
    const { error: timestampError } = await supabase
      .from('tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticket.id);
    
    if (timestampError) {
      console.error('❌ Timestamp update failed:', timestampError);
    } else {
      console.log('✅ Timestamp update successful');
    }
    
    // Test 2: Update only the unread flag
    console.log('\n2. Testing unread flag update...');
    const { error: flagError } = await supabase
      .from('tickets')
      .update({ has_unread_customer_messages: true })
      .eq('id', ticket.id);
    
    if (flagError) {
      console.error('❌ Unread flag update failed:', flagError);
      console.error('Error details:', {
        message: flagError.message,
        details: flagError.details,
        hint: flagError.hint,
        code: flagError.code
      });
    } else {
      console.log('✅ Unread flag update successful');
    }
    
    // Test 3: Update both fields together
    console.log('\n3. Testing combined update...');
    const { error: combinedError } = await supabase
      .from('tickets')
      .update({ 
        has_unread_customer_messages: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticket.id);
    
    if (combinedError) {
      console.error('❌ Combined update failed:', combinedError);
      console.error('Error details:', {
        message: combinedError.message,
        details: combinedError.details,
        hint: combinedError.hint,
        code: combinedError.code
      });
    } else {
      console.log('✅ Combined update successful');
    }
    
    // Verify final state
    console.log('\n4. Verifying final state...');
    const { data: finalTicket, error: verifyError } = await supabase
      .from('tickets')
      .select('id, title, has_unread_customer_messages, updated_at')
      .eq('id', ticket.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
    } else {
      console.log('✅ Final state:', finalTicket);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testSimpleUpdate();