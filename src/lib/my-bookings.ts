import { supabase } from '@/lib/supabase';
import type { Booking } from '@/lib/payments';

export interface BookingRow extends Booking {
  properties: { title: string; city: string | null; country: string; cover_url: string | null } | null;
}

export type Bucket = 'upcoming' | 'past' | 'cancelled';

export async function listMyBookings(): Promise<BookingRow[]> {
  const { data: auth } = await supabase.auth.getSession();
  const uid = auth.session?.user.id;
  if (!uid) return [];
  const { data, error } = await supabase
    .from('bookings')
    .select('*, properties(title, city, country, cover_url)')
    .eq('guest_id', uid) // hosts can also read bookings on their listings; here we only want trips this user is taking
    .order('check_in', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as BookingRow[];
}

const isoToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const holdExpired = (b: Booking) =>
  b.status === 'pending' && b.payment_status === 'unpaid' && !!b.expires_at && new Date(b.expires_at) < new Date();

export function bucketOf(b: Booking): Bucket {
  if (b.status === 'cancelled' || holdExpired(b)) return 'cancelled';
  if (b.status === 'completed' || b.check_out < isoToday()) return 'past';
  return 'upcoming';
}

export function statusLabel(b: Booking): { text: string; tone: 'good' | 'warn' | 'bad' | 'muted' } {
  if (b.status === 'cancelled') return { text: 'Cancelled', tone: 'bad' };
  if (holdExpired(b)) return { text: 'Expired', tone: 'bad' };
  if (b.status === 'completed') return { text: 'Completed', tone: 'muted' };
  if (b.status === 'confirmed') {
    return b.payment_status === 'partial' ? { text: 'Confirmed · balance due', tone: 'warn' } : { text: 'Confirmed', tone: 'good' };
  }
  return b.expires_at ? { text: 'Awaiting payment', tone: 'warn' } : { text: 'Awaiting host', tone: 'warn' };
}

export const toneClass = (t: 'good' | 'warn' | 'bad' | 'muted') =>
  t === 'good' ? 'text-emerald-400' : t === 'warn' ? 'text-amber-300' : t === 'bad' ? 'text-red-300' : 'text-emerald-100/60';