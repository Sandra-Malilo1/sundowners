'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PROPERTY_TYPES, formatPrice, type Property } from '@/lib/staycations';
import { useSaved } from '@/lib/saved';

export default function PropertyCard({ property: p }: { property: Property }) {
  const router = useRouter();
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(p.id);
  const typeLabel = PROPERTY_TYPES.find((t) => t.value === p.property_type)?.label ?? '';

  const onHeart = async () => {
    try {
      const result = await toggle(p.id);
      if (result === 'login') {
        const next = `${window.location.pathname}${window.location.search}`;
        router.push(`/auth/login?next=${encodeURIComponent(next)}`);
      }
    } catch {
      /* heart already reverted */
    }
  };

  return (
    <article className="group relative">
      <Link href={`/staycations/${p.id}`} className="block">
        {/* Photo */}
        <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-emerald-300/15 bg-[#0a1f12] transition-all duration-300 group-hover:border-emerald-300/40 group-hover:-translate-y-1 group-hover:shadow-[0_18px_40px_-18px_rgba(52,211,153,0.35)]">
          {p.cover_url && (
            <img
              src={p.cover_url}
              alt={p.title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-[#051009]/70 to-transparent" />

          <span className="absolute top-3 left-3 rounded-full bg-[#051009]/75 backdrop-blur-sm px-3.5 py-1.5 text-[13px] font-medium text-white">
            {typeLabel}
          </span>
          {p.instant_book && (
            <span className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-emerald-400 px-3 py-1 text-[12px] font-semibold text-black">
              <span className="w-1.5 h-1.5 rounded-full bg-black/60" /> Instant book
            </span>
          )}
        </div>

        {/* Details */}
        <div className="pt-4 px-1">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-serif text-[22px] leading-snug text-white group-hover:text-emerald-200 transition-colors">{p.title}</h3>
            {p.rating_count > 0 && (
              <span className="shrink-0 pt-1 text-[15px] font-medium text-white">
                <span className="text-emerald-400">★</span> {Number(p.rating_avg).toFixed(1)}
                <span className="text-emerald-100/50 font-normal"> ({p.rating_count})</span>
              </span>
            )}
          </div>
          <p className="mt-1 text-[15px] text-emerald-100/75">{[p.city, p.country].filter(Boolean).join(', ')}</p>
          <p className="mt-0.5 text-[15px] text-emerald-100/55">
            {p.max_guests} guests · {p.bedrooms} bedroom{p.bedrooms === 1 ? '' : 's'} · {p.bathrooms} bath
          </p>
          <p className="mt-3 text-white">
            <span className="text-[18px] font-semibold">{formatPrice(Number(p.base_price), p.currency)}</span>
            <span className="text-[15px] text-emerald-100/60"> / night</span>
          </p>
        </div>
      </Link>

      {/* Next to the link (not inside it) so tapping the heart never opens the listing */}
      <button
        type="button"
        onClick={onHeart}
        aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
        aria-pressed={saved}
        className="absolute top-3 right-3 z-10 w-11 h-11 rounded-full bg-[#051009]/70 backdrop-blur-sm flex items-center justify-center hover:bg-[#051009]/90 hover:scale-105 transition-all"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill={saved ? '#34d399' : 'none'} stroke={saved ? '#34d399' : '#fff'} strokeWidth="1.8">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
        </svg>
      </button>
    </article>
  );
}