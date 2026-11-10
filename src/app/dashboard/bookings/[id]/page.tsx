'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/staycations';
import { getBooking, getPayments } from '@/lib/payments';
import { getHost, getProperty } from '@/lib/property';

const sectionTitle = 'font-serif text-[22px] text-white tracking-tight mb-5';
const labelClass = 'font-mono text-[9px] uppercase tracking-[0.3em] text-emerald-300 mb-2 block';

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

const Shell = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

function BookingView() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const qc = useQueryClient();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const bookingQ = useQuery({ queryKey: ['booking', id], queryFn: () => getBooking(id), staleTime: 0 });
  const b = bookingQ.data;
  const propertyQ = useQuery({ queryKey: ['property', b?.property_id], queryFn: () => getProperty(b!.property_id), enabled: !!b });
  const paymentsQ = useQuery({ queryKey: ['payments', id], queryFn: () => getPayments(id), enabled: !!b, staleTime: 0 });
  const p = propertyQ.data;
  const hostQ = useQuery({ queryKey: ['host', p?.host_id], queryFn: () => getHost(p!.host_id), enabled: !!p });

  if (bookingQ.isLoading) {
    return (
      <Shell>
        <div className="h-96 bg-emerald-900/20 animate-pulse rounded-sm" />
      </Shell>
    );
  }

  if (!b) {
    return (
      <Shell>
        <div className="text-center py-16">
          <h1 className="font-serif text-[32px] text-white mb-4">Booking not found</h1>
          <Link href="/staycations" className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400 border-b border-emerald-400/40 pb-1">Browse stays</Link>
        </div>
      </Shell>
    );
  }

  const holdActive = !b.expires_at || new Date(b.expires_at) > new Date();
  const awaitingPayment = b.status === 'pending' && b.payment_status === 'unpaid' && !!b.expires_at;
  const awaitingHost = b.status === 'pending' && b.payment_status === 'unpaid' && !b.expires_at;
  const balance = Number(b.total) - Number(b.amount_paid);
  const today = new Date().toISOString().slice(0, 10);
  const canCancel = (b.status === 'pending' || b.status === 'confirmed') && b.check_in > today;

  const cancelBooking = async () => {
    setCancelling(true);
    setCancelError('');
    const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', b.id);
    setCancelling(false);
    if (error) return setCancelError(error.message);
    setConfirmCancel(false);
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['booking', id] }),
      qc.invalidateQueries({ queryKey: ['my-bookings'] }),
      qc.invalidateQueries({ queryKey: ['unavailable'] }),
    ]);
  };

  const banner = (() => {
    if (b.status === 'confirmed' || b.status === 'completed')
      return { eyebrow: b.status === 'completed' ? 'Stay completed' : 'Booking confirmed', title: 'You’re all set.', tone: 'text-emerald-400' };
    if (awaitingHost) return { eyebrow: 'Request sent', title: 'Waiting for your host.', tone: 'text-emerald-400' };
    if (awaitingPayment && holdActive) return { eyebrow: 'Payment pending', title: 'Finish paying to confirm.', tone: 'text-amber-300' };
    if (awaitingPayment) return { eyebrow: 'Hold expired', title: 'This booking wasn’t paid in time.', tone: 'text-red-300' };
    return { eyebrow: 'Cancelled', title: 'This booking was cancelled.', tone: 'text-red-300' };
  })();

  const row = 'flex items-center justify-between font-sans text-sm text-emerald-50/80';
  const payments = paymentsQ.data ?? [];

  return (
    <Shell>
      <div>
        <div>
          <p className={`font-mono text-[10px] tracking-[0.4em] uppercase mb-4 flex items-center gap-3 ${banner.tone}`}>
            <span className="w-8 h-px bg-current" /> {banner.eyebrow}
          </p>
          <h1 className="font-serif text-[36px] md:text-[52px] text-white tracking-tighter leading-[1.1] mb-4">{banner.title}</h1>
          {sp.get('paid') && b.status === 'confirmed' && (
            <p className="font-sans text-emerald-50/70 text-[14px] mb-2">Payment received. A receipt is listed below.</p>
          )}
          {sp.get('requested') && awaitingHost && (
            <p className="font-sans text-emerald-50/70 text-[14px] mb-2">You won’t be charged until the host accepts.</p>
          )}

          {awaitingPayment && holdActive && p && (
            <Link
              href={`/staycations/${p.id}/checkout?booking=${b.id}`}
              className="inline-block mt-6 px-10 py-4 rounded-sm font-mono text-[10px] uppercase tracking-[0.2em] text-black font-medium bg-emerald-400 hover:bg-emerald-300 transition-colors"
            >
              Complete payment
            </Link>
          )}

          <div className="mt-14 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 lg:gap-16 items-start">
            <div className="space-y-12">
              {/* Trip card */}
              {p && (
                <section className="glass-panel overflow-hidden">
                  {p.cover_url && <img src={p.cover_url} alt="" className="w-full h-56 object-cover opacity-90" />}
                  <div className="p-7">
                    <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-emerald-300 mb-2">{[p.city, p.country].filter(Boolean).join(' · ')}</p>
                    <h2 className="font-serif text-[28px] text-white mb-6">{p.title}</h2>
                    <div className="grid grid-cols-2 gap-6 font-sans text-[14px] text-emerald-50/80">
                      <div><p className={labelClass}>Check-in</p>{fmtDate(b.check_in)}<br /><span className="text-emerald-100/50">from {p.check_in_time.slice(0, 5)}</span></div>
                      <div><p className={labelClass}>Check-out</p>{fmtDate(b.check_out)}<br /><span className="text-emerald-100/50">by {p.check_out_time.slice(0, 5)}</span></div>
                      <div><p className={labelClass}>Guests</p>{b.guests}</div>
                      <div><p className={labelClass}>Host</p>{hostQ.data?.full_name ?? '—'}</div>
                      {p.address && <div className="col-span-2"><p className={labelClass}>Address</p>{p.address}</div>}
                    </div>
                    <Link href={`/staycations/${p.id}`} className="inline-block mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400 border-b border-emerald-400/40 pb-1 hover:border-emerald-400 transition-colors">
                      View listing
                    </Link>
                  </div>
                </section>
              )}


              {canCancel && (
                <section>
                  <h2 className={sectionTitle}>Cancel booking</h2>
                  {!confirmCancel ? (
                    <button type="button" onClick={() => setConfirmCancel(true)}
                      className="font-mono text-[10px] uppercase tracking-[0.2em] text-red-300 border-b border-red-300/40 pb-1 hover:border-red-300 transition-colors">
                      Cancel this booking
                    </button>
                  ) : (
                    <div className="glass-panel p-6 max-w-lg">
                      <p className="font-sans text-[14px] text-emerald-50/80 mb-2">Cancel your stay at {p?.title ?? 'this property'}?</p>
                      {Number(b.amount_paid) > 0 && (
                        <p className="font-sans text-[13px] text-amber-300 mb-4">
                          You’ve paid {formatPrice(Number(b.amount_paid), b.currency)}. Our team reviews cancellations and sends any refund to your M-Pesa.
                        </p>
                      )}
                      {cancelError && <p role="alert" className="font-sans text-sm text-red-300 mb-4">{cancelError}</p>}
                      <div className="flex gap-6 items-center">
                        <button type="button" onClick={cancelBooking} disabled={cancelling}
                          className="px-8 py-3.5 rounded-sm font-mono text-[10px] uppercase tracking-[0.2em] text-black font-medium bg-red-300 hover:bg-red-200 disabled:opacity-60 transition-colors">
                          {cancelling ? 'Cancelling…' : 'Yes, cancel'}
                        </button>
                        <button type="button" onClick={() => setConfirmCancel(false)}
                          className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-100/70 hover:text-emerald-300 transition-colors">
                          Keep booking
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Payments */}
              <section>
                <h2 className={sectionTitle}>Payments</h2>
                {payments.length === 0 ? (
                  <p className="font-sans text-[14px] text-emerald-50/60">No payments yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {payments.map((pay) => (
                      <li key={pay.id} className="glass-panel p-5 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-sans text-white text-sm">
                            {formatPrice(Number(pay.amount), pay.currency)} · M-Pesa {pay.kind === 'deposit' ? '(30% deposit)' : ''}
                          </p>
                          <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-emerald-100/50 mt-1">
                            {pay.receipt ? `Receipt ${pay.receipt}` : new Date(pay.created_at).toLocaleString('en-GB')}
                          </p>
                        </div>
                        <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${pay.status === 'succeeded' ? 'text-emerald-400' : pay.status === 'pending' ? 'text-amber-300' : 'text-red-300'}`}>
                          {pay.status === 'needs_review' ? 'In review' : pay.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {/* Price summary */}
            <aside className="glass-panel p-7 space-y-3 lg:sticky lg:top-8">
              <h2 className={sectionTitle}>Price</h2>
              <div className={row}><span>{b.nights} night{b.nights === 1 ? '' : 's'}</span><span>{formatPrice(Number(b.subtotal), b.currency)}</span></div>
              {Number(b.cleaning_fee) > 0 && <div className={row}><span>Cleaning fee</span><span>{formatPrice(Number(b.cleaning_fee), b.currency)}</span></div>}
              <div className={row}><span>Service fee</span><span>{formatPrice(Number(b.service_fee), b.currency)}</span></div>
              <div className="flex items-center justify-between pt-4 border-t border-emerald-900/50 font-sans text-white font-medium">
                <span>Total</span><span>{formatPrice(Number(b.total), b.currency)}</span>
              </div>
              <div className={`${row} pt-2`}><span>Paid</span><span>{formatPrice(Number(b.amount_paid), b.currency)}</span></div>
              {b.status === 'confirmed' && balance > 0 && (
                <div className={`${row} text-amber-300`}>
                  <span>Balance{b.balance_due_date ? ` due ${fmtDate(b.balance_due_date)}` : ''}</span>
                  <span>{formatPrice(balance, b.currency)}</span>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </Shell>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={null}>
      <BookingView />
    </Suspense>
  );
}