'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatPrice } from '@/lib/staycations';
import { STATUS_LABEL, deleteListing, duplicateListing, getMyListings, saveListing, type HostListing } from '@/lib/host';

function ListingsView() {
  const router = useRouter();
  const qc = useQueryClient();
  const sp = useSearchParams();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const q = useQuery({ queryKey: ['host-listings'], queryFn: getMyListings, staleTime: 0 });
  const listings = q.data ?? [];

  const run = async (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id);
    setError('');
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: ['host-listings'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusyId(null);
    }
  };

  const duplicate = (l: HostListing) =>
    run(l.id, async () => {
      const id = await duplicateListing(l);
      router.push(`/host/listings/${id}/edit?step=2`);
    });

  const remove = (l: HostListing) => {
    if (!window.confirm(`Delete “${l.title}”? This can’t be undone.`)) return;
    run(l.id, () => deleteListing(l.id));
  };

  const link = 'text-[15px] font-medium text-emerald-300 hover:text-white transition-colors';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="font-serif text-[40px] md:text-[48px] text-white tracking-tight leading-[1.1]">My listings</h1>
        <Link href="/host/listings/new" className="inline-flex h-13 items-center px-7 rounded-xl bg-emerald-400 text-black text-[16px] font-semibold hover:bg-emerald-300 transition-colors">+ New listing</Link>
      </div>

      {sp.get('submitted') && <div className="mb-6 px-5 py-4 rounded-xl border border-emerald-400/40 bg-emerald-400/10 text-emerald-100 text-[16px]">Sent for review. We’ll check it within 24 hours.</div>}
      {sp.get('saved') && <div className="mb-6 px-5 py-4 rounded-xl border border-emerald-400/40 bg-emerald-400/10 text-emerald-100 text-[16px]">Changes saved.</div>}
      {error && <div role="alert" className="mb-6 px-5 py-4 rounded-xl border border-red-400/40 bg-red-500/10 text-red-200 text-[16px]">{error}</div>}

      {q.isLoading && <div className="h-48 rounded-2xl bg-emerald-900/20 animate-pulse" />}

      {!q.isLoading && listings.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-[17px] text-emerald-50/70 mb-6">You haven’t created a listing yet.</p>
          <Link href="/host/listings/new" className="text-[16px] font-medium text-emerald-300 underline underline-offset-4">Create your first listing</Link>
        </div>
      )}

      <ul className="space-y-5">
        {listings.map((l) => {
          const st = STATUS_LABEL[l.status];
          const busy = busyId === l.id;
          return (
            <li key={l.id} className={`rounded-2xl border border-emerald-300/15 bg-[#0a1f12]/50 overflow-hidden flex flex-col sm:flex-row ${busy ? 'opacity-60' : ''}`}>
              <div className="sm:w-60 h-44 sm:h-auto bg-[#0a1f12] shrink-0">
                {l.cover_url ? <img src={l.cover_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[15px] text-emerald-100/40">No photo yet</div>}
              </div>
              <div className="p-6 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h2 className="font-serif text-[24px] text-white truncate">{l.title}</h2>
                  <span className={`rounded-full px-3 py-1 text-[13px] font-medium ${st.tone}`}>{st.text}</span>
                </div>
                <p className="text-[15px] text-emerald-100/65 mb-1">{[l.city, l.country].filter(Boolean).join(', ') || 'No location yet'}</p>
                <p className="text-[16px] text-white mb-5">{Number(l.base_price) > 0 ? `${formatPrice(Number(l.base_price), l.currency)} / night` : 'No price yet'}</p>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <Link href={`/host/listings/${l.id}/edit`} className={link}>Edit</Link>
                  {l.status === 'active' && <Link href={`/staycations/${l.id}`} className={link}>View live</Link>}
                  {l.status === 'active' && <button type="button" disabled={busy} className={link} onClick={() => run(l.id, () => saveListing(l.id, { status: 'paused' }))}>Pause</button>}
                  {l.status === 'paused' && <button type="button" disabled={busy} className={link} onClick={() => run(l.id, () => saveListing(l.id, { status: 'active' }))}>Resume</button>}
                  {(l.status === 'draft' || l.status === 'rejected') && <Link href={`/host/listings/${l.id}/edit?step=6`} className={link}>Send for review</Link>}
                  <button type="button" disabled={busy} className={link} onClick={() => duplicate(l)}>Duplicate</button>
                  {(l.status === 'draft' || l.status === 'rejected') && (
                    <button type="button" disabled={busy} className="text-[15px] font-medium text-red-300 hover:text-red-200 transition-colors" onClick={() => remove(l)}>Delete</button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={null}>
      <ListingsView />
    </Suspense>
  );
}