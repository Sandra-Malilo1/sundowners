'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import SiteStyles from '@/components/ui/SiteStyles';
import SiteHeader from '@/components/ui/SiteHeader';
import PropertyCard from '@/components/staycations/PropertyCard';
import { FilterSidebar, SearchBar } from '@/components/staycations/StaycationFilters';
import {
  AMENITIES,
  PROPERTY_TYPES,
  SORTS,
  buildQuery,
  parseFilters,
  searchProperties,
  type Filters,
  type Property,
  type Sort,
} from '@/lib/staycations';

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: 'easeOut' as const },
});

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

const num = (n: number) => n.toLocaleString('en-KE');

function CardSkeleton() {
  return (
    <div>
      <div className="aspect-4/3 rounded-2xl bg-emerald-900/25 animate-pulse" />
      <div className="pt-4 space-y-3">
        <div className="h-6 w-3/4 rounded bg-emerald-900/25 animate-pulse" />
        <div className="h-4 w-1/2 rounded bg-emerald-900/20 animate-pulse" />
        <div className="h-5 w-1/3 rounded bg-emerald-900/25 animate-pulse" />
      </div>
    </div>
  );
}

function StaycationsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = searchParams.toString();
  const filters = parseFilters(searchParams);

  const [results, setResults] = useState<Property[] | null>(null);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false); // phones only: the sidebar is always visible on desktop

  useEffect(() => {
    let cancelled = false;
    setResults(null);
    setError('');
    searchProperties(parseFilters(new URLSearchParams(key))).then(({ data, error }) => {
      if (cancelled) return;
      if (error) setError(error.message);
      else setResults(data);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const update = (patch: Partial<Filters>) =>
    router.replace(`${pathname}${buildQuery({ ...filters, ...patch })}`, { scroll: false });

  const clearFilters = () => update({ types: [], minPrice: null, maxPrice: null, amenities: [], minRating: null });
  const clearAll = () => router.replace(pathname, { scroll: false });

  /* Removable "what you're looking at" chips */
  const chips: { key: string; label: string; remove: Partial<Filters> }[] = [];
  if (filters.q) chips.push({ key: 'q', label: filters.q, remove: { q: '' } });
  if (filters.checkIn && filters.checkOut)
    chips.push({ key: 'dates', label: `${shortDate(filters.checkIn)} – ${shortDate(filters.checkOut)}`, remove: { checkIn: '', checkOut: '' } });
  if (filters.guests) chips.push({ key: 'guests', label: `${filters.guests} guest${filters.guests === 1 ? '' : 's'}`, remove: { guests: null } });
  if (filters.minPrice !== null || filters.maxPrice !== null)
    chips.push({
      key: 'price',
      label:
        filters.minPrice !== null && filters.maxPrice !== null
          ? `KES ${num(filters.minPrice)} – ${num(filters.maxPrice)}`
          : filters.minPrice !== null
            ? `KES ${num(filters.minPrice)}+`
            : `Under KES ${num(filters.maxPrice!)}`,
      remove: { minPrice: null, maxPrice: null },
    });
  for (const t of filters.types) {
    chips.push({ key: `t-${t}`, label: PROPERTY_TYPES.find((x) => x.value === t)?.label ?? t, remove: { types: filters.types.filter((x) => x !== t) } });
  }
  if (filters.minRating !== null) chips.push({ key: 'rating', label: `${filters.minRating}+ rating`, remove: { minRating: null } });
  for (const a of filters.amenities) {
    chips.push({
      key: `a-${a}`,
      label: AMENITIES.find((x) => x.value === a)?.label ?? a,
      remove: { amenities: filters.amenities.filter((x) => x !== a) },
    });
  }

  const filterCount =
    filters.types.length +
    (filters.minPrice !== null || filters.maxPrice !== null ? 1 : 0) +
    (filters.minRating !== null ? 1 : 0) +
    filters.amenities.length;

  const countText =
    results === null
      ? 'Searching…'
      : `${results.length} stay${results.length === 1 ? '' : 's'}${filters.q ? ` in “${filters.q}”` : ' across Africa'}`;

  return (
    <main className="relative min-h-screen bg-[#051009] selection:bg-emerald-500/30 selection:text-white">
      <SiteStyles />
      <SiteHeader active="staycations" />

      {/* HERO + SEARCH */}
      <section className="relative px-6 md:px-10 pt-14 pb-10 md:pt-20 md:pb-14 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/assets/images/exp.jpg" alt="" className="w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-linear-to-b from-[#051009]/40 via-[#051009]/85 to-[#051009]" />
        </div>
        <div className="relative z-10 max-w-350 mx-auto">
          <motion.div {...reveal()} className="mb-8 md:mb-10 max-w-3xl">
            <p className="text-[14px] font-medium tracking-wide text-emerald-400 mb-3">Staycations</p>
            <h1 className="font-serif text-[40px] md:text-[60px] text-white tracking-tight leading-[1.05] mb-4">
              Find your perfect <span className="text-emerald-200 italic">stay.</span>
            </h1>
            <p className="text-[17px] md:text-[18px] text-emerald-50/75 leading-relaxed max-w-xl">
              Handpicked villas, lodges and apartments across Africa. Search by place and dates, then book in minutes.
            </p>
          </motion.div>
          <motion.div {...reveal(0.1)}>
            <SearchBar key={key} filters={filters} onSearch={update} />
          </motion.div>
        </div>
      </section>

      {/* RESULTS: filters on the left, stays on the right */}
      <section className="px-6 md:px-10 pb-28">
        <div className="max-w-350 mx-auto">
          {/* Phones: one button reveals the filters */}
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className="lg:hidden w-full mb-6 flex items-center justify-between px-5 py-3.5 rounded-xl border border-emerald-300/30 text-[16px] font-medium text-white"
          >
            <span>{showFilters ? 'Hide filters' : 'Show filters'}</span>
            {filterCount > 0 && <span className="min-w-6 h-6 px-2 rounded-full bg-emerald-400 text-black text-[13px] font-semibold flex items-center justify-center">{filterCount}</span>}
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 lg:gap-12 items-start">
            <aside className={`${showFilters ? 'block' : 'hidden'} lg:block lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto`}>
              <FilterSidebar filters={filters} onChange={update} onClear={clearFilters} />
            </aside>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <p className="text-[18px] text-white font-medium">{countText}</p>
                <div className="flex items-center gap-3">
                  <label htmlFor="sort" className="text-[15px] text-emerald-100/70">Sort by</label>
                  <select
                    id="sort"
                    value={filters.sort}
                    onChange={(e) => update({ sort: e.target.value as Sort })}
                    className="rounded-full border border-emerald-300/30 bg-transparent px-5 py-2.5 text-[15px] font-medium text-white cursor-pointer hover:border-emerald-300/70 transition-colors outline-none"
                  >
                    {SORTS.map((s) => (
                      <option key={s.value} value={s.value} className="bg-[#051009] text-white">
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {chips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2.5 mb-8">
                  {chips.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => update(c.remove)}
                      className="flex items-center gap-2 pl-4 pr-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-[14px] text-emerald-100 hover:bg-emerald-400/20 transition-colors"
                      aria-label={`Remove ${c.label}`}
                    >
                      {c.label} <span className="text-emerald-300 text-[16px] leading-none">×</span>
                    </button>
                  ))}
                  <button type="button" onClick={clearAll} className="ml-2 text-[14px] font-medium text-emerald-100/70 underline underline-offset-4 hover:text-white transition-colors">
                    Clear all
                  </button>
                </div>
              )}

              {error && (
                <div role="alert" className="mb-8 px-5 py-4 rounded-xl border border-red-400/40 bg-red-500/10 text-red-200 text-[15px]">
                  Couldn’t load stays: {error}
                </div>
              )}

              {results === null && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-x-7 gap-y-12">
                  {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
                </div>
              )}

              {results && results.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-x-7 gap-y-12">
                  {results.map((p, i) => (
                    <motion.div key={p.id} {...reveal(Math.min(i, 5) * 0.05)}>
                      <PropertyCard property={p} />
                    </motion.div>
                  ))}
                </div>
              )}

              {results && results.length === 0 && (
                <div className="py-24 text-center max-w-md mx-auto">
                  <h3 className="font-serif text-[30px] text-white mb-3">No stays match that search</h3>
                  <p className="text-[16px] text-emerald-50/70 mb-8">Try different dates, fewer filters or another destination.</p>
                  {key !== '' && (
                    <button onClick={clearAll} className="px-8 py-3.5 rounded-xl bg-emerald-400 text-black text-[16px] font-semibold hover:bg-emerald-300 transition-colors">
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function StaycationsPage() {
  return (
    <Suspense fallback={null}>
      <StaycationsView />
    </Suspense>
  );
}