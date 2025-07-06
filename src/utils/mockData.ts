import { Ticket, User, DashboardStats } from '../types';

export const mockTickets: Ticket[] = [
  {
    id: '1',
    ticket_number: '6994',
    title: 'Login issues with mobile app',
    description: 'Users are unable to log in to the mobile application. The error message shows "Invalid credentials" even with correct information.',
    status: 'open',
    priority: 'high',
    category: 'technical',
    customer_email: 'sarah.johnson@email.com',
    customer_name: 'Sarah Johnson',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    tags: ['mobile', 'authentication', 'urgent'],
    sentiment_score: -0.6,
    risk_level: 'high',
    ai_summary: 'Customer experiencing authentication issues on mobile app. High frustration level detected.',
    suggested_replies: [
      'I apologize for the login issues. Let me help you troubleshoot this immediately.',
      'This appears to be a known issue with our mobile app. We\'re working on a fix.',
      'Can you please try clearing your app cache and let me know if that helps?'
    ],
    agent_actions: 'בדקתי את לוגי השרת - נמצאה בעיה בשירות האימות. העברתי לצוות הפיתוח לתיקון דחוף.',
    conversation: [
      {
        id: '1',
        ticket_id: '1',
        content: 'I cannot log into the mobile app at all. This is very frustrating!',
        sender: 'customer',
        sender_name: 'Sarah Johnson',
        created_at: '2024-01-15T10:30:00Z'
      }
    ]
  },
  {
    id: '2',
    ticket_number: '6995',
    title: 'Billing discrepancy on last invoice',
    description: 'There appears to be a charge on my latest invoice that I do not recognize. Can you please help clarify?',
    status: 'in_progress',
    priority: 'medium',
    category: 'billing',
    customer_email: 'mike.chen@email.com',
    customer_name: 'Mike Chen',
    assigned_to: 'agent-1',
    created_at: '2024-01-15T09:15:00Z',
    updated_at: '2024-01-15T11:20:00Z',
    tags: ['billing', 'invoice', 'clarification'],
    sentiment_score: 0.1,
    risk_level: 'medium',
    ai_summary: 'Customer inquiry about billing discrepancy. Moderate concern level.',
    suggested_replies: [
      'I\'ll review your invoice details and get back to you with a breakdown.',
      'Let me check your account history to identify the charge in question.',
      'I understand your concern about the billing discrepancy. Let me investigate this for you.'
    ],
    agent_actions: 'בדקתי את היסטוריית החיובים - נמצא חיוב כפול בטעות. יצרתי זיכוי מלא שיופיע בחשבון הבא.',
    conversation: [
      {
        id: '2',
        ticket_id: '2',
        content: 'I noticed an unexpected charge on my invoice. Can you help me understand what this is for?',
        sender: 'customer',
        sender_name: 'Mike Chen',
        created_at: '2024-01-15T09:15:00Z'
      },
      {
        id: '3',
        ticket_id: '2',
        content: 'I\'ll review your account and get back to you shortly with details.',
        sender: 'agent',
        sender_name: 'Support Agent',
        created_at: '2024-01-15T11:20:00Z'
      }
    ]
  },
  {
    id: '3',
    ticket_number: '6996',
    title: 'Feature request: Dark mode support',
    description: 'Would love to see dark mode support in the application. Many users have been requesting this feature.',
    status: 'open',
    priority: 'low',
    category: 'feature_request',
    customer_email: 'alex.rivera@email.com',
    customer_name: 'Alex Rivera',
    created_at: '2024-01-15T08:45:00Z',
    updated_at: '2024-01-15T08:45:00Z',
    tags: ['feature-request', 'ui', 'enhancement'],
    sentiment_score: 0.7,
    risk_level: 'low',
    ai_summary: 'Positive feature request for dark mode support. Customer is engaged and providing feedback.',
    suggested_replies: [
      'Thank you for the feedback! Dark mode is definitely on our roadmap.',
      'We appreciate your suggestion. I\'ll make sure our product team sees this.',
      'Great idea! We\'ll consider this for our next major release.'
    ],
    agent_actions: 'העברתי את הבקשה לצוות המוצר. הוספתי את הלקוח לרשימת המעוניינים לקבלת עדכון כשהתכונה תהיה זמינה.',
    conversation: [
      {
        id: '4',
        ticket_id: '3',
        content: 'I would really love to see dark mode support in the app. It would be great for night usage!',
        sender: 'customer',
        sender_name: 'Alex Rivera',
        created_at: '2024-01-15T08:45:00Z'
      }
    ]
  }
];

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'john.doe@company.com',
    name: 'John Doe',
    role: 'admin',
    avatar_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    created_at: '2024-01-01T00:00:00Z',
    is_active: true
  },
  {
    id: '2',
    email: 'jane.smith@company.com',
    name: 'Jane Smith',
    role: 'agent',
    avatar_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    created_at: '2024-01-01T00:00:00Z',
    is_active: true
  }
];

export const mockDashboardStats: DashboardStats = {
  total_tickets: 1247,
  open_tickets: 89,
  in_progress_tickets: 34,
  resolved_today: 23,
  avg_response_time: 2.5,
  satisfaction_score: 4.2,
  high_risk_tickets: 7,
  ai_accuracy: 0.89
};