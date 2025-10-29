// mobile/services/providers.js
import { supabase } from './supabase';

/**
 * Fetch providers from Supabase. RLS may restrict staff.
 * We merge these with static providers + current user in App.js.
 */
export async function fetchProviders() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('user_id, email, role')
    .order('email', { ascending: true });

  if (error) {
    console.error('fetchProviders error', error.message);
    return [];
  }
  return data || [];
}
