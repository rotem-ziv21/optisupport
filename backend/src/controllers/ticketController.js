import { body, validationResult } from 'express-validator';
import supabase from '../supabaseClient.js';
import { analyzeUrgency } from '../services/aiService.js';
import { sendWebhook } from '../utils/webhookUtils.js';

// Validation rules for creating a ticket
export const validateTicket = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('customer_id').notEmpty().withMessage('Customer ID is required'),
];

/**
 * Create a new support ticket
 * @route POST /api/tickets
 * @access Customer
 */
export const createTicket = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, description, customer_id, category } = req.body;

    // Analyze ticket urgency using AI
    const aiAnalysis = await analyzeUrgency(description);
    
    // Prepare ticket data
    const ticketData = {
      title,
      description,
      customer_id,
      category: category || 'general',
      status: 'open',
      priority: aiAnalysis.urgency,
      ai_recommendation: aiAnalysis.recommendation,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Insert ticket into database
    const { data, error } = await supabase
      .from('tickets')
      .insert(ticketData)
      .select()
      .single();

    if (error) {
      console.error('Error creating ticket:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create ticket', 
        error: error.message 
      });
    }

    // Send webhook notification for high priority tickets
    if (aiAnalysis.urgency === 'high') {
      await sendWebhook('new_high_priority_ticket', {
        ticket_id: data.id,
        title: data.title,
        priority: data.priority,
        recommendation: data.ai_recommendation
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data,
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};

/**
 * Get all tickets with optional filtering
 * @route GET /api/tickets
 * @access Agent, Admin
 */
export const getTickets = async (req, res) => {
  try {
    // Extract query parameters for filtering
    const { status, priority, category, agent_id, page = 1, limit = 10 } = req.query;
    
    // Build query
    let query = supabase
      .from('tickets')
      .select('*, customer:customer_id(*), agent:agent_id(*)');
    
    // Apply filters if provided
    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (category) query = query.eq('category', category);
    if (agent_id) query = query.eq('agent_id', agent_id);
    
    // Add pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Execute query with pagination
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)
      .limit(limit);
    
    if (error) {
      console.error('Error fetching tickets:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch tickets', 
        error: error.message 
      });
    }
    
    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting tickets:', countError);
    }
    
    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};

/**
 * Get a specific ticket by ID
 * @route GET /api/tickets/:id
 * @access Customer, Agent, Admin (with access control)
 */
export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get ticket with related data
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        customer:customer_id(*),
        agent:agent_id(*),
        comments(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false, 
          message: 'Ticket not found' 
        });
      }
      
      console.error('Error fetching ticket:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch ticket', 
        error: error.message 
      });
    }
    
    // Access control: check if user has permission to view this ticket
    const user = req.user;
    
    // Allow access if:
    // 1. User is an admin
    // 2. User is the assigned agent
    // 3. User is the customer who created the ticket
    if (
      user.role !== 'admin' && 
      user.id !== data.agent_id &&
      user.id !== data.customer_id
    ) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to view this ticket' 
      });
    }
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get ticket by ID error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};

/**
 * Update ticket status
 * @route PATCH /api/tickets/:id/status
 * @access Agent, Admin
 */
export const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['open', 'in_progress', 'pending', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status value' 
      });
    }
    
    // Update ticket status
    const { data, error } = await supabase
      .from('tickets')
      .update({ 
        status, 
        updated_at: new Date(),
        ...(status === 'resolved' || status === 'closed' ? { resolved_at: new Date() } : {})
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating ticket status:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update ticket status', 
        error: error.message 
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Ticket status updated successfully',
      data
    });
  } catch (error) {
    console.error('Update ticket status error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};

/**
 * Add a comment to a ticket
 * @route POST /api/tickets/:id/comment
 * @access Customer, Agent, Admin
 */
export const addTicketComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const user = req.user;
    
    // Validate comment content
    if (!content || content.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Comment content is required' 
      });
    }
    
    // Check if ticket exists
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();
    
    if (ticketError) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found' 
      });
    }
    
    // Create comment
    const commentData = {
      ticket_id: id,
      user_id: user.id,
      user_role: user.role,
      content,
      created_at: new Date()
    };
    
    const { data, error } = await supabase
      .from('ticket_comments')
      .insert(commentData)
      .select()
      .single();
    
    if (error) {
      console.error('Error adding comment:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to add comment', 
        error: error.message 
      });
    }
    
    // Update ticket's updated_at timestamp
    await supabase
      .from('tickets')
      .update({ updated_at: new Date() })
      .eq('id', id);
    
    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data
    });
  } catch (error) {
    console.error('Add ticket comment error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};
