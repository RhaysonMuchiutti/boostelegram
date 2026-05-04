CREATE TYPE import_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'stopped');

CREATE TABLE public.import_tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id TEXT NOT NULL,
    group_title TEXT,
    participants_list TEXT NOT NULL,
    total_count INTEGER NOT NULL DEFAULT 0,
    added_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    processed_count INTEGER NOT NULL DEFAULT 0,
    current_offset INTEGER NOT NULL DEFAULT 0,
    status import_status NOT NULL DEFAULT 'pending',
    results JSONB DEFAULT '[]'::jsonb,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.import_tasks ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Usuários podem ver suas próprias tarefas" 
ON public.import_tasks FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias tarefas" 
ON public.import_tasks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias tarefas" 
ON public.import_tasks FOR UPDATE 
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_import_tasks_updated_at
BEFORE UPDATE ON public.import_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();