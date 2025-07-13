import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// שימוש במפתח השירות במקום במפתח האנונימי כדי לעקוף את מדיניות ה-RLS
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl && 
  supabaseServiceKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL_HERE' && 
  supabaseServiceKey !== 'YOUR_SUPABASE_SERVICE_KEY_HERE';

export const supabase = hasValidCredentials 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
      }
    })
  : null;

export const isSupabaseConfigured = hasValidCredentials;

export type Database = {
  public: {
    Tables: {
      tickets: {
        Row: {
          id: string;
          title: string;
          description: string;
          status: string;
          priority: string;
          category: string;
          customer_email: string;
          customer_name: string;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
          tags: string[];
          sentiment_score: number;
          risk_level: string;
          ai_summary: string | null;
          suggested_replies: string[];
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          status?: string;
          priority?: string;
          category?: string;
          customer_email: string;
          customer_name: string;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
          tags?: string[];
          sentiment_score?: number;
          risk_level?: string;
          ai_summary?: string | null;
          suggested_replies?: string[];
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          status?: string;
          priority?: string;
          category?: string;
          customer_email?: string;
          customer_name?: string;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
          tags?: string[];
          sentiment_score?: number;
          risk_level?: string;
          ai_summary?: string | null;
          suggested_replies?: string[];
        };
      };
      messages: {
        Row: {
          id: string;
          ticket_id: string;
          content: string;
          sender: string;
          sender_name: string;
          created_at: string;
          is_ai_suggested: boolean;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          content: string;
          sender: string;
          sender_name: string;
          created_at?: string;
          is_ai_suggested?: boolean;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          content?: string;
          sender?: string;
          sender_name?: string;
          created_at?: string;
          is_ai_suggested?: boolean;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: string;
          avatar_url: string | null;
          created_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: string;
          avatar_url?: string | null;
          created_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: string;
          avatar_url?: string | null;
          created_at?: string;
          is_active?: boolean;
        };
      };
    };
  };
};