import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';

const extra = (Constants?.expoConfig?.extra) || {};
export const SUPABASE_URL = extra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = extra.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) throw new Error('Missing Supabase URL. Set EXPO_PUBLIC_SUPABASE_URL in mobile/.env');
if (!SUPABASE_ANON_KEY) throw new Error('Missing Supabase anon key. Set EXPO_PUBLIC_SUPABASE_ANON_KEY in mobile/.env');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});