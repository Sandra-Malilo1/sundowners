import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Safaricom expects a 200 with this body no matter what happened on our side.
const ack = () => NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });

interface CallbackItem {
  Name: string;
  Value?: string | number;
}

export async function POST(req: NextRequest) {
  // Daraja callbacks are not signed, so the URL we gave Safaricom carries a secret token.
  const token = req.nextUrl.searchParams.get('token');
  if (!process.env.MPESA_CALLBACK_SECRET || token !== process.env.MPESA_CALLBACK_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const payload = await req.json().catch(() => null);
  const cb = payload?.Body?.stkCallback as
    | {
        CheckoutRequestID: string;
        ResultCode: number;
        ResultDesc: string;
        CallbackMetadata?: { Item?: CallbackItem[] };
      }
    | undefined;
  if (!cb?.CheckoutRequestID) return ack();

  const admin = adminClient();
  const { data: pay } = await admin.from('payments').select('*').eq('provider_ref', cb.CheckoutRequestID).maybeSingle();
  if (!pay) return ack();
  if (pay.status !== 'pending') return ack(); // already handled (Safaricom can retry)

  // Failed or cancelled by the customer (1032 = cancelled)
  if (cb.ResultCode !== 0) {
    await admin
      .from('payments')
      .update({ status: cb.ResultCode === 1032 ? 'cancelled' : 'failed', result_desc: cb.ResultDesc })
      .eq('id', pay.id);
    return ack();
  }

  const items = new Map((cb.CallbackMetadata?.Item ?? []).map((i) => [i.Name, i.Value]));
  const received = Number(items.get('Amount'));
  const receipt = items.get('MpesaReceiptNumber') ? String(items.get('MpesaReceiptNumber')) : null;

  // Money arrived but it isn't what we asked for -> a human looks at it
  if (received !== Number(pay.amount)) {
    await admin
      .from('payments')
      .update({ status: 'needs_review', receipt, result_desc: `Expected ${pay.amount}, received ${received}` })
      .eq('id', pay.id);
    return ack();
  }

  const { data: booking } = await admin.from('bookings').select('*').eq('id', pay.booking_id).maybeSingle();
  if (!booking) {
    await admin.from('payments').update({ status: 'needs_review', receipt, result_desc: 'Booking not found' }).eq('id', pay.id);
    return ack();
  }

  // Confirm the booking FIRST, so when the guest's screen sees "succeeded" the booking is already confirmed.
  // (If the 15-minute hold had lapsed and someone else took the dates, this update fails on the overlap rule.)
  const newPaid = Number(booking.amount_paid) + received;
  const { error: bookingError } = await admin
    .from('bookings')
    .update({
      status: 'confirmed',
      cancelled_at: null,
      payment_method: 'mpesa',
      amount_paid: newPaid,
      payment_status: newPaid >= Number(booking.total) ? 'paid' : 'partial',
      expires_at: null,
    })
    .eq('id', booking.id);

  if (bookingError) {
    await admin
      .from('payments')
      .update({
        status: 'needs_review',
        receipt,
        result_desc: `Paid but booking could not be confirmed (refund needed): ${bookingError.message}`,
      })
      .eq('id', pay.id);
    return ack();
  }

  await admin
    .from('payments')
    .update({ status: 'succeeded', receipt, result_desc: cb.ResultDesc, paid_at: new Date().toISOString() })
    .eq('id', pay.id);

  return ack();
}