-- Create table for telegram connections
CREATE TABLE IF NOT EXISTS public.telegram_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'disconnected',
    session_string TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.telegram_connections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own connection"
ON public.telegram_connections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connection"
ON public.telegram_connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connection"
ON public.telegram_connections FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at (using the function created in previous migration)
CREATE TRIGGER set_telegram_connections_updated_at
BEFORE UPDATE ON public.telegram_connections
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();