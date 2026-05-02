import { createClient } from "@supabase/supabase-js";

// Lovable injeta automaticamente essas variáveis de ambiente para o projeto conectado ao Supabase
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
