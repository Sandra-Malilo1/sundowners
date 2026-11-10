'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!imageRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * -16;
      const y = (e.clientY / window.innerHeight - 0.5) * -16;
      imageRef.current.style.transform = `translate(${x}px, ${y}px) scale(1.05)`;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:3001/auth/login', form);
      Cookies.set('token', res.data.access_token, { expires: 7 });
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FAFAF8', fontFamily: 'Inter, sans-serif' }}>

      {/* Left panel */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'none' }} className="md:block" >
        <div
          ref={imageRef}
          style={{
            position: 'absolute', inset: '-20px',
            backgroundImage: 'url(https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1200)',
            backgroundSize: 'cover', backgroundPosition: 'center',
            transition: 'transform 0.1s ease-out',
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.2) 100%)' }} />

        {/* Logo */}
        <div style={{ position: 'absolute', top: 40, left: 40, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#C9933A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: 16 }}>☀</span>
          </div>
          <span style={{ color: 'white', fontSize: 18, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 500 }}>Sundowner Stays</span>
        </div>

        {/* Quote */}
        <div style={{ position: 'absolute', bottom: 48, left: 40, right: 40 }}>
          <p style={{ color: 'rgba(255,255,255,0.95)', fontSize: 28, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.3, marginBottom: 24 }}>
            "Where Africa meets luxury."
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 100, padding: '8px 16px' }}>
            <span style={{ color: '#C9933A', fontSize: 13 }}>✦</span>
            <span style={{ color: 'white', fontSize: 13, letterSpacing: '0.05em' }}>12 Curated Villas · 6 Countries</span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 56px', background: '#FFFFFF' }}>
        
        {/* Mobile logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 48 }} className="md:hidden">
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#C9933A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: 14 }}>☀</span>
          </div>
          <span style={{ fontSize: 16, fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#1A1A1A' }}>Sundowner Stays</span>
        </div>

        <div style={{ animation: 'fadeUp 0.6s ease forwards' }}>
          <h1 style={{ fontSize: 36, fontFamily: 'Georgia, serif', fontWeight: 400, color: '#1A1A1A', margin: '0 0 8px' }}>Welcome back</h1>
          <p style={{ fontSize: 15, color: '#6B6560', margin: '0 0 40px' }}>Sign in to continue your journey</p>

          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10,
              padding: '12px 16px', marginBottom: 24, fontSize: 14, color: '#DC2626',
              animation: shake ? 'shake 0.5s ease' : 'none',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1A1A1A', marginBottom: 6 }}>Email address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                required
                style={{
                  width: '100%', padding: '13px 16px', fontSize: 15,
                  background: '#F5F3F0', border: '1.5px solid transparent',
                  borderRadius: 12, outline: 'none', color: '#1A1A1A',
                  boxSizing: 'border-box', transition: 'all 0.2s',
                }}
                onFocus={e => { e.target.style.border = '1.5px solid #C9933A'; e.target.style.background = '#FFFFFF'; e.target.style.boxShadow = '0 0 0 4px rgba(201,147,58,0.1)'; }}
                onBlur={e => { e.target.style.border = '1.5px solid transparent'; e.target.style.background = '#F5F3F0'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 32 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1A1A1A', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%', padding: '13px 48px 13px 16px', fontSize: 15,
                    background: '#F5F3F0', border: '1.5px solid transparent',
                    borderRadius: 12, outline: 'none', color: '#1A1A1A',
                    boxSizing: 'border-box', transition: 'all 0.2s',
                  }}
                  onFocus={e => { e.target.style.border = '1.5px solid #C9933A'; e.target.style.background = '#FFFFFF'; e.target.style.boxShadow = '0 0 0 4px rgba(201,147,58,0.1)'; }}
                  onBlur={e => { e.target.style.border = '1.5px solid transparent'; e.target.style.background = '#F5F3F0'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B6560', fontSize: 18, padding: 0 }}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px', fontSize: 15, fontWeight: 600,
                background: loading ? '#D4A96A' : '#C9933A',
                color: 'white', border: 'none', borderRadius: 100,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 20px rgba(201,147,58,0.35)',
                transition: 'all 0.2s', letterSpacing: '0.02em',
              }}
              onMouseEnter={e => { if (!loading) (e.target as HTMLButtonElement).style.transform = 'scale(1.02)'; }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.transform = 'scale(1)'; }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: '#6B6560', marginTop: 32 }}>
            New to Sundowner?{' '}
            <Link href="/auth/register" style={{ color: '#C9933A', fontWeight: 500, textDecoration: 'none' }}>
              Create an account
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .md\\:block { display: block !important; }
        .md\\:hidden { display: none !important; }
        @media (max-width: 768px) {
          .md\\:block { display: none !important; }
          .md\\:hidden { display: flex !important; }
        }
      `}</style>
    </div>
  );
}