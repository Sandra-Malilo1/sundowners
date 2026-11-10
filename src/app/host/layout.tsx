'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import SiteStyles from '@/components/ui/SiteStyles';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/lib/profile';

const NAV = [
  { href: '/host', label: 'Overview' },
  { href: '/host/listings', label: 'My listings' },
  { href: '/host/bookings', label: 'Bookings' },
];

// Wraps every page under /host. Signed-out -> login. Signed-in but not a host yet -> "Become a host".
export default function HostLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const [ready, setReady] = useState(false);
  const profileQ = useProfile();

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      if (!data.session) router.replace(`/auth/host/login?next=${encodeURIComponent(pathname)}`);
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

  const isHost = !!profileQ.data?.roles?.includes('host');
  const active = (href: string) => (href === '/host' ? pathname === href : pathname.startsWith(href));

  return (
    <main className="relative min-h-screen bg-[#051009] selection:bg-emerald-500/30 selection:text-white">
      <SiteStyles />
      <header className="border-b border-emerald-900/40">
        <div className="max-w-350 mx-auto px-6 md:px-10 h-18 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-sans font-bold text-[22px] tracking-tighter uppercase text-white">
              <span className="text-emerald-400">Love</span>Africa
            </Link>
            <span className="hidden sm:inline rounded-full bg-emerald-400/15 px-3 py-1 text-[13px] font-medium text-emerald-300">Hosting</span>
          </div>
          <div className="flex items-center gap-5 text-[15px] font-medium">
            <Link href="/dashboard" className="hidden sm:block text-emerald-100/75 hover:text-white transition-colors">Guest account</Link>
            <button type="button" onClick={signOut} className="px-5 py-2.5 rounded-full border border-emerald-300/30 text-white hover:bg-white/5 transition-colors">Sign out</button>
          </div>
        </div>
      </header>

      <div className="max-w-350 mx-auto px-6 md:px-10 py-10 pb-28">
        {!ready || profileQ.isLoading ? (
          <div className="h-96 rounded-2xl bg-emerald-900/20 animate-pulse" />
        ) : !isHost ? (
          <div className="max-w-xl mx-auto text-center py-16">
            <h1 className="font-serif text-[40px] md:text-[48px] text-white tracking-tight leading-[1.1] mb-4">This isn’t a host account</h1>
            <p className="text-[18px] text-emerald-50/75 leading-relaxed mb-8">
              The host area is for host accounts only. Sign out, then create a host account or sign in with one.
            </p>
            <button type="button" onClick={async () => { await signOut(); router.replace('/auth/host/register'); }} className="h-14 px-10 rounded-xl bg-emerald-400 text-black text-[17px] font-semibold hover:bg-emerald-300 transition-colors">
              Create a host account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[210px_1fr] gap-8 md:gap-14">
            <aside>
              <ul className="flex md:flex-col gap-2 overflow-x-auto md:sticky md:top-8 pb-2 md:pb-0">
                {NAV.map((n) => (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      className={`block whitespace-nowrap px-4 py-3 rounded-xl text-[16px] font-medium transition-colors ${
                        active(n.href) ? 'bg-emerald-400/15 text-emerald-300' : 'text-emerald-100/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
            <section className="min-w-0">{children}</section>
          </div>
        )}
      </div>
    </main>
  );
}