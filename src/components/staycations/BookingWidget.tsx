'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/staycations';
import { quote, rangeBlocked, todayISO, type PropertyDetail } from '@/lib/property';

const labelClass = 'font-mono text-[9px] uppercase tracking-[0.3em] text-emerald-300 mb-2 block';
const inputClass = 'form-input w-full px-4 py-3 text-white font-sans text-sm scheme-dark';

export default function BookingWidget({
  property: p,
  blocked,
  checkIn,
  checkOut,
  guests,
  onChange,
}: {
  property: PropertyDetail;
  blocked: Set<string>;
  checkIn: string;
  checkOut: string;
  guests: number;
  onChange: (patch: { checkIn?: string; checkOut?: string; guests?: number }) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const today = todayISO();

  const haveDates = !!checkIn && !!checkOut && checkOut > checkIn;
  const q = haveDates ? quote(p, checkIn, checkOut) : null;

  let problem = '';
  if (checkIn && checkOut && checkOut <= checkIn) problem = 'Check-out must be after check-in.';
  else if (haveDates && rangeBlocked(blocked, checkIn, checkOut)) problem = 'Some of those nights are already booked.';
  else if (q && q.nights < p.min_nights) problem = `Minimum stay is ${p.min_nights} night${p.min_nights === 1 ? '' : 's'}.`;
  else if (q && p.max_nights && q.nights > p.max_nights) problem = `Maximum stay is ${p.max_nights} nights.`;

  const canReserve = !!q && !problem;

  const reserve = async () => {
    if (!canReserve) return;
    setBusy(true);
    const target = `/staycations/${p.id}/checkout?in=${checkIn}&out=${checkOut}&guests=${guests}`;
    const { data } = await supabase.auth.getSession();
    router.push(data.session ? target : `/auth/login?next=${encodeURIComponent(target)}`);
  };

  const row = 'flex items-center justify-between font-sans text-sm text-emerald-50/80';

  return (
    <div className="glass-panel p-6 md:p-7">
      <div className="flex items-baseline justify-between mb-6">
        <p className="font-sans text-white">
          <span className="font-serif text-[28px]">{formatPrice(Number(p.base_price), p.currency)}</span>
          <span className="text-emerald-100/60 text-sm"> / night</span>
        </p>
        {p.rating_count > 0 && (
          <span className="font-mono text-[10px] text-emerald-100/70">★ {Number(p.rating_avg).toFixed(1)} ({p.rating_count})</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label htmlFor="bw-in" className={labelClass}>Check-in</label>
          <input id="bw-in" type="date" min={today} value={checkIn}
            onChange={(e) => onChange({ checkIn: e.target.value, checkOut: checkOut && checkOut > e.target.value ? checkOut : '' })}
            className={inputClass} />
        </div>
        <div>
          <label htmlFor="bw-out" className={labelClass}>Check-out</label>
          <input id="bw-out" type="date" min={checkIn || today} value={checkOut}
            onChange={(e) => onChange({ checkOut: e.target.value })} className={inputClass} />
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="bw-guests" className={labelClass}>Guests</label>
        <select id="bw-guests" value={guests} onChange={(e) => onChange({ guests: Number(e.target.value) })}
          className="form-select w-full px-4 py-3 text-sm font-sans text-white cursor-pointer">
          {Array.from({ length: p.max_guests }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n} className="bg-[#051009] text-white">{n} guest{n === 1 ? '' : 's'}</option>
          ))}
        </select>
      </div>

      {problem && (
        <div role="alert" className="mb-5 px-4 py-3 rounded-sm border border-red-400/40 bg-red-500/10 text-red-200 font-sans text-[13px]">
          {problem}
        </div>
      )}

      <button type="button" onClick={reserve} disabled={!canReserve || busy}
        className="w-full py-4 rounded-sm font-mono text-[10px] uppercase tracking-[0.2em] text-black font-medium bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] transition-colors">
        {busy ? 'One moment…' : p.instant_book ? 'Reserve' : 'Request to book'}
      </button>

      {!q && !problem && (
        <p className="mt-4 text-center font-sans text-[12px] text-emerald-100/50">Pick your dates to see the full price.</p>
      )}

      {q && !problem && (
        <div className="mt-6 pt-6 border-t border-emerald-900/50 space-y-3">
          <p className="font-sans text-[12px] text-emerald-100/50 text-center mb-2">You won’t be charged yet</p>
          <div className={row}>
            <span>{q.nights} night{q.nights === 1 ? '' : 's'}</span>
            <span>{formatPrice(q.subtotal, p.currency)}</span>
          </div>
          {q.cleaning > 0 && (
            <div className={row}><span>Cleaning fee</span><span>{formatPrice(q.cleaning, p.currency)}</span></div>
          )}
          <div className={row}><span>Service fee</span><span>{formatPrice(q.service, p.currency)}</span></div>
          <div className="flex items-center justify-between pt-4 border-t border-emerald-900/50 font-sans text-white font-medium">
            <span>Total</span><span>{formatPrice(q.total, p.currency)}</span>
          </div>
        </div>
      )}
    </div>
  );
}