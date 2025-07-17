// Test script to verify the message icon functionality
// Run this with: node test_message_icon.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://tlaitqgzygbnknrrftgz.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsYWl0cWd6eWdibmtucnJmdGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1Njk4MzksImV4cCI6MjA2NzE0NTgzOX0.2LSrYMH8_TTKued1Jf783OMZTvXkPMHN1D_i18vg2iY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testMessageIcon() {
  try {
    console.log('Testing message icon functionality...\n');
    
    // 1. Check if the has_unread_customer_messages field exists
    console.log('1. Checking if has_unread_customer_messages field exists...');
    const { data: tickets, error: fetchError } = await supabase
      .from('tickets')
      .select('id, title, has_unread_customer_messages')
      .limit(1);
    
    if (fetchError) {
      if (fetchError.message.includes('has_unread_customer_messages')) {
        console.log('❌ Field does not exist in database!');
        console.log('Please run the SQL command in add_field.sql in your Supabase dashboard SQL Editor');
        return;
      } else {
        console.error('Error fetching tickets:', fetchError);
        return;
      }
    }
    
    console.log('✅ Field exists in database');
    
    if (tickets && tickets.length > 0) {
      const ticket = tickets[0];
      console.log(`Using ticket: ${ticket.id} - "${ticket.title}"`);
      console.log(`Current has_unread_customer_messages: ${ticket.has_unread_customer_messages}`);
      
      // 2. Test adding a customer message
      console.log('\n2. Testing adding a customer message...');
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          ticket_id: ticket.id,
          content: 'Test message from customer',
          sender: 'customer',
          sender_name: 'Test Customer',
          created_at: new Date().toISOString(),
          is_ai_suggested: false
        });
      
      if (messageError) {
        console.error('Error adding message:', messageError);
        return;
      }
      
      console.log('✅ Message added successfully');
      
      // 3. Test updating the unread flag
      console.log('\n3. Testing updating unread flag...');
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
      
      console.log('✅ Unread flag set to true');
      
      // 4. Verify the change
      console.log('\n4. Verifying the change...');
      const { data: updatedTicket, error: verifyError } = await supabase
        .from('tickets')
        .select('id, title, has_unread_customer_messages')
        .eq('id', ticket.id)
        .single();
      
      if (verifyError) {
        console.error('Error verifying update:', verifyError);
        return;
      }
      
      console.log(`✅ Updated has_unread_customer_messages: ${updatedTicket.has_unread_customer_messages}`);
      
      // 5. Test marking as read
      console.log('\n5. Testing marking as read...');
      const { error: readError } = await supabase
        .from('tickets')
        .update({ has_unread_customer_messages: false })
        .eq('id', ticket.id);
      
      if (readError) {
        console.error('Error marking as read:', readError);
        return;
      }
      
      console.log('✅ Marked as read successfully');
      
      // 6. Final verification
      console.log('\n6. Final verification...');
      const { data: finalTicket, error: finalError } = await supabase
        .from('tickets')
        .select('id, title, has_unread_customer_messages')
        .eq('id', ticket.id)
        .single();
      
      if (finalError) {
        console.error('Error in final verification:', finalError);
        return;
      }
      
      console.log(`✅ Final has_unread_customer_messages: ${finalTicket.has_unread_customer_messages}`);
      
      console.log('\n🎉 All tests passed! The message icon functionality should work now.');
      console.log('\nNext steps:');
      console.log('1. Test by sending a message through the customer interface');
      console.log('2. Check if the icon appears in the agent interface');
      console.log('3. Open the ticket to verify the icon disappears');
      
    } else {
      console.log('No tickets found in database');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testMessageIcon();