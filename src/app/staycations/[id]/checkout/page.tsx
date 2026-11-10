'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import SiteStyles from '@/components/ui/SiteStyles';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/staycations';
import { toMsisdn } from '@/lib/phone';
import { getBooking, getPayment, startMpesa } from '@/lib/payments';
import { addDays, buildBlockedSet, diffDays, getProperty, getUnavailable, quote, rangeBlocked, todayISO } from '@/lib/property';

type Stage = 'form' | 'working' | 'waiting';

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

const LockIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const Shell = ({ children }: { children: React.ReactNode }) => (
  <main className="relative min-h-screen bg-[#051009] selection:bg-emerald-500/30 selection:text-white">
    <SiteStyles />
    <header className="border-b border-emerald-900/40">
      <div className="max-w-6xl mx-auto px-6 md:px-10 h-18 flex items-center justify-between">
        <Link href="/" className="font-sans font-bold text-[22px] tracking-tighter uppercase text-white">
          <span className="text-emerald-400">Love</span>Africa
        </Link>
        <span className="flex items-center gap-2 text-[14px] font-medium text-emerald-100/70">
          <LockIcon /> Secure checkout
        </span>
      </div>
    </header>
    {children}
  </main>
);

function Steps({ labels, current }: { labels: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-3 md:gap-5 mb-10">
      {labels.map((l, i) => (
        <li key={l} className="flex items-center gap-3 md:gap-5">
          <span className={`flex items-center gap-2.5 text-[15px] font-medium ${i === current ? 'text-white' : i < current ? 'text-emerald-300' : 'text-emerald-100/40'}`}>
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-semibold ${
                i < current ? 'bg-emerald-400 text-black' : i === current ? 'border-2 border-emerald-400 text-emerald-300' : 'border border-emerald-300/25'
              }`}
            >
              {i < current ? '✓' : i + 1}
            </span>
            <span className={i === current ? '' : 'hidden sm:inline'}>{l}</span>
          </span>
          {i < labels.length - 1 && <span className="w-6 md:w-14 h-px bg-emerald-300/25" />}
        </li>
      ))}
    </ol>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-emerald-300/15 bg-[#0a1f12]/50 p-6 md:p-8">
      <div className="flex items-center gap-4 mb-6">
        <span className="w-9 h-9 rounded-full bg-emerald-400/15 border border-emerald-400/40 text-emerald-300 text-[15px] font-semibold flex items-center justify-center">{n}</span>
        <h2 className="font-serif text-[26px] md:text-[28px] text-white tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function OptionCard({
  selected,
  disabled,
  onClick,
  title,
  desc,
  right,
  badge,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick?: () => void;
  title: string;
  desc?: string;
  right?: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={`w-full text-left flex items-start gap-4 p-5 rounded-xl border transition-colors ${
        disabled
          ? 'border-emerald-900/50 opacity-55 cursor-not-allowed'
          : selected
            ? 'border-emerald-400 bg-emerald-400/10'
            : 'border-emerald-300/20 hover:border-emerald-300/50 hover:bg-white/5'
      }`}
    >
      <span className={`mt-1 w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center ${selected ? 'border-emerald-400' : 'border-emerald-300/40'}`}>
        {selected && <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[17px] font-semibold text-white">
          {title}
          {badge && <span className="text-[12px] font-medium px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-100/70">{badge}</span>}
        </span>
        {desc && <span className="block mt-1 text-[15px] leading-snug text-emerald-100/65">{desc}</span>}
      </span>
      {right && <span className="text-[17px] font-semibold text-white whitespace-nowrap">{right}</span>}
    </button>
  );
}

const fieldLabel = 'block text-[14px] font-medium text-emerald-300 mb-2';

function CheckoutView() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const resumeId = sp.get('booking');

  const [userId, setUserId] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState<'full' | 'installment'>('full');
  const [stage, setStage] = useState<Stage>('form');
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  /* ---- must be signed in ---- */
  const search = sp.toString();
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      if (!data.session) {
        router.replace(`/auth/login?next=${encodeURIComponent(`${pathname}?${search}`)}`);
        return;
      }
      setUserId(data.session.user.id);
      const { data: prof } = await supabase.from('profiles').select('phone').eq('id', data.session.user.id).maybeSingle();
      if (alive && prof?.phone) setPhone((prev) => prev || String(prof.phone).replace(/^\+?254/, '0'));
    })();
    return () => {
      alive = false;
    };
  }, [router, pathname, search]);

  /* ---- data ---- */
  const propertyQ = useQuery({ queryKey: ['property', id], queryFn: () => getProperty(id) });
  const unavailQ = useQuery({ queryKey: ['unavailable', id], queryFn: () => getUnavailable(id), staleTime: 0, enabled: !!propertyQ.data });
  const resumeQ = useQuery({ queryKey: ['booking', resumeId], queryFn: () => getBooking(resumeId!), enabled: !!resumeId, staleTime: 0 });
  const blocked = useMemo(() => buildBlockedSet(unavailQ.data ?? []), [unavailQ.data]);

  /* ---- watch the payment after the M-Pesa prompt is sent ---- */
  useEffect(() => {
    if (stage !== 'waiting' || !paymentId || !bookingId) return;
    let alive = true;
    const started = Date.now();
    const timer = setInterval(async () => {
      try {
        const pay = await getPayment(paymentId);
        if (!alive || !pay) return;
        if (pay.status === 'succeeded') {
          clearInterval(timer);
          router.replace(`/dashboard/bookings/${bookingId}?paid=1`);
        } else if (pay.status !== 'pending') {
          clearInterval(timer);
          setError(
            pay.status === 'cancelled'
              ? 'The M-Pesa prompt was cancelled. You can try again.'
              : pay.status === 'needs_review'
                ? 'Your payment needs a quick review by our team. Check your booking page shortly.'
                : `Payment failed: ${pay.result_desc ?? 'please try again'}`,
          );
          setStage('form');
        } else if (Date.now() - started > 120_000) {
          clearInterval(timer);
          setError('We haven’t received confirmation yet. If you already entered your PIN, check your booking page in a minute.');
          setStage('form');
        }
      } catch {
        /* keep polling */
      }
    }, 3000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [stage, paymentId, bookingId, router]);

  /* ---- states ---- */
  const p = propertyQ.data;
  const resumed = resumeQ.data;

  if (propertyQ.isLoading || !userId || (resumeId && resumeQ.isLoading)) {
    return (
      <Shell>
        <div className="max-w-4xl mx-auto px-6 pt-10">
          <div className="h-8 w-64 bg-emerald-900/30 animate-pulse rounded-sm mb-8" />
          <div className="h-96 bg-emerald-900/20 animate-pulse rounded-sm" />
        </div>
      </Shell>
    );
  }
  if (!p) {
    return (
      <Shell>
        <div className="text-center pt-24 px-6">
          <h1 className="font-serif text-[32px] text-white mb-4">Stay not found</h1>
          <Link href="/staycations" className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400 border-b border-emerald-400/40 pb-1">Back to all stays</Link>
        </div>
      </Shell>
    );
  }

  const resumable = resumed && resumed.status === 'pending' && resumed.payment_status === 'unpaid' && resumed.property_id === p.id;
  if (resumeId && !resumable) {
    return (
      <Shell>
        <div className="text-center pt-24 px-6">
          <h1 className="font-serif text-[32px] text-white mb-4">This booking can’t be paid anymore</h1>
          <p className="font-sans text-emerald-50/70 mb-8">It may already be paid, cancelled or expired.</p>
          <Link href={resumeId ? `/dashboard/bookings/${resumeId}` : `/staycations/${p.id}`} className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400 border-b border-emerald-400/40 pb-1">
            View booking
          </Link>
        </div>
      </Shell>
    );
  }

  /* ---- derive the trip ---- */
  const activeBookingId = bookingId ?? (resumable ? resumed!.id : null);
  const checkIn = resumable ? resumed!.check_in : (sp.get('in') ?? '');
  const checkOut = resumable ? resumed!.check_out : (sp.get('out') ?? '');
  const guests = resumable ? resumed!.guests : Number(sp.get('guests')) || 1;
  const effectivePlan = resumable ? resumed!.payment_plan : plan;

  const q = checkIn && checkOut && checkOut > checkIn ? quote(p, checkIn, checkOut) : null;
  const installmentOk = !!checkIn && diffDays(todayISO(), checkIn) >= 15;
  const dueNow = resumable
    ? Number(resumed!.amount_due_now)
    : q
      ? effectivePlan === 'installment'
        ? Math.round(q.total * 0.3 * 100) / 100
        : q.total
      : 0;
  const balance = q ? q.total - dueNow : 0;

  let problem = '';
  if (!q) problem = 'The dates for this booking are missing or invalid.';
  else if (!activeBookingId && rangeBlocked(blocked, checkIn, checkOut)) problem = 'Some of those nights were just booked.';
  else if (q.nights < p.min_nights) problem = `Minimum stay is ${p.min_nights} nights.`;
  else if (p.max_nights && q.nights > p.max_nights) problem = `Maximum stay is ${p.max_nights} nights.`;
  else if (guests > p.max_guests) problem = `This stay sleeps up to ${p.max_guests} guests.`;
  else if (p.currency !== 'KES') problem = 'Online payment is only available for KES stays right now.';
const requestOnly = !p.instant_book && !resumable; // an accepted request being paid is no longer "request only"
  const busy = stage !== 'form';

  const pay = async () => {
    if (!q || problem) return;
    setError('');
    if (!requestOnly && !toMsisdn(phone)) {
      setError('Enter a valid Safaricom number, e.g. 0712 345 678.');
      return;
    }
    setStage('working');
    try {
      let bid = activeBookingId;
      if (!bid) {
        await supabase.rpc('expire_stale_bookings'); // free any lapsed holds on these dates
        const { data, error: insertError } = await supabase
          .from('bookings')
          .insert({ property_id: p.id, guest_id: userId, check_in: checkIn, check_out: checkOut, guests, payment_plan: plan })
          .select('id')
          .single();
        if (insertError) {
          throw new Error(
            insertError.code === '23P01' ? 'Those dates were just taken. Please choose different dates.' : insertError.message,
          );
        }
        bid = data.id as string;
        setBookingId(bid);
      }
      if (requestOnly) {
        router.replace(`/dashboard/bookings/${bid}?requested=1`);
        return;
      }
      const pid = await startMpesa(bid, phone);
      setPaymentId(pid);
      setStage('waiting');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setStage('form');
    }
  };

  const stopWaiting = () => {
    setStage('form');
    setPaymentId(null);
  };

  const steps = requestOnly ? ['Your trip', 'Request', 'Host reply'] : ['Your trip', 'Payment', 'Confirmed'];
  const row = 'flex items-center justify-between text-[16px] text-emerald-50/85';
  const money = (n: number) => formatPrice(n, p.currency);
  const payLabel = stage === 'working' ? 'One moment…' : requestOnly ? 'Send request' : `Pay ${formatPrice(Math.ceil(dueNow), p.currency)} with M-Pesa`;

  return (
    <Shell>
      <div className="max-w-6xl mx-auto px-6 md:px-10 pt-8 pb-28">
        <Link href={`/staycations/${p.id}`} className="inline-flex items-center gap-2 mb-8 text-[15px] font-medium text-emerald-100/70 hover:text-white transition-colors">
          <span aria-hidden>←</span> Back to {p.title}
        </Link>

        <Steps labels={steps} current={1} />

        <h1 className="font-serif text-[38px] md:text-[52px] text-white tracking-tight leading-[1.08] mb-3">
          {requestOnly ? 'Request to book' : 'Confirm and pay'}
        </h1>
        <p className="text-[17px] text-emerald-50/70 mb-12 max-w-2xl">
          {requestOnly ? 'Review your trip and send your request. You won’t be charged yet.' : 'Review your trip, choose how to pay, and you’re done.'}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 lg:gap-14 items-start">
          {/* ================= LEFT ================= */}
          <div className="space-y-6">
            {stage === 'waiting' ? (
              <div className="rounded-2xl border border-emerald-400/30 bg-[#0a1f12]/60 p-8 md:p-12 text-center">
                <div className="relative w-20 h-20 mx-auto mb-8">
                  <span className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
                  <span className="absolute inset-0 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin" />
                  <span className="absolute inset-0 flex items-center justify-center text-[28px]" aria-hidden>📱</span>
                </div>
                <h2 className="font-serif text-[34px] text-white mb-3">Check your phone</h2>
                <p className="text-[17px] text-emerald-50/80 max-w-md mx-auto mb-8 leading-relaxed">
                  We sent an M-Pesa prompt for <strong className="text-white">{formatPrice(Math.ceil(dueNow), 'KES')}</strong> to <strong className="text-white">{phone}</strong>.
                </p>
                <ol className="text-left max-w-sm mx-auto space-y-3 text-[16px] text-emerald-50/80 mb-10">
                  <li className="flex gap-3"><span className="text-emerald-400 font-semibold">1.</span> Open the M-Pesa prompt on your phone</li>
                  <li className="flex gap-3"><span className="text-emerald-400 font-semibold">2.</span> Enter your M-Pesa PIN</li>
                  <li className="flex gap-3"><span className="text-emerald-400 font-semibold">3.</span> Stay on this page. We’ll confirm automatically</li>
                </ol>
                <button type="button" onClick={stopWaiting} className="text-[15px] font-medium text-emerald-100/70 underline underline-offset-4 hover:text-white transition-colors">
                  Didn’t get a prompt? Go back
                </button>
              </div>
            ) : (
              <>
                {/* 1. Trip */}
                <Section n={1} title="Your trip">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <p className={fieldLabel}>Check-in</p>
                      <p className="text-[18px] font-medium text-white">{checkIn ? fmtDate(checkIn) : '—'}</p>
                      <p className="text-[15px] text-emerald-100/55">from {p.check_in_time.slice(0, 5)}</p>
                    </div>
                    <div>
                      <p className={fieldLabel}>Check-out</p>
                      <p className="text-[18px] font-medium text-white">{checkOut ? fmtDate(checkOut) : '—'}</p>
                      <p className="text-[15px] text-emerald-100/55">by {p.check_out_time.slice(0, 5)}</p>
                    </div>
                    <div>
                      <p className={fieldLabel}>Guests</p>
                      <p className="text-[18px] font-medium text-white">{guests} guest{guests === 1 ? '' : 's'}</p>
                    </div>
                  </div>
                </Section>

                {!requestOnly && (
                  <>
                    {/* 2. When to pay */}
                    <Section n={2} title="When to pay">
                      <div role="radiogroup" aria-label="When to pay" className="space-y-3">
                        <OptionCard
                          selected={effectivePlan === 'full'}
                          disabled={!!activeBookingId && effectivePlan !== 'full'}
                          onClick={() => !activeBookingId && setPlan('full')}
                          title="Pay in full"
                          desc="Settle everything today and you’re done."
                          right={q ? money(q.total) : undefined}
                        />
                        <OptionCard
                          selected={effectivePlan === 'installment'}
                          disabled={!installmentOk || (!!activeBookingId && effectivePlan !== 'installment')}
                          onClick={() => !activeBookingId && setPlan('installment')}
                          title="Pay 30% now, the rest later"
                          badge={installmentOk ? undefined : 'Not available'}
                          desc={
                            installmentOk && q
                              ? `${money(Math.round(q.total * 0.3 * 100) / 100)} today, then ${money(q.total - Math.round(q.total * 0.3 * 100) / 100)} on ${fmtDate(addDays(checkIn, -14))}.`
                              : 'Available when check-in is at least 15 days away.'
                          }
                          right={installmentOk && q ? money(Math.round(q.total * 0.3 * 100) / 100) : undefined}
                        />
                      </div>
                    </Section>

                    {/* 3. Pay with */}
                    <Section n={3} title="Pay with">
                      <div role="radiogroup" aria-label="Payment method" className="space-y-3 mb-8">
                        <OptionCard selected title="M-Pesa" desc="You’ll get a prompt on your phone to enter your PIN." />
                        {['Card', 'Airtel Money', 'MTN MoMo'].map((m) => (
                          <OptionCard key={m} selected={false} disabled title={m} badge="Coming soon" />
                        ))}
                      </div>

                      <label htmlFor="mpesa-phone" className={fieldLabel}>M-Pesa phone number</label>
                      <input
                        id="mpesa-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0712 345 678"
                        className="w-full h-14 rounded-xl border border-emerald-300/25 bg-[#051009]/70 px-5 text-[18px] text-white placeholder:text-emerald-100/30 outline-none focus:border-emerald-300/70 transition-colors"
                      />
                      <p className="mt-2.5 text-[14px] text-emerald-100/55">Use the Safaricom number that has your M-Pesa account.</p>
                    </Section>
                  </>
                )}

                {requestOnly && (
                  <Section n={2} title="How it works">
                    <ol className="space-y-4 text-[16px] text-emerald-50/85">
                      <li className="flex gap-4"><span className="text-emerald-400 font-semibold">1.</span> You send your request. Your dates are held for you.</li>
                      <li className="flex gap-4"><span className="text-emerald-400 font-semibold">2.</span> The host reviews it and replies.</li>
                      <li className="flex gap-4"><span className="text-emerald-400 font-semibold">3.</span> You pay once the host accepts. Nothing is charged now.</li>
                    </ol>
                  </Section>
                )}

                {(error || problem) && (
                  <div role="alert" className="px-5 py-4 rounded-xl border border-red-400/40 bg-red-500/10 text-red-200 text-[16px]">
                    {problem || error}
                  </div>
                )}

                <div>
                  <button
                    type="button"
                    onClick={pay}
                    disabled={busy || !!problem}
                    className="w-full h-15 rounded-xl bg-emerald-400 text-black text-[17px] font-semibold hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] transition-all flex items-center justify-center gap-3"
                  >
                    {!requestOnly && stage !== 'working' && <LockIcon size={18} />}
                    {payLabel}
                  </button>
                  <p className="mt-4 text-center text-[14px] text-emerald-100/55">
                    {requestOnly ? 'You won’t be charged until the host accepts.' : 'You’ll confirm the payment on your phone with your M-Pesa PIN.'}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* ================= RIGHT: summary ================= */}
          <aside className="lg:sticky lg:top-8 rounded-2xl border border-emerald-300/20 bg-[#0a1f12]/70 overflow-hidden">
            {p.cover_url && <img src={p.cover_url} alt="" className="w-full aspect-16/10 object-cover" />}
            <div className="p-6 md:p-7">
              <p className="text-[14px] font-medium text-emerald-300 mb-1">{[p.city, p.country].filter(Boolean).join(', ')}</p>
              <h3 className="font-serif text-[28px] leading-tight text-white mb-1">{p.title}</h3>
              {checkIn && checkOut && (
                <p className="text-[15px] text-emerald-100/65 mb-6">
                  {fmtDate(checkIn)} → {fmtDate(checkOut)}
                </p>
              )}

              {q && (
                <div className="space-y-3.5 pt-6 border-t border-emerald-900/60">
                  <div className={row}><span>{q.nights} night{q.nights === 1 ? '' : 's'}</span><span>{money(q.subtotal)}</span></div>
                  {q.cleaning > 0 && <div className={row}><span>Cleaning fee</span><span>{money(q.cleaning)}</span></div>}
                  <div className={row}><span>Service fee</span><span>{money(q.service)}</span></div>
                  <div className="flex items-baseline justify-between pt-5 mt-2 border-t border-emerald-900/60">
                    <span className="text-[17px] font-semibold text-white">Total</span>
                    <span className="font-serif text-[30px] text-white">{money(q.total)}</span>
                  </div>

                  {!requestOnly && effectivePlan === 'installment' && (
                    <div className="mt-2 rounded-xl bg-emerald-400/10 border border-emerald-400/25 p-4 space-y-2">
                      <div className="flex items-center justify-between text-[16px] font-semibold text-emerald-200"><span>Due today (30%)</span><span>{money(dueNow)}</span></div>
                      <div className="flex items-center justify-between text-[15px] text-emerald-100/70"><span>Balance, {fmtDate(addDays(checkIn, -14))}</span><span>{money(balance)}</span></div>
                    </div>
                  )}
                </div>
              )}

              <ul className="mt-7 pt-6 border-t border-emerald-900/60 space-y-2.5 text-[14px] text-emerald-100/65">
                <li className="flex gap-2.5"><span className="text-emerald-400">✓</span> The full price is shown, with no hidden fees</li>
                {!requestOnly && <li className="flex gap-2.5"><span className="text-emerald-400">✓</span> Confirmed as soon as your payment clears</li>}
                <li className="flex gap-2.5"><span className="text-emerald-400">✓</span> The total is verified by our system when you book</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </Shell>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutView />
    </Suspense>
  );
}