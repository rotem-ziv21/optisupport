import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Automation, Trigger, Action, TriggerType, ActionType } from '../types/automation';
import { ticketService } from './ticketService';

class AutomationService {
  // קבלת כל האוטומציות
  async getAutomations(): Promise<Automation[]> {
    console.log('DEBUG - getAutomations called');
    
    // אם סופרבייס לא מוגדר, החזר נתונים לדוגמה
    if (!isSupabaseConfigured || !supabase) {
      console.log('DEBUG - Supabase not configured, using mock automations');
      return this.getMockAutomations();
    }

    // Always use mock data for automations since tables don't exist in Supabase
    console.log('DEBUG - Using mock automations (automation tables not implemented in DB)');
    return this.getMockAutomations();
  }

  // קבלת אוטומציה לפי מזהה
  async getAutomation(id: string): Promise<Automation | null> {
    console.log('DEBUG - getAutomation called for ID:', id);
  
    // Always use mock data for automations since tables don't exist in Supabase
    console.log('DEBUG - Using mock automation data (automation tables not implemented in DB)');
    const mockAutomations = this.getMockAutomations();
    const mockAutomation = mockAutomations.find(automation => automation.id === id) || null;
    console.log('DEBUG - Found mock automation:', mockAutomation ? 'yes' : 'no');
    return mockAutomation;
  }

