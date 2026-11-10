import { supabase } from '@/lib/supabase';
import type { Property } from '@/lib/staycations';

export interface PropertyDetail extends Property {
  host_id: string;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  cleaning_fee: number;
  house_rules: Record<string, unknown>;
  check_in_time: string;
  check_out_time: string;
  min_nights: number;
  max_nights: number | null;
}

export interface HostProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  verification: string;
  created_at: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  guest_name: string | null;
  guest_avatar: string | null;
}

export interface DateRange {
  start_date: string;
  end_date: string; // exclusive
}

/* ---------------------------- queries ---------------------------- */

export async function getProperty(id: string): Promise<PropertyDetail | null> {
  const { data, error } = await supabase.from('properties').select('*').eq('id', id).maybeSingle();
  if (error) {
    if (error.code === '22P02') return null; // not a valid uuid
    throw error;
  }
  return (data as PropertyDetail | null) ?? null;
}

export async function getPhotos(propertyId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('property_photos')
    .select('url, position')
    .eq('property_id', propertyId)
    .order('position');
  if (error) throw error;
  return (data ?? []).map((r: { url: string }) => r.url);
}

export async function getHost(hostId: string): Promise<HostProfile | null> {
  const { data, error } = await supabase
    .from('public_profiles')
    .select('id, full_name, avatar_url, verification, created_at')
    .eq('id', hostId)
    .maybeSingle();
  if (error) throw error;
  return (data as HostProfile | null) ?? null;
}

export async function getReviews(propertyId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, guest_id')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  const rows = (data ?? []) as { id: string; rating: number; comment: string | null; created_at: string; guest_id: string }[];
  if (rows.length === 0) return [];

  const ids = [...new Set(rows.map((r) => r.guest_id))];
  const { data: profs } = await supabase.from('public_profiles').select('id, full_name, avatar_url').in('id', ids);
  const byId = new Map<string, { full_name: string | null; avatar_url: string | null }>(
    (profs ?? []).map((p: { id: string; full_name: string | null; avatar_url: string | null }) => [p.id, p]),
  );
  return rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    guest_name: byId.get(r.guest_id)?.full_name ?? null,
    guest_avatar: byId.get(r.guest_id)?.avatar_url ?? null,
  }));
}

export async function getUnavailable(propertyId: string): Promise<DateRange[]> {
  const { data, error } = await supabase.rpc('get_unavailable_dates', { p_property_id: propertyId });
  if (error) throw error;
  return (data ?? []) as DateRange[];
}

export async function getSimilar(p: PropertyDetail): Promise<Property[]> {
  let q = supabase.from('properties').select('*').eq('status', 'active').neq('id', p.id);
  const citySafe = p.city && /^[\w\s.'-]+$/.test(p.city);
  q = citySafe
    ? q.or(`city.eq.${p.city},property_type.eq.${p.property_type}`)
    : q.eq('property_type', p.property_type);
  const { data, error } = await q.order('rating_avg', { ascending: false }).limit(3);
  if (error) throw error;
  return (data ?? []) as Property[];
}

/* ---------------------------- dates (UTC, 'YYYY-MM-DD') ---------------------------- */

const DAY = 86_400_000;
export const parseISO = (s: string) => new Date(`${s}T00:00:00Z`);
export const toISO = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (s: string, n: number) => toISO(new Date(parseISO(s).getTime() + n * DAY));
export const diffDays = (a: string, b: string) => Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / DAY);
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Every unavailable NIGHT as 'YYYY-MM-DD' (a range's end date is the check-out day, so it is excluded). */
export function buildBlockedSet(ranges: DateRange[]): Set<string> {
  const set = new Set<string>();
  for (const r of ranges) {
    const n = Math.min(diffDays(r.start_date, r.end_date), 800);
    for (let i = 0; i < n; i++) set.add(addDays(r.start_date, i));
  }
  return set;
}

export function rangeBlocked(blocked: Set<string>, checkIn: string, checkOut: string): boolean {
  const n = diffDays(checkIn, checkOut);
  for (let i = 0; i < n; i++) if (blocked.has(addDays(checkIn, i))) return true;
  return false;
}

/* ---------------------------- pricing (display only: the database computes the real total) ---------------------------- */

export const SERVICE_FEE_RATE = 0.1;

export function quote(p: PropertyDetail, checkIn: string, checkOut: string) {
  const nights = diffDays(checkIn, checkOut);
  let subtotal = 0;
  for (let i = 0; i < nights; i++) {
    const dow = parseISO(addDays(checkIn, i)).getUTCDay(); // 5 = Fri, 6 = Sat
    const weekend = (dow === 5 || dow === 6) && p.weekend_price != null;
    subtotal += Number(weekend ? p.weekend_price : p.base_price);
  }
  const cleaning = Number(p.cleaning_fee);
  const service = Math.round(subtotal * SERVICE_FEE_RATE * 100) / 100;
  return { nights, subtotal, cleaning, service, total: subtotal + cleaning + service };
}