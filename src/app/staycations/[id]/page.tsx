'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import SiteStyles from '@/components/ui/SiteStyles';
import PhotoGallery from '@/components/staycations/PhotoGallery';
import AvailabilityCalendar from '@/components/staycations/AvailabilityCalendar';
import BookingWidget from '@/components/staycations/BookingWidget';
import PropertyCard from '@/components/staycations/PropertyCard';
import { AMENITIES, PROPERTY_TYPES } from '@/lib/staycations';
import {
  buildBlockedSet,
  getHost,
  getPhotos,
  getProperty,
  getReviews,
  getSimilar,
  getUnavailable,
} from '@/lib/property';

const sectionTitle = 'font-serif text-[26px] md:text-[30px] text-white tracking-tight mb-6';
const eyebrow = 'font-mono text-[10px] tracking-[0.3em] text-emerald-400 uppercase';

function Header() {
  return (
    <nav className="absolute top-0 left-0 w-full z-30 px-6 md:px-16 py-8 flex justify-between items-center">
      <Link href="/" className="font-sans font-bold text-xl tracking-tighter uppercase text-white">
        <span className="text-emerald-400">Love</span>Africa
      </Link>
      <Link href="/auth/login" className="font-mono text-[10px] uppercase tracking-[0.2em] border border-emerald-400/50 px-6 py-3 text-white hover:bg-emerald-500 hover:text-black transition-colors">
        Sign In
      </Link>
    </nav>
  );
}

const Shell = ({ children }: { children: React.ReactNode }) => (
  <main className="relative min-h-screen bg-[#051009] selection:bg-emerald-500/30 selection:text-white">
    <SiteStyles />
    <Header />
    {children}
  </main>
);

const humanize = (k: string) => k.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

