// Debug the 400 error when updating tickets
// Run with: node debug_400_error.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tlaitqgzygbnknrrftgz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsYWl0cWd6eWdibmtucnJmdGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1Njk4MzksImV4cCI6MjA2NzE0NTgzOX0.2LSrYMH8_TTKued1Jf783OMZTvXkPMHN1D_i18vg2iY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug400Error() {
  try {
    console.log('🔍 Debugging 400 error...');
    
    // Get the ticket that's causing the error
    const ticketId = '35a19c2e-6b18-480d-932a-c71aa1998c66';
    console.log('Testing with ticket ID:', ticketId);
    
    // First, let's see what the current ticket data looks like
    const { data: currentTicket, error: fetchError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching ticket:', fetchError);
      return;
    }
    
    console.log('📋 Current ticket data:');
    console.log(JSON.stringify(currentTicket, null, 2));
    
    // Test different update scenarios
    console.log('\n🧪 Testing different update scenarios...');
    
    // Test 1: Simple timestamp update
    console.log('\n1. Testing simple timestamp update...');
    const simpleUpdate = { updated_at: new Date().toISOString() };
    console.log('Update data:', simpleUpdate);
    
    const { error: simpleError } = await supabase
      .from('tickets')
      .update(simpleUpdate)
      .eq('id', ticketId);
    
    if (simpleError) {
      console.error('❌ Simple update failed:', simpleError);
    } else {
      console.log('✅ Simple update succeeded');
    }
    
    // Test 2: Update with has_unread_customer_messages
    console.log('\n2. Testing has_unread_customer_messages update...');
    const unreadUpdate = { 
      updated_at: new Date().toISOString(),
      has_unread_customer_messages: true 
    };
    console.log('Update data:', unreadUpdate);
    
    const { error: unreadError } = await supabase
      .from('tickets')
      .update(unreadUpdate)
      .eq('id', ticketId);
    
    if (unreadError) {
      console.error('❌ Unread update failed:', unreadError);
      console.error('Error details:', {
        message: unreadError.message,
        details: unreadError.details,
        hint: unreadError.hint,
        code: unreadError.code
      });
    } else {
      console.log('✅ Unread update succeeded');
    }
    
    // Test 3: Update with suggested_replies (this might be the issue)
    console.log('\n3. Testing suggested_replies update...');
    const repliesUpdate = { 
      updated_at: new Date().toISOString(),
      suggested_replies: ['Test reply 1', 'Test reply 2']
    };
    console.log('Update data:', repliesUpdate);
    
    const { error: repliesError } = await supabase
      .from('tickets')
      .update(repliesUpdate)
      .eq('id', ticketId);
    
    if (repliesError) {
      console.error('❌ Replies update failed:', repliesError);
      console.error('Error details:', {
        message: repliesError.message,
        details: repliesError.details,
        hint: repliesError.hint,
        code: repliesError.code
      });
    } else {
      console.log('✅ Replies update succeeded');
    }
    
    // Test 4: Update with all fields that might cause issues
    console.log('\n4. Testing comprehensive update...');
    const comprehensiveUpdate = {
      updated_at: new Date().toISOString(),
      has_unread_customer_messages: true,
      suggested_replies: ['Test reply'],
      ai_summary: 'Test summary',
      tags: ['test']
    };
    console.log('Update data:', comprehensiveUpdate);
    
    const { error: comprehensiveError } = await supabase
      .from('tickets')
      .update(comprehensiveUpdate)
      .eq('id', ticketId);
    
    if (comprehensiveError) {
      console.error('❌ Comprehensive update failed:', comprehensiveError);
      console.error('Error details:', {
        message: comprehensiveError.message,
        details: comprehensiveError.details,
        hint: comprehensiveError.hint,
        code: comprehensiveError.code
      });
    } else {
      console.log('✅ Comprehensive update succeeded');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debug400Error();