// Test adding a customer message and checking if the flag is set
// Run with: node test_customer_message.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tlaitqgzygbnknrrftgz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsYWl0cWd6eWdibmtucnJmdGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1Njk4MzksImV4cCI6MjA2NzE0NTgzOX0.2LSrYMH8_TTKued1Jf783OMZTvXkPMHN1D_i18vg2iY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCustomerMessage() {
  try {
    // Get first ticket
    const { data: tickets, error: ticketError } = await supabase
      .from('tickets')
      .select('id, title, has_unread_customer_messages')
      .limit(1);
    
    if (ticketError) {
      console.error('Error getting tickets:', ticketError);
      return;
    }
    
    if (!tickets || tickets.length === 0) {
      console.log('No tickets found');
      return;
    }
    
    const ticket = tickets[0];
    console.log('Using ticket:', ticket.id, '-', ticket.title);
    console.log('Current has_unread_customer_messages:', ticket.has_unread_customer_messages);
    
    // Add a customer message
    console.log('\n1. Adding customer message...');
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        ticket_id: ticket.id,
        content: 'Test customer message - ' + new Date().toISOString(),
        sender: 'customer',
        sender_name: 'Test Customer',
        created_at: new Date().toISOString(),
        is_ai_suggested: false
      });
    
    if (messageError) {
      console.error('Error adding message:', messageError);
      return;
    }
    
    console.log('✅ Message added');
    
    // Update ticket to set unread flag
    console.log('\n2. Setting unread flag...');
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        has_unread_customer_messages: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticket.id);
    
    if (updateError) {
      console.error('Error updating ticket:', updateError);
      return;
    }
    
    console.log('✅ Unread flag set');
    
    // Verify the change
    console.log('\n3. Verifying change...');
    const { data: updatedTicket, error: verifyError } = await supabase
      .from('tickets')
      .select('id, title, has_unread_customer_messages')
      .eq('id', ticket.id)
      .single();
    
    if (verifyError) {
      console.error('Error verifying:', verifyError);
      return;
    }
    
    console.log('✅ Updated ticket:', updatedTicket);
    console.log('has_unread_customer_messages is now:', updatedTicket.has_unread_customer_messages);
    
    if (updatedTicket.has_unread_customer_messages) {
      console.log('🎉 SUCCESS! The flag was set correctly.');
      console.log('Now check the agent interface - the icon should appear!');
    } else {
      console.log('❌ PROBLEM: The flag was not set correctly.');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testCustomerMessage();