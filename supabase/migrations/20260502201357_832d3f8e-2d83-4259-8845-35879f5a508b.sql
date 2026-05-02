ALTER TABLE public.telegram_connections 
ADD COLUMN IF NOT EXISTS telegram_username TEXT;
