-- Garante que telegram_id seja obrigatório
ALTER TABLE public.scraped_groups ALTER COLUMN telegram_id SET NOT NULL;

-- Remove índice único antigo se existir (geralmente criado implicitamente pela PK ou constraint anterior)
-- Se 'telegram_id' era a chave única, vamos manter, mas adicionar o username como fallback no upsert logic
-- Para garantir integridade total via DB:
ALTER TABLE public.scraped_groups DROP CONSTRAINT IF EXISTS scraped_groups_telegram_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_scraped_groups_dedup ON public.scraped_groups (telegram_id);
