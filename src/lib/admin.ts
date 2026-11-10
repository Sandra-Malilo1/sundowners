// SERVER ONLY. Uses the service-role key, which bypasses RLS.
// Never import this file from a component or page that has 'use client'.
import { createClient } from '@supabase/supabase-js';

export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY is not set');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}