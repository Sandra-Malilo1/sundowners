'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { formatPrice } from '@/lib/staycations';
import { bucketOf, listMyBookings, statusLabel, toneClass, type Bucket } from '@/lib/my-bookings';

const TABS: { key: Bucket; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
];

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export default function BookingsPage() {
  const [tab, setTab] = useState<Bucket>('upcoming');
  const q = useQuery({ queryKey: ['my-bookings'], queryFn: listMyBookings, staleTime: 0 });

  const all = q.data ?? [];
  const shown = all.filter((b) => bucketOf(b) === tab);
  const count = (k: Bucket) => all.filter((b) => bucketOf(b) === k).length;

  return (
    <div>
      <h1 className="font-serif text-[36px] md:text-[44px] text-white tracking-tighter leading-[1.1] mb-8">My bookings</h1>

      <div className="flex gap-8 mb-8 border-b border-emerald-900/50">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`pb-3 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors border-b ${
              tab === t.key ? 'text-emerald-400 border-emerald-400' : 'text-emerald-100/50 border-transparent hover:text-emerald-200'
            }`}
          >
            {t.label} {!q.isLoading && <span className="text-emerald-100/40">({count(t.key)})</span>}
          </button>
        ))}
      </div>

      {q.isError && (
        <div role="alert" className="px-4 py-3 rounded-sm border border-red-400/40 bg-red-500/10 text-red-200 font-sans text-sm">
          Couldn’t load your bookings.
        </div>
      )}

      {q.isLoading && <div className="h-40 bg-emerald-900/20 animate-pulse rounded-sm" />}

      {!q.isLoading && shown.length === 0 && (
        <div className="py-16 text-center">
          <p className="font-sans text-emerald-50/70 text-[14px] mb-6">Nothing here yet.</p>
          <Link href="/staycations" className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400 border-b border-emerald-400/40 pb-1 hover:border-emerald-400 transition-colors">
            Find a stay
          </Link>
        </div>
      )}

      <ul className="space-y-4">
        {shown.map((b) => {
          const s = statusLabel(b);
          return (
            <li key={b.id}>
              <Link href={`/dashboard/bookings/${b.id}`} className="glass-panel overflow-hidden flex flex-col sm:flex-row hover:bg-emerald-500/10 transition-colors">
                {b.properties?.cover_url && <img src={b.properties.cover_url} alt="" className="w-full sm:w-44 h-36 sm:h-auto object-cover opacity-90" />}
                <div className="p-5 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-xl text-white mb-1">{b.properties?.title ?? 'Stay'}</h3>
                    <p className="font-sans text-[13px] text-emerald-50/70">{fmt(b.check_in)} → {fmt(b.check_out)} · {b.guests} guest{b.guests === 1 ? '' : 's'}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="font-sans text-white text-sm mb-1">{formatPrice(Number(b.total), b.currency)}</p>
                    <p className={`font-mono text-[10px] uppercase tracking-[0.2em] ${toneClass(s.tone)}`}>{s.text}</p>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}