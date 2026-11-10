'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!Cookies.get('token'));
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '0 48px',
      height: 72,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: scrolled ? '#3D4E17' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : 'none',
      transition: 'all 0.3s ease',
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#C9933A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontSize: 16 }}>☀</span>
        </div>
        <span style={{ fontSize: 18, fontFamily: 'Georgia, serif', fontStyle: 'italic', color: scrolled ? '#1A1A1A' : 'white', fontWeight: 500 }}>
          LoveAfrica StatCation
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <Link href="/properties" style={{ fontSize: 14, color: scrolled ? '#1A1A1A' : 'white', textDecoration: 'none', fontWeight: 500 }}>
          Properties
        </Link>
        <Link href="/surprise" style={{ fontSize: 14, color: scrolled ? '#1A1A1A' : 'white', textDecoration: 'none', fontWeight: 500 }}>
          Experiences
        </Link>
      </div>

      {/* Auth buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isLoggedIn ? (
          <Link href="/dashboard" style={{
            padding: '9px 20px', borderRadius: 100,
            background: '#C9933A', color: 'white',
            fontSize: 14, fontWeight: 600, textDecoration: 'none',
          }}>
            Dashboard
          </Link>
        ) : (
          <>
            <Link href="/auth/login" style={{
              padding: '9px 20px', borderRadius: 100,
              border: `1.5px solid ${scrolled ? '#1A1A1A' : 'white'}`,
              color: scrolled ? '#1A1A1A' : 'white',
              fontSize: 14, fontWeight: 500, textDecoration: 'none',
            }}>
              Sign in
            </Link>
            <Link href="/auth/register" style={{
              padding: '9px 20px', borderRadius: 100,
              background: '#C9933A', color: 'white',
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}>
              Get started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}