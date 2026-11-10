'use client';

import React, { useEffect, useState } from 'react';
import { AMENITIES, PROPERTY_TYPES, type Filters, type PropertyType } from '@/lib/staycations';

/* ============================== SEARCH BAR ============================== */

const fieldInput = 'w-full bg-transparent text-[16px] text-white placeholder:text-emerald-100/35 outline-none scheme-dark';

function Field({ label, htmlFor, className = '', children }: { label: string; htmlFor: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl px-4 py-2.5 hover:bg-white/5 focus-within:bg-white/10 transition-colors ${className}`}>
      <label htmlFor={htmlFor} className="block text-[12px] font-medium tracking-wide text-emerald-300 mb-0.5">
        {label}
      </label>
      {children}
    </div>
  );
}

export function SearchBar({ filters, onSearch }: { filters: Filters; onSearch: (patch: Partial<Filters>) => void }) {
  const [q, setQ] = useState(filters.q);
  const [checkIn, setCheckIn] = useState(filters.checkIn);
  const [checkOut, setCheckOut] = useState(filters.checkOut);
  const [guests, setGuests] = useState(filters.guests ? String(filters.guests) : '');
  const today = new Date().toISOString().slice(0, 10);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const datesOk = checkIn && checkOut && checkOut > checkIn;
    onSearch({
      q: q.trim(),
      checkIn: datesOk ? checkIn : '',
      checkOut: datesOk ? checkOut : '',
      guests: guests ? Math.max(1, Number(guests)) : null,
    });
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-emerald-300/25 bg-[#0a1f12]/85 backdrop-blur-md p-2 grid grid-cols-1 md:grid-cols-[1.7fr_1fr_1fr_0.8fr_auto] gap-1 md:gap-0 md:items-center shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]"
    >
      <Field label="Where" htmlFor="q">
        <input id="q" type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nairobi, Diani, Maasai Mara…" className={fieldInput} />
      </Field>
      <Field label="Check-in" htmlFor="in" className="md:border-l md:border-emerald-300/10 md:rounded-none">
        <input id="in" type="date" min={today} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className={fieldInput} />
      </Field>
      <Field label="Check-out" htmlFor="out" className="md:border-l md:border-emerald-300/10 md:rounded-none">
        <input id="out" type="date" min={checkIn || today} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className={fieldInput} />
      </Field>
      <Field label="Guests" htmlFor="guests" className="md:border-l md:border-emerald-300/10 md:rounded-none">
        <input id="guests" type="number" min={1} max={30} value={guests} onChange={(e) => setGuests(e.target.value)} placeholder="Add guests" className={fieldInput} />
      </Field>
      <button
        type="submit"
        className="mt-1 md:mt-0 md:ml-2 h-14 px-8 rounded-xl bg-emerald-400 text-black text-[16px] font-semibold hover:bg-emerald-300 active:scale-[0.99] transition-colors flex items-center justify-center gap-2"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.5" y2="16.5" />
        </svg>
        Search
      </button>
    </form>
  );
}

/* ============================== FILTER SIDEBAR ============================== */

const PRICE_PRESETS: { label: string; min: number | null; max: number | null }[] = [
  { label: 'Under 15,000', min: null, max: 15000 },
  { label: '15,000 – 30,000', min: 15000, max: 30000 },
  { label: '30,000 – 50,000', min: 30000, max: 50000 },
  { label: '50,000 and up', min: 50000, max: null },
];

const RATINGS: { v: number | null; l: string }[] = [
  { v: null, l: 'Any' },
  { v: 3, l: '3+' },
  { v: 4, l: '4+' },
  { v: 4.5, l: '4.5+' },
];

const heading = 'text-[16px] font-semibold text-white mb-3';
const moneyInput =
  'w-full rounded-xl border border-emerald-300/25 bg-[#051009]/60 pl-12 pr-3 py-2.5 text-[15px] text-white outline-none focus:border-emerald-300/70 transition-colors';

function CheckRow({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="group flex items-center gap-3 py-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        className={`w-5 h-5 shrink-0 rounded-md border flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-300 ${
          checked ? 'bg-emerald-400 border-emerald-400' : 'border-emerald-300/40 group-hover:border-emerald-300'
        }`}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#051009" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      <span className="text-[15px] text-emerald-50/90 group-hover:text-white transition-colors">{label}</span>
    </label>
  );
}

/** All filters, always visible on the side. Every change applies instantly. */
export function FilterSidebar({
  filters,
  onChange,
  onClear,
}: {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onClear: () => void;
}) {
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setMin(filters.minPrice?.toString() ?? '');
    setMax(filters.maxPrice?.toString() ?? '');
  }, [filters.minPrice, filters.maxPrice]);

  const applyPrice = () =>
    onChange({
      minPrice: min === '' ? null : Math.max(0, Number(min)),
      maxPrice: max === '' ? null : Math.max(0, Number(max)),
    });

  const toggleType = (t: PropertyType) =>
    onChange({ types: filters.types.includes(t) ? filters.types.filter((x) => x !== t) : [...filters.types, t] });
  const toggleAmenity = (v: string) =>
    onChange({ amenities: filters.amenities.includes(v) ? filters.amenities.filter((a) => a !== v) : [...filters.amenities, v] });

  const amenities = showAll ? AMENITIES : AMENITIES.filter((a, i) => i < 6 || filters.amenities.includes(a.value));
  const hidden = AMENITIES.length - amenities.length;

  const segment = (active: boolean) =>
    `py-2.5 rounded-lg text-[15px] border transition-colors ${
      active ? 'border-emerald-400 bg-emerald-400/15 text-emerald-200 font-medium' : 'border-emerald-300/25 text-emerald-50/80 hover:border-emerald-300/60'
    }`;
  const preset = (active: boolean) =>
    `px-3.5 py-2 rounded-full text-[14px] border transition-colors ${
      active ? 'border-emerald-400 bg-emerald-400/15 text-emerald-200 font-medium' : 'border-emerald-300/25 text-emerald-50/80 hover:border-emerald-300/60'
    }`;

  return (
    <div className="rounded-2xl border border-emerald-300/15 bg-[#0a1f12]/60 p-6 space-y-7">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-[24px] text-white">Filters</h2>
        <button type="button" onClick={onClear} className="text-[14px] font-medium text-emerald-300 hover:text-white underline underline-offset-4 transition-colors">
          Clear all
        </button>
      </div>

      <section>
        <h3 className={heading}>Property type</h3>
        <div>
          {PROPERTY_TYPES.map((t) => (
            <CheckRow key={t.value} label={t.label} checked={filters.types.includes(t.value)} onChange={() => toggleType(t.value)} />
          ))}
        </div>
      </section>

      <section className="pt-7 border-t border-emerald-900/50">
        <h3 className={heading}>Price per night</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {PRICE_PRESETS.map((p) => (
            <button key={p.label} type="button" className={preset(filters.minPrice === p.min && filters.maxPrice === p.max)} onClick={() => onChange({ minPrice: p.min, maxPrice: p.max })}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-emerald-300">KES</span>
            <input type="number" min={0} value={min} onChange={(e) => setMin(e.target.value)} onBlur={applyPrice} onKeyDown={(e) => e.key === 'Enter' && applyPrice()} placeholder="Min" aria-label="Minimum price" className={moneyInput} />
          </div>
          <span className="text-emerald-100/40">–</span>
          <div className="relative flex-1 min-w-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-emerald-300">KES</span>
            <input type="number" min={0} value={max} onChange={(e) => setMax(e.target.value)} onBlur={applyPrice} onKeyDown={(e) => e.key === 'Enter' && applyPrice()} placeholder="Max" aria-label="Maximum price" className={moneyInput} />
          </div>
        </div>
      </section>

      <section className="pt-7 border-t border-emerald-900/50">
        <h3 className={heading}>Guest rating</h3>
        <div className="grid grid-cols-4 gap-2">
          {RATINGS.map((r) => (
            <button key={r.l} type="button" className={segment(filters.minRating === r.v)} onClick={() => onChange({ minRating: r.v })}>
              {r.l}
            </button>
          ))}
        </div>
      </section>

      <section className="pt-7 border-t border-emerald-900/50">
        <h3 className={heading}>Amenities</h3>
        <div>
          {amenities.map((a) => (
            <CheckRow key={a.value} label={a.label} checked={filters.amenities.includes(a.value)} onChange={() => toggleAmenity(a.value)} />
          ))}
        </div>
        {(hidden > 0 || showAll) && (
          <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-2 text-[14px] font-medium text-emerald-300 hover:text-white underline underline-offset-4 transition-colors">
            {showAll ? 'Show fewer' : `Show ${hidden} more`}
          </button>
        )}
      </section>
    </div>
  );
}