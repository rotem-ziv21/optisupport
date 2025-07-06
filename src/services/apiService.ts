import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Ticket, Message } from '../types';

/**
 * API Service for communicating with the backend
 */
class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    // Create axios instance with base URL
    this.api = axios.create({
      baseURL: 'http://localhost:5000/api', // Default to local development server
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use((config) => {
      if (this.token) {
        config.headers['Authorization'] = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  /**
   * Set the authentication token for API requests
   */
  setAuthToken(token: string) {
    this.token = token;
  }

  /**
   * Clear the authentication token
   */
  clearAuthToken() {
    this.token = null;
  }

  /**
   * Get all tickets with optional filtering
   */
  async getTickets(filters?: {
    status?: string;
    priority?: string;
    category?: string;
    agent_id?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Ticket[], pagination: any }> {
    try {
      const response = await this.api.get('/tickets', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching tickets from API:', error);
      throw new Error('Failed to fetch tickets');
    }
  }

  /**
   * Get a specific ticket by ID
   */
  async getTicket(id: string): Promise<Ticket> {
    try {
      const response = await this.api.get(`/tickets/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching ticket ${id} from API:`, error);
      throw new Error('Failed to fetch ticket');
    }
  }

  /**
   * Create a new ticket
   */
  async createTicket(ticketData: {
    title: string;
    description: string;
    customer_id: string;
    category?: string;
  }): Promise<Ticket> {
    try {
      const response = await this.api.post('/tickets', ticketData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating ticket through API:', error);
      throw new Error('Failed to create ticket');
    }
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(id: string, status: string): Promise<Ticket> {
    try {
      const response = await this.api.patch(`/tickets/${id}/status`, { status });
      return response.data.data;
    } catch (error) {
      console.error(`Error updating ticket ${id} status through API:`, error);
      throw new Error('Failed to update ticket status');
    }
  }

  /**
   * Add a comment to a ticket
   */
  async addTicketComment(ticketId: string, content: string): Promise<any> {
    try {
      const response = await this.api.post(`/tickets/${ticketId}/comment`, { content });
      return response.data.data;
    } catch (error) {
      console.error(`Error adding comment to ticket ${ticketId} through API:`, error);
      throw new Error('Failed to add comment');
    }
  }

  /**
   * Get ticket statistics
   */
  async getTicketStats(): Promise<{
    open: number;
    closed: number;
    highPriority: number;
    avgResponseTime: string;
  }> {
    try {
      const response = await this.api.get('/stats');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching ticket stats from API:', error);
      throw new Error('Failed to fetch ticket statistics');
    }
  }

  /**
   * Get ticket statistics by priority (admin only)
   */
  async getTicketsByPriority(): Promise<any> {
    try {
      const response = await this.api.get('/stats/priority');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching priority stats from API:', error);
      throw new Error('Failed to fetch priority statistics');
    }
  }

  /**
   * Login user and get JWT token
   * Note: This is a placeholder. Implement actual authentication as needed.
   */
  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    try {
      // This would be replaced with your actual authentication endpoint
      const response = await this.api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      this.setAuthToken(token);
      return { token, user };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Login failed');
    }
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();
