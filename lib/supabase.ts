import { createClient } from "@supabase/supabase-js";

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(envUrl && envAnon);
export const supabaseConfigError = hasSupabaseConfig
  ? ""
  : "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart dev server.";

const url = envUrl ?? "https://placeholder.supabase.co";
const anon = envAnon ?? "placeholder-anon-key";

export const supabase = createClient(url, anon, {
  realtime: { params: { eventsPerSecond: 10 } },
  auth: { persistSession: false },
});
