-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.consent_status AS ENUM ('granted', 'revoked', 'pending');

-- Profiles/Users (Admin)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Campaigns
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  niche TEXT,
  slug TEXT UNIQUE NOT NULL,
  promise_title TEXT,
  promise_subtitle TEXT,
  cta_text TEXT DEFAULT 'Entrar pelo Telegram',
  telegram_group_link TEXT,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0
);

-- Leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  telegram_id BIGINT UNIQUE,
  full_name TEXT,
  username TEXT,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  interest TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  consent_status public.consent_status DEFAULT 'pending',
  consent_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Segments
CREATE TABLE public.segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  telegram_link TEXT NOT NULL
);

-- Message Campaigns
CREATE TABLE public.message_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  segment_id UUID REFERENCES public.segments(id),
  status TEXT DEFAULT 'draft',
  sent_count INTEGER DEFAULT 0
);

-- Consent Logs
CREATE TABLE public.consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'opt-in', 'opt-out'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  ip_address TEXT,
  user_agent TEXT
);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

-- Simple policies for MVP
CREATE POLICY "Admins can see everything" ON public.campaigns FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins can see leads" ON public.leads FOR ALL TO authenticated USING (true);
