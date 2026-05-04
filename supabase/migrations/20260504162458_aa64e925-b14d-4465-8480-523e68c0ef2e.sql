-- Tabela de nichos/categorias
CREATE TABLE public.niche_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    keywords TEXT[] NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de grupos garimpados
CREATE TABLE public.scraped_groups (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    niche_id UUID REFERENCES public.niche_categories(id) ON DELETE SET NULL,
    telegram_id TEXT,
    username TEXT,
    title TEXT NOT NULL,
    description TEXT,
    member_count INTEGER DEFAULT 0,
    type TEXT CHECK (type IN ('group', 'channel')),
    is_public BOOLEAN DEFAULT true,
    last_scraped_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, username)
);

-- Habilitar RLS
ALTER TABLE public.niche_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraped_groups ENABLE ROW LEVEL SECURITY;

-- Políticas para nichos
CREATE POLICY "Usuários podem gerenciar seus próprios nichos" 
ON public.niche_categories FOR ALL 
USING (auth.uid() = user_id);

-- Políticas para grupos garimpados
CREATE POLICY "Usuários podem gerenciar seus próprios grupos garimpados" 
ON public.scraped_groups FOR ALL 
USING (auth.uid() = user_id);

-- Trigger para updated_at (reutilizando a função existente se possível ou criando nova com search_path fixo)
CREATE TRIGGER update_scraped_groups_updated_at
BEFORE UPDATE ON public.scraped_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();