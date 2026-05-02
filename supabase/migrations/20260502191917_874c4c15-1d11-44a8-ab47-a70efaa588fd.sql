-- Create table for telegram credentials
CREATE TABLE IF NOT EXISTS public.telegram_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    api_id TEXT NOT NULL,
    api_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.telegram_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own credentials"
ON public.telegram_credentials FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credentials"
ON public.telegram_credentials FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credentials"
ON public.telegram_credentials FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credentials"
ON public.telegram_credentials FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.telegram_credentials
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();