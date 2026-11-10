'use client';

import React from 'react';
import { PROPERTY_TYPES, type PropertyType } from '@/lib/staycations';

export const labelClass = 'block text-[15px] font-medium text-emerald-300 mb-2';
export const hintClass = 'mt-2 text-[14px] text-emerald-100/55';
export const inputClass =
  'w-full h-13 rounded-xl border border-emerald-300/25 bg-[#051009]/70 px-4 text-[17px] text-white placeholder:text-emerald-100/30 outline-none focus:border-emerald-300/70 transition-colors scheme-dark';
export const textareaClass =
  'w-full rounded-xl border border-emerald-300/25 bg-[#051009]/70 px-4 py-3 text-[17px] leading-relaxed text-white placeholder:text-emerald-100/30 outline-none focus:border-emerald-300/70 transition-colors';

export function Card({ title, subtitle, children }: { title?: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-emerald-300/15 bg-[#0a1f12]/50 p-6 md:p-8">
      {title && <h2 className="font-serif text-[26px] md:text-[28px] text-white tracking-tight mb-1">{title}</h2>}
      {subtitle && <p className="text-[16px] text-emerald-100/65 mb-6">{subtitle}</p>}
      {!subtitle && title && <div className="mb-6" />}
      {children}
    </section>
  );
}

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClass}>{label}</label>
      {children}
      {hint && <p className={hintClass}>{hint}</p>}
    </div>
  );
}

export function Counter({
  label,
  value,
  onChange,
  min = 0,
  max = 50,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const btn =
    'w-10 h-10 rounded-full border border-emerald-300/30 text-[20px] text-white hover:bg-emerald-400/15 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center';
  return (
    <div className="flex items-center justify-between py-4 border-b border-emerald-900/40 last:border-0">
      <span className="text-[17px] text-white">{label}</span>
      <div className="flex items-center gap-4">
        <button type="button" className={btn} aria-label={`Fewer ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}>−</button>
        <span className="w-10 text-center text-[18px] font-semibold text-white">{value}</span>
        <button type="button" className={btn} aria-label={`More ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}>+</button>
      </div>
    </div>
  );
}

export function Toggle({ label, desc, on, onChange }: { label: string; desc?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-emerald-900/40 last:border-0">
      <div>
        <p className="text-[17px] text-white">{label}</p>
        {desc && <p className="text-[15px] text-emerald-100/60 mt-0.5">{desc}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        className={`relative w-14 h-8 shrink-0 rounded-full transition-colors ${on ? 'bg-emerald-400' : 'bg-white/15'}`}
      >
        <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${on ? 'translate-x-6 bg-[#051009]' : ''}`} />
      </button>
    </div>
  );
}

const TYPE_DESC: Record<PropertyType, string> = {
  apartment: 'A self-contained flat in a building.',
  hotel_guesthouse: 'Rooms in a hotel, B&B or guesthouse.',
  safari_lodge_camp: 'A lodge or tented camp in the wild.',
  villa_holiday_home: 'A whole villa, house or holiday home.',
};

export function TypePicker({ value, onChange }: { value: PropertyType | null; onChange: (t: PropertyType) => void }) {
  return (
    <div role="radiogroup" aria-label="Property type" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {PROPERTY_TYPES.map((t) => {
        const on = value === t.value;
        return (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(t.value)}
            className={`text-left p-6 rounded-2xl border transition-colors ${
              on ? 'border-emerald-400 bg-emerald-400/10' : 'border-emerald-300/20 hover:border-emerald-300/50 hover:bg-white/5'
            }`}
          >
            <p className="font-serif text-[22px] text-white mb-1">{t.label}</p>
            <p className="text-[15px] text-emerald-100/65">{TYPE_DESC[t.value]}</p>
          </button>
        );
      })}
    </div>
  );
}