  // יצירת אוטומציה חדשה
  async createAutomation(automationData: Omit<Automation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Automation> {
    console.log('DEBUG - createAutomation called with data:', JSON.stringify(automationData));
  
    // Always create mock automation since automation tables don't exist in Supabase
    console.log('DEBUG - Creating mock automation (automation tables not implemented in DB)');
    const newId = `auto-${Date.now()}`;
    
    // וודא שיש id לטריגר ולפעולות
    const trigger = {
      ...automationData.trigger,
      id: automationData.trigger.id || `trigger-${Date.now()}`
    };
    
    const actions = automationData.actions.map((action, index) => ({
      ...action,
      id: action.id || `action-${Date.now()}-${index}`
    }));
    
    const newAutomation: Automation = {
      ...automationData,
      id: newId,
      trigger,
      actions,
      isActive: automationData.isActive !== undefined ? automationData.isActive : true,
      is_active: automationData.isActive !== undefined ? automationData.isActive : true,
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log('DEBUG - Created mock automation:', JSON.stringify(newAutomation));
    return newAutomation;
  }

  // עדכון אוטומציה קיימת
  async updateAutomation(id: string, automationData: Partial<Automation>): Promise<Automation> {
    console.log('DEBUG - updateAutomation called with ID:', id);
    console.log('DEBUG - automationData:', JSON.stringify(automationData));
  
    // אם סופרבייס לא מוגדר, החזר נתונים לדוגמה
    if (!isSupabaseConfigured || !supabase) {
      console.log('DEBUG - Supabase not configured, using mock data');
      const mockAutomations = this.getMockAutomations();
      const automationIndex = mockAutomations.findIndex(automation => automation.id === id);
      if (automationIndex === -1) {
        console.error('DEBUG - Automation not found with ID:', id);
        throw new Error('Automation not found');
      }
    
      const updatedAutomation: Automation = {
        ...mockAutomations[automationIndex],
        ...automationData,
        updatedAt: new Date().toISOString(),
      };
    
      console.log('DEBUG - Mock automation updated successfully');
      return updatedAutomation;
    }

    try {
      console.log('DEBUG - Updating automation in Supabase with ID:', id);
    
      // בדיקה אם האוטומציה קיימת
      const { data: existingData, error: fetchError } = await supabase
        .from('automations')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('DEBUG - Error fetching existing automation:', fetchError.message);
        throw new Error(`Automation not found: ${fetchError.message}`);
      }
    
      if (!existingData) {
        console.error('DEBUG - No automation found with ID:', id);
        throw new Error('Automation not found');
      }
    
      console.log('DEBUG - Existing automation data:', JSON.stringify(existingData));
    
      // המרה מ-camelCase ל-snake_case והכנת הנתונים לעדכון
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString()
      };
    
      // המרה ידנית של השדות הבסיסיים
      if (automationData.name !== undefined) updateData.name = automationData.name;
      if (automationData.description !== undefined) updateData.description = automationData.description;
      if (automationData.isActive !== undefined) updateData.is_active = automationData.isActive;
    
      // טיפול מיוחד בטריגר
      if (automationData.trigger) {
        // וודא שיש id לטריגר
        const trigger = {
          ...automationData.trigger,
          id: automationData.trigger.id || existingData.trigger?.id || `trigger-${Date.now()}`
        };
        updateData.trigger = trigger;
      }
    
      // טיפול מיוחד בפעולות
      if (automationData.actions) {
        // וודא שיש id לכל פעולה
        const actions = automationData.actions.map((action, index) => ({
          ...action,
          id: action.id || `action-${Date.now()}-${index}`
        }));
        updateData.actions = actions;
      }
    
      console.log('DEBUG - Update data prepared:', JSON.stringify(updateData));
    
      // שליחת העדכון לסופרבייס
      const { data, error } = await supabase
        .from('automations')
        .update(updateData)
        .eq('id', id)
        .select('*, trigger(*), actions(*)')
        .single();

      if (error) {
        console.error('DEBUG - Error updating automation:', error.message, error.details, error.hint);
        throw new Error(`Failed to update automation: ${error.message}`);
      }

      if (!data) {
        console.error('DEBUG - No data returned after update');
        throw new Error('Failed to update automation: No data returned');
      }
    
      console.log('DEBUG - Automation updated successfully:', JSON.stringify(data));
    
      // המרת שדות snake_case ל-camelCase לצורך תאימות עם הממשק
      const processedAutomation: Automation = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        isActive: data.is_active, // המרה מ-snake_case ל-camelCase
        is_active: data.is_active, // שמירה גם על השדה המקורי
        createdAt: data.created_at,
        created_at: data.created_at,
        updatedAt: data.updated_at,
        updated_at: data.updated_at,
        trigger: data.trigger,
        actions: data.actions || [],
      };

      return processedAutomation;
    } catch (error: any) {
      console.error('DEBUG - Supabase connection failed:', error);
      throw new Error(`Failed to update automation: ${error.message || error}`);
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
      console.log('DEBUG - triggerAutomation called for automation ID:', id);
      console.log('DEBUG - Context received:', JSON.stringify(context));
      
      const automation = await this.getAutomation(id);
      if (!automation) {
        console.log('DEBUG - Automation not found with ID:', id);
        return false;
      }
      
      // בדיקה אם האוטומציה פעילה - בודקים גם isActive וגם is_active
      const isAutomationActive = automation.isActive === true || automation.is_active === true;
      if (!isAutomationActive) {
        console.log('DEBUG - Automation is not active:', id);
        return false;
      }
      
      // הוספת שדה event לקונטקסט בהתאם לסוג הטריגר
      if (automation.trigger && !context.event) {
        if (automation.trigger.type === TriggerType.TICKET_CREATED) {
          context.event = 'ticket_created';
        } else if (automation.trigger.type === TriggerType.TICKET_UPDATED) {
          context.event = 'ticket_updated';
        } else if (automation.trigger.type === TriggerType.MESSAGE_RECEIVED) {
          context.event = 'message_received';
        }
        console.log('DEBUG - Added event to context:', context.event);
      }

      // בדיקת תנאי הטריגר
      if (!this.evaluateTriggerConditions(automation.trigger, context)) {
        console.log('DEBUG - Trigger conditions not met for automation:', id);
        return false;
      }
      
      console.log('DEBUG - Trigger conditions met, executing actions for automation:', id);

      // הפעלת הפעולות
      for (const action of automation.actions) {
        console.log('DEBUG - Executing action:', action.type, action.name);
        await this.executeAction(action, context);
      }

      console.log('DEBUG - All actions executed successfully for automation:', id);
      return true;
    } catch (error) {
      console.error('DEBUG - Failed to trigger automation:', error);
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
