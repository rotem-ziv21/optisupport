// Test the customer message flow and verify the icon appears
// Run with: node test_customer_flow.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tlaitqgzygbnknrrftgz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsYWl0cWd6eWdibmtucnJmdGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1Njk4MzksImV4cCI6MjA2NzE0NTgzOX0.2LSrYMH8_TTKued1Jf783OMZTvXkPMHN1D_i18vg2iY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCustomerFlow() {
  try {
    console.log('🚀 Testing customer message flow...\n');
    
    // Get the first ticket
    const { data: tickets, error: fetchError } = await supabase
      .from('tickets')
      .select('id, title, has_unread_customer_messages')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Error fetching tickets:', fetchError);
      return;
    }
    
    if (!tickets || tickets.length === 0) {
      console.log('❌ No tickets found');
      return;
    }
    
    const ticket = tickets[0];
    console.log('📋 Using ticket:', ticket.id);
    console.log('📋 Title:', ticket.title);
    console.log('📋 Initial has_unread_customer_messages:', ticket.has_unread_customer_messages);
    
    // Reset the ticket first
    console.log('\n🔄 Resetting ticket to clean state...');
    await supabase
      .from('tickets')
      .update({ has_unread_customer_messages: false })
      .eq('id', ticket.id);
    
    // Step 1: Add a customer message
    console.log('\n1️⃣ Adding customer message...');
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        ticket_id: ticket.id,
        content: 'TEST: Customer message - ' + new Date().toISOString(),
        sender: 'customer',
        sender_name: 'Test Customer',
        created_at: new Date().toISOString(),
        is_ai_suggested: false
      })
      .select()
      .single();
    
    if (messageError) {
      console.error('❌ Error adding message:', messageError);
      return;
    }
    
    console.log('✅ Message added successfully');
    
    // Step 2: Update the ticket flag
    console.log('\n2️⃣ Updating ticket flag...');
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        has_unread_customer_messages: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticket.id);
    
    if (updateError) {
      console.error('❌ Error updating ticket:', updateError);
      return;
    }
    
    console.log('✅ Ticket flag updated successfully');
    
    // Step 3: Verify the change
    console.log('\n3️⃣ Verifying the change...');
    const { data: updatedTicket, error: verifyError } = await supabase
      .from('tickets')
      .select('id, title, has_unread_customer_messages, updated_at')
      .eq('id', ticket.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Error verifying:', verifyError);
      return;
    }
    
    console.log('✅ Verification result:', {
      id: updatedTicket.id,
      title: updatedTicket.title,
      has_unread_customer_messages: updatedTicket.has_unread_customer_messages,
      updated_at: updatedTicket.updated_at
    });
    
    // Step 4: Test fetching all tickets (simulate agent interface)
    console.log('\n4️⃣ Testing agent interface fetch...');
    const { data: allTickets, error: fetchAllError } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (fetchAllError) {
      console.error('❌ Error fetching all tickets:', fetchAllError);
      return;
    }
    
    console.log('✅ All tickets fetched successfully');
    
    // Find our test ticket
    const testTicket = allTickets.find(t => t.id === ticket.id);
    if (testTicket) {
      console.log('✅ Test ticket found in list:', {
        id: testTicket.id,
        title: testTicket.title,
        has_unread_customer_messages: testTicket.has_unread_customer_messages
      });
      
      if (testTicket.has_unread_customer_messages) {
        console.log('🎉 SUCCESS! The ticket has unread messages flag set');
        console.log('🎉 The icon should appear in the agent interface');
      } else {
        console.log('❌ PROBLEM: The ticket does not have unread messages flag set');
      }
    } else {
      console.log('❌ PROBLEM: Test ticket not found in the list');
    }
    
    // Count all tickets with unread messages
    const unreadTickets = allTickets.filter(t => t.has_unread_customer_messages);
    console.log(`\n📊 Summary: Found ${unreadTickets.length} tickets with unread messages:`);
    unreadTickets.forEach((ticket, index) => {
      console.log(`  ${index + 1}. ${ticket.id}: ${ticket.title}`);
    });
    
    if (unreadTickets.length > 0) {
      console.log('\n🎯 INSTRUCTIONS FOR TESTING:');
      console.log('1. Go to the agent interface (tickets page)');
      console.log('2. Click the "רענן" (Refresh) button');
      console.log('3. Look for blue pulsing icons next to these tickets');
      console.log('4. Click the "🔍 Debug" button to see the count');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testCustomerFlow();