function PropertyView() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();

  const [checkIn, setCheckIn] = useState(sp.get('in') ?? '');
  const [checkOut, setCheckOut] = useState(sp.get('out') ?? '');
  const [guests, setGuests] = useState(Number(sp.get('guests')) || 1);

  const propertyQ = useQuery({ queryKey: ['property', id], queryFn: () => getProperty(id) });
  const p = propertyQ.data;

  const photosQ = useQuery({ queryKey: ['photos', id], queryFn: () => getPhotos(id), enabled: !!p });
  const hostQ = useQuery({ queryKey: ['host', p?.host_id], queryFn: () => getHost(p!.host_id), enabled: !!p });
  const reviewsQ = useQuery({ queryKey: ['reviews', id], queryFn: () => getReviews(id), enabled: !!p });
  const unavailQ = useQuery({ queryKey: ['unavailable', id], queryFn: () => getUnavailable(id), enabled: !!p, staleTime: 30_000 });
  const similarQ = useQuery({ queryKey: ['similar', id], queryFn: () => getSimilar(p!), enabled: !!p });

  const blocked = useMemo(() => buildBlockedSet(unavailQ.data ?? []), [unavailQ.data]);

  useEffect(() => {
    if (p) document.title = `${p.title}, ${p.city ?? p.country} — LoveAfrica`;
  }, [p]);

  const update = (patch: { checkIn?: string; checkOut?: string; guests?: number }) => {
    if (patch.checkIn !== undefined) setCheckIn(patch.checkIn);
    if (patch.checkOut !== undefined) setCheckOut(patch.checkOut);
    if (patch.guests !== undefined) setGuests(patch.guests);
  };

  /* ---------- states ---------- */
  if (propertyQ.isLoading) {
    return (
      <Shell>
        <div className="pt-36 px-6 md:px-16 max-w-400 mx-auto">
          <div className="h-10 w-72 bg-emerald-900/30 animate-pulse mb-8 rounded-sm" />
          <div className="h-72 md:h-125 bg-emerald-900/20 animate-pulse rounded-sm" />
        </div>
      </Shell>
    );
  }

  if (propertyQ.isError || !p) {
    return (
      <Shell>
        <div className="pt-48 pb-32 px-6 text-center">
          <h1 className="font-serif text-[36px] text-white mb-4">Stay not found</h1>
          <p className="font-sans text-emerald-50/70 mb-8">
            {propertyQ.isError ? 'Something went wrong loading this stay.' : 'This stay doesn’t exist or isn’t available right now.'}
          </p>
          <Link href="/staycations" className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400 border-b border-emerald-400/40 pb-1 hover:border-emerald-400 transition-colors">
            Back to all stays
          </Link>
        </div>
      </Shell>
    );
  }

  /* ---------- derived ---------- */
  const typeLabel = PROPERTY_TYPES.find((t) => t.value === p.property_type)?.label ?? '';
  const photos = photosQ.data && photosQ.data.length > 0 ? photosQ.data : p.cover_url ? [p.cover_url] : [];
  const amenities = p.amenities.map((a) => AMENITIES.find((x) => x.value === a)?.label ?? humanize(a));
  const rules = Object.entries(p.house_rules ?? {});
  const host = hostQ.data;
  const reviews = reviewsQ.data ?? [];
  const hasMap = p.latitude != null && p.longitude != null;
  const mapSrc = hasMap
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${p.longitude! - 0.012}%2C${p.latitude! - 0.008}%2C${p.longitude! + 0.012}%2C${p.latitude! + 0.008}&layer=mapnik&marker=${p.latitude}%2C${p.longitude}`
    : '';

  const facts = [
    `${p.max_guests} guests`,
    `${p.bedrooms} bedroom${p.bedrooms === 1 ? '' : 's'}`,
    `${p.beds} bed${p.beds === 1 ? '' : 's'}`,
    `${p.bathrooms} bath${Number(p.bathrooms) === 1 ? '' : 's'}`,
  ];

  return (
    <Shell>
      <div className="pt-32 px-6 md:px-16 pb-24">
        <div className="max-w-400 mx-auto">
          <Link href="/staycations" className="inline-block mb-8 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-100/60 hover:text-emerald-300 transition-colors">
            ← All stays
          </Link>

          {/* Title */}
          <div className="mb-8">
            <p className={`${eyebrow} mb-4`}>{typeLabel}</p>
            <h1 className="font-serif text-[36px] md:text-[56px] text-white tracking-tighter leading-[1.05] mb-4">{p.title}</h1>
            <p className="font-sans text-emerald-50/70 text-[14px]">
              {[p.city, p.country].filter(Boolean).join(', ')}
              {p.rating_count > 0 && (
                <span> · ★ {Number(p.rating_avg).toFixed(1)} ({p.rating_count} review{p.rating_count === 1 ? '' : 's'})</span>
              )}
            </p>
          </div>

          <PhotoGallery photos={photos} title={p.title} />

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 lg:gap-20 items-start">
            {/* ---------------- LEFT ---------------- */}
            <div className="space-y-16 min-w-0">
              <section>
                <div className="flex flex-wrap gap-x-6 gap-y-2 pb-8 mb-8 border-b border-emerald-900/50 font-mono text-[11px] uppercase tracking-[0.15em] text-emerald-200">
                  {facts.map((f) => <span key={f}>{f}</span>)}
                </div>
                {p.description && (
                  <p className="font-sans text-emerald-50/80 text-[15px] leading-relaxed max-w-2xl whitespace-pre-line">{p.description}</p>
                )}
              </section>

              {amenities.length > 0 && (
                <section>
                  <h2 className={sectionTitle}>What this place offers</h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {amenities.map((a) => (
                      <li key={a} className="flex items-center gap-3 font-sans text-[14px] text-emerald-50/80">
                        <span className="text-emerald-400">✓</span> {a}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section id="availability" className="scroll-mt-8">
                <h2 className={sectionTitle}>Availability</h2>
                <AvailabilityCalendar
                  blocked={blocked}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  onChange={(i, o) => update({ checkIn: i, checkOut: o })}
                />
              </section>

              {hasMap && (
                <section>
                  <h2 className={sectionTitle}>Where you’ll stay</h2>
                  <p className="font-sans text-emerald-50/70 text-[14px] mb-5">{p.address ?? [p.city, p.country].filter(Boolean).join(', ')}</p>
                  <div className="relative h-80 rounded-sm overflow-hidden border border-emerald-300/15">
                    <iframe title="Map" src={mapSrc} loading="lazy" className="absolute inset-0 w-full h-full" style={{ filter: 'grayscale(0.35) brightness(0.9)' }} />
                  </div>
                </section>
              )}

              <section>
                <h2 className={sectionTitle}>House rules</h2>
                <ul className="space-y-3 font-sans text-[14px] text-emerald-50/80">
                  <li>Check-in from {p.check_in_time.slice(0, 5)}</li>
                  <li>Check-out by {p.check_out_time.slice(0, 5)}</li>
                  <li>Minimum stay: {p.min_nights} night{p.min_nights === 1 ? '' : 's'}{p.max_nights ? ` · Maximum: ${p.max_nights} nights` : ''}</li>
                  {rules.map(([k, v]) => (
                    <li key={k}>
                      {humanize(k)}: {typeof v === 'boolean' ? (v ? 'Allowed' : 'Not allowed') : String(v)}
                    </li>
                  ))}
                </ul>
              </section>

              {host && (
                <section>
                  <h2 className={sectionTitle}>Your host</h2>
                  <div className="glass-panel p-6 flex items-center gap-5 max-w-lg">
                    {host.avatar_url ? (
                      <img src={host.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center font-serif text-2xl text-emerald-200">
                        {(host.full_name ?? 'H').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-serif text-xl text-white">{host.full_name ?? 'Your host'}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-100/60 mt-1">
                        Member since {new Date(host.created_at).getFullYear()}
                      </p>
                      {host.verification === 'verified' && (
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400 mt-2">✓ Verified host</p>
                      )}
                    </div>
                  </div>
                </section>
              )}

              <section>
                <h2 className={sectionTitle}>
                  Reviews{p.rating_count > 0 && <span className="text-emerald-100/50"> · ★ {Number(p.rating_avg).toFixed(1)}</span>}
                </h2>
                {reviews.length === 0 ? (
                  <p className="font-sans text-[14px] text-emerald-50/60">No written reviews yet. Guests can review after a completed stay.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {reviews.map((r) => (
                      <article key={r.id}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center font-serif text-emerald-200">
                            {(r.guest_name ?? 'G').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-sans text-sm text-white">{r.guest_name ?? 'Guest'}</p>
                            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-100/50">
                              {new Date(r.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <p className="font-mono text-[11px] text-emerald-400 mb-2">{'★'.repeat(r.rating)}<span className="text-emerald-100/20">{'★'.repeat(5 - r.rating)}</span></p>
                        {r.comment && <p className="font-sans text-[14px] text-emerald-50/80 leading-relaxed">{r.comment}</p>}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* ---------------- RIGHT: booking ---------------- */}
            <aside className="lg:sticky lg:top-8">
              <BookingWidget property={p} blocked={blocked} checkIn={checkIn} checkOut={checkOut} guests={guests} onChange={update} />
            </aside>
          </div>

          {similarQ.data && similarQ.data.length > 0 && (
            <section className="mt-24 pt-16 border-t border-emerald-900/50">
              <p className={`${eyebrow} mb-4`}>You may also like</p>
              <h2 className="font-serif text-[32px] md:text-[40px] text-white tracking-tighter mb-10">Similar stays</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {similarQ.data.map((s) => <PropertyCard key={s.id} property={s} />)}
              </div>
            </section>
          )}
        </div>
      </div>
    </Shell>
  );
}

export default function PropertyPage() {
  return (
    <Suspense fallback={null}>
      <PropertyView />
    </Suspense>
  );
}