ALTER TABLE public.telegram_connections 
ADD COLUMN IF NOT EXISTS step_logs JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_error TEXT;

COMMENT ON COLUMN public.telegram_connections.step_logs IS 'History of connection steps (e.g., QR generated, scanned, error)';