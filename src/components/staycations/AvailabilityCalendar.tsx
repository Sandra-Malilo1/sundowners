'use client';

import { useState } from 'react';
import { rangeBlocked, todayISO } from '@/lib/property';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function MonthGrid({
  year,
  month,
  blocked,
  checkIn,
  checkOut,
  onPick,
}: {
  year: number;
  month: number;
  blocked: Set<string>;
  checkIn: string;
  checkOut: string;
  onPick: (iso: string) => void;
}) {
  const today = todayISO();
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (first.getUTCDay() + 6) % 7; // Monday first
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const picking = !!checkIn && !checkOut;
  const label = first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  const cells: (string | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= count; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }

  return (
    <div>
      <p className="font-serif text-lg text-white text-center mb-4">{label}</p>
      <div className="grid grid-cols-7 gap-y-1 mb-1">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-center font-mono text-[9px] tracking-[0.2em] uppercase text-emerald-300/70 py-2">{w}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((iso, i) => {
          if (!iso) return <span key={`e${i}`} />;
          const past = iso < today;
          const isBlocked = blocked.has(iso);
          const canCheckout = picking && iso > checkIn && !rangeBlocked(blocked, checkIn, iso);
          const disabled = past || !(canCheckout || !isBlocked);
          const selected = iso === checkIn || iso === checkOut;
          const inRange = !!checkIn && !!checkOut && iso > checkIn && iso < checkOut;

          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onPick(iso)}
              aria-label={iso}
              aria-pressed={selected}
              className={[
                'h-10 text-sm font-sans transition-colors',
                selected ? 'bg-emerald-400 text-black font-medium rounded-sm' : '',
                inRange ? 'bg-emerald-500/20 text-emerald-100' : '',
                !selected && !inRange && !disabled ? 'text-white hover:bg-emerald-500/20 rounded-sm' : '',
                disabled && isBlocked && !past ? 'text-emerald-100/25 line-through' : '',
                disabled && (past || !isBlocked) ? 'text-emerald-100/20' : '',
                disabled ? 'cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
            >
              {Number(iso.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AvailabilityCalendar({
  blocked,
  checkIn,
  checkOut,
  onChange,
}: {
  blocked: Set<string>;
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
}) {
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });

  const shift = (delta: number) =>
    setCursor(({ y, m }) => {
      const d = new Date(Date.UTC(y, m + delta, 1));
      return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
    });

  const next = new Date(Date.UTC(cursor.y, cursor.m + 1, 1));
  const atCurrentMonth = cursor.y === now.getFullYear() && cursor.m === now.getMonth();

  const pick = (iso: string) => {
    const picking = !!checkIn && !checkOut;
    if (picking && iso > checkIn && !rangeBlocked(blocked, checkIn, iso)) {
      onChange(checkIn, iso);
    } else if (!blocked.has(iso)) {
      onChange(iso, '');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button type="button" onClick={() => shift(-1)} disabled={atCurrentMonth} aria-label="Previous month"
          className="w-10 h-10 rounded-full border border-emerald-300/30 text-white hover:bg-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">←</button>
        <div className="flex items-center gap-5 font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-100/60">
          <span className="flex items-center gap-2"><i className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" /> Selected</span>
          <span className="flex items-center gap-2"><span className="line-through text-emerald-100/40">12</span> Booked</span>
        </div>
        <button type="button" onClick={() => shift(1)} aria-label="Next month"
          className="w-10 h-10 rounded-full border border-emerald-300/30 text-white hover:bg-emerald-500/20 transition-colors">→</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <MonthGrid year={cursor.y} month={cursor.m} blocked={blocked} checkIn={checkIn} checkOut={checkOut} onPick={pick} />
        <div className="hidden md:block">
          <MonthGrid year={next.getUTCFullYear()} month={next.getUTCMonth()} blocked={blocked} checkIn={checkIn} checkOut={checkOut} onPick={pick} />
        </div>
      </div>

      {(checkIn || checkOut) && (
        <button type="button" onClick={() => onChange('', '')}
          className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-100/60 hover:text-emerald-300 transition-colors">
          Clear dates
        </button>
      )}
    </div>
  );
}