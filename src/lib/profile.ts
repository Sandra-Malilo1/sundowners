import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type Verification = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  roles: string[];
  verification: Verification;
  loyalty_points: number;
  wallet_balance: number;
  created_at: string;
}

export async function getMyProfile(): Promise<Profile | null> {
  const { data: auth } = await supabase.auth.getSession();
  const uid = auth.session?.user.id;
  if (!uid) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export const useProfile = () => useQuery({ queryKey: ['profile'], queryFn: getMyProfile });