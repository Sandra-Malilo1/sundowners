import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase-admin';
import { stkPush } from '@/lib/mpesa';
import { toMsisdn } from '@/lib/phone';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  try {
    // 1. Who is asking?
    const jwt = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!jwt) return fail('Please sign in.', 401);

    const admin = adminClient();
    const { data: auth, error: authError } = await admin.auth.getUser(jwt);
    if (authError || !auth.user) return fail('Please sign in again.', 401);

    // 2. What are they paying for?
    const body = (await req.json().catch(() => null)) as { bookingId?: string; phone?: string } | null;
    const msisdn = toMsisdn(body?.phone ?? '');
    if (!body?.bookingId) return fail('Missing booking.', 400);
    if (!msisdn) return fail('Enter a valid Safaricom number, e.g. 0712 345 678.', 400);

    const { data: booking } = await admin.from('bookings').select('*').eq('id', body.bookingId).maybeSingle();
    if (!booking || booking.guest_id !== auth.user.id) return fail('Booking not found.', 404);
    if (booking.status !== 'pending' || booking.payment_status !== 'unpaid') {
      return fail('This booking is not waiting for payment.', 409);
    }
    if (booking.expires_at && new Date(booking.expires_at) < new Date()) {
      return fail('This booking hold expired. Please start again.', 409);
    }
    if (booking.currency !== 'KES') return fail('M-Pesa only supports KES bookings.', 400);
    if (!booking.expires_at) {
      // No hold timer = a request-to-book. It can only be paid once the host has accepted (which sets the timer).
      const { data: prop } = await admin.from('properties').select('instant_book').eq('id', booking.property_id).maybeSingle();
      if (!prop?.instant_book) return fail('The host has not accepted this request yet.', 409);
    }

    // 3. Don't spam the guest's phone
    const since = new Date(Date.now() - 60_000).toISOString();
    const { data: recent } = await admin
      .from('payments')
      .select('id')
      .eq('booking_id', booking.id)
      .eq('status', 'pending')
      .gte('created_at', since)
      .limit(1);
    if (recent && recent.length > 0) {
      return fail('A payment prompt was just sent. Check your phone, or wait a minute to try again.', 429);
    }

    // 4. Record the attempt, then ask M-Pesa
    const amount = Math.ceil(Number(booking.amount_due_now));
    const { data: payment, error: insertError } = await admin
      .from('payments')
      .insert({
        booking_id: booking.id,
        user_id: auth.user.id,
        provider: 'mpesa',
        kind: booking.payment_plan === 'installment' ? 'deposit' : 'full',
        amount,
        currency: 'KES',
        phone: msisdn,
      })
      .select('id')
      .single();
    if (insertError || !payment) return fail('Could not record the payment.', 500);

    try {
      const stk = await stkPush({
        phone: msisdn,
        amount,
        reference: `SDS${booking.id.slice(0, 8).toUpperCase()}`,
        description: 'Sundowner stay',
      });
      await admin
        .from('payments')
        .update({ provider_ref: stk.checkoutRequestId, merchant_ref: stk.merchantRequestId })
        .eq('id', payment.id);
      await admin.from('bookings').update({ payment_method: 'mpesa' }).eq('id', booking.id);
      return NextResponse.json({ paymentId: payment.id });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'M-Pesa request failed';
      await admin.from('payments').update({ status: 'failed', result_desc: message }).eq('id', payment.id);
      return fail(message, 502);
    }
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Server error', 500);
  }
}