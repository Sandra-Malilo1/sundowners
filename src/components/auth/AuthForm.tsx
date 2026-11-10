'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

type Mode = 'login' | 'register';
type Method = 'email' | 'phone';

// Same look as the homepage: emerald/black, Playfair + JetBrains Mono + Inter.
// (Homepage keeps these inline in its own <GlobalStyles/>, so the auth pages carry their own copy.)
const AuthStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,800;1,400&family=JetBrains+Mono:wght@300;400;700&family=Inter:wght@300;400;500;600&display=swap');
    body { font-family: 'Inter', sans-serif; background-color: #051009; color: #fff; overflow-x: hidden; }
    .font-serif { font-family: 'Playfair Display', serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    .font-sans { font-family: 'Inter', sans-serif; }
    .glass-panel {
      background: rgba(10, 30, 18, 0.45);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(163, 191, 174, 0.35);
      border-radius: 8px;
    }
    .form-input {
      background: rgba(5, 16, 9, 0.6);
      border: 1px solid rgba(163, 191, 174, 0.3);
      border-radius: 6px;
      color: #fff;
      transition: border-color 0.2s ease, background-color 0.2s ease;
    }
    .form-input:focus { background: rgba(5, 16, 9, 0.85); border-color: rgba(163, 191, 174, 0.8); outline: none; }
    .form-input::placeholder { color: rgba(163, 191, 174, 0.3); }
  `}</style>
);

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
});

const labelClass = 'font-mono text-[9px] uppercase tracking-[0.3em] text-emerald-300 mb-3 block';
const inputClass = 'form-input w-full px-4 py-3 text-white font-sans text-sm';

const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.9 2.3 2.8 6.4 2.8 11.9S6.9 21.5 12 21.5c5.2 0 8.6-3.6 8.6-8.8 0-.6-.1-1-.2-1.5H12z" />
  </svg>
);

// Only allow same-site redirects like /dashboard, never //evil.com
const safeNext = (value: string | null, fallback = '/dashboard') =>
  value && value.startsWith('/') && !value.startsWith('//') ? value : fallback;

// "0712 345 678" -> "+254712345678". Anything already starting with + is kept.
const normalizePhone = (raw: string) => {
  const cleaned = raw.replace(/[\s()-]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('0')) return `+254${cleaned.slice(1)}`;
  return `+${cleaned}`;
};

const COPY = {
  login: {
    eyebrow: 'Welcome Back',
    title: 'Sign in to',
    highlight: 'LoveAfrica',
    blurb: 'Pick up where you left off: your trips, saved stays and messages.',
    cta: 'Sign In',
    switchText: "Don't have an account?",
    switchLink: 'Create one',
    switchHref: '/auth/register',
    image: '/assets/images/living4.jpg',
    quoteLabel: 'Your Journey Continues',
    quote: "Africa's most remarkable stays, waiting for you.",
  },
  register: {
    eyebrow: 'Join LoveAfrica',
    title: 'Begin your',
    highlight: 'African escape',
    blurb: 'One account for every stay and experience. Free to join.',
    cta: 'Create Account',
    switchText: 'Already have an account?',
    switchLink: 'Sign in',
    switchHref: '/auth/login',
    image: '/assets/images/exte.jpg',
    quoteLabel: 'Your Journey Starts Here',
    quote: 'Discover Africa’s most exclusive properties.',
  },
} as const;

const HOST_COPY = {
  login: {
    ...COPY.login,
    eyebrow: 'Host Portal',
    title: 'Host sign in to',
    highlight: 'LoveAfrica',
    blurb: 'Manage your listings, bookings and guests.',
    switchText: 'New host?',
    switchLink: 'Create a host account',
    switchHref: '/auth/host/register',
    quoteLabel: 'Welcome Back, Host',
    quote: 'Your guests are waiting.',
  },
  register: {
    ...COPY.register,
    eyebrow: 'Become a Host',
    title: 'List your place on',
    highlight: 'LoveAfrica',
    blurb: 'Create a host account to list your villa, apartment, lodge or guesthouse. Free to join.',
    cta: 'Create Host Account',
    switchText: 'Already a host?',
    switchLink: 'Host sign in',
    switchHref: '/auth/host/login',
    quoteLabel: 'Share Your Space',
    quote: 'Welcome guests from across Africa.',
  },
} as const;

export default function AuthForm({ mode, audience = 'guest' }: { mode: Mode; audience?: 'guest' | 'host' }) {
  const router = useRouter();
  const params = useSearchParams();
  const isHost = audience === 'host';
  const defaultNext = isHost ? '/host' : '/dashboard';
  const next = safeNext(params.get('next'), defaultNext);
  const copy = (isHost ? HOST_COPY : COPY)[mode];

  // Host portal only lets host accounts in.
  const hostGate = async (): Promise<boolean> => {
    const { data: u } = await supabase.auth.getUser();
    const id = u.user?.id;
    if (id) {
      const { data } = await supabase.from('profiles').select('roles').eq('id', id).maybeSingle();
      if ((data?.roles as string[] | undefined)?.includes('host')) return true;
    }
    await supabase.auth.signOut();
    setError('This is not a host account. Create a host account, or use guest sign in.');
    return false;
  };

  const [method, setMethod] = useState<Method>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const reset = () => {
    setError('');
    setNotice('');
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setLoading(true);

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoading(false);
        return setError(error.message);
      }
      if (isHost && !(await hostGate())) return setLoading(false);
      setLoading(false);
      router.replace(next);
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, ...(isHost ? { signup_as: 'host' } : {}) },
        emailRedirectTo: `${window.location.origin}${next}`,
      },
    });
    setLoading(false);
    if (error) return setError(error.message);
    if (data.session) {
      if (isHost) await supabase.rpc('add_my_role', { r: 'host' });
      router.replace(next);
      router.refresh();
    } else {
      setNotice('Check your email and click the confirmation link to finish creating your account.');
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizePhone(phone),
      options: {
        shouldCreateUser: mode === 'register',
        data: mode === 'register' ? { full_name: name, ...(isHost ? { signup_as: 'host' } : {}) } : undefined,
      },
    });
    setLoading(false);
    if (error) return setError(error.message);
    setOtpSent(true);
    setNotice('We sent a 6-digit code by SMS.');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: normalizePhone(phone),
      token: otp.trim(),
      type: 'sms',
    });
    if (error) {
      setLoading(false);
      return setError(error.message);
    }
    if (isHost) {
      if (mode === 'register') await supabase.rpc('add_my_role', { r: 'host' });
      if (!(await hostGate())) return setLoading(false);
    }
    setLoading(false);
    router.replace(next);
    router.refresh();
  };

  const handleGoogle = async () => {
    reset();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${next}` },
    });
    if (error) setError(error.message);
  };

  const submitBtn =
    'w-full py-4 rounded-sm font-mono text-[10px] uppercase tracking-[0.2em] text-black font-medium bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] transition-colors flex items-center justify-center gap-3';

  return (
    <main className="relative min-h-screen bg-[#051009] selection:bg-emerald-500/30 selection:text-white">
      <AuthStyles />

      <Link
        href="/"
        className="absolute top-8 left-6 md:left-16 z-30 font-sans font-bold text-xl tracking-tighter uppercase text-white"
      >
        <span className="text-emerald-400">Love</span>Africa
      </Link>

      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* LEFT: image */}
        <div className="relative hidden lg:block overflow-hidden">
          <img src={copy.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-linear-to-t from-[#051009]/80 via-[#051009]/20 to-[#051009]/40" />
          <div className="absolute top-6 left-6 w-16 h-16 border-t-2 border-l-2 border-emerald-400/40" />
          <div className="absolute bottom-6 right-6 w-16 h-16 border-b-2 border-r-2 border-emerald-400/40" />
          <div className="glass-panel absolute bottom-0 left-0 right-0 m-10 p-8">
            <p className="font-mono text-[10px] tracking-[0.3em] text-emerald-400 uppercase mb-3">{copy.quoteLabel}</p>
            <h3 className="font-serif text-2xl md:text-3xl text-white leading-tight">{copy.quote}</h3>
          </div>
        </div>

        {/* RIGHT: form */}
        <div className="flex items-center justify-center px-6 md:px-16 py-32">
          <motion.div {...reveal()} className="w-full max-w-md">
            <p className="font-mono text-[10px] tracking-[0.4em] text-emerald-400 uppercase mb-4 flex items-center gap-3">
              <span className="w-8 h-px bg-emerald-400" /> {copy.eyebrow}
            </p>
            <h1 className="font-serif text-[36px] md:text-[44px] text-white tracking-tighter leading-[1.1] mb-4">
              {copy.title}
              <br />
              <span className="text-emerald-100">{copy.highlight}</span>
            </h1>
            <p className="font-sans text-emerald-50/70 text-[14px] leading-relaxed mb-8">{copy.blurb}</p>

            {/* Google (not on host sign-up, so every host account gets the host role) */}
            {!(isHost && mode === 'register') && (<>
            <button
              type="button"
              onClick={handleGoogle}
              className="w-full py-3.5 mb-6 rounded-sm border border-emerald-300/30 hover:border-emerald-300/60 hover:bg-emerald-500/10 transition-colors flex items-center justify-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white"
            >
              <GoogleIcon /> Continue with Google
            </button>

            <div className="flex items-center gap-4 mb-6">
              <span className="flex-1 h-px bg-emerald-900/60" />
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-emerald-100/40">or</span>
              <span className="flex-1 h-px bg-emerald-900/60" />
            </div>
            </>)}

            {/* Method tabs */}
            <div className="flex gap-8 mb-6 border-b border-emerald-900/50">
              {(['email', 'phone'] as Method[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMethod(m);
                    reset();
                  }}
                  className={`pb-3 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors border-b ${
                    method === m
                      ? 'text-emerald-400 border-emerald-400'
                      : 'text-emerald-100/50 border-transparent hover:text-emerald-200'
                  }`}
                >
                  {m === 'email' ? 'Email' : 'Phone'}
                </button>
              ))}
            </div>

            {/* Feedback */}
            {error && (
              <div role="alert" className="mb-6 px-4 py-3 rounded-sm border border-red-400/40 bg-red-500/10 text-red-200 font-sans text-sm">
                {error}
              </div>
            )}
            {notice && (
              <div className="mb-6 px-4 py-3 rounded-sm border border-emerald-400/40 bg-emerald-500/10 text-emerald-100 font-sans text-sm">
                {notice}
              </div>
            )}

            {/* EMAIL */}
            {method === 'email' && (
              <form onSubmit={handleEmail} className="space-y-6">
                {mode === 'register' && (
                  <div>
                    <label className={labelClass} htmlFor="name">Full Name</label>
                    <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Sarah Anderson" className={inputClass} />
                  </div>
                )}
                <div>
                  <label className={labelClass} htmlFor="email">Email</label>
                  <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sarah@example.com" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={mode === 'register' ? 8 : undefined}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
                    className={inputClass}
                  />
                </div>
                <button type="submit" disabled={loading} className={submitBtn}>
                  <span>{loading ? 'Please wait…' : copy.cta}</span>
                  <ArrowRight />
                </button>
              </form>
            )}

            {/* PHONE */}
            {method === 'phone' && !otpSent && (
              <form onSubmit={handleSendOtp} className="space-y-6">
                {mode === 'register' && (
                  <div>
                    <label className={labelClass} htmlFor="pname">Full Name</label>
                    <input id="pname" type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Sarah Anderson" className={inputClass} />
                  </div>
                )}
                <div>
                  <label className={labelClass} htmlFor="phone">Phone Number</label>
                  <input id="phone" type="tel" required autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678 or +254…" className={inputClass} />
                </div>
                <button type="submit" disabled={loading} className={submitBtn}>
                  <span>{loading ? 'Sending…' : 'Send Code'}</span>
                  <ArrowRight />
                </button>
              </form>
            )}

            {method === 'phone' && otpSent && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className={labelClass} htmlFor="otp">6-digit Code</label>
                  <input id="otp" type="text" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" className={`${inputClass} tracking-[0.5em] text-center`} />
                </div>
                <button type="submit" disabled={loading} className={submitBtn}>
                  <span>{loading ? 'Verifying…' : 'Verify & Continue'}</span>
                  <ArrowRight />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                    reset();
                  }}
                  className="w-full font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-100/60 hover:text-emerald-300 transition-colors"
                >
                  Use a different number
                </button>
              </form>
            )}

            <p className="mt-10 font-sans text-sm text-emerald-50/70">
              {copy.switchText}{' '}
              <Link
                href={`${copy.switchHref}${next !== defaultNext ? `?next=${encodeURIComponent(next)}` : ''}`}
                className="text-emerald-400 hover:text-emerald-300 hover:underline"
              >
                {copy.switchLink}
              </Link>
            </p>
            <p className="mt-4 font-sans text-sm text-emerald-50/55">
              {isHost ? (
                <>Looking to book a stay? <Link href="/auth/login" className="text-emerald-400 hover:text-emerald-300 hover:underline">Guest sign in</Link></>
              ) : (
                <>Hosting a property? <Link href="/auth/host/login" className="text-emerald-400 hover:text-emerald-300 hover:underline">Host sign in</Link></>
              )}
            </p>
          </motion.div>
        </div>
      </div>
    </main>
  );
}