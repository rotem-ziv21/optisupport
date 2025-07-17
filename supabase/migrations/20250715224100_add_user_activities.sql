-- Create user_activities table to track staff actions
CREATE TABLE IF NOT EXISTS public.user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action_type VARCHAR(50) NOT NULL, -- e.g., 'ticket_update', 'message_sent', 'status_change'
  action_details JSONB NOT NULL DEFAULT '{}',
  related_ticket_id UUID REFERENCES public.tickets(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address VARCHAR(50)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_action_type ON public.user_activities(action_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_related_ticket_id ON public.user_activities(related_ticket_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at);

-- Add RLS policies
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all activities
CREATE POLICY user_activities_select_policy ON public.user_activities
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to insert their own activities
CREATE POLICY user_activities_insert_policy ON public.user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add more fields to users table if needed
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';
