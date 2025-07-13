// טיפוסי נתונים לאוטומציות
export interface Trigger {
  id: string;
  name: string;
  type: TriggerType;
  description: string;
  conditions?: Record<string, any>;
}

export interface Action {
  id: string;
  name: string;
  type: ActionType;
  description: string;
  parameters: Record<string, any>;
  webhook?: string; // URL לקריאה חיצונית
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  isActive?: boolean;  // camelCase - משמש בצד הקליינט
  is_active?: boolean; // snake_case - מגיע מהדאטהבייס
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  trigger: Trigger;
  actions: Action[];
}

export enum TriggerType {
  TICKET_CREATED = 'ticket_created',
  TICKET_UPDATED = 'ticket_updated',
  TICKET_CLOSED = 'ticket_closed',
  TICKET_REOPENED = 'ticket_reopened',
  MESSAGE_RECEIVED = 'message_received',
  STATUS_CHANGED = 'status_changed',
  PRIORITY_CHANGED = 'priority_changed',
  CATEGORY_CHANGED = 'category_changed',
  SCHEDULED = 'scheduled',
}

export enum ActionType {
  SEND_EMAIL = 'send_email',
  SEND_SMS = 'send_sms',
  UPDATE_TICKET = 'update_ticket',
  ASSIGN_TICKET = 'assign_ticket',
  ADD_TAG = 'add_tag',
  REMOVE_TAG = 'remove_tag',
  WEBHOOK = 'webhook',
  SEND_NOTIFICATION = 'send_notification',
}
