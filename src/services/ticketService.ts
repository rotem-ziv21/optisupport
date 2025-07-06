import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Ticket, Message, AIAnalysis } from '../types';
import { aiService } from './aiService';
import { mockTickets } from '../utils/mockData';
import { knowledgeBaseService } from './knowledgeBaseService';

class TicketService {
  async getTickets(filters?: {
    status?: string;
    priority?: string;
    category?: string;
    assigned_to?: string;
    search?: string;
  }): Promise<Ticket[]> {
    // If Supabase is not configured, return mock data
    if (!isSupabaseConfigured || !supabase) {
      return this.getMockTickets(filters);
    }

    try {
      let query = supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch tickets: ${error.message}`);
      }

      return data.map(ticket => ({
        ...ticket,
        conversation: [] // Will be loaded separately when needed
      }));
    } catch (error) {
      console.warn('Supabase connection failed, using mock data:', error);
      return this.getMockTickets(filters);
    }
  }

  private getMockTickets(filters?: {
    status?: string;
    priority?: string;
    category?: string;
    assigned_to?: string;
    search?: string;
  }): Ticket[] {
    let filteredTickets = [...mockTickets];

    if (filters?.status) {
      filteredTickets = filteredTickets.filter(ticket => ticket.status === filters.status);
    }
    if (filters?.priority) {
      filteredTickets = filteredTickets.filter(ticket => ticket.priority === filters.priority);
    }
    if (filters?.category) {
      filteredTickets = filteredTickets.filter(ticket => ticket.category === filters.category);
    }
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredTickets = filteredTickets.filter(ticket => 
        ticket.title.toLowerCase().includes(searchLower) ||
        ticket.description.toLowerCase().includes(searchLower)
      );
    }

    return filteredTickets;
  }

  async getTicket(id: string): Promise<Ticket | null> {
    if (!isSupabaseConfigured || !supabase) {
      return mockTickets.find(ticket => ticket.id === id) || null;
    }

    try {
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single();

      if (ticketError) {
        throw new Error(`Failed to fetch ticket: ${ticketError.message}`);
      }

      if (!ticket) return null;

      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });

      if (messagesError) {
        throw new Error(`Failed to fetch messages: ${messagesError.message}`);
      }

      return {
        ...ticket,
        conversation: messages || []
      };
    } catch (error) {
      console.warn('Supabase connection failed, using mock data:', error);
      return mockTickets.find(ticket => ticket.id === id) || null;
    }
  }

  async createTicket(ticketData: {
    title: string;
    description: string;
    customer_email: string;
    customer_name: string;
    priority?: string;
    category?: string;
  }): Promise<Ticket> {
    // Always try to create in Supabase first if configured
    if (isSupabaseConfigured && supabase) {
      try {
        // Use AI to classify the ticket if OpenAI is configured
        let classification = { category: 'general', priority: 'medium', confidence: 0.5 };
        let sentiment = { score: 0, label: 'neutral' as 'neutral' | 'negative' | 'positive', confidence: 0.5 };

        try {
          classification = await aiService.classifyTicket(ticketData.description);
          sentiment = await aiService.analyzeSentiment(ticketData.description);
        } catch (aiError) {
          console.warn('AI analysis failed, using defaults:', aiError);
        }

        const { data, error } = await supabase
          .from('tickets')
          .insert({
            title: ticketData.title,
            description: ticketData.description,
            customer_email: ticketData.customer_email,
            customer_name: ticketData.customer_name,
            priority: ticketData.priority || classification.priority,
            category: ticketData.category || classification.category,
            status: 'open',
            sentiment_score: sentiment.score,
            risk_level: sentiment.label === 'negative' ? 'medium' : 'low',
            tags: ['auto-classified'],
            suggested_replies: []
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to create ticket in Supabase: ${error.message}`);
        }

        // Perform full AI analysis in the background
        this.performAIAnalysis(data.id);

        // Try to generate auto solution from knowledge base
        this.generateAutoSolution(data.id, `${ticketData.title}\n${ticketData.description}`);

