'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { formatPrice } from '@/lib/staycations';
import { useProfile } from '@/lib/profile';
import { bucketOf, listMyBookings, statusLabel, toneClass } from '@/lib/my-bookings';

const label = 'font-mono text-[9px] uppercase tracking-[0.3em] text-emerald-300 mb-2 block';
const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

const VERIFY_TEXT = { unverified: 'Not verified', pending: 'In review', verified: 'Verified', rejected: 'Rejected' } as const;

export default function DashboardHome() {
  const profileQ = useProfile();
  const bookingsQ = useQuery({ queryKey: ['my-bookings'], queryFn: listMyBookings, staleTime: 0 });

  const profile = profileQ.data;
  const upcoming = (bookingsQ.data ?? []).filter((b) => bucketOf(b) === 'upcoming').sort((a, b) => a.check_in.localeCompare(b.check_in));
  const next = upcoming[0];
  const firstName = profile?.full_name?.split(' ')[0];

  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.4em] text-emerald-400 uppercase mb-4 flex items-center gap-3">
        <span className="w-8 h-px bg-emerald-400" /> Your account
      </p>
      <h1 className="font-serif text-[36px] md:text-[48px] text-white tracking-tighter leading-[1.1] mb-10">
        {firstName ? `Welcome back, ${firstName}.` : 'Welcome back.'}
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <div className="glass-panel p-5">
          <span className={label}>Upcoming trips</span>
          <p className="font-serif text-[32px] text-white">{bookingsQ.isLoading ? '–' : upcoming.length}</p>
        </div>
        <div className="glass-panel p-5">
          <span className={label}>Loyalty points</span>
          <p className="font-serif text-[32px] text-white">{profile ? profile.loyalty_points : '–'}</p>
        </div>
        <div className="glass-panel p-5">
          <span className={label}>Trip wallet</span>
          <p className="font-serif text-[32px] text-white">{profile ? formatPrice(Number(profile.wallet_balance), 'KES') : '–'}</p>
        </div>
        <Link href="/dashboard/profile" className="glass-panel p-5 hover:bg-emerald-500/10 transition-colors">
          <span className={label}>ID verification</span>
          <p className={`font-serif text-[24px] ${profile?.verification === 'verified' ? 'text-emerald-400' : 'text-white'}`}>
            {profile ? VERIFY_TEXT[profile.verification] : '–'}
          </p>
        </Link>
      </div>

      <h2 className="font-serif text-[24px] text-white tracking-tight mb-5">Next trip</h2>
      {bookingsQ.isLoading ? (
        <div className="h-40 bg-emerald-900/20 animate-pulse rounded-sm" />
      ) : next ? (
        <Link href={`/dashboard/bookings/${next.id}`} className="glass-panel overflow-hidden flex flex-col sm:flex-row hover:bg-emerald-500/10 transition-colors">
          {next.properties?.cover_url && <img src={next.properties.cover_url} alt="" className="w-full sm:w-56 h-40 sm:h-auto object-cover opacity-90" />}
          <div className="p-6">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-emerald-300 mb-2">
              {[next.properties?.city, next.properties?.country].filter(Boolean).join(' · ')}
            </p>
            <h3 className="font-serif text-2xl text-white mb-3">{next.properties?.title ?? 'Your stay'}</h3>
            <p className="font-sans text-sm text-emerald-50/80 mb-2">{fmt(next.check_in)} → {fmt(next.check_out)} · {next.guests} guest{next.guests === 1 ? '' : 's'}</p>
            <p className={`font-mono text-[10px] uppercase tracking-[0.2em] ${toneClass(statusLabel(next).tone)}`}>{statusLabel(next).text}</p>
          </div>
        </Link>
      ) : (
        <div className="glass-panel p-8">
          <p className="font-sans text-emerald-50/70 text-[14px] mb-5">You have no upcoming trips yet.</p>
          <Link href="/staycations" className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400 border-b border-emerald-400/40 pb-1 hover:border-emerald-400 transition-colors">
            Find a stay
          </Link>
        </div>
      )}
    </div>
  );
}