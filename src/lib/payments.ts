import { supabase } from '@/lib/supabase';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentState = 'unpaid' | 'partial' | 'paid' | 'refunded';

export interface Booking {
  id: string;
  property_id: string;
  guest_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  nights: number;
  subtotal: number;
  cleaning_fee: number;
  service_fee: number;
  total: number;
  currency: string;
  status: BookingStatus;
  payment_status: PaymentState;
  payment_method: string | null;
  amount_paid: number;
  payment_plan: 'full' | 'installment';
  amount_due_now: number;
  balance_due_date: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  kind: 'full' | 'deposit' | 'balance';
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'needs_review';
  receipt: string | null;
  result_desc: string | null;
  paid_at: string | null;
  created_at: string;
}

export async function getBooking(id: string): Promise<Booking | null> {
  const { data, error } = await supabase.from('bookings').select('*').eq('id', id).maybeSingle();
  if (error) {
    if (error.code === '22P02') return null;
    throw error;
  }
  return (data as Booking | null) ?? null;
}

export async function getPayments(bookingId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Payment[];
}

export async function getPayment(id: string): Promise<Payment | null> {
  const { data, error } = await supabase.from('payments').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as Payment | null) ?? null;
}

/** Asks our server to send the M-Pesa prompt to the guest's phone. Returns the payment id to watch. */
export async function startMpesa(bookingId: string, phone: string): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Please sign in again.');

  const res = await fetch('/api/payments/stk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ bookingId, phone }),
  });
  const json = (await res.json().catch(() => ({}))) as { paymentId?: string; error?: string };
  if (!res.ok || !json.paymentId) throw new Error(json.error ?? 'Could not start the M-Pesa payment.');
  return json.paymentId;
}