import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (import.meta.env.VITE_PUBLIC_SUPABASE_URL as string) ||
  'https://nxzdytwemagrzdjghucj.supabase.co';
const supabaseAnonKey =
  (import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string) ||
  'sb_publishable_T0vB-tz5lpCdBL9TZq1eUA_sXz3W5ir';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});