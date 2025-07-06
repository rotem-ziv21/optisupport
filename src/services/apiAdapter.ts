import { apiService } from './apiService';
import { ticketService } from './ticketService';
import { Ticket, Message } from '../types';

/**
 * API Adapter to help migrate from direct Supabase to backend API
 * 
 * This adapter provides a unified interface that can switch between
 * direct Supabase access and the backend API based on configuration.
 */
class ApiAdapter {
  private useBackendApi: boolean = false;

  /**
   * Configure whether to use the backend API or direct Supabase
   */
  setUseBackendApi(value: boolean) {
    this.useBackendApi = value;
    console.log(`Using ${value ? 'backend API' : 'direct Supabase'} for data access`);
  }

  /**
   * Get tickets with optional filters
   */
  async getTickets(filters?: {
    status?: string;
    priority?: string;
    category?: string;
    assigned_to?: string;
    search?: string;
  }): Promise<Ticket[]> {
    if (this.useBackendApi) {
      try {
        // Map frontend filters to backend API format if needed
        const apiFilters = {
          ...filters,
          agent_id: filters?.assigned_to,
        };
        const response = await apiService.getTickets(apiFilters);
        return response.data;
      } catch (error) {
        console.error('Backend API error, falling back to Supabase:', error);
        return ticketService.getTickets(filters);
      }
    } else {
      return ticketService.getTickets(filters);
    }
  }

  /**
   * Get a specific ticket by ID
   */
  async getTicket(id: string): Promise<Ticket | null> {
    if (this.useBackendApi) {
      try {
        const ticket = await apiService.getTicket(id);
        return ticket;
      } catch (error) {
        console.error('Backend API error, falling back to Supabase:', error);
        return ticketService.getTicket(id);
      }
    } else {
      return ticketService.getTicket(id);
    }
  }

  /**
   * Create a new ticket
   */
  async createTicket(ticketData: {
    title: string;
    description: string;
    customer_email: string;
    customer_name: string;
    priority?: string;
    category?: string;
  }): Promise<Ticket> {
    if (this.useBackendApi) {
      try {
        // Map to backend API format
        const apiTicketData = {
          title: ticketData.title,
          description: ticketData.description,
          customer_id: ticketData.customer_email, // Using email as customer ID
          category: ticketData.category,
          priority: ticketData.priority,
          customer_name: ticketData.customer_name,
          customer_email: ticketData.customer_email
        };
        
        const ticket = await apiService.createTicket(apiTicketData);
        return ticket;
      } catch (error) {
        console.error('Backend API error, falling back to Supabase:', error);
        return ticketService.createTicket(ticketData);
      }
    } else {
      return ticketService.createTicket(ticketData);
    }
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(id: string, status: string): Promise<Ticket> {
    if (this.useBackendApi) {
      try {
        return await apiService.updateTicketStatus(id, status);
      } catch (error) {
        console.error('Backend API error, falling back to Supabase:', error);
        return ticketService.updateTicket(id, { status });
      }
    } else {
      return ticketService.updateTicket(id, { status });
    }
  }

  /**
   * Add a comment to a ticket
   */
  async addComment(ticketId: string, message: {
    content: string;
    sender: 'customer' | 'agent';
    sender_name: string;
    is_ai_suggested?: boolean;
  }): Promise<Message> {
    if (this.useBackendApi) {
      try {
        const comment = await apiService.addTicketComment(ticketId, message.content);
        // Convert backend response to frontend Message format
        return {
          id: comment.id,
          ticket_id: ticketId,
          content: message.content,
          sender: message.sender,
          sender_name: message.sender_name,
          created_at: new Date().toISOString(),
          is_ai_suggested: message.is_ai_suggested || false
        };
      } catch (error) {
        console.error('Backend API error, falling back to Supabase:', error);
        return ticketService.addMessage(ticketId, message);
      }
    } else {
      return ticketService.addMessage(ticketId, message);
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<{
    total_tickets: number;
    open_tickets: number;
    in_progress_tickets: number;
    resolved_today: number;
    avg_response_time: number;
    satisfaction_score: number;
    high_risk_tickets: number;
    ai_accuracy: number;
  }> {
    if (this.useBackendApi) {
      try {
        const stats = await apiService.getTicketStats();
        const priorityStats = await apiService.getTicketsByPriority();
        
        // Map backend stats to frontend format
        return {
          total_tickets: stats.open + stats.closed,
          open_tickets: stats.open,
          in_progress_tickets: 0, // Not directly provided by backend
          resolved_today: 0, // Not directly provided by backend
          avg_response_time: parseFloat(stats.avgResponseTime) || 0,
          satisfaction_score: 0, // Not provided by backend
          high_risk_tickets: stats.highPriority,
          ai_accuracy: 0.89 // Placeholder
        };
      } catch (error) {
        console.error('Backend API error, falling back to Supabase:', error);
        return ticketService.getDashboardStats();
      }
    } else {
      return ticketService.getDashboardStats();
    }
  }
}

// Create and export a singleton instance
export const apiAdapter = new ApiAdapter();
