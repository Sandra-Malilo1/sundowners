'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getMyListings } from '@/lib/host';
import { useProfile } from '@/lib/profile';

async function hostBookingStats(propertyIds: string[]) {
  if (propertyIds.length === 0) return { upcoming: 0, requests: 0 };
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('bookings')
    .select('status, check_in, expires_at, payment_status')
    .in('property_id', propertyIds);
  if (error) throw error;
  const rows = (data ?? []) as { status: string; check_in: string; expires_at: string | null; payment_status: string }[];
  return {
    upcoming: rows.filter((b) => b.status === 'confirmed' && b.check_in >= today).length,
    requests: rows.filter((b) => b.status === 'pending' && b.payment_status === 'unpaid' && !b.expires_at).length,
  };
}

const stat = 'rounded-2xl border border-emerald-300/15 bg-[#0a1f12]/50 p-6';

export default function HostHome() {
  const profile = useProfile().data;
  const listingsQ = useQuery({ queryKey: ['host-listings'], queryFn: getMyListings, staleTime: 0 });
  const listings = listingsQ.data ?? [];
  const ids = listings.map((l) => l.id);
  const statsQ = useQuery({ queryKey: ['host-stats', ids.join(',')], queryFn: () => hostBookingStats(ids), enabled: listingsQ.isSuccess, staleTime: 0 });

  const count = (s: string) => listings.filter((l) => l.status === s).length;
  const first = profile?.full_name?.split(' ')[0];

  return (
    <div>
      <p className="text-[15px] font-medium text-emerald-400 mb-3">Hosting</p>
      <h1 className="font-serif text-[40px] md:text-[52px] text-white tracking-tight leading-[1.08] mb-10">{first ? `Hello, ${first}.` : 'Hello.'}</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <div className={stat}><p className="text-[15px] text-emerald-300 mb-1">Live listings</p><p className="font-serif text-[40px] text-white">{listingsQ.isLoading ? '–' : count('active')}</p></div>
        <div className={stat}><p className="text-[15px] text-emerald-300 mb-1">In review</p><p className="font-serif text-[40px] text-white">{listingsQ.isLoading ? '–' : count('pending_review')}</p></div>
        <Link href="/host/bookings?tab=upcoming" className={`${stat} hover:border-emerald-300/40 transition-colors`}><p className="text-[15px] text-emerald-300 mb-1">Upcoming stays</p><p className="font-serif text-[40px] text-white">{statsQ.data ? statsQ.data.upcoming : '–'}</p></Link>
        <Link href="/host/bookings?tab=requests" className={`${stat} hover:border-emerald-300/40 transition-colors`}><p className="text-[15px] text-emerald-300 mb-1">Requests to answer</p><p className="font-serif text-[40px] text-white">{statsQ.data ? statsQ.data.requests : '–'}</p></Link>
      </div>

      {!listingsQ.isLoading && listings.length === 0 ? (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-8 md:p-10">
          <h2 className="font-serif text-[30px] text-white mb-3">Add your first listing</h2>
          <p className="text-[17px] text-emerald-50/75 mb-6 max-w-xl">Tell us about your place, add photos and set your price. We review every new listing before it goes live.</p>
          <Link href="/host/listings/new" className="inline-flex h-13 items-center px-8 rounded-xl bg-emerald-400 text-black text-[16px] font-semibold hover:bg-emerald-300 transition-colors">Create a listing</Link>
        </div>
      ) : (
        <Link href="/host/listings" className="inline-flex h-13 items-center px-8 rounded-xl bg-emerald-400 text-black text-[16px] font-semibold hover:bg-emerald-300 transition-colors">Manage my listings</Link>
      )}
    </div>
  );
}