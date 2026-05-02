-- Create audit logs table
CREATE TABLE IF NOT EXISTS public.connection_audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    reason TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.connection_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own audit logs" 
ON public.connection_audit_logs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.connection_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.connection_audit_logs(created_at DESC);