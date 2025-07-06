import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Import routes
import ticketRoutes from './routes/ticketRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';

// Import utilities
import { checkStaleTickets } from './utils/webhookUtils.js';
import supabase from './supabaseClient.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Allow requests from the frontend URL or any origin in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
})); // Enable CORS with specific configuration
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to OptiSupport API',
    version: '1.0.0',
    status: 'running'
  });
});

// API Routes
app.use('/api/tickets', ticketRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/webhooks', webhookRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Set up scheduled tasks
  if (process.env.NODE_ENV !== 'test') {
    // Check for stale tickets every hour
    setInterval(() => {
      checkStaleTickets(supabase);
    }, 60 * 60 * 1000); // 1 hour
  }
});

export default app;
