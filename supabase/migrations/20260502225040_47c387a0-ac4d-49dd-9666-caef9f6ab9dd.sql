-- Function to synchronize status based on session existence
CREATE OR REPLACE FUNCTION public.sync_telegram_connection_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If we have a session string and status is not connected, fix it
    IF NEW.session_string IS NOT NULL AND NEW.session_string <> '' AND NEW.status = 'pending_qr' THEN
        NEW.status := 'connected';
    END IF;
    
    -- If status changes to connected and we don't have a username yet, 
    -- it will be updated by the edge function later, but we keep it connected.
    
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for sync
DROP TRIGGER IF EXISTS tr_sync_telegram_status ON public.telegram_connections;
CREATE TRIGGER tr_sync_telegram_status
BEFORE INSERT OR UPDATE ON public.telegram_connections
FOR EACH ROW
EXECUTE FUNCTION public.sync_telegram_connection_status();

-- Also ensure any existing records with session_string but pending_qr are fixed
UPDATE public.telegram_connections 
SET status = 'connected' 
WHERE session_string IS NOT NULL 
  AND session_string <> '' 
  AND status = 'pending_qr';
