import express from 'express';
import { 
  createTicket, 
  getTickets, 
  getTicketById, 
  updateTicketStatus, 
  addTicketComment,
  validateTicket
} from '../controllers/ticketController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Create a new ticket
router.post('/', authenticate(['customer']), validateTicket, createTicket);

// Get all tickets (with filtering)
router.get('/', authenticate(['agent', 'admin']), getTickets);

// Get a specific ticket
router.get('/:id', authenticate(['customer', 'agent', 'admin']), getTicketById);

// Update ticket status
router.patch('/:id/status', authenticate(['agent', 'admin']), updateTicketStatus);

// Add comment to a ticket
router.post('/:id/comment', authenticate(['customer', 'agent', 'admin']), addTicketComment);

export default router;
