// Test the complete customer message flow
// Run with: node test_full_flow.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tlaitqgzygbnknrrftgz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsYWl0cWd6eWdibmtucnJmdGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1Njk4MzksImV4cCI6MjA2NzE0NTgzOX0.2LSrYMH8_TTKued1Jf783OMZTvXkPMHN1D_i18vg2iY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFullFlow() {
  try {
    console.log('Testing complete customer message flow...');
    
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
    console.log('Using ticket:', ticket.id, '-', ticket.title);
    console.log('Initial has_unread_customer_messages:', ticket.has_unread_customer_messages);
    
    // Step 1: Add a message (simulating addMessage function)
    console.log('\n1. Adding customer message...');
    const messageData = {
      ticket_id: ticket.id,
      content: 'Test customer message - ' + new Date().toISOString(),
      sender: 'customer',
      sender_name: 'Test Customer',
      created_at: new Date().toISOString(),
      is_ai_suggested: false
    };
    
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();
    
    if (messageError) {
      console.error('❌ Message insertion failed:', messageError);
      return;
    }
    
    console.log('✅ Message added successfully');
    
    // Step 2: Update ticket (simulating the update logic)
    console.log('\n2. Updating ticket...');
    const updateData = { 
      updated_at: new Date().toISOString(),
      has_unread_customer_messages: true
    };
    
    console.log('Update data:', updateData);
    
    const { error: updateError } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', ticket.id);
    
    if (updateError) {
      console.error('❌ Ticket update failed:', updateError);
      console.error('Error details:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      });
    } else {
      console.log('✅ Ticket update successful');
    }
    
    // Step 3: Verify the changes
    console.log('\n3. Verifying changes...');
    const { data: updatedTicket, error: verifyError } = await supabase
      .from('tickets')
      .select('id, title, has_unread_customer_messages, updated_at')
      .eq('id', ticket.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
    } else {
      console.log('✅ Updated ticket state:', updatedTicket);
      
      if (updatedTicket.has_unread_customer_messages) {
        console.log('🎉 SUCCESS! The unread flag is set to true');
        console.log('The icon should now appear in the agent interface');
      } else {
        console.log('❌ PROBLEM: The unread flag is still false');
      }
    }
    
    // Step 4: Test fetching tickets (simulating getTickets)
    console.log('\n4. Testing ticket fetching...');
    const { data: fetchedTickets, error: fetchError2 } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (fetchError2) {
      console.error('❌ Tickets fetch failed:', fetchError2);
    } else {
      console.log('✅ Tickets fetched successfully');
      const testTicket = fetchedTickets.find(t => t.id === ticket.id);
      if (testTicket) {
        console.log('Test ticket in results:', {
          id: testTicket.id,
          title: testTicket.title,
          has_unread_customer_messages: testTicket.has_unread_customer_messages
        });
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testFullFlow();