        return {
          ...data,
          conversation: []
        };
      } catch (error) {
        console.error('Failed to create ticket in Supabase:', error);
        // Fall through to mock creation
      }
    }

    // Fallback to mock ticket creation
    const newTicket: Ticket = {
      id: `mock-${Date.now()}`,
      title: ticketData.title,
      description: ticketData.description,
      customer_email: ticketData.customer_email,
      customer_name: ticketData.customer_name,
      status: 'open',
      priority: ticketData.priority || 'medium',
      category: (ticketData.category as 'general' | 'technical' | 'billing' | 'feature_request') || 'general',
      assigned_to: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: ['mock-data'],
      sentiment_score: 0,
      risk_level: 'low',
      ai_summary: null,
      suggested_replies: [],
      agent_actions: '',
      conversation: []
    };

    // Add to mock data for consistency
    mockTickets.unshift(newTicket);
    
    return newTicket;
  }

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket> {
    if (!isSupabaseConfigured || !supabase) {
      const existingTicket = mockTickets.find(t => t.id === id);
      if (!existingTicket) {
        throw new Error('Ticket not found');
      }
      const updatedTicket = { ...existingTicket, ...updates };
      // Update the mock data array
      const index = mockTickets.findIndex(t => t.id === id);
      if (index !== -1) {
        mockTickets[index] = updatedTicket;
      }
      return updatedTicket;
    }

    const { data, error } = await supabase
      .from('tickets')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update ticket: ${error.message}`);
    }

    return {
      ...data,
      conversation: [] // Will be loaded separately if needed
    };
  }

  async addMessage(ticketId: string, message: {
    content: string;
    sender: 'customer' | 'agent';
    sender_name: string;
    is_ai_suggested?: boolean;
  }): Promise<Message> {
    if (!isSupabaseConfigured || !supabase) {
      const mockMessage: Message = {
        id: `mock-msg-${Date.now()}`,
        ticket_id: ticketId,
        content: message.content,
        sender: message.sender,
        sender_name: message.sender_name,
        created_at: new Date().toISOString(),
        is_ai_suggested: message.is_ai_suggested || false
      };
      return mockMessage;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        ticket_id: ticketId,
        content: message.content,
        sender: message.sender,
        sender_name: message.sender_name,
        is_ai_suggested: message.is_ai_suggested || false
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add message: ${error.message}`);
    }

    // Update ticket's updated_at timestamp
    await supabase
      .from('tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    // Re-analyze ticket if customer message
    if (message.sender === 'customer') {
      this.performAIAnalysis(ticketId);
    }

    return data;
  }

  async getSuggestedReplies(ticketId: string): Promise<string[]> {
    const ticket = await this.getTicket(ticketId);
    if (!ticket) return [];

    if (!isSupabaseConfigured || !supabase) {
      return [
        'תודה על פנייתך. אנו בוחנים את הבעיה ונחזור אליך בהקדם.',
        'אני מבין את הבעיה. בינתיים, אתה יכול לנסות...',
        'זה נשמע כמו בעיה ידועה. הפתרון הוא...'
      ];
    }

    const replies = await aiService.generateSuggestedReplies(ticket, ticket.conversation);
    
    // Update ticket with suggested replies
    await supabase
      .from('tickets')
      .update({ suggested_replies: replies })
      .eq('id', ticketId);

    return replies;
  }

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
    if (!isSupabaseConfigured || !supabase) {
      return {
        total_tickets: mockTickets.length,
        open_tickets: mockTickets.filter(t => t.status === 'open').length,
        in_progress_tickets: mockTickets.filter(t => t.status === 'in_progress').length,
        resolved_today: 3,
        avg_response_time: 2.5,
        satisfaction_score: 4.2,
        high_risk_tickets: mockTickets.filter(t => t.risk_level === 'high').length,
        ai_accuracy: 0.89
      };
    }

    const today = new Date().toISOString().split('T')[0];

    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedToday,
      highRiskTickets
    ] = await Promise.all([
      supabase.from('tickets').select('id', { count: 'exact' }),
      supabase.from('tickets').select('id', { count: 'exact' }).eq('status', 'open'),
      supabase.from('tickets').select('id', { count: 'exact' }).eq('status', 'in_progress'),
      supabase.from('tickets').select('id', { count: 'exact' }).eq('status', 'resolved').gte('updated_at', `${today}T00:00:00`),
      supabase.from('tickets').select('id', { count: 'exact' }).eq('risk_level', 'high')
    ]);

    return {
      total_tickets: totalTickets.count || 0,
      open_tickets: openTickets.count || 0,
      in_progress_tickets: inProgressTickets.count || 0,
      resolved_today: resolvedToday.count || 0,
      avg_response_time: 2.5, // hours - would calculate from actual data
      satisfaction_score: 4.2, // out of 5 - would calculate from feedback
      high_risk_tickets: highRiskTickets.count || 0,
      ai_accuracy: 0.89 // would calculate from AI predictions vs actual outcomes
    };
  }

  private async performAIAnalysis(ticketId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    try {
      const ticket = await this.getTicket(ticketId);
      if (!ticket) return;

      const analysis = await aiService.analyzeTicket(ticket);
      const summary = await aiService.summarizeTicket(ticket, ticket.conversation);
      const riskAssessment = await aiService.assessRisk(ticket, ticket.conversation);

      await supabase
        .from('tickets')
        .update({
          priority: analysis.classification.priority,
          category: analysis.classification.category,
          tags: analysis.suggested_tags,
          sentiment_score: analysis.sentiment.score,
          risk_level: riskAssessment.level,
          ai_summary: summary,
          suggested_replies: analysis.suggested_replies
        })
        .eq('id', ticketId);
    } catch (error) {
      console.error('Failed to perform AI analysis:', error);
    }
  }

  private async generateAutoSolution(ticketId: string, ticketContent: string): Promise<void> {
    try {
      const autoSolution = await knowledgeBaseService.generateAutoSolution(ticketId, ticketContent);
      
      if (autoSolution && autoSolution.confidence_score > 0.7) {
        // Strip HTML tags and clean the solution content
        const cleanSolutionContent = autoSolution.solution_content
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        // Add the auto-generated solution as a suggested reply
        const currentTicket = await this.getTicket(ticketId);
        if (currentTicket) {
          const updatedReplies = [
            cleanSolutionContent,
            ...(currentTicket.suggested_replies || [])
          ].slice(0, 5); // Keep only top 5 suggestions

          if (isSupabaseConfigured && supabase) {
            // Ensure all replies are clean strings
            const sanitizedReplies = updatedReplies
              .filter(reply => typeof reply === 'string' && reply.trim().length > 0)
              .map(reply => reply.replace(/[\x00-\x1F\x7F]/g, '').trim()); // Remove control characters
            
            await supabase
              .from('tickets')
              .update({ suggested_replies: sanitizedReplies })
              .eq('id', ticketId);
          }
        }
      }
    } catch (error) {
      console.error('Failed to generate auto solution:', error);
    }
  }
}

export const ticketService = new TicketService();