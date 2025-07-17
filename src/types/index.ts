export interface AgentAction {
  id: string;
  content: string;
  timestamp: string;
  agent_name?: string;
}

export interface Ticket {
  id: string;
  ticket_number?: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'general' | 'feature_request';
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  company_name?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  in_progress_at?: string; // זמן מעבר לטיפול
  resolved_at?: string; // זמן פתרון הכרטיס
  tags: string[];
  sentiment_score: number;
  risk_level: 'low' | 'medium' | 'high';
  ai_summary?: string;
  suggested_replies?: string[];
  solution?: string; // Solution provided by the agent
  agent_actions?: string | AgentAction[]; // Support both string (legacy) and array of actions
  conversation: Message[];
  has_unread_customer_messages?: boolean; // האם יש הודעות לקוח שלא נקראו
  has_unread_agent_messages?: boolean; // האם יש הודעות נציג שלא נקראו
}

export interface Message {
  id: string;
  ticket_id: string;
  content: string;
  sender: 'customer' | 'agent' | 'system';
  sender_name: string;
  created_at: string;
  is_ai_suggested?: boolean;
  // השדות הבאים אינם קיימים בטבלה הנוכחית בסופרבייס
  // אנחנו משאירים אותם במודל לצורך הרחבה עתידית
  // בינתיים אנחנו משתמשים בתוכן ההודעה כדי לסמן הודעות שנשלחו ללקוח
  sent_to_customer?: boolean;
  delivery_status?: 'pending' | 'sent' | 'delivered' | 'failed';
  delivery_time?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'agent' | 'manager';
  avatar_url?: string;
  created_at: string;
  is_active: boolean;
  last_active?: string;
  permissions?: Record<string, boolean>;
}

export interface UserActivity {
  id: string;
  user_id: string;
  action_type: 'ticket_update' | 'message_sent' | 'status_change' | 'ticket_assigned' | 'login' | 'logout' | 'ticket_created' | 'ticket_resolved';
  action_details: Record<string, any>;
  related_ticket_id?: string;
  created_at: string;
  ip_address?: string;
}

export interface UserActivityWithDetails extends UserActivity {
  user: User;
  ticket?: Ticket;
}

export interface AIAnalysis {
  classification: {
    category: string;
    priority: string;
    confidence: number;
  };
  sentiment: {
    score: number;
    label: 'positive' | 'neutral' | 'negative';
    confidence: number;
  };
  risk_assessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  summary: string;
  suggested_tags: string[];
  suggested_replies: string[];
}

export interface DashboardStats {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_today: number;
  avg_response_time: number;
  satisfaction_score: number;
  high_risk_tickets: number;
  ai_accuracy: number;
}

export interface KnowledgeBaseItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  source_type: 'document' | 'faq' | 'manual' | 'url';
  source_url?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  metadata: {
    author?: string;
    version?: string;
    language?: string;
    file_type?: string;
  };
}

export interface KnowledgeChunk {
  id: string;
  kb_item_id: string;
  content: string;
  chunk_index: number;
  embedding?: number[];
  created_at: string;
}

export interface KnowledgeSearchResult {
  chunk: KnowledgeChunk;
  kb_item: KnowledgeBaseItem;
  similarity_score: number;
  relevance_explanation?: string;
}

export interface AutoSolution {
  id: string;
  ticket_id: string;
  solution_type: 'automatic' | 'suggested' | 'escalated';
  confidence_score: number;
  solution_content: string;
  knowledge_sources: KnowledgeSearchResult[];
  created_at: string;
  is_approved?: boolean;
  feedback_score?: number;
}