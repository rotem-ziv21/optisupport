import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Automation, Trigger, Action, TriggerType, ActionType } from '../types/automation';
// הסרת הייבוא של Ticket שלא בשימוש
// import { Ticket } from '../types';
// הסרת הייבוא המעגלי
// import { ticketService } from './ticketService';

export class AutomationService {
  // קבלת כל האוטומציות
  async getAutomations(): Promise<Automation[]> {
    console.log('DEBUG - getAutomations called');
    
    // אם סופרבייס לא מוגדר, החזר נתונים לדוגמה
    if (!isSupabaseConfigured || !supabase) {
      console.log('DEBUG - Supabase not configured, using mock automations');
      return this.getMockAutomations();
    }

    try {
      // בדיקה אם הטבלה קיימת ויצירתה אם לא
      await this.ensureAutomationsTableExists();
      
      console.log('DEBUG - Fetching automations from Supabase');
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('DEBUG - Error fetching automations:', error.message);
        throw new Error(`Failed to fetch automations: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.log('DEBUG - No automations found in database');
        return [];
      }
      
      console.log('DEBUG - Found automations in DB:', data.length);
      
      // המרת שדות snake_case ל-camelCase לצורך תאימות עם הממשק
      const automations: Automation[] = data.map(item => {
        // המרת מחרוזות JSON לאובייקטים
        let trigger = {};
        let actions = [];
        
        try {
          if (item.trigger) {
            // בדיקה אם trigger הוא כבר אובייקט או מחרוזת JSON
            trigger = typeof item.trigger === 'string' ? JSON.parse(item.trigger) : item.trigger;
            console.log('DEBUG - Trigger parsed successfully:', trigger);
          }
        } catch (e) {
          console.error('DEBUG - Error parsing trigger JSON:', e);
          // במקרה של שגיאה, נשתמש באובייקט כמו שהוא
          trigger = item.trigger || {};
        }
        
        try {
          if (item.actions) {
            // בדיקה אם actions הוא כבר אובייקט או מחרוזת JSON
            actions = typeof item.actions === 'string' ? JSON.parse(item.actions) : item.actions;
            console.log('DEBUG - Actions parsed successfully:', actions);
          }
        } catch (e) {
          console.error('DEBUG - Error parsing actions JSON:', e);
          // במקרה של שגיאה, נשתמש באובייקט כמו שהוא
          actions = item.actions || [];
        }
        
        return {
          id: item.id,
          name: item.name,
          description: item.description || '',
          isActive: item.is_active, // המרה מ-snake_case ל-camelCase
          is_active: item.is_active, // שמירה גם על השדה המקורי
          createdAt: item.created_at,
          created_at: item.created_at,
          updatedAt: item.updated_at,
          updated_at: item.updated_at,
          trigger,
          actions: actions || [],
        };
      });
      
      console.log('DEBUG - Processed automations:', automations.length);
      return automations;
    } catch (error) {
      console.warn('DEBUG - Supabase connection failed, using mock data:', error);
      return this.getMockAutomations();
    }
  }
  
  // וודא שטבלת האוטומציות קיימת
  private async ensureAutomationsTableExists(): Promise<void> {
    if (!supabase) return;
    
    try {
      // בדיקה אם הטבלה קיימת ע"י ניסיון לקבל שורה אחת
      const { error } = await supabase
        .from('automations')
        .select('id')
        .limit(1);
      
      if (!error) {
        console.log('DEBUG - Automations table exists');
        return; // הטבלה קיימת
      }
      
      // אם יש שגיאה שאינה קשורה לחוסר טבלה, נציג אותה
      if (!error.message.includes('relation "automations" does not exist') && 
          !error.message.includes('does not exist')) {
        console.error('DEBUG - Error checking automations table:', error.message);
        return;
      }
      
      console.log('DEBUG - Creating automations table');
      
      // ננסה ליצור את הטבלה ישירות דרך SQL
      try {
        // בדיקה אם הפונקציה uuid_generate_v4 קיימת
        const { error: uuidError } = await supabase.rpc('exec_sql', { 
          sql: "SELECT uuid_generate_v4();"
        });
        
        let uuidFunction = 'uuid_generate_v4()';
        if (uuidError) {
          console.log('DEBUG - uuid_generate_v4 not available, using gen_random_uuid() instead');
          uuidFunction = 'gen_random_uuid()';
        }
        
        // יצירת טבלה ישירות ב-SQL
        const createTableSQL = `
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
          
          CREATE TABLE IF NOT EXISTS automations (
            id UUID PRIMARY KEY DEFAULT ${uuidFunction},
            name TEXT NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            trigger TEXT,
            actions TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `;
        
        // ננסה להריץ את ה-SQL ישירות
        const { error: sqlError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
        
        if (sqlError) {
          console.error('DEBUG - Failed to create automations table with exec_sql:', sqlError.message);
          
          // אם הפונקציה exec_sql לא קיימת, ננסה ליצור את הטבלה באמצעות קריאה רגילה לסופרבייס
          if (sqlError.message.includes('function "exec_sql" does not exist')) {
            console.log('DEBUG - exec_sql not available, trying to use REST API');
            
            // ננסה ליצור את הטבלה באמצעות REST API
            // זה לא יעבוד ישירות כי צריך הרשאות מיוחדות, אבל ננסה ליצור את הטבלה בדרך אחרת
            
            // ננסה ליצור את הטבלה ע"י הכנסת נתונים אליה
            // זה ייצור את הטבלה אם היא לא קיימת
            const { error: insertError } = await supabase
              .from('automations')
              .insert([
                {
                  name: 'Test Automation',
                  description: 'This is a test automation to create the table',
                  is_active: true,
                  trigger: JSON.stringify({ type: 'test', conditions: [] }),
                  actions: JSON.stringify([{ type: 'test', config: {} }])
                }
              ]);
            
            if (insertError) {
              console.error('DEBUG - Failed to create automations table via insert:', insertError.message);
            } else {
              console.log('DEBUG - Successfully created automations table via insert');
            }
          }
        } else {
          console.log('DEBUG - Successfully created automations table with SQL');
        }
      } catch (sqlCreateError) {
        console.error('DEBUG - Error during SQL table creation:', sqlCreateError);
      }
    } catch (error) {
      console.error('DEBUG - Error ensuring automations table exists:', error);
    }
  }

  // קבלת אוטומציה לפי מזהה
  async getAutomation(id: string): Promise<Automation | null> {
    console.log('DEBUG - getAutomation called for ID:', id);
  
    // אם סופרבייס לא מוגדר, החזר נתונים לדוגמה
    if (!isSupabaseConfigured || !supabase) {
      console.log('DEBUG - Supabase not configured, using mock data');
      const mockAutomations = this.getMockAutomations();
      const mockAutomation = mockAutomations.find(automation => automation.id === id) || null;
      console.log('DEBUG - Found mock automation:', mockAutomation ? 'yes' : 'no');
      return mockAutomation;
    }

    try {
      // בדיקה אם הטבלה קיימת ויצירתה אם לא
      await this.ensureAutomationsTableExists();
      
      console.log('DEBUG - Fetching automation from Supabase with ID:', id);
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('DEBUG - Error fetching automation:', error.message);
        throw new Error(`Failed to fetch automation: ${error.message}`);
      }

      if (!data) {
        console.log('DEBUG - No automation found with ID:', id);
        return null;
      }
    
      console.log('DEBUG - Automation data from DB:', JSON.stringify(data));
    
      // המרת שדות snake_case ל-camelCase לצורך תאימות עם הממשק
      // המרת מחרוזות JSON לאובייקטים או שימוש באובייקטים קיימים
      let trigger = {};
      let actions = [];
      
      // בדיקה אם ה-trigger הוא כבר אובייקט או מחרוזת JSON
      if (data.trigger) {
        if (typeof data.trigger === 'object') {
          console.log('DEBUG - Trigger is already an object, using as is');
          trigger = data.trigger;
        } else {
          try {
            trigger = JSON.parse(data.trigger);
            console.log('DEBUG - Successfully parsed trigger JSON');
          } catch (e) {
            console.error('DEBUG - Error parsing trigger JSON:', e);
            // אם יש שגיאת פרסור, נשתמש באובייקט ריק
          }
        }
      }
      
      // בדיקה אם ה-actions הם כבר מערך או מחרוזת JSON
      if (data.actions) {
        if (Array.isArray(data.actions)) {
          console.log('DEBUG - Actions is already an array, using as is');
          actions = data.actions;
        } else {
          try {
            actions = JSON.parse(data.actions);
            console.log('DEBUG - Successfully parsed actions JSON');
          } catch (e) {
            console.error('DEBUG - Error parsing actions JSON:', e);
            // אם יש שגיאת פרסור, נשתמש במערך ריק
          }
        }
      }
      
      const automation: Automation = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        isActive: data.is_active, // המרה מ-snake_case ל-camelCase
        is_active: data.is_active, // שמירה גם על השדה המקורי
        createdAt: data.created_at,
        created_at: data.created_at,
        updatedAt: data.updated_at,
        updated_at: data.updated_at,
        trigger,
        actions: actions || [],
      };
    
      console.log('DEBUG - Processed automation:', JSON.stringify(automation));
      return automation;
    } catch (error) {
      console.warn('DEBUG - Supabase connection failed, using mock data:', error);
      const mockAutomations = this.getMockAutomations();
      const mockAutomation = mockAutomations.find(automation => automation.id === id) || null;
      console.log('DEBUG - Found mock automation as fallback:', mockAutomation ? 'yes' : 'no');
      return mockAutomation;
    }
  }

  // יצירת אוטומציה חדשה
  async createAutomation(automationData: Omit<Automation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Automation> {
    console.log('DEBUG - createAutomation called with data:', JSON.stringify(automationData));
  
    // אם סופרבייס לא מוגדר, החזר נתונים לדוגמה
    if (!isSupabaseConfigured || !supabase) {
      console.log('DEBUG - Supabase not configured, creating mock automation');
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

    try {
      // בדיקה אם הטבלה קיימת ויצירתה אם לא
      await this.ensureAutomationsTableExists();
      
      console.log('DEBUG - Creating new automation in Supabase');
      
      // וודא שיש id לטריגר ולפעולות
      const trigger = {
        ...automationData.trigger,
        id: automationData.trigger.id || `trigger-${Date.now()}`
      };
      
      const actions = automationData.actions.map((action, index) => ({
        ...action,
        id: action.id || `action-${Date.now()}-${index}`
      }));
      
      const timestamp = new Date().toISOString();
      const insertData = {
        name: automationData.name,
        description: automationData.description || '',
        is_active: automationData.isActive !== undefined ? automationData.isActive : true,
        trigger: JSON.stringify(trigger),
        actions: JSON.stringify(actions),
        created_at: timestamp,
        updated_at: timestamp,
      };
      
      console.log('DEBUG - Insert data prepared:', JSON.stringify(insertData));
      
      const { data, error } = await supabase
        .from('automations')
        .insert([insertData])
        .select('*')
        .single();

      if (error) {
        console.error('DEBUG - Error creating automation:', error.message, error.details, error.hint);
        throw new Error(`Failed to create automation: ${error.message}`);
      }

      if (!data) {
        console.error('DEBUG - No data returned after insert');
        throw new Error('Failed to create automation: No data returned');
      }
      
      console.log('DEBUG - Automation created successfully:', JSON.stringify(data));
      
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
      throw new Error(`Failed to create automation: ${error.message || error}`);
    }
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
      // בדיקה אם הטבלה קיימת ויצירתה אם לא
      await this.ensureAutomationsTableExists();
      
      console.log('DEBUG - Updating automation in Supabase with ID:', id);
      
      // הכנת נתוני העדכון בפורמט snake_case לסופרבייס
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString()
      };
      if (automationData.name !== undefined) updateData.name = automationData.name;
      if (automationData.description !== undefined) updateData.description = automationData.description;
      if (automationData.isActive !== undefined) updateData.is_active = automationData.isActive;
      if (automationData.trigger) {
        const trigger = {
          ...automationData.trigger,
          id: automationData.trigger.id || `trigger-${Date.now()}`
        };
        updateData.trigger = JSON.stringify(trigger);
      }
      if (automationData.actions) {
        const actions = automationData.actions.map((action, index) => ({
          ...action,
          id: action.id || `action-${Date.now()}-${index}`
        }));
        updateData.actions = JSON.stringify(actions);
      }
      
      console.log('DEBUG - Update data prepared for DB:', JSON.stringify(updateData));
      
      const { data, error } = await supabase
        .from('automations')
        .update(updateData)
        .eq('id', id)
        .select('*')
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
      
      console.log('DEBUG - Found automation:', JSON.stringify(automation));
      
      // בדיקה אם האוטומציה פעילה - בודקים גם isActive וגם is_active
      const isAutomationActive = automation.isActive === true || automation.is_active === true;
      if (!isAutomationActive) {
        console.log('DEBUG - Automation is not active:', id);
        return false;
      }
      
      console.log('DEBUG - Automation is active, checking actions:', JSON.stringify(automation.actions));
      
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

      // בדיקה אם יש פעולות מוגדרות
      if (!automation.actions || automation.actions.length === 0) {
        console.log('DEBUG - No actions defined for automation, creating default webhook action');
        
        // יצירת פעולת webhook ברירת מחדל עם URL מהקונטקסט או URL קבוע לבדיקה
        const defaultAction: Action = {
          id: `default-action-${Date.now()}`,
          name: 'Default Webhook Action',
          type: ActionType.WEBHOOK,
          description: 'Auto-generated webhook action',
          parameters: {
            url: 'https://webhook.site/test-webhook' // URL לבדיקה
          },
          webhook: 'https://webhook.site/test-webhook' // URL לבדיקה
        };
        
        console.log('DEBUG - Executing default webhook action');
        await this.executeAction(defaultAction, context);
      } else {
        // הפעלת הפעולות המוגדרות
        console.log('DEBUG - Found', automation.actions.length, 'actions to execute');
        for (const action of automation.actions) {
          console.log('DEBUG - Executing action:', action.type, action.name);
          await this.executeAction(action, context);
        }
      }

      console.log('DEBUG - All actions executed successfully for automation:', id);
      return true;
    } catch (error) {
      console.error('DEBUG - Failed to trigger automation:', error);
      return false;
    }
  }

  // בדיקת תנאי הטריגר
  private evaluateTriggerConditions(trigger: Trigger | null | undefined, context: Record<string, any>): boolean {
    // אם זה אירוע יצירת כרטיס על ידי לקוח, נוסיף סימון מיוחד
    const isCustomerCreatedTicket = context.ticket?.customer_email && !context.ticket?.assigned_to;
    if (isCustomerCreatedTicket) {
      console.log('DEBUG - This appears to be a customer-created ticket');
    }
    
    // אם אין טריגר מוגדר, נאפשר הפעלה אם זה אירוע יצירת כרטיס
    if (!trigger) {
      console.log('DEBUG - No trigger defined, checking if this is a ticket_created event');
      // אם זה אירוע יצירת כרטיס, נאפשר הפעלה
      if (context.event === 'ticket_created' || context.ticketId) {
        console.log('DEBUG - This is a ticket_created event, allowing execution without trigger');
        return true;
      }
      console.log('DEBUG - Not a ticket_created event, skipping execution');
      return false;
    }
    
    console.log('DEBUG - Evaluating trigger conditions for type:', trigger.type);
    console.log('DEBUG - Context received:', JSON.stringify(context));
    console.log('DEBUG - Trigger conditions:', JSON.stringify(trigger.conditions));
  
    switch (trigger.type) {
      case TriggerType.TICKET_CREATED:
        // Check if this is a new ticket context (either has ticketId or event)
        let isNewTicket = context.ticketId;
        
        // בדיקה אם event הוא מחרוזת או אובייקט
        if (typeof context.event === 'string') {
          isNewTicket = isNewTicket || context.event === 'ticket_created';
        } else if (typeof context.event === 'object' && context.event !== null) {
          // אם event הוא אובייקט, בדוק את שדה ה-type
          isNewTicket = isNewTicket || context.event.type === 'ticket_created';
        }
        
        console.log('DEBUG - TICKET_CREATED initial check:', isNewTicket);
        
        if (!isNewTicket) {
          return false;
        }
        
        // בדיקה אם זה כרטיס שנוצר על ידי לקוח
        const isCustomerCreatedTicket = context.ticket?.customer_email && !context.ticket?.assigned_to;
        
        // Check additional conditions if they exist
        if (trigger.conditions) {
          // אם זה כרטיס שנוצר על ידי לקוח, נתעלם מתנאי priority כי הוא נקבע אוטומטית
          if (trigger.conditions.priority && context.ticket && !isCustomerCreatedTicket) {
            const matchesPriority = context.ticket.priority === trigger.conditions.priority;
            console.log('DEBUG - Priority condition check:', {
              required: trigger.conditions.priority,
              actual: context.ticket.priority,
              matches: matchesPriority,
              isCustomerCreated: isCustomerCreatedTicket
            });
            if (!matchesPriority) {
              return false;
            }
          }
          
          // אם זה כרטיס שנוצר על ידי לקוח, נתעלם מתנאי status כי הוא תמיד 'open'
          if (trigger.conditions.status && context.ticket && !isCustomerCreatedTicket) {
            const matchesStatus = context.ticket.status === trigger.conditions.status;
            console.log('DEBUG - Status condition check:', {
              required: trigger.conditions.status,
              actual: context.ticket.status,
              matches: matchesStatus,
              isCustomerCreated: isCustomerCreatedTicket
            });
            if (!matchesStatus) {
              return false;
            }
          }
          
          // בדיקת קטגוריה - נבדוק גם בכרטיסים שנוצרו על ידי לקוחות
          if (trigger.conditions.category && context.ticket) {
            const matchesCategory = context.ticket.category === trigger.conditions.category;
            console.log('DEBUG - Category condition check:', {
              required: trigger.conditions.category,
              actual: context.ticket.category,
              matches: matchesCategory,
              isCustomerCreated: isCustomerCreatedTicket
            });
            if (!matchesCategory && !isCustomerCreatedTicket) {
              // אם זה לא כרטיס שנוצר על ידי לקוח, נחזיר false
              return false;
            } else if (!matchesCategory && isCustomerCreatedTicket) {
              // אם זה כרטיס שנוצר על ידי לקוח, נתעלם מאי התאמה בקטגוריה
              console.log('DEBUG - Ignoring category mismatch for customer-created ticket');
            }
          }
        }
        
        console.log('DEBUG - TICKET_CREATED trigger conditions passed');
        return true;
      
      case TriggerType.TICKET_UPDATED:
        // בדיקה אם event הוא מחרוזת או אובייקט
        if (typeof context.event === 'string') {
          return context.event === 'ticket_updated';
        } else if (typeof context.event === 'object' && context.event !== null) {
          // אם event הוא אובייקט, בדוק את שדה ה-type
          return context.event.type === 'ticket_updated';
        }
        return false;
      
      case TriggerType.STATUS_CHANGED:
        let isTicketUpdated = false;
        
        // בדיקה אם event הוא מחרוזת או אובייקט
        if (typeof context.event === 'string') {
          isTicketUpdated = context.event === 'ticket_updated';
        } else if (typeof context.event === 'object' && context.event !== null) {
          // אם event הוא אובייקט, בדוק את שדה ה-type
          isTicketUpdated = context.event.type === 'ticket_updated';
        }
        
        return (
          isTicketUpdated &&
          context.previousStatus !== context.currentStatus &&
          (!trigger.conditions?.status || trigger.conditions.status === context.currentStatus)
        );
      
      case TriggerType.MESSAGE_RECEIVED:
      // בדיקה אם event הוא מחרוזת או אובייקט
      if (typeof context.event === 'string') {
        return context.event === 'message_received';
      } else if (typeof context.event === 'object' && context.event !== null) {
        // אם event הוא אובייקט, בדוק את שדה ה-type
        return context.event.type === 'message_received';
      }
      return false;
      
      case TriggerType.TICKET_RESOLVED:
        console.log('DEBUG - Evaluating TICKET_RESOLVED trigger');
        // בדיקה אם זה אירוע של כרטיס שנפתר
        const isTicketResolved = context.ticketResolved || 
                                (context.newStatus === 'resolved') ||
                                (context.ticket?.status === 'resolved');
        
        console.log('DEBUG - TICKET_RESOLVED check:', {
          ticketResolved: context.ticketResolved,
          newStatus: context.newStatus,
          ticketStatus: context.ticket?.status,
          result: isTicketResolved
        });
        
        return isTicketResolved;
      
      default:
        console.log('DEBUG - Unknown trigger type:', trigger.type);
        return false;
    }
  }

  // ביצוע פעולה
  private async executeAction(action: Action, context: Record<string, any>): Promise<void> {
    // כאן תהיה לוגיקה לביצוע הפעולה בהתאם לסוג הפעולה
    console.log('DEBUG - Executing action:', action.type, 'with parameters:', JSON.stringify(action.parameters));
    
    // בדיקה אם יש URL ל-webhook בפעולה, ללא קשר לסוג הפעולה
    const webhookUrl = action.parameters?.url || action.parameters?.webhookUrl || action.webhook;
    if (webhookUrl && (action.type === ActionType.WEBHOOK || !action.type)) {
      console.log('DEBUG - Found webhook URL:', webhookUrl);
      await this.callWebhook(webhookUrl, action.parameters || {}, context);
      return;
    }
    
    switch (action.type) {
      case ActionType.SEND_EMAIL:
        await this.sendEmail(action.parameters, context);
        break;
      
      case ActionType.UPDATE_TICKET:
        await this.updateTicket(action.parameters, context);
        break;
      
      case ActionType.WEBHOOK:
        // בדיקה אם יש URL ב-parameters או ב-webhook
        if (webhookUrl) {
          console.log('DEBUG - Found webhook URL:', webhookUrl);
          await this.callWebhook(webhookUrl, action.parameters || {}, context);
        } else {
          console.error('DEBUG - No webhook URL found in action:', JSON.stringify(action));
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
    console.log('DEBUG - Updating ticket:', { parameters, context });
    
    // בדיקה אם יש מזהה כרטיס בקונטקסט
    if (!context.ticketId) {
      console.warn('DEBUG - Cannot update ticket: No ticketId in context');
      return;
    }
    
    try {
      // במקום לקרוא לשירות, נעדכן ישירות בסופרבייס כדי למנוע תלות מעגלית
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('tickets')
          .update(parameters)
          .eq('id', context.ticketId);
        
        if (error) {
          throw error;
        }
        console.log('DEBUG - Ticket updated successfully in Supabase:', context.ticketId);
      } else {
        console.log('DEBUG - Mock update ticket:', context.ticketId, parameters);
      }
    } catch (error) {
      console.error('DEBUG - Failed to update ticket:', error);
    }
  }
  
  // קריאה ל-webhook
  private async callWebhook(url: string, parameters: Record<string, any>, context: Record<string, any>): Promise<boolean> {
    console.log('DEBUG - callWebhook started with URL:', url);
    console.log('DEBUG - Parameters:', JSON.stringify(parameters));
    console.log('DEBUG - Context:', JSON.stringify(context));
    
    try {      
      // קבלת פרטי הכרטיס המלאים אם יש מזהה כרטיס בקונטקסט
      let ticketData = {};
      
      // אם יש לנו כבר את נתוני הכרטיס בקונטקסט (כמו במקרה של יצירת כרטיס חדש)
      if (context.ticket) {
        ticketData = context.ticket;
        console.log('DEBUG - Using ticket data from context for webhook');
      } else if (context.ticketId) {
        console.log('DEBUG - Found ticketId in context:', context.ticketId);
        console.log('DEBUG - Using ticketId only, not fetching full ticket to avoid circular dependency');
        ticketData = { id: context.ticketId };
      }
      
      // בדיקה אם זה כרטיס שנוצר על ידי לקוח
      const isCustomerCreatedTicket = ticketData && 'customer_email' in ticketData && !('assigned_to' in ticketData && ticketData.assigned_to);
      
      // הכנת הנתונים לשליחה
      const payload = {
        ...parameters,
        ticketData,
        context: {
          timestamp: new Date().toISOString(),
          event_type: context.event || 'unknown_event',
          source: isCustomerCreatedTicket ? 'customer_portal' : 'agent_dashboard',
          is_customer_created: isCustomerCreatedTicket,
          ...context
        }
      };
      
      // לוג מפורט יותר של הנתונים שנשלחים
      console.log('DEBUG - Sending webhook payload to:', url);
      console.log('DEBUG - Payload size:', JSON.stringify(payload).length, 'bytes');
      console.log('DEBUG - Payload preview:', JSON.stringify(payload).substring(0, 200) + (JSON.stringify(payload).length > 200 ? '...' : ''));
      
      // הגדרת timeout לקריאה
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 שניות timeout
      
      try {
        console.log('DEBUG - Executing fetch call to webhook URL:', url);
        
        // ניסיון לבצע את הקריאה באמצעות XMLHttpRequest אם fetch לא זמין
        if (typeof fetch === 'undefined') {
          console.log('DEBUG - fetch API not available, trying XMLHttpRequest');
          return new Promise((resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('User-Agent', 'OptiSupport-Automation/1.0');
            xhr.setRequestHeader('X-Automation-ID', context.automationId || 'unknown');
            
            xhr.onload = function() {
              console.log('DEBUG - XMLHttpRequest completed with status:', xhr.status);
              if (xhr.status >= 200 && xhr.status < 300) {
                console.log('DEBUG - Webhook called successfully via XMLHttpRequest');
                resolve(true);
              } else {
                console.error('DEBUG - Webhook call failed via XMLHttpRequest with status:', xhr.status);
                resolve(false);
              }
            };
            
            xhr.onerror = function() {
              console.error('DEBUG - XMLHttpRequest failed to execute');
              resolve(false);
            };
            
            xhr.ontimeout = function() {
              console.error('DEBUG - XMLHttpRequest timed out');
              resolve(false);
            };
            
            xhr.timeout = 10000; // 10 שניות timeout
            
            try {
              xhr.send(JSON.stringify(payload));
              console.log('DEBUG - XMLHttpRequest sent');
            } catch (xhrError) {
              console.error('DEBUG - Failed to send XMLHttpRequest:', xhrError);
              resolve(false);
            }
          });
        }
        
        // שימוש ב-fetch API
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'OptiSupport-Automation/1.0',
            'X-Automation-ID': context.automationId || 'unknown',
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId); // ביטול ה-timeout אם הקריאה הסתיימה

        console.log('DEBUG - Webhook response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No response text');
          console.error(`DEBUG - Webhook call failed with status: ${response.status}`, errorText.substring(0, 200));
          return false;
        }

        const responseText = await response.text().catch(() => 'No response text');
        console.log('DEBUG - Webhook called successfully:', url);
        console.log('DEBUG - Webhook response:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
        return true;
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error('DEBUG - Webhook call timed out after 10 seconds:', url);
        } else if (fetchError instanceof Error) {
          console.error('DEBUG - Fetch error in webhook call:', fetchError.message);
          console.error('DEBUG - Full error details:', fetchError);
        } else {
          console.error('DEBUG - Unknown fetch error in webhook call:', fetchError);
        }
        
        // ניסיון נוסף עם האובייקט Image לשליחת בקשה בסיסית
        console.log('DEBUG - Trying alternative method with Image object');
        try {
          const img = new Image();
          const queryParams = `?data=${encodeURIComponent(JSON.stringify({ ping: true, timestamp: new Date().toISOString() }))}`;
          img.src = url + queryParams;
          console.log('DEBUG - Image ping sent to:', url + queryParams);
          return true; // מחזירים true כי אין דרך לדעת אם הקריאה הצליחה
        } catch (imgError) {
          console.error('DEBUG - Image ping method failed:', imgError);
          return false;
        }
      }
    } catch (error) {
      console.error('DEBUG - Failed to call webhook:', error);
      return false;
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
      // אוטומציה לדוגמה עם טריגר TICKET_RESOLVED
      {
        id: 'demo-ticket-resolved',
        name: 'שליחת webhook כשכרטיס נפתר',
        description: 'שולח webhook עם פרטי הכרטיס כשהוא נפתר',
        isActive: true,
        is_active: true,
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        trigger: {
          id: 'trigger-resolved',
          name: 'כרטיס נפתר',
          type: TriggerType.TICKET_RESOLVED,
          description: 'מופעל כשכרטיס מקבל סטטוס resolved',
          conditions: {}
        },
        actions: [
          {
            id: 'action-webhook-resolved',
            name: 'שליחת webhook',
            type: ActionType.WEBHOOK,
            description: 'שולח webhook עם פרטי הכרטיס שנפתר',
            parameters: {
              url: 'https://webhook.site/test-resolved-ticket',
              ticketData: {
                id: '{{ticket.id}}',
                title: '{{ticket.title}}',
                priority: '{{ticket.priority}}',
                status: '{{ticket.status}}',
                customer: '{{ticket.customer_name}}',
                customer_email: '{{ticket.customer_email}}',
                description: '{{ticket.description}}',
                resolved_at: '{{ticket.resolved_at}}'
              },
              message: 'Ticket {{ticket.id}} has been resolved'
            },
            webhook: 'https://webhook.site/test-resolved-ticket',
          },
        ],
      },
    ];
  }
}

// יצירת מופע יחיד של השירות
export const automationService = new AutomationService();

// ייצוא ברירת מחדל של השירות
export default automationService;
