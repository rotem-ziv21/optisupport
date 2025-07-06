import express from 'express';
import { authenticateApiKey } from '../middleware/auth.js';
import supabase from '../supabaseClient.js';
import { processCreateTicketWebhook, processCloseTicketWebhook } from '../utils/webhookUtils.js';

const router = express.Router();

/**
 * Receive webhook to create a new ticket
 * @route POST /api/webhooks/ticket/create
 * @access API Key
 */
router.post('/ticket/create', authenticateApiKey(), async (req, res) => {
  try {
    const payload = req.body;
    
    if (!payload) {
      return res.status(400).json({
        success: false,
        message: 'Missing webhook payload'
      });
    }
    
    const ticket = await processCreateTicketWebhook(payload, supabase);
    
    return res.status(201).json({
      success: true,
      message: 'Ticket created successfully via webhook',
      data: ticket
    });
  } catch (error) {
    console.error('Webhook create ticket error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process webhook'
    });
  }
});

/**
 * Receive webhook to close an existing ticket
 * @route POST /api/webhooks/ticket/close
 * @access API Key
 */
router.post('/ticket/close', authenticateApiKey(), async (req, res) => {
  try {
    const payload = req.body;
    
    if (!payload || !payload.ticket_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing ticket_id in webhook payload'
      });
    }
    
    const ticket = await processCloseTicketWebhook(payload, supabase);
    
    return res.status(200).json({
      success: true,
      message: 'Ticket closed successfully via webhook',
      data: ticket
    });
  } catch (error) {
    console.error('Webhook close ticket error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process webhook'
    });
  }
});

export default router;
