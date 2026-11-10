'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import SiteStyles from '@/components/ui/SiteStyles';
import { supabase } from '@/lib/supabase';

const NAV = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/bookings', label: 'My Bookings' },
  { href: '/dashboard/wishlist', label: 'Wishlist' },
  { href: '/dashboard/profile', label: 'Profile' },
];

// Wraps EVERY page under /dashboard: signed-out visitors are sent to login, then back here.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      if (!data.session) router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
      else setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [router, pathname]);

  const signOut = async () => {
    await supabase.auth.signOut();
    qc.clear();
    router.replace('/');
  };

  const active = (href: string) => (href === '/dashboard' ? pathname === href : pathname.startsWith(href));

  return (
    <main className="relative min-h-screen bg-[#051009] selection:bg-emerald-500/30 selection:text-white">
      <SiteStyles />
      <nav className="px-6 md:px-16 py-8 flex justify-between items-center">
        <Link href="/" className="font-sans font-bold text-xl tracking-tighter uppercase text-white">
          <span className="text-emerald-400">Love</span>Africa
        </Link>
        <div className="flex items-center gap-8 font-mono text-[10px] uppercase tracking-[0.2em]">
          <Link href="/staycations" className="text-emerald-100/70 hover:text-emerald-300 transition-colors">Browse stays</Link>
          <button type="button" onClick={signOut} className="border border-emerald-400/50 px-6 py-3 text-white hover:bg-emerald-500 hover:text-black transition-colors">
            Sign out
          </button>
        </div>
      </nav>

      <div className="px-6 md:px-16 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 md:gap-16 pt-6">
          <aside>
            <ul className="flex md:flex-col gap-2 md:gap-1 overflow-x-auto md:sticky md:top-8 pb-2 md:pb-0">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className={`block whitespace-nowrap px-4 py-3 rounded-sm font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
                      active(n.href) ? 'bg-emerald-500/15 text-emerald-300' : 'text-emerald-100/60 hover:text-emerald-200 hover:bg-emerald-500/5'
                    }`}
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          <section className="min-w-0">
            {ready ? children : <div className="h-96 bg-emerald-900/20 animate-pulse rounded-sm" />}
          </section>
        </div>
      </div>
    </main>
  );
}