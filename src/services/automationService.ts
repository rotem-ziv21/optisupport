import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Automation, Trigger, Action, TriggerType, ActionType } from '../types/automation';
import { ticketService } from './ticketService';

class AutomationService {
  // קבלת כל האוטומציות
  async getAutomations(): Promise<Automation[]> {
    // אם סופרבייס לא מוגדר, החזר נתונים לדוגמה
    if (!isSupabaseConfigured || !supabase) {
      return this.getMockAutomations();
    }

    try {
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch automations: ${error.message}`);
      }

      return data as Automation[];
    } catch (error) {
      console.warn('Supabase connection failed, using mock data:', error);
      return this.getMockAutomations();
    }
  }

  // קבלת אוטומציה לפי מזהה
  async getAutomation(id: string): Promise<Automation | null> {
    // אם סופרבייס לא מוגדר, החזר נתונים לדוגמה
    if (!isSupabaseConfigured || !supabase) {
      const mockAutomations = this.getMockAutomations();
      return mockAutomations.find(automation => automation.id === id) || null;
    }

    try {
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch automation: ${error.message}`);
      }

      return data as Automation;
    } catch (error) {
      console.warn('Supabase connection failed, using mock data:', error);
      const mockAutomations = this.getMockAutomations();
      return mockAutomations.find(automation => automation.id === id) || null;
    }
  }

  // יצירת אוטומציה חדשה
  async createAutomation(automationData: Omit<Automation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Automation> {
    // אם סופרבייס לא מוגדר, החזר נתונים לדוגמה
    if (!isSupabaseConfigured || !supabase) {
      const newAutomation: Automation = {
        ...automationData,
        id: Math.random().toString(36).substring(2, 11),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newAutomation;
    }

    try {
      const { data, error } = await supabase
        .from('automations')
        .insert([{
          name: automationData.name,
          description: automationData.description,
          is_active: automationData.isActive,
          trigger: automationData.trigger,
          actions: automationData.actions,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create automation: ${error.message}`);
      }

      return data as Automation;
    } catch (error) {
      console.warn('Supabase connection failed:', error);
      throw new Error('Failed to create automation');
    }
  }

  // עדכון אוטומציה קיימת
  async updateAutomation(id: string, automationData: Partial<Automation>): Promise<Automation> {
    // אם סופרבייס לא מוגדר, החזר נתונים לדוגמה
    if (!isSupabaseConfigured || !supabase) {
      const mockAutomations = this.getMockAutomations();
      const automationIndex = mockAutomations.findIndex(automation => automation.id === id);
      if (automationIndex === -1) {
        throw new Error('Automation not found');
      }
      
      const updatedAutomation: Automation = {
        ...mockAutomations[automationIndex],
        ...automationData,
        updatedAt: new Date().toISOString(),
      };
      
      return updatedAutomation;
    }

    try {
      // המרה מ-camelCase ל-snake_case
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      // המרה ידנית של השדות
      if (automationData.name !== undefined) updateData.name = automationData.name;
      if (automationData.description !== undefined) updateData.description = automationData.description;
      if (automationData.isActive !== undefined) updateData.is_active = automationData.isActive;
      if (automationData.trigger !== undefined) updateData.trigger = automationData.trigger;
      if (automationData.actions !== undefined) updateData.actions = automationData.actions;
      
      const { data, error } = await supabase
        .from('automations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update automation: ${error.message}`);
      }

      return data as Automation;
    } catch (error) {
      console.warn('Supabase connection failed:', error);
      throw new Error('Failed to update automation');
    }
  }

  // מחיקת אוטומציה
  async deleteAutomation(id: string): Promise<void> {
    // אם סופרבייס לא מוגדר, אל תעשה כלום
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    try {
      const { error } = await supabase
        .from('automations')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete automation: ${error.message}`);
      }
    } catch (error) {
      console.warn('Supabase connection failed:', error);
      throw new Error('Failed to delete automation');
    }
  }

  // הפעלת אוטומציה באופן ידני
  async triggerAutomation(id: string, context: Record<string, any> = {}): Promise<boolean> {
    try {
      const automation = await this.getAutomation(id);
      if (!automation || !automation.isActive) {
        return false;
      }

      // בדיקת תנאי הטריגר
      if (!this.evaluateTriggerConditions(automation.trigger, context)) {
        return false;
      }

      // הפעלת הפעולות
      for (const action of automation.actions) {
        await this.executeAction(action, context);
      }

      return true;
    } catch (error) {
      console.error('Failed to trigger automation:', error);
      return false;
    }
  }

  // בדיקת תנאי הטריגר
  private evaluateTriggerConditions(trigger: Trigger, context: Record<string, any>): boolean {
    console.log('DEBUG - Evaluating trigger conditions for type:', trigger.type);
    console.log('DEBUG - Context received:', JSON.stringify(context));
    console.log('DEBUG - Trigger conditions:', JSON.stringify(trigger.conditions));
  
    switch (trigger.type) {
      case TriggerType.TICKET_CREATED:
        // Check if this is a new ticket context (either has ticketId or event)
        const isNewTicket = context.ticketId || context.event === 'ticket_created';
        console.log('DEBUG - TICKET_CREATED initial check:', isNewTicket);
        
        if (!isNewTicket) {
          return false;
        }
        
        // Check additional conditions if they exist
        if (trigger.conditions) {
          // Check priority condition
          if (trigger.conditions.priority && context.ticket) {
            const matchesPriority = context.ticket.priority === trigger.conditions.priority;
            console.log('DEBUG - Priority condition check:', {
              required: trigger.conditions.priority,
              actual: context.ticket.priority,
              matches: matchesPriority
            });
            if (!matchesPriority) {
              return false;
            }
          }
          
          // Check status condition
          if (trigger.conditions.status && context.ticket) {
            const matchesStatus = context.ticket.status === trigger.conditions.status;
            console.log('DEBUG - Status condition check:', {
              required: trigger.conditions.status,
              actual: context.ticket.status,
              matches: matchesStatus
            });
            if (!matchesStatus) {
              return false;
            }
          }
          
          // Check category condition
          if (trigger.conditions.category && context.ticket) {
            const matchesCategory = context.ticket.category === trigger.conditions.category;
            console.log('DEBUG - Category condition check:', {
              required: trigger.conditions.category,
              actual: context.ticket.category,
              matches: matchesCategory
            });
            if (!matchesCategory) {
              return false;
            }
          }
        }
        
        console.log('DEBUG - TICKET_CREATED trigger conditions passed');
        return true;
      
      case TriggerType.TICKET_UPDATED:
        return context.event === 'ticket_updated';
      
      case TriggerType.STATUS_CHANGED:
        return (
          context.event === 'ticket_updated' &&
          context.previousStatus !== context.currentStatus &&
          (!trigger.conditions?.status || trigger.conditions.status === context.currentStatus)
        );
      
      case TriggerType.MESSAGE_RECEIVED:
        return context.event === 'message_received';
      
      default:
        console.log('DEBUG - Unknown trigger type:', trigger.type);
        return false;
    }
  }

  // ביצוע פעולה
  private async executeAction(action: Action, context: Record<string, any>): Promise<void> {
    // כאן תהיה לוגיקה לביצוע הפעולה בהתאם לסוג הפעולה
    
    switch (action.type) {
      case ActionType.SEND_EMAIL:
        await this.sendEmail(action.parameters, context);
        break;
      
      case ActionType.UPDATE_TICKET:
        await this.updateTicket(action.parameters, context);
        break;
      
      case ActionType.WEBHOOK:
        if (action.webhook) {
          await this.callWebhook(action.webhook, action.parameters, context);
        }
        break;
      
      default:
        console.warn(`Action type ${action.type} not implemented`);
    }
  }

  // שליחת אימייל
  private async sendEmail(parameters: Record<string, any>, context: Record<string, any>): Promise<void> {
    // כאן תהיה לוגיקה לשליחת אימייל
    console.log('Sending email:', { parameters, context });
    // בפרויקט אמיתי: קריאה לשירות שליחת אימייל
  }

  // עדכון כרטיס
  private async updateTicket(parameters: Record<string, any>, context: Record<string, any>): Promise<void> {
    // כאן תהיה לוגיקה לעדכון כרטיס
    console.log('Updating ticket:', { parameters, context });
    // בפרויקט אמיתי: קריאה לשירות עדכון כרטיסים
  }

  // קריאה ל-webhook
  private async callWebhook(url: string, parameters: Record<string, any>, context: Record<string, any>): Promise<void> {
    try {
      console.log('DEBUG - callWebhook started with URL:', url);
      console.log('DEBUG - Parameters:', JSON.stringify(parameters));
      console.log('DEBUG - Context:', JSON.stringify(context));
      
      // קבלת פרטי הכרטיס המלאים אם יש מזהה כרטיס בקונטקסט
      let ticketData = {};
      
      if (context.ticketId) {
        console.log('DEBUG - Found ticketId in context:', context.ticketId);
        try {
          // קבלת פרטי הכרטיס המלאים
          const ticket = await ticketService.getTicket(context.ticketId);
          console.log('DEBUG - Retrieved ticket:', ticket ? 'success' : 'null');
          
          // שליחת הכרטיס המלא כמו שהוא, ללא שינויים
          if (ticket) {
            ticketData = ticket;
            console.log('DEBUG - Ticket data prepared for webhook');
          }
        } catch (ticketError) {
          console.warn('DEBUG - Failed to fetch ticket details for webhook:', ticketError);
        }
      } else {
        console.log('DEBUG - No ticketId in context, skipping ticket data fetch');
      }
      
      // שליחת נתונים ל-webhook עם כל הפרטים
      console.log('DEBUG - Preparing to send webhook request to:', url);
      
      const payload = {
        parameters,
        context,
        ticket: ticketData,
        timestamp: new Date().toISOString(),
      };
      
      console.log('DEBUG - Webhook payload prepared:', JSON.stringify(payload).substring(0, 200) + '...');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('DEBUG - Webhook response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Webhook call failed with status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('DEBUG - Webhook called successfully:', url);
      console.log('DEBUG - Webhook response:', responseText.substring(0, 200));
    } catch (error) {
      console.error('DEBUG - Failed to call webhook:', error);
    }
  }

  // נתונים לדוגמה
  private getMockAutomations(): Automation[] {
    return [
      {
        id: 'auto-1',
        name: 'סגירה אוטומטית של כרטיסים לא פעילים',
        description: 'סגירה אוטומטית של כרטיסים שלא היתה בהם פעילות למעלה מ-7 ימים',
        isActive: true,
        createdAt: '2025-07-01T10:00:00Z',
        updatedAt: '2025-07-01T10:00:00Z',
        trigger: {
          id: 'trigger-1',
          name: 'כרטיס לא פעיל',
          type: TriggerType.SCHEDULED,
          description: 'בדיקה יומית של כרטיסים לא פעילים',
          conditions: {
            inactiveDays: 7,
            status: 'open',
          },
        },
        actions: [
          {
            id: 'action-1',
            name: 'סגירת כרטיס',
            type: ActionType.UPDATE_TICKET,
            description: 'סגירת הכרטיס',
            parameters: {
              status: 'closed',
              addComment: true,
              comment: 'כרטיס זה נסגר אוטומטית עקב חוסר פעילות למעלה מ-7 ימים.',
            },
          },
          {
            id: 'action-2',
            name: 'שליחת הודעת אימייל',
            type: ActionType.SEND_EMAIL,
            description: 'שליחת הודעת אימייל ללקוח',
            parameters: {
              template: 'ticket_closed_inactivity',
              to: '{{customer.email}}',
              subject: 'הכרטיס שלך נסגר עקב חוסר פעילות',
            },
          },
        ],
      },
      {
        id: 'auto-2',
        name: 'התראה על כרטיסים בעדיפות גבוהה',
        description: 'שליחת התראה לצוות כאשר נפתח כרטיס בעדיפות גבוהה',
        isActive: true,
        createdAt: '2025-07-05T14:30:00Z',
        updatedAt: '2025-07-05T14:30:00Z',
        trigger: {
          id: 'trigger-2',
          name: 'כרטיס בעדיפות גבוהה',
          type: TriggerType.TICKET_CREATED,
          description: 'כרטיס חדש נפתח עם עדיפות גבוהה',
          conditions: {
            priority: 'high',
          },
        },
        actions: [
          {
            id: 'action-3',
            name: 'שליחת התראה',
            type: ActionType.SEND_NOTIFICATION,
            description: 'שליחת התראה לצוות',
            parameters: {
              channel: 'team',
              message: 'כרטיס חדש בעדיפות גבוהה: {{ticket.title}}',
            },
          },
          {
            id: 'action-4',
            name: 'קריאה ל-webhook',
            type: ActionType.WEBHOOK,
            description: 'קריאה לשירות חיצוני',
            parameters: {
              data: {
                ticketId: '{{ticket.id}}',
                priority: '{{ticket.priority}}',
                title: '{{ticket.title}}',
              },
            },
            webhook: 'https://example.com/api/high-priority-ticket',
          },
        ],
      },
      {
        id: 'auto-3',
        name: 'webhook לכל כרטיס חדש',
        description: 'שליחת webhook כאשר נפתח כרטיס חדש (בכל עדיפות)',
        isActive: true,
        createdAt: '2025-07-13T10:00:00Z',
        updatedAt: '2025-07-13T10:00:00Z',
        trigger: {
          id: 'trigger-3',
          name: 'כרטיס חדש',
          type: TriggerType.TICKET_CREATED,
          description: 'כל כרטיס חדש שנפתח',
          conditions: {}, // אין תנאים מיוחדים - כל כרטיס
        },
        actions: [
          {
            id: 'action-5',
            name: 'webhook כרטיס חדש',
            type: ActionType.WEBHOOK,
            description: 'שליחת webhook עם פרטי הכרטיס החדש',
            parameters: {
              ticketData: {
                id: '{{ticket.id}}',
                title: '{{ticket.title}}',
                priority: '{{ticket.priority}}',
                status: '{{ticket.status}}',
                customer: '{{ticket.customer_name}}',
                description: '{{ticket.description}}'
              },
            },
            webhook: 'https://webhook.site/test-new-ticket',
          },
        ],
      },
    ];
  }
}

export const automationService = new AutomationService();
