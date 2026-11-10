import { supabase } from '@/lib/supabase';
import type { Booking } from '@/lib/payments';

export interface HostBooking extends Booking {
  properties: { title: string; city: string | null; cover_url: string | null; host_id: string } | null;
  guest_name: string | null;
}

export type HostTab = 'requests' | 'awaiting' | 'upcoming' | 'past' | 'cancelled';

export const HOST_TABS: { key: HostTab; label: string }[] = [
  { key: 'requests', label: 'Requests' },
  { key: 'awaiting', label: 'Awaiting payment' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
];

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function tabOf(b: HostBooking): HostTab {
  const expired = !!b.expires_at && new Date(b.expires_at) < new Date();
  if (b.status === 'cancelled') return 'cancelled';
  if (b.status === 'pending' && b.payment_status === 'unpaid') {
    if (!b.expires_at) return 'requests';
    return expired ? 'cancelled' : 'awaiting';
  }
  if (b.status === 'completed' || b.check_out < today()) return 'past';
  return 'upcoming';
}

/** What the host takes home before any payout fees: nightly total + cleaning fee (the 10% service fee is ours). */
export const hostEarning = (b: Booking) => Number(b.subtotal) + Number(b.cleaning_fee);

export async function getHostBookings(): Promise<HostBooking[]> {
  const { data: auth } = await supabase.auth.getSession();
  const uid = auth.session?.user.id;
  if (!uid) return [];

  const { data, error } = await supabase
    .from('bookings')
    .select('*, properties!inner(title, city, cover_url, host_id)')
    .eq('properties.host_id', uid)
    .order('check_in', { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as unknown as Omit<HostBooking, 'guest_name'>[];

  const ids = [...new Set(rows.map((r) => r.guest_id))];
  const names = new Map<string, string | null>();
  if (ids.length > 0) {
    const { data: people } = await supabase.from('public_profiles').select('id, full_name').in('id', ids);
    (people ?? []).forEach((p: { id: string; full_name: string | null }) => names.set(p.id, p.full_name));
  }
  return rows.map((r) => ({ ...r, guest_name: names.get(r.guest_id) ?? null }));
}

export async function respondToRequest(bookingId: string, accept: boolean) {
  const { error } = await supabase.rpc('host_respond_booking', { p_booking: bookingId, p_accept: accept });
  if (error) throw error;
}

export async function hostCancelBooking(bookingId: string) {
  const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
  if (error) throw error;
}