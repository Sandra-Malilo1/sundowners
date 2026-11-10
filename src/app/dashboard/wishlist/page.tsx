'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import PropertyCard from '@/components/staycations/PropertyCard';
import { supabase } from '@/lib/supabase';
import type { Property } from '@/lib/staycations';

async function listWishlist(): Promise<Property[]> {
  const { data: auth } = await supabase.auth.getSession();
  if (!auth.session) return [];
  const { data, error } = await supabase
    .from('saved_properties')
    .select('created_at, properties(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  // a saved stay that is no longer public comes back as null: skip it
  return ((data ?? []) as unknown as { properties: Property | null }[])
    .map((r) => r.properties)
    .filter((p): p is Property => !!p);
}

export default function WishlistPage() {
  const q = useQuery({ queryKey: ['wishlist'], queryFn: listWishlist, staleTime: 0 });
  const items = q.data ?? [];

  return (
    <div>
      <h1 className="font-serif text-[36px] md:text-[44px] text-white tracking-tighter leading-[1.1] mb-8">Wishlist</h1>

      {q.isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="aspect-4/5 rounded-sm bg-emerald-900/20 animate-pulse" />)}
        </div>
      )}

      {!q.isLoading && items.length === 0 && (
        <div className="py-16 text-center">
          <p className="font-sans text-emerald-50/70 text-[14px] mb-6">Tap the heart on any stay to save it here.</p>
          <Link href="/staycations" className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400 border-b border-emerald-400/40 pb-1 hover:border-emerald-400 transition-colors">
            Browse stays
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      )}
    </div>
  );
}