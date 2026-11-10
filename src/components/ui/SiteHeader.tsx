'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Active = 'staycations' | 'experiences';

const NAV: { key: Active; href: string; label: string }[] = [
  { key: 'staycations', href: '/staycations', label: 'Staycations' },
  { key: 'experiences', href: '/experiences', label: 'Experiences' },
];

/** Sticky top bar. Shows Sign in / Join when signed out, Wishlist / My account when signed in. */
export default function SiteHeader({ active }: { active?: Active }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setSignedIn(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(!!session));
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-900/40 bg-[#051009]/85 backdrop-blur-md">
      <div className="max-w-350 mx-auto px-6 md:px-10 h-18 flex items-center justify-between gap-6">
        <div className="flex items-center gap-10">
          <Link href="/" className="font-sans font-bold text-[22px] tracking-tighter uppercase text-white">
            <span className="text-emerald-400">Love</span>Africa
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {NAV.map((n) => (
              <Link
                key={n.key}
                href={n.href}
                className={`relative text-[15px] font-medium transition-colors py-2 ${
                  active === n.key ? 'text-white' : 'text-emerald-100/70 hover:text-white'
                }`}
              >
                {n.label}
                {active === n.key && <span className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-emerald-400 rounded-full" />}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3 md:gap-5 text-[15px] font-medium">
          {signedIn === true && (
            <>
              <Link href="/dashboard/wishlist" className="hidden sm:block text-emerald-100/80 hover:text-white transition-colors">
                Wishlist
              </Link>
              <Link href="/dashboard" className="px-5 py-2.5 rounded-full bg-emerald-400 text-black hover:bg-emerald-300 transition-colors">
                My account
              </Link>
            </>
          )}
          {signedIn === false && (
            <>
              <Link href="/auth/host/login" className="hidden md:block text-emerald-100/80 hover:text-white transition-colors">
                Host
              </Link>
              <Link href="/auth/login" className="text-emerald-100/80 hover:text-white transition-colors">
                Sign in
              </Link>
              <Link href="/auth/register" className="px-5 py-2.5 rounded-full bg-emerald-400 text-black hover:bg-emerald-300 transition-colors">
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}