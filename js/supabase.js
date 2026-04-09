export const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
export const SUPABASE_KEY = "SUA_PUBLIC_KEY";

export const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
