// Test the real-time customer message flow
// This simulates exactly what happens when a customer sends a message
// Run with: node test_realtime_flow.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tlaitqgzygbnknrrftgz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsYWl0cWd6eWdibmtucnJmdGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1Njk4MzksImV4cCI6MjA2NzE0NTgzOX0.2LSrYMH8_TTKued1Jf783OMZTvXkPMHN1D_i18vg2iY';

const supabase = createClient(supabaseUrl, supabaseKey);

// Simulate the ticketService.addMessage function
async function simulateAddMessage(ticketId, message) {
  console.log('📝 Simulating addMessage function...');
  
  // Insert the message
  const messageData = {
    ticket_id: ticketId,
    content: message.content,
    sender: message.sender,
    sender_name: message.sender_name,
    created_at: new Date().toISOString(),
    is_ai_suggested: message.is_ai_suggested || false
  };
  
  console.log('📝 Inserting message:', messageData);
  
  const { data, error } = await supabase
    .from('messages')
    .insert(messageData)
    .select()
    .single();

  if (error) {
    console.error('❌ Message insertion failed:', error);
    throw new Error(`Failed to add message: ${error.message}`);
  }

  console.log('✅ Message inserted successfully');

  // Update ticket's updated_at timestamp and mark unread if customer message
  const updateData = { updated_at: new Date().toISOString() };
  
  if (message.sender === 'customer') {
    updateData.has_unread_customer_messages = true;
    console.log('🔔 Customer message detected - setting has_unread_customer_messages to true for ticket:', ticketId);
  }
  
  console.log('📝 Updating ticket with data:', updateData);
  
  const { error: updateError } = await supabase
    .from('tickets')
    .update(updateData)
    .eq('id', ticketId);
  
  if (updateError) {
    console.error('❌ Error updating ticket:', updateError);
    console.error('❌ Error details:', {
      message: updateError.message,
      details: updateError.details,
      hint: updateError.hint,
      code: updateError.code
    });
    console.error('❌ Update data that failed:', updateData);
    throw updateError;
  } else {
    console.log('✅ Ticket updated successfully');
  }

  return data;
}

// Simulate the ticketService.getTicket function
async function simulateGetTicket(id) {
  console.log('📝 Simulating getTicket function for ID:', id);
  
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .single();

  if (ticketError) {
    console.error('❌ Failed to fetch ticket:', ticketError);
    throw new Error(`Failed to fetch ticket: ${ticketError.message}`);
  }

  if (!ticket) {
    console.log('❌ Ticket not found');
    return null;
  }

  console.log('✅ Ticket fetched successfully:', {
    id: ticket.id,
    title: ticket.title,
    has_unread_customer_messages: ticket.has_unread_customer_messages
  });

  // Get messages for this ticket
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true });

  if (messagesError) {
    console.error('❌ Failed to fetch messages:', messagesError);
    throw new Error(`Failed to fetch messages: ${messagesError.message}`);
  }

  return {
    ...ticket,
    conversation: messages || []
  };
}

// Simulate the ticketService.getTickets function
async function simulateGetTickets() {
  console.log('📝 Simulating getTickets function...');
  
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Failed to fetch tickets:', error);
    throw new Error(`Failed to fetch tickets: ${error.message}`);
  }

  const tickets = data.map(ticket => ({
    ...ticket,
    conversation: []
  }));

  console.log('✅ Tickets fetched successfully. Tickets with unread messages:');
  tickets.forEach(ticket => {
    if (ticket.has_unread_customer_messages) {
      console.log(`  - ${ticket.id}: ${ticket.title} (UNREAD)`);
    }
  });

  return tickets;
}

async function testRealtimeFlow() {
  try {
    console.log('🚀 Testing real-time customer message flow...\n');
    
    // Get a ticket to test with
    const { data: tickets } = await supabase
      .from('tickets')
      .select('id, title, has_unread_customer_messages')
      .limit(1);
    
    if (!tickets || tickets.length === 0) {
      console.log('❌ No tickets found');
      return;
    }
    
    const ticket = tickets[0];
    console.log('📋 Using ticket:', ticket.id, '-', ticket.title);
    console.log('📋 Initial has_unread_customer_messages:', ticket.has_unread_customer_messages);
    
    // Step 1: Customer sends message (simulate customer interface)
    console.log('\n1️⃣ CUSTOMER SENDS MESSAGE');
    console.log('🔔 Customer sending message...');
    
    await simulateAddMessage(ticket.id, {
      content: 'Test customer message from real-time flow - ' + new Date().toISOString(),
      sender: 'customer',
      sender_name: 'Test Customer'
    });
    
    // Step 2: Customer interface refreshes ticket (simulate CustomerTicketView)
    console.log('\n2️⃣ CUSTOMER INTERFACE REFRESHES');
    console.log('🔄 Refreshing ticket data in customer interface...');
    
    const refreshedTicket = await simulateGetTicket(ticket.id);
    if (refreshedTicket) {
      console.log('✅ Customer interface sees:', {
        id: refreshedTicket.id,
        has_unread_customer_messages: refreshedTicket.has_unread_customer_messages
      });
    }
    
    // Step 3: Agent interface fetches tickets (simulate TicketList)
    console.log('\n3️⃣ AGENT INTERFACE FETCHES TICKETS');
    console.log('📋 Agent interface fetching all tickets...');
    
    const allTickets = await simulateGetTickets();
    const testTicketInList = allTickets.find(t => t.id === ticket.id);
    
    if (testTicketInList) {
      console.log('✅ Agent interface sees:', {
        id: testTicketInList.id,
        title: testTicketInList.title,
        has_unread_customer_messages: testTicketInList.has_unread_customer_messages
      });
      
      if (testTicketInList.has_unread_customer_messages) {
        console.log('🎉 SUCCESS! The icon should appear in the agent interface');
      } else {
        console.log('❌ PROBLEM: The unread flag is false - no icon will appear');
      }
    } else {
      console.log('❌ PROBLEM: Ticket not found in agent interface list');
    }
    
    // Step 4: Test marking as read
    console.log('\n4️⃣ AGENT OPENS TICKET (MARK AS READ)');
    console.log('📖 Marking messages as read...');
    
    const { error: readError } = await supabase
      .from('tickets')
      .update({ has_unread_customer_messages: false })
      .eq('id', ticket.id);
    
    if (readError) {
      console.error('❌ Failed to mark as read:', readError);
    } else {
      console.log('✅ Messages marked as read');
      
      // Verify
      const finalTicket = await simulateGetTicket(ticket.id);
      if (finalTicket) {
        console.log('✅ Final state:', {
          id: finalTicket.id,
          has_unread_customer_messages: finalTicket.has_unread_customer_messages
        });
        
        if (!finalTicket.has_unread_customer_messages) {
          console.log('🎉 SUCCESS! The icon should now disappear from the agent interface');
        }
      }
    }
    
    console.log('\n🏁 Test completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testRealtimeFlow();