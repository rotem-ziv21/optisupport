import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { TriggerType } from '../types/automation';
import { Ticket, Message } from '../types';
import { aiService } from './aiService';
import { mockTickets } from '../utils/mockData';
import { knowledgeBaseService } from './knowledgeBaseService';
// ייבוא המופע היחיד של automationService כייצוא ברירת מחדל
import automationService from './automationService';

class TicketService {
  // פונקציה ליצירת טוקן ייחודי לכרטיס
  async generateTicketToken(ticketId: string): Promise<string | null> {
    if (!isSupabaseConfigured || !supabase) {
      // במצב מדגמי, נחזיר טוקן מדומה
      return `mock-token-${ticketId}-${Date.now()}`;
    }
    
    try {
      // בדיקה שהכרטיס קיים
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('id')
        .eq('id', ticketId)
        .single();
      
      if (ticketError || !ticket) {
        console.error('Ticket not found:', ticketError);
        return null;
      }
      
      // יצירת טוקן ייחודי
      const token = `${ticketId}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      // שמירת הטוקן בטבלת טוקנים
      const { error } = await supabase
        .from('ticket_tokens')
        .insert({
          ticket_id: ticketId,
          token: token,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // תוקף ל-30 יום
        });
      
      if (error) {
        console.error('Failed to create token:', error);
        return null;
      }
      
      return token;
    } catch (error) {
      console.error('Error generating ticket token:', error);
      return null;
    }
  }
  
  // פונקציה לקבלת כרטיס באמצעות טוקן
  async getTicketByToken(token: string): Promise<Ticket | null> {
    if (!isSupabaseConfigured || !supabase) {
      // במצב מדגמי, נחפש כרטיס שמתאים לטוקן המדומה
      const mockTokenParts = token.split('-');
      if (mockTokenParts.length >= 2) {
        const ticketId = mockTokenParts[1];
        return mockTickets.find(ticket => ticket.id === ticketId) || null;
      }
      return null;
    }
    
    try {
      // בדיקה שהטוקן קיים ותקף
      const { data: tokenData, error: tokenError } = await supabase
        .from('ticket_tokens')
        .select('ticket_id, expires_at')
        .eq('token', token)
        .single();
      
      if (tokenError || !tokenData) {
        console.error('Token not found or invalid:', tokenError);
        return null;
      }
      
      // בדיקת תוקף הטוקן
      if (new Date(tokenData.expires_at) < new Date()) {
        console.error('Token expired');
        return null;
      }
      
      // קבלת הכרטיס המתאים
      return this.getTicket(tokenData.ticket_id);
    } catch (error) {
      console.error('Error fetching ticket by token:', error);
      return null;
    }
  }
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
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%,customer_phone.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`);
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
    customer_phone?: string;
    company_name?: string;
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
          console.log('Starting AI classification and sentiment analysis for new ticket');
          classification = await aiService.classifyTicket(ticketData.description);
          console.log('Classification completed:', classification);
          
          sentiment = await aiService.analyzeSentiment(ticketData.description);
          console.log('Sentiment analysis completed:', sentiment);
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
            customer_phone: ticketData.customer_phone || undefined,
            company_name: ticketData.company_name || undefined,
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
        
        const newTicket = {
          ...data,
          conversation: []
        };
        
        // Perform AI analysis on the new ticket
        try {
          this.performAIAnalysis(data.id);
        } catch (analysisError) {
          console.error('Failed to perform AI analysis:', analysisError);
          // אל תפסיק את התהליך אם יש שגיאה באנליזה
        }
        
        // הפעלת אוטומציות רלוונטיות לכרטיס חדש
        try {
          console.log('DEBUG - Triggering automations for new ticket:', data.id);
          console.log('DEBUG - Ticket data:', JSON.stringify(newTicket));
          await this.triggerAutomationsForNewTicket(newTicket);
        } catch (automationError) {
          console.error('Failed to trigger automations:', automationError);
          // אל תפסיק את התהליך אם יש שגיאה באוטומציות
        }
        
        return newTicket;
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
      customer_phone: ticketData.customer_phone || undefined,
      company_name: ticketData.company_name || undefined,
      status: 'open',
      priority: (ticketData.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent',
      category: ticketData.category as any || 'general',
      assigned_to: null as any,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: ['mock-data'],
      sentiment_score: 0,
      risk_level: 'low' as any,
      ai_summary: null as any,
      suggested_replies: [],
      agent_actions: '',
      conversation: []
    };

    // Add to mock data for consistency
    mockTickets.unshift(newTicket);
    
    return newTicket;
  }

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket> {
    // קבלת הכרטיס הקיים לבדיקת שינוי סטטוס
    const existingTicket = await this.getTicket(id);
    if (!existingTicket) {
      throw new Error('Ticket not found');
    }

    if (!isSupabaseConfigured || !supabase) {
      const updatedTicket = { ...existingTicket, ...updates };
      // Update the mock data array
      const index = mockTickets.findIndex(t => t.id === id);
      if (index !== -1) {
        mockTickets[index] = updatedTicket;
      }
      
      // הפעלת אוטומציות אם הסטטוס השתנה
      if (updates.status && updates.status !== existingTicket.status) {
        await this.triggerAutomationsForStatusChange(updatedTicket, existingTicket.status, updates.status);
      }
      
      return updatedTicket;
    }

    // הכנת אובייקט העדכון עם שדות זמן מותאמים
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // אם הסטטוס משתנה ל-in_progress, נעדכן את in_progress_at
    if (updates.status === 'in_progress') {
      updateData.in_progress_at = new Date().toISOString();
    }

    // אם הסטטוס משתנה ל-resolved או closed, נעדכן את resolved_at
    if (updates.status === 'resolved' || updates.status === 'closed') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update ticket: ${error.message}`);
    }

    const updatedTicket = {
      ...data,
      conversation: [] // Will be loaded separately if needed
    };

    // הפעלת אוטומציות אם הסטטוס השתנה
    if (updates.status && updates.status !== existingTicket.status) {
      await this.triggerAutomationsForStatusChange(updatedTicket, existingTicket.status, updates.status);
    }

    return updatedTicket;
  }

  async addMessage(ticketId: string, message: {
    content: string;
    sender: 'customer' | 'agent' | 'system';
    sender_name: string;
    is_ai_suggested?: boolean;
    sent_to_customer?: boolean;
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

    // נשתמש רק בשדות הקיימים בטבלה
    const messageData = {
      ticket_id: ticketId,
      content: message.content,
      sender: message.sender,
      sender_name: message.sender_name,
      is_ai_suggested: message.is_ai_suggested || false
    };
    
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add message: ${error.message}`);
    }

    // Update ticket's updated_at timestamp and set unread message flags
    const updateData: any = { updated_at: new Date().toISOString() };
  
    // Set appropriate unread message flag based on sender
    if (message.sender === 'customer') {
      updateData.has_unread_customer_messages = true;
      this.performAIAnalysis(ticketId);
      
      // הפעלת אוטומציות להודעות חדשות מלקוח
      try {
        console.log('DEBUG - Triggering automations for new customer message:', ticketId);
        this.triggerAutomationsForNewMessage(ticketId, data);
      } catch (automationError) {
        console.error('Failed to trigger automations for new message:', automationError);
        // המשך הפעולה גם אם האוטומציה נכשלה
      }
    } else if (message.sender === 'agent') {
      updateData.has_unread_agent_messages = true;
    }
  
    try {
      await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticketId);
    } catch (error) {
      console.error('Failed to update unread message flags:', error);
      // Continue execution even if this update fails
      // This provides graceful degradation if the columns don't exist yet
    }

    return data;
  }

  async sendMessageToCustomer(ticketId: string, content: string, senderName: string = 'נציג תמיכה'): Promise<Message> {
    // קבלת פרטי הכרטיס כדי לדעת למי לשלוח את ההודעה
    const ticket = await this.getTicket(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    // במערכת אמיתית, כאן היה קוד ששולח אימייל או SMS ללקוח
    // לדוגמה: שליחת אימייל לכתובת ticket.customer_email
    
    // שמירת ההודעה במערכת עם סימון שהיא נשלחה ללקוח
    const message = await this.addMessage(ticketId, {
      content: `[נשלח ללקוח] ${content}`,
      sender: 'agent',
      sender_name: senderName
    });
    
    // במערכת אמיתית, כאן היינו מעדכנים את סטטוס השליחה
    // לדוגמה: בדיקה אם האימייל נשלח בהצלחה
    
    return message;
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

  /**
   * חישוב זמן פתרון ממוצע לכרטיסים שנפתרו
   */
  private async calculateAverageResolutionTime(): Promise<number> {
    if (!isSupabaseConfigured || !supabase) {
      // חישוב מדגמי עבור כרטיסים מדומים
      const resolvedMockTickets = mockTickets.filter(t => t.status === 'resolved' || t.status === 'closed');
      if (resolvedMockTickets.length === 0) return 0;
      
      const totalHours = resolvedMockTickets.reduce((sum, ticket) => {
        const created = new Date(ticket.created_at);
        const updated = new Date(ticket.updated_at);
        const diffInHours = (updated.getTime() - created.getTime()) / (1000 * 60 * 60);
        return sum + diffInHours;
      }, 0);
      
      return totalHours / resolvedMockTickets.length;
    }

    try {
      // קבלת כל הכרטיסים שנפתרו ב-30 הימים האחרונים
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: resolvedTickets, error } = await supabase
        .from('tickets')
        .select('created_at, updated_at')
        .in('status', ['resolved', 'closed'])
        .gte('updated_at', thirtyDaysAgo.toISOString());
      
      if (error) {
        console.error('Error fetching resolved tickets for time calculation:', error);
        return 0;
      }
      
      if (!resolvedTickets || resolvedTickets.length === 0) {
        return 0;
      }
      
      // חישוב זמן פתרון לכל כרטיס
      const totalResolutionTimeHours = resolvedTickets.reduce((sum, ticket) => {
        const createdAt = new Date(ticket.created_at);
        const resolvedAt = new Date(ticket.updated_at);
        const resolutionTimeMs = resolvedAt.getTime() - createdAt.getTime();
        const resolutionTimeHours = resolutionTimeMs / (1000 * 60 * 60); // המרה לשעות
        return sum + resolutionTimeHours;
      }, 0);
      
      const averageResolutionTime = totalResolutionTimeHours / resolvedTickets.length;
      return Math.round(averageResolutionTime * 100) / 100; // עיגול ל-2 מקומות אחרי הנקודה
    } catch (error) {
      console.error('Error calculating average resolution time:', error);
      return 0;
    }
  }

  /**
   * חישוב ציון שביעות רצון ממוצע
   */
  private async calculateSatisfactionScore(): Promise<number> {
    if (!isSupabaseConfigured || !supabase) {
      // חישוב מדגמי בהתבסס על סנטימנט
      const sentimentScores = mockTickets.map(t => t.sentiment_score);
      if (sentimentScores.length === 0) return 4.0;
      
      // המרה מסיזון סנטימנט (-1 עד 1) לציון שביעות רצון (1 עד 5)
      const avgSentiment = sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length;
      const satisfactionScore = ((avgSentiment + 1) / 2) * 4 + 1; // המרה לטווח 1-5
      return Math.round(satisfactionScore * 10) / 10;
    }

    try {
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('sentiment_score')
        .not('sentiment_score', 'is', null);
      
      if (error || !tickets || tickets.length === 0) {
        return 4.0; // ברירת מחדל
      }
      
      const avgSentiment = tickets.reduce((sum, ticket) => sum + (ticket.sentiment_score || 0), 0) / tickets.length;
      const satisfactionScore = ((avgSentiment + 1) / 2) * 4 + 1;
      return Math.round(satisfactionScore * 10) / 10;
    } catch (error) {
      console.error('Error calculating satisfaction score:', error);
      return 4.0;
    }
  }

  /**
   * חישוב דיוק בינה מלאכותית
   */
  private async calculateAIAccuracy(): Promise<number> {
    // לעת הזו נחזיר ציון מדומה
    // במערכת אמיתית, זה יחושב על בסיס השוואה בין תחזיות AI לתוצאות אמיתיות
    return 0.87;
  }
  
  /**
   * הפעלת אוטומציות רלוונטיות לכרטיס חדש
   * @param ticket הכרטיס החדש שנוצר
   */
  private async triggerAutomationsForNewTicket(ticket: Ticket): Promise<void> {
    console.log('DEBUG - triggerAutomationsForNewTicket called for ticket:', ticket.id);
    
    try {
      // קבלת כל האוטומציות מהמערכת
      const automations = await automationService.getAutomations();
      console.log(`DEBUG - Found ${automations.length} total automations`);
      console.log('DEBUG - Automations details:', JSON.stringify(automations));
      
      // סינון רק אוטומציות פעילות
      const activeAutomations = automations.filter(automation => {
        const isActive = automation.isActive === true || automation.is_active === true;
        console.log(`DEBUG - Automation ${automation.id} active status:`, isActive);
        return isActive;
      });
      
      console.log(`DEBUG - Found ${activeAutomations.length} active automations to check`);
      
      // אם אין אוטומציות פעילות, אין צורך להמשיך
      if (activeAutomations.length === 0) {
        console.log('DEBUG - No active automations found, nothing to trigger');
        return;
      }
      
      // בדיקה של כל אוטומציה פעילה
      let foundMatchingAutomation = false;
      
      // עבור על כל האוטומציות הפעילות
      for (const automation of activeAutomations) {
        try {
          console.log('DEBUG - Checking automation:', automation.id, 'name:', automation.name);
          console.log('DEBUG - Trigger type:', automation.trigger?.type);
          
          // בדיקה אם האוטומציה מתאימה לאירוע של יצירת כרטיס חדש
          // אם אין סוג טריגר מוגדר, נניח שזה TICKET_CREATED כברירת מחדל
          if (!automation.trigger || !automation.trigger.type || automation.trigger.type === TriggerType.TICKET_CREATED) {
            foundMatchingAutomation = true;
            console.log(`DEBUG - Found automation with TICKET_CREATED trigger: ${automation.id} - ${automation.name}`);
            
            // יצירת קונטקסט לאוטומציה
            const context = {
              ticket,
              automationId: automation.id, // הוספת מזהה האוטומציה לקונטקסט
              event: {
                type: 'ticket_created',
                timestamp: new Date().toISOString(),
                data: {
                  ticket_id: ticket.id,
                  title: ticket.title,
                  description: ticket.description,
                  customer_name: ticket.customer_name,
                  customer_email: ticket.customer_email,
                  customer_phone: ticket.customer_phone,
                  company_name: ticket.company_name,
                  status: ticket.status,
                  priority: ticket.priority,
                  category: ticket.category,
                  created_at: ticket.created_at
                }
              }
            };
            
            // הפעלת האוטומציה
            console.log(`DEBUG - Triggering automation ${automation.id} for new ticket ${ticket.id}`);
            console.log('DEBUG - Automation context:', JSON.stringify(context));
            await automationService.triggerAutomation(automation.id, context);
            console.log(`DEBUG - Successfully triggered automation ${automation.id}`);
          } else {
            console.log(`DEBUG - Automation ${automation.id} does not have TICKET_CREATED trigger, skipping`);
          }
        } catch (error) {
          console.error(`DEBUG - Error triggering automation ${automation.id}:`, error);
          // המשך לאוטומציה הבאה גם אם זו נכשלה
        }
      }
      
      if (!foundMatchingAutomation) {
        console.log('DEBUG - No matching automations found for TICKET_CREATED trigger');
      }
      
      console.log('DEBUG - Finished checking all automations for new ticket');
    } catch (error) {
      console.error('DEBUG - Error in triggerAutomationsForNewTicket:', error);
    }
  }
  
  /**
   * מפעיל אוטומציות כאשר מתקבלת הודעה חדשה מלקוח
   * @param ticketId מזהה הכרטיס
   * @param message ההודעה שהתקבלה
   */
  private async triggerAutomationsForNewMessage(ticketId: string, message: Message): Promise<void> {
    console.log('DEBUG - triggerAutomationsForNewMessage called for ticket:', ticketId);
    
    try {
      // קבלת הכרטיס המלא
      const ticket = await this.getTicket(ticketId);
      if (!ticket) {
        console.error('DEBUG - Cannot trigger automations: Ticket not found:', ticketId);
        return;
      }
      
      // קבלת כל האוטומציות מהמערכת
      const automations = await automationService.getAutomations();
      console.log(`DEBUG - Found ${automations.length} total automations`);
      
      // סינון רק אוטומציות פעילות
      const activeAutomations = automations.filter(automation => {
        const isActive = automation.isActive === true || automation.is_active === true;
        return isActive;
      });
      
      console.log(`DEBUG - Found ${activeAutomations.length} active automations to check`);
      
      // אם אין אוטומציות פעילות, אין צורך להמשיך
      if (activeAutomations.length === 0) {
        console.log('DEBUG - No active automations found, nothing to trigger');
        return;
      }
      
      // בדיקה של כל אוטומציה פעילה
      let foundMatchingAutomation = false;
      
      // עבור על כל האוטומציות הפעילות
      for (const automation of activeAutomations) {
        try {
          console.log('DEBUG - Checking automation:', automation.id, 'name:', automation.name);
          console.log('DEBUG - Trigger type:', automation.trigger?.type);
          
          // בדיקה אם האוטומציה מתאימה לאירוע של קבלת הודעה חדשה
          if (automation.trigger?.type === TriggerType.MESSAGE_RECEIVED) {
            foundMatchingAutomation = true;
            console.log(`DEBUG - Found automation with MESSAGE_RECEIVED trigger: ${automation.id} - ${automation.name}`);
            
            // יצירת קונטקסט לאוטומציה
            const context = {
              ticket,
              message,
              automationId: automation.id,
              event: {
                type: 'message_received',
                timestamp: new Date().toISOString(),
                data: {
                  ticket_id: ticket.id,
                  message_id: message.id,
                  message_content: message.content,
                  sender: message.sender,
                  sender_name: message.sender_name,
                  created_at: message.created_at,
                  ticket_title: ticket.title,
                  customer_name: ticket.customer_name,
                  customer_email: ticket.customer_email,
                  customer_phone: ticket.customer_phone,
                  company_name: ticket.company_name
                }
              }
            };
            
            // הפעלת האוטומציה
            console.log(`DEBUG - Triggering automation ${automation.id} for new message in ticket ${ticketId}`);
            console.log('DEBUG - Automation context:', JSON.stringify(context));
            await automationService.triggerAutomation(automation.id, context);
            console.log(`DEBUG - Successfully triggered automation ${automation.id}`);
          } else {
            console.log(`DEBUG - Automation ${automation.id} does not have MESSAGE_RECEIVED trigger, skipping`);
          }
        } catch (error) {
          console.error(`DEBUG - Error triggering automation ${automation.id}:`, error);
          // המשך לאוטומציה הבאה גם אם זו נכשלה
        }
      }
      
      if (!foundMatchingAutomation) {
        console.log('DEBUG - No matching automations found for MESSAGE_RECEIVED trigger');
      }
      
      console.log('DEBUG - Finished checking all automations for new message');
    } catch (error) {
      console.error('DEBUG - Error in triggerAutomationsForNewMessage:', error);
    }
  }

  // הפעלת אוטומציות כשסטטוס כרטיס משתנה
  private async triggerAutomationsForStatusChange(ticket: Ticket, oldStatus: string, newStatus: string): Promise<void> {
    console.log(`DEBUG - triggerAutomationsForStatusChange called for ticket ${ticket.id}, status changed from ${oldStatus} to ${newStatus}`);
    
    try {
      const automations = await automationService.getAutomations();
      console.log(`DEBUG - Found ${automations.length} automations to check`);
      
      let foundMatchingAutomation = false;
      
      for (const automation of automations) {
        // בדיקה שהאוטומציה פעילה
        if (!automation.isActive && !automation.is_active) {
          console.log(`DEBUG - Automation ${automation.id} is not active, skipping`);
          continue;
        }
        
        console.log(`DEBUG - Checking automation ${automation.id} with trigger type: ${automation.trigger?.type}`);
        
        try {
          // בדיקה לטריגר STATUS_CHANGED
          if (automation.trigger?.type === 'status_changed') {
            console.log(`DEBUG - Found STATUS_CHANGED automation: ${automation.id}`);
            foundMatchingAutomation = true;
            
            const context = {
              ticket: {
                id: ticket.id,
                title: ticket.title,
                description: ticket.description,
                status: ticket.status,
                priority: ticket.priority,
                category: ticket.category,
                customer_name: ticket.customer_name,
                customer_email: ticket.customer_email,
                customer_phone: ticket.customer_phone,
                company_name: ticket.company_name,
                created_at: ticket.created_at,
                updated_at: ticket.updated_at,
                resolved_at: ticket.resolved_at,
                in_progress_at: ticket.in_progress_at
              },
              oldStatus,
              newStatus,
              statusChanged: true
            };
            
            console.log(`DEBUG - Triggering automation ${automation.id} with context:`, context);
            await automationService.triggerAutomation(automation.id, context);
          }
          // בדיקה לטריגר TICKET_RESOLVED כשהסטטוס החדש הוא resolved
          else if (automation.trigger?.type === 'ticket_resolved' && newStatus === 'resolved') {
            console.log(`DEBUG - Found TICKET_RESOLVED automation: ${automation.id}`);
            foundMatchingAutomation = true;
            
            const context = {
              ticket: {
                id: ticket.id,
                title: ticket.title,
                description: ticket.description,
                status: ticket.status,
                priority: ticket.priority,
                category: ticket.category,
                customer_name: ticket.customer_name,
                customer_email: ticket.customer_email,
                customer_phone: ticket.customer_phone,
                company_name: ticket.company_name,
                created_at: ticket.created_at,
                updated_at: ticket.updated_at,
                resolved_at: ticket.resolved_at,
                in_progress_at: ticket.in_progress_at
              },
              oldStatus,
              newStatus,
              ticketResolved: true
            };
            
            console.log(`DEBUG - Triggering TICKET_RESOLVED automation ${automation.id} with context:`, context);
            await automationService.triggerAutomation(automation.id, context);
          } else {
            console.log(`DEBUG - Automation ${automation.id} does not have STATUS_CHANGED or TICKET_RESOLVED trigger, skipping`);
          }
        } catch (error) {
          console.error(`DEBUG - Error triggering automation ${automation.id}:`, error);
          // המשך לאוטומציה הבאה גם אם זו נכשלה
        }
      }
      
      if (!foundMatchingAutomation) {
        console.log('DEBUG - No matching automations found for status change');
      }
      
      console.log('DEBUG - Finished checking all automations for status change');
    } catch (error) {
      console.error('DEBUG - Error in triggerAutomationsForStatusChange:', error);
    }
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
      const avgResolutionTime = await this.calculateAverageResolutionTime();
      const satisfactionScore = await this.calculateSatisfactionScore();
      
      return {
        total_tickets: mockTickets.length,
        open_tickets: mockTickets.filter(t => t.status === 'open').length,
        in_progress_tickets: mockTickets.filter(t => t.status === 'in_progress').length,
        resolved_today: mockTickets.filter(t => {
          const today = new Date().toDateString();
          const ticketDate = new Date(t.updated_at).toDateString();
          return (t.status === 'resolved' || t.status === 'closed') && ticketDate === today;
        }).length,
        avg_response_time: avgResolutionTime,
        satisfaction_score: satisfactionScore,
        high_risk_tickets: mockTickets.filter(t => (t.risk_level === 'high' || t.priority === 'high' || t.priority === 'urgent') && t.status !== 'resolved' && t.status !== 'closed').length,
        ai_accuracy: await this.calculateAIAccuracy()
      };
    }

    const today = new Date().toISOString().split('T')[0];

    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedToday,
      highRiskTickets,
      avgResolutionTime,
      satisfactionScore
    ] = await Promise.all([
      supabase.from('tickets').select('id', { count: 'exact' }),
      supabase.from('tickets').select('id', { count: 'exact' }).eq('status', 'open'),
      supabase.from('tickets').select('id', { count: 'exact' }).eq('status', 'in_progress'),
      supabase.from('tickets').select('id', { count: 'exact' }).in('status', ['resolved', 'closed']).gte('updated_at', `${today}T00:00:00`),
      supabase.from('tickets').select('id', { count: 'exact' }).or('risk_level.eq.high,priority.eq.high,priority.eq.urgent').neq('status', 'resolved').neq('status', 'closed'),
      this.calculateAverageResolutionTime(),
      this.calculateSatisfactionScore()
    ]);

    return {
      total_tickets: totalTickets.count || 0,
      open_tickets: openTickets.count || 0,
      in_progress_tickets: inProgressTickets.count || 0,
      resolved_today: resolvedToday.count || 0,
      avg_response_time: avgResolutionTime,
      satisfaction_score: satisfactionScore,
      high_risk_tickets: highRiskTickets.count || 0,
      ai_accuracy: await this.calculateAIAccuracy()
    };
  }

  private async performAIAnalysis(ticketId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      console.log('Supabase not configured, skipping AI analysis');
      return;
    }

    try {
      console.log('Starting AI analysis for ticket:', ticketId);
      const ticket = await this.getTicket(ticketId);
      if (!ticket) {
        console.log('Ticket not found, skipping AI analysis');
        return;
      }

      // Perform AI analysis
      console.log('Getting AI analysis for ticket');
      const analysis = await aiService.analyzeTicket(ticket);
      const summary = await aiService.summarizeTicket(ticket, ticket.conversation);
      const riskAssessment = await aiService.assessRisk(ticket, ticket.conversation);

      // Ensure suggested_replies is a valid array
      const validReplies = Array.isArray(analysis.suggested_replies) 
        ? analysis.suggested_replies.filter(reply => typeof reply === 'string')
        : [];
        
      console.log('Updating ticket with AI analysis, suggested_replies:', JSON.stringify(validReplies));
      
      try {
        // Update ticket with AI analysis results
        await supabase
          .from('tickets')
          .update({
            priority: analysis.classification.priority,
            category: analysis.classification.category,
            tags: Array.isArray(analysis.suggested_tags) ? analysis.suggested_tags : [],
            sentiment_score: analysis.sentiment.score,
            risk_level: riskAssessment.level,
            ai_summary: summary,
            suggested_replies: validReplies
          })
          .eq('id', ticketId);
        
        // Generate auto-solution from knowledge base
        console.log('Generating auto-solution from knowledge base for ticket:', ticketId);
        const ticketContent = `${ticket.title}\n${ticket.description}\n${ticket.conversation || ''}`;
        const autoSolution = await knowledgeBaseService.generateAutoSolution(ticketId, ticketContent);
        
        if (autoSolution) {
          console.log('Auto-solution generated, updating ticket with solution:', autoSolution.id);
          
          // Update ticket with auto-solution
          await supabase
            .from('tickets')
            .update({
              auto_solution_id: autoSolution.id,
              solution_confidence: autoSolution.confidence_score,
              solution_type: autoSolution.solution_type
            })
            .eq('id', ticketId);
            
          console.log('Ticket updated with auto-solution');
          
          // Add the auto-generated solution as a suggested reply if confidence is high
          if (autoSolution.confidence_score > 0.7) {
            // Strip HTML tags and clean the solution content
            const cleanSolutionContent = autoSolution.solution_content
              .replace(/<[^>]*>/g, '') // Remove HTML tags
              .replace(/\s+/g, ' ') // Normalize whitespace
              .trim();
              
            // Get current suggested replies
            const currentTicket = await this.getTicket(ticketId);
            if (currentTicket) {
              // Make sure current suggested_replies is an array
              const currentReplies = Array.isArray(currentTicket.suggested_replies) 
                ? currentTicket.suggested_replies 
                : [];
                
              // Create updated replies array with the new solution at the beginning
              const updatedReplies = [
                cleanSolutionContent,
                ...currentReplies
              ].slice(0, 5); // Keep only top 5 suggestions

              // Ensure all replies are clean strings
              const sanitizedReplies = updatedReplies
                .filter(reply => typeof reply === 'string' && reply.trim().length > 0)
                .map(reply => reply.replace(/[\x00-\x1F\x7F]/g, '').trim()); // Remove control characters
              
              // Make sure we're sending a valid JSON array
              console.log('Updating ticket with sanitized replies from auto-solution:', JSON.stringify(sanitizedReplies));
              
              try {
                await supabase
                  .from('tickets')
                  .update({ suggested_replies: sanitizedReplies })
                  .eq('id', ticketId);
              } catch (updateError) {
                console.error('Failed to update suggested_replies with auto-solution:', updateError);
              }
            }
          }
        } else {
          console.log('No auto-solution generated for ticket');
        }
      } catch (updateError) {
        console.error('Failed to update ticket with AI analysis or auto-solution:', updateError);
      }
    } catch (error) {
      console.error('Failed to perform AI analysis:', error);
    }
  }

  // סימון הודעות לקוח כנקראו
  async markMessagesAsRead(ticketId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      console.log('Supabase not configured, skipping markMessagesAsRead');
      return;
    }

    try {
      await supabase
        .from('tickets')
        .update({ has_unread_customer_messages: false })
        .eq('id', ticketId);
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      // אם העמודה לא קיימת, נמשיך בלי לזרוק שגיאה
      // זה מאפשר למערכת לעבוד גם אם העמודה עדיין לא קיימת בבסיס הנתונים
    }
  }

  // סימון הודעות נציג כנקראו על ידי הלקוח
  async markAgentMessagesAsRead(ticketId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      console.log('Supabase not configured, skipping markAgentMessagesAsRead');
      return;
    }

    try {
      await supabase
        .from('tickets')
        .update({ has_unread_agent_messages: false })
        .eq('id', ticketId);
    } catch (error) {
      console.error('Failed to mark agent messages as read:', error);
      // אם העמודה לא קיימת, נמשיך בלי לזרוק שגיאה
      // זה מאפשר למערכת לעבוד גם אם העמודה עדיין לא קיימת בבסיס הנתונים
    }
  }
}

export const ticketService = new TicketService();
