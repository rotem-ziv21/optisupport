import express from 'express';
import { getTicketsByPriority, getTicketStats } from '../controllers/statsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get ticket statistics by priority (admin only)
router.get('/priority', authenticate(['admin']), getTicketsByPriority);

// Get general ticket statistics (admin and agents)
router.get('/', authenticate(['admin', 'agent']), getTicketStats);

export default router;
