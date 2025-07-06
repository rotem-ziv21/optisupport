import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Send a webhook notification to the configured webhook URL
 * @param {string} event - The event type
 * @param {Object} data - The data to send
 * @returns {Promise<Object>} - The response from the webhook endpoint
 */
export const sendWebhook = async (event, data) => {
  try {
    const webhookUrl = process.env.WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.warn('No webhook URL configured. Skipping webhook notification.');
      return null;
    }
    
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data
    };
    
    const response = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'OptiSupport-Backend',
      }
    });
    
    console.log(`Webhook sent: ${event}`, response.status);
    return response.data;
  } catch (error) {
    console.error('Error sending webhook:', error);
    return null;
  }
};

/**
 * Process an incoming webhook for ticket creation
 * @param {Object} payload - The webhook payload
 * @param {Object} supabase - The Supabase client
 * @returns {Promise<Object>} - The created ticket
 */
export const processCreateTicketWebhook = async (payload, supabase) => {
  try {
    const { title, description, customer_id, category, priority } = payload;
    
    // Validate required fields
    if (!title || !description || !customer_id) {
      throw new Error('Missing required fields: title, description, or customer_id');
    }
    
    // Create ticket in database
    const { data, error } = await supabase
      .from('tickets')
      .insert({
        title,
        description,
        customer_id,
        category: category || 'general',
        status: 'open',
        priority: priority || 'medium',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create ticket: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error processing create ticket webhook:', error);
    throw error;
  }
};

/**
 * Process an incoming webhook for ticket closure
 * @param {Object} payload - The webhook payload
 * @param {Object} supabase - The Supabase client
 * @returns {Promise<Object>} - The updated ticket
 */
export const processCloseTicketWebhook = async (payload, supabase) => {
  try {
    const { ticket_id, resolution_note } = payload;
    
    if (!ticket_id) {
      throw new Error('Missing required field: ticket_id');
    }
    
    // Update ticket status to closed
    const { data, error } = await supabase
      .from('tickets')
      .update({
        status: 'closed',
        resolution_note: resolution_note || 'Closed via webhook',
        resolved_at: new Date(),
        updated_at: new Date(),
      })
      .eq('id', ticket_id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to close ticket: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error processing close ticket webhook:', error);
    throw error;
  }
};

/**
 * Check for tickets that haven't been updated in 72 hours and send notifications
 * @param {Object} supabase - The Supabase client
 */
export const checkStaleTickets = async (supabase) => {
  try {
    const threeHoursAgo = new Date();
    threeHoursAgo.setHours(threeHoursAgo.getHours() - 72);
    
    // Find tickets that haven't been updated in 72 hours and are still open
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .in('status', ['open', 'in_progress'])
      .lt('updated_at', threeHoursAgo.toISOString());
    
    if (error) {
      console.error('Error checking for stale tickets:', error);
      return;
    }
    
    // Send webhook notifications for each stale ticket
    for (const ticket of data) {
      await sendWebhook('ticket_stale', {
        ticket_id: ticket.id,
        title: ticket.title,
        status: ticket.status,
        last_updated: ticket.updated_at,
        hours_since_update: Math.floor((new Date() - new Date(ticket.updated_at)) / (1000 * 60 * 60))
      });
      
      // Update the ticket to prevent repeated notifications
      await supabase
        .from('tickets')
        .update({ 
          updated_at: new Date(),
          stale_notification_sent: true
        })
        .eq('id', ticket.id);
    }
    
    console.log(`Sent stale notifications for ${data.length} tickets`);
  } catch (error) {
    console.error('Error in checkStaleTickets:', error);
  }
};
