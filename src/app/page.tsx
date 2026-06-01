'use client';

import React, { useEffect, useRef, useState, FormEvent, useCallback } from 'react';

// --- CONFIG & CONSTANTS ---
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
const COLORS = {
  green: '#1B4332',
  purple: '#6D28D9',
  lightPurple: '#EDE9FE',
  lightGreen: '#ECFDF5',
} as const;

const PHOTOS = {
  hero: "/assets/drone.mp4",
  heroPoster: "/assets/hero.jpg",
  exterior: "/assets/ext1.jpg",
  living: "/assets/living4.jpg",
  bedroom: "/assets/bedroom.jpg",
  balcony: "/assets/balcony.jpg",
  book: "/assets/book.jpg",
  destinations: [
    { name: "Zanzibar", country: "Tanzania", count: 14, img: "/assets/zanzibar.jpg" },
    { name: "Nairobi", country: "Kenya", count: 8, img: "/assets/nairobi.jpg" },
    { name: "Cape Town", country: "South Africa", count: 22, img: "/assets/cape-town.jpg" }
  ],
  guests: "/assets/guests.jpg",
  hosts: "/assets/hosts.jpg",
  surprise: "/assets/surprise.jpg",
  cta: "/assets/cta.jpg",
} as const;

// --- GLOBAL STYLES ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap');
    
    :root {
      --color-green: ${COLORS.green};
      --color-purple: ${COLORS.purple};
    }

    body {
      font-family: 'Inter', sans-serif;
      background-color: #0d1f17;
      color: #111827;
      overflow-x: hidden;
      cursor: none;
    }

    /* Respect user motion preferences */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }

    .font-playfair { font-family: 'Playfair Display', serif; }
    
    .glass-panel {
      background: rgba(255, 255, 255, 0.55);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.7);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .text-stroke-green {
      -webkit-text-stroke: 2px var(--color-green);
      color: transparent;
    }

    ::-webkit-scrollbar { width: 0px; background: transparent; }

    @keyframes drift {
      0% { transform: translateY(-12px); }
      50% { transform: translateY(0px); }
      100% { transform: translateY(-12px); }
    }
    
    @keyframes blob-morph {
      0% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; transform: rotate(0deg); }
      50% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; transform: rotate(180deg); }
      100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; transform: rotate(360deg); }
    }

    @keyframes ken-burns {
      0% { transform: scale(1); }
      100% { transform: scale(1.06); }
    }
    
    @keyframes slideDown {
      0% { transform: translateY(-100%); opacity: 0; }
      50% { opacity: 1; }
      100% { transform: translateY(100%); opacity: 0; }
    }
    
    .animate-ken-burns {
      animation: ken-burns 8s ease-in-out infinite alternate;
    }
    
    .animate-drift { animation: drift 4s ease-in-out infinite; }
    .animate-drift-slow { animation: drift 6s ease-in-out infinite; animation-delay: -2s; }
    .animate-drift-offset { animation: drift 4.5s ease-in-out infinite; animation-delay: -1s; }
  `}</style>
);

// --- SVG ICONS ---
const Icons = {
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  MapPin: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  Star: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
  Zap: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
  ArrowRight: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B4332" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
};

// --- CUSTOM CURSOR ---
const CustomCursor = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip on touch devices or reduced motion preference
    if (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      }
    };

    const onMouseDown = () => {
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(0.6)`;
      }
    };

    const onMouseUp = () => {
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(1)`;
      }
    };

    const render = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }
      rafId = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    
    const handleMouseOver = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('button, a, input, .interactive')) {
        if (ringRef.current) {
          ringRef.current.classList.add('w-12', 'h-12', 'border-2');
        }
        if (dotRef.current) {
          dotRef.current.classList.add('opacity-0');
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('button, a, input, .interactive')) {
        if (ringRef.current) {
          ringRef.current.classList.remove('w-12', 'h-12', 'border-2');
        }
        if (dotRef.current) {
          dotRef.current.classList.remove('opacity-0');
        }
      }
    };

    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    window.addEventListener('mouseout', handleMouseOut, { passive: true });

    render();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="fixed top-0 left-0 w-8 h-8 border border-[#1B4332] rounded-full pointer-events-none z-[9999] transition-[width,height] duration-200 ease-out hidden md:block mix-blend-difference" aria-hidden="true" />
      <div ref={dotRef} className="fixed top-0 left-0 w-2 h-2 bg-[#1B4332] rounded-full pointer-events-none z-[9999] transition-opacity duration-200 hidden md:block mix-blend-difference" aria-hidden="true" />
    </>
  );
};

// --- SCRIPT LOADER HOOK ---
const useDependencies = () => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadScript = (src: string): Promise<boolean> => {
      return new Promise((resolve) => {
        // Check if already in DOM
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve(true);
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;

        script.onload = () => resolve(true);
        script.onerror = () => {
          console.error(`Failed to load script: ${src}`);
          resolve(false);
        };

        document.head.appendChild(script);
      });
    };

    const init = async () => {
      try {
        const results = await Promise.all([
          loadScript('https://unpkg.com/@studio-freight/lenis@1.0.39/dist/lenis.min.js'),
          loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js'),
          loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js'),
        ]);

        if (!results.every(Boolean)) {
          throw new Error('Failed to load animation libraries');
        }

        // @ts-ignore
        if (window.gsap && window.ScrollTrigger && window.Lenis) {
          // @ts-ignore
          window.gsap.registerPlugin(window.ScrollTrigger);
          
          // @ts-ignore
          const lenis = new window.Lenis({
            duration: 1.4,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
          });

          // @ts-ignore
          window.gsap.ticker.add((time: number) => lenis.raf(time * 1000));
          // @ts-ignore
          window.gsap.ticker.lagSmoothing(0);
          
          setLoaded(true);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Animation library initialization failed:', message);
        // Still set loaded to prevent infinite loading screen
        setLoaded(true);
      }
    };

    init();
  }, []);

  return { loaded, error };
};

// --- SECTION 1: HERO ---
const HeroSection = ({ isLoaded }: { isLoaded: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const layer1Ref = useRef<HTMLDivElement>(null);
  const layer2Ref = useRef<HTMLDivElement>(null);
  const layer3Ref = useRef<HTMLDivElement>(null);
  const layer4Ref = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const blobsRef = useRef<HTMLDivElement>(null);
  
  const [searchState, setSearchState] = useState<'idle' | 'loading' | 'success'>('idle');

  // Parallax Logic - with proper cleanup
  useEffect(() => {
    if (!containerRef.current) return;

    let targetX = 0, targetY = 0;
    let currX = 0, currY = 0;
    let rafId: number;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const handleMouseLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    const animate = () => {
      currX += (targetX - currX) * 0.06;
      currY += (targetY - currY) * 0.06;

      if (layer1Ref.current) layer1Ref.current.style.transform = `translate3d(${currX * -4}px, ${currY * -4}px, 0)`;
      if (layer2Ref.current) layer2Ref.current.style.transform = `translate3d(${currX * 12}px, ${currY * 12}px, 0)`;
      if (layer3Ref.current) layer3Ref.current.style.transform = `translate3d(${currX * 18}px, ${currY * 18}px, 0)`;
      if (layer4Ref.current) layer4Ref.current.style.transform = `translate3d(${currX * 24}px, ${currY * 24}px, 0)`;
      if (blobsRef.current) blobsRef.current.style.transform = `translate3d(${currX * -30}px, ${currY * -30}px, 0)`;

      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Text Entrance Animation
  useEffect(() => {
    if (!isLoaded || !textRef.current) return;

    // @ts-ignore
    const gsap = window.gsap;
    if (!gsap) return;

    const lines = textRef.current.querySelectorAll('.hero-line');
    
    gsap.fromTo(lines, 
      { y: 60, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, stagger: 0.15, ease: "power3.out", delay: 0.2 }
    );
    
    // Scroll text parallax
    gsap.to(textRef.current, {
      y: -80,
      scrollTrigger: { trigger: containerRef.current, start: "top top", end: "bottom top", scrub: true }
    });
  }, [isLoaded]);

  const handleSearch = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearchState('loading');
    setTimeout(() => setSearchState('success'), 1500);
    setTimeout(() => setSearchState('idle'), 3000);
  }, []);

  return (
    <section ref={containerRef} className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center">
      {/* Background Layer 1 */}
      <div ref={layer1Ref} className="absolute inset-[-5%] w-[110%] h-[110%] z-0">
        <div className="absolute inset-0 bg-black/20 z-10"></div>
        <video
          className="w-full h-full object-cover animate-ken-burns"
          autoPlay
          loop
          muted
          playsInline
          poster={PHOTOS.heroPoster}
          aria-label="Background video"
        >
          <source src={PHOTOS.hero} type="video/mp4" />
        </video>
      </div>

      {/* Morphing Blobs */}
      <div ref={blobsRef} className="absolute inset-0 z-0 pointer-events-none opacity-15 mix-blend-overlay" aria-hidden="true">
        <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] bg-[#1B4332] blur-[100px]" style={{ animation: 'blob-morph 15s ease-in-out infinite' }}></div>
        <div className="absolute top-[40%] right-[10%] w-[35vw] h-[35vw] bg-[#6D28D9] blur-[100px]" style={{ animation: 'blob-morph 20s ease-in-out infinite reverse' }}></div>
      </div>

      {/* Text Content */}
      <div ref={textRef} className="relative z-20 text-center flex flex-col items-center mt-[-10vh]">
        <div className="overflow-hidden"><h1 className="hero-line font-playfair italic text-[60px] md:text-[110px] leading-[1.1] text-white mix-blend-exclusion">Find Your</h1></div>
        <div className="overflow-hidden"><h1 className="hero-line font-playfair italic text-[60px] md:text-[110px] leading-[1.1] text-[#EDE9FE] mix-blend-exclusion">Perfect Stay</h1></div>
        <div className="overflow-hidden"><h1 className="hero-line font-playfair italic text-[60px] md:text-[110px] leading-[1.1] text-stroke-green">in Africa</h1></div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative z-30 mt-12 glass-panel rounded-[20px] w-[92vw] max-w-[900px] h-auto md:h-[72px] flex flex-col md:flex-row items-center p-2 focus-within:ring-4 focus-within:ring-[#1B4332]/20 transition-all duration-300">
        <div className="flex-1 flex items-center px-4 py-3 md:py-0 w-full md:border-r border-black/10">
          <Icons.MapPin />
          <input type="text" placeholder="Where to?" className="bg-transparent border-none outline-none text-sm font-medium w-full ml-3 placeholder:text-gray-600" required aria-label="Destination" />
        </div>
        <div className="flex-1 flex items-center px-4 py-3 md:py-0 w-full md:border-r border-black/10">
          <input type="text" placeholder="Check in - out" onFocus={(e) => e.currentTarget.type = 'date'} onBlur={(e) => !e.currentTarget.value && (e.currentTarget.type = 'text')} className="bg-transparent border-none outline-none text-sm font-medium w-full ml-3 placeholder:text-gray-600" aria-label="Check in and out dates" />
        </div>
        <div className="flex-[0.8] flex items-center px-4 py-3 md:py-0 w-full">
          <Icons.Search />
          <input type="number" placeholder="Guests" min="1" max="99" className="bg-transparent border-none outline-none text-sm font-medium w-full ml-3 placeholder:text-gray-600" aria-label="Number of guests" />
        </div>
        <button type="submit" className={`relative bg-[#1B4332] text-white h-12 md:h-full flex items-center justify-center transition-all duration-500 overflow-hidden w-full md:w-auto md:px-8 mt-2 md:mt-0 ${searchState !== 'idle' ? 'rounded-full w-12 md:w-12 !px-0' : 'rounded-[14px]'}`} aria-label="Search properties">
          {searchState === 'idle' && <span className="font-medium text-sm whitespace-nowrap">Search</span>}
          {searchState === 'loading' && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
          {searchState === 'success' && <Icons.Check />}
        </button>
      </form>

      {/* Floating Badges */}
      <div ref={layer2Ref} className="absolute top-[15%] right-[5%] md:right-[15%] z-20 animate-drift flex items-center gap-3">
        <img src={PHOTOS.exterior} className="w-[60px] h-[60px] rounded-xl object-cover shadow-2xl" alt="Zanzibar Villa exterior" loading="lazy" />
        <div className="glass-panel px-4 py-2 rounded-xl">
          <p className="font-playfair italic text-[#1B4332] text-[13px] font-bold">Zanzibar Villa</p>
          <p className="text-[11px] text-gray-600 font-medium">From $480/night</p>
        </div>
      </div>

      <div ref={layer3Ref} className="absolute bottom-[25%] left-[5%] md:left-[10%] z-20 animate-drift-offset glass-panel px-5 py-3 rounded-xl max-w-[200px]">
        <div className="flex text-[#1B4332] mb-1"><Icons.Star/><Icons.Star/><Icons.Star/><Icons.Star/><Icons.Star/></div>
        <p className="text-[12px] italic font-playfair font-bold text-gray-800">"Absolute perfection."</p>
        <p className="text-[10px] text-gray-500 mt-1">— Amara K.</p>
      </div>

      <div ref={layer4Ref} className="absolute top-[40%] right-[8%] z-20 animate-drift-slow glass-panel px-4 py-2 rounded-full flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-[#ECFDF5] flex items-center justify-center text-[#1B4332]"><Icons.Zap /></div>
        <span className="text-[12px] font-bold text-[#1B4332]">Instant Book</span>
      </div>

      {/* Scroll Cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
        <span className="text-[10px] uppercase tracking-widest text-white/80 mb-2 font-medium">Scroll to explore</span>
        <div className="w-[1px] h-[40px] bg-white/20 overflow-hidden relative">
          <div className="w-full h-full bg-white absolute top-0 left-0 animate-[slideDown_2s_ease-in-out_infinite]"></div>
        </div>
      </div>
    </section>
  );
};

// --- SECTION 2: 3D FLY-THROUGH STORY (800vh) ---
const StorySection = ({ isLoaded }: { isLoaded: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  
  const scene1 = useRef<HTMLDivElement>(null);
  const scene2 = useRef<HTMLDivElement>(null);
  const scene3 = useRef<HTMLDivElement>(null);
  const scene4 = useRef<HTMLDivElement>(null);
  const scene5 = useRef<HTMLDivElement>(null);

  const text1 = useRef<HTMLDivElement>(null);
  const text2 = useRef<HTMLDivElement>(null);
  const amenitiesPanel = useRef<HTMLDivElement>(null);
  const text3 = useRef<HTMLDivElement>(null);
  const text4 = useRef<HTMLDivElement>(null);
  const bookPanel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoaded || !containerRef.current) return;

    // @ts-ignore
    const gsap = window.gsap;
    if (!gsap) return;
    
    const refs = [scene1.current, scene2.current, scene3.current, scene4.current, scene5.current].filter(Boolean);
    
    gsap.set(refs, {
      position: "absolute",
      top: 0, left: 0,
      width: "100%", height: "100%",
      transformOrigin: "center center",
      willChange: "transform, opacity"
    });

    gsap.set(scene1.current, { zIndex: 50 });
    gsap.set(scene2.current, { scale: 0.15, opacity: 0, zIndex: 40 });
    gsap.set(scene3.current, { scale: 0.15, opacity: 0, zIndex: 30, rotationX: 10 });
    gsap.set(scene4.current, { scale: 0.15, opacity: 0, zIndex: 20, rotationY: -10 });
    gsap.set(scene5.current, { scale: 0.15, opacity: 0, zIndex: 10 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
      }
    });

    tl.to(text1.current, { scale: 1.5, opacity: 0, z: 300, duration: 1 }, 0)
      .to(scene1.current, { scale: 4, opacity: 0, duration: 3, ease: "power2.inOut" }, 0)
      .to(scene2.current, { scale: 1, opacity: 1, duration: 3, ease: "power2.inOut" }, 0.5)
      .fromTo(text2.current, { scale: 0.5, opacity: 0, z: -200 }, { scale: 1, opacity: 1, z: 0, duration: 1 }, 2)
      .fromTo(amenitiesPanel.current, { y: 150, opacity: 0, rotationX: -40 }, { y: 0, opacity: 1, rotationX: 0, duration: 1 }, 2.5)
      .to([text2.current, amenitiesPanel.current], { scale: 1.5, opacity: 0, z: 300, duration: 1.5 }, 4)
      .to(scene2.current, { scale: 4, opacity: 0, duration: 3, ease: "power2.inOut" }, 4.5)
      .to(scene3.current, { scale: 1, opacity: 1, rotationX: 0, duration: 3, ease: "power2.inOut" }, 5)
      .fromTo(text3.current, { x: -150, opacity: 0, rotationY: 25 }, { x: 0, opacity: 1, rotationY: 0, duration: 1 }, 6.5)
      .to(text3.current, { scale: 1.5, opacity: 0, z: 300, duration: 1.5 }, 8)
      .to(scene3.current, { scale: 4, opacity: 0, duration: 3, ease: "power2.inOut" }, 8.5)
      .to(scene4.current, { scale: 1, opacity: 1, rotationY: 0, duration: 3, ease: "power2.inOut" }, 9)
      .fromTo(text4.current, { scale: 0.5, y: 100, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 1 }, 10.5)
      .to(text4.current, { scale: 1.5, opacity: 0, duration: 1.5 }, 12)
      .to(scene4.current, { scale: 4, opacity: 0, duration: 3, ease: "power2.inOut" }, 12.5)
      .to(scene5.current, { scale: 1, opacity: 1, duration: 3, ease: "power2.out" }, 13)
      .fromTo(bookPanel.current, { scale: 0.8, rotationY: 30, opacity: 0, z: -300 }, { scale: 1, rotationY: 0, opacity: 1, z: 0, duration: 2, ease: "back.out(1.2)" }, 14.5);

  }, [isLoaded]);

  return (
    <section ref={containerRef} className="relative h-[800vh] w-full bg-black">
      <div ref={pinRef} className="sticky top-0 h-screen w-full overflow-hidden" style={{ perspective: '1500px', transformStyle: 'preserve-3d' }}>
        
        {/* SCENE 1: EXTERIOR */}
        <div ref={scene1} className="overflow-hidden">
          <img src={PHOTOS.exterior} className="absolute inset-0 w-full h-full object-cover" alt="Property exterior" loading="lazy" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/40 to-black"></div>
          <div ref={text1} className="absolute inset-0 flex flex-col justify-center px-[10%] z-10 text-white">
            <p className="text-[10px] uppercase tracking-widest text-[#ECFDF5] mb-4 font-bold">01 · Arrival</p>
            <h2 className="font-playfair italic text-[60px] md:text-[80px] leading-none mb-4 shadow-black drop-shadow-2xl">Step inside.</h2>
            <p className="text-[16px] font-light max-w-[400px] text-white/80">Leave the noise behind. The doors open to a sanctuary designed entirely around the landscape.</p>
          </div>
        </div>
        
        {/* SCENE 2: LIVING ROOM */}
        <div ref={scene2} className="overflow-hidden">
          <img src={PHOTOS.living} className="absolute inset-0 w-full h-full object-cover" alt="Living room" loading="lazy" />
          <div className="absolute inset-0 bg-black/40"></div>
          <div ref={text2} className="absolute inset-0 flex flex-col justify-center items-end px-[10%] z-20 text-white text-right">
            <h2 className="font-playfair italic text-[60px] md:text-[80px] leading-none drop-shadow-2xl">Where light lives.</h2>
          </div>
          <div ref={amenitiesPanel} className="absolute bottom-[20%] right-[10%] z-20 glass-panel px-6 py-4 rounded-2xl flex gap-6">
            <div className="flex flex-col items-center gap-2"><div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><Icons.Zap/></div><span className="text-[10px] uppercase tracking-wide font-medium text-white">Fast WiFi</span></div>
            <div className="flex flex-col items-center gap-2"><div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><Icons.Star/></div><span className="text-[10px] uppercase tracking-wide font-medium text-white">Private Pool</span></div>
            <div className="flex flex-col items-center gap-2"><div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><Icons.Check/></div><span className="text-[10px] uppercase tracking-wide font-medium text-white">Chef Kitchen</span></div>
          </div>
        </div>

        {/* SCENE 3: BEDROOM */}
        <div ref={scene3} className="overflow-hidden">
          <img src={PHOTOS.bedroom} className="absolute inset-0 w-full h-full object-cover" alt="Bedroom" loading="lazy" />
          <div className="absolute inset-0 bg-black/30"></div>
          <div ref={text3} className="absolute inset-0 flex flex-col justify-center px-[10%] z-30 text-white">
            <h2 className="font-playfair italic text-[60px] md:text-[80px] leading-none drop-shadow-2xl max-w-[600px]">Sleep, the oldest luxury.</h2>
          </div>
        </div>

        {/* SCENE 4: BALCONY */}
        <div ref={scene4} className="overflow-hidden">
          <img src={PHOTOS.balcony} className="absolute inset-0 w-full h-full object-cover" alt="Balcony" loading="lazy" />
          <div className="absolute inset-0 bg-black/20"></div>
          <div ref={text4} className="absolute inset-0 z-40 flex items-center justify-center text-white">
            <h2 className="font-playfair italic text-[80px] md:text-[100px] leading-none drop-shadow-2xl text-center px-4">The view is yours.</h2>
          </div>
        </div>

        {/* SCENE 5: BOOK CTA */}
        <div ref={scene5} className="overflow-hidden">
          <img src={PHOTOS.book} className="absolute inset-0 w-full h-full object-cover blur-[2px]" alt="Book booking" loading="lazy" />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute inset-0 z-50 flex items-center justify-center">
            <div ref={bookPanel} className="glass-panel p-8 md:p-12 rounded-[32px] w-[90%] max-w-[500px] pointer-events-auto flex flex-col items-center text-center shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
              <h3 className="font-playfair text-[32px] font-bold text-[#1B4332] mb-2">Zanzibar Clifftop</h3>
              <p className="text-gray-700 font-medium text-sm mb-8">Zanzibar, Tanzania</p>
              <div className="flex w-full justify-between mb-8 pb-8 border-b border-black/10">
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Price</p>
                  <p className="font-playfair text-[24px] text-[#1B4332] font-bold">$850<span className="text-sm font-normal text-gray-500">/night</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Rating</p>
                  <p className="font-bold flex items-center gap-1 justify-end text-gray-800"><Icons.Star/> 4.98</p>
                </div>
              </div>
              <button className="interactive w-full bg-[#1B4332] text-white py-4 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-[#6D28D9] transition-colors duration-500 shadow-lg">
                Reserve Now <Icons.ArrowRight />
              </button>
            </div>
          </div>
        </div>

        <style>{`.bg-radial-gradient { background: radial-gradient(circle at center, var(--tw-gradient-from) 30%, var(--tw-gradient-via) 60%, var(--tw-gradient-to) 100%); }`}</style>
      </div>
    </section>
  );
};

// --- SECTION 3: DESTINATIONS ---
const DestinationsSection = ({ isLoaded }: { isLoaded: boolean }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!isLoaded || !sectionRef.current) return;

    // @ts-ignore
    const gsap = window.gsap;
    if (!gsap) return;

    const tiles = sectionRef.current.querySelectorAll('.dest-tile');
    gsap.fromTo(tiles, 
      { y: 80, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: "power3.out", 
        scrollTrigger: { trigger: sectionRef.current, start: "top 70%" }
      }
    );
  }, [isLoaded]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = (y / (rect.height / 2)) * -6;
    const rotateY = (x / (rect.width / 2)) * 6;
    target.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  }, []);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  }, []);

  return (
    <section ref={sectionRef} className="py-24 px-4 md:px-8 bg-white min-h-screen">
      <div className="max-w-[1400px] mx-auto h-full flex flex-col">
        <div className="mb-12">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#1B4332] font-bold mb-4">Explore</p>
          <h2 className="font-playfair italic text-[50px] md:text-[80px] leading-tight">The Continent's <br/><span className="text-[#6D28D9]">Finest Corners.</span></h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-2 gap-4 h-[120vh] md:h-[80vh]">
          {PHOTOS.destinations.map((dest, i) => {
            const isLarge = i === 0;
            return (
              <div 
                key={dest.name}
                className={`dest-tile interactive relative rounded-2xl overflow-hidden group cursor-none transition-transform duration-300 ease-out will-change-transform ${
                  isLarge ? 'md:col-span-5 md:row-span-2' : 'md:col-span-7 md:row-span-1'
                }`}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <img src={dest.img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={`${dest.name}, ${dest.country}`} loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/70 transition-colors duration-500"></div>
                
                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                  <div>
                    <h3 className="font-playfair italic text-[40px] md:text-[52px] text-white leading-none mb-2">{dest.name}</h3>
                    <p className="text-[11px] uppercase tracking-widest text-[#ECFDF5]">{dest.country}</p>
                    <p className="text-[12px] text-white/60 mt-2">{dest.count} Villas available</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 transform translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                    <Icons.ArrowRight />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// --- SECTION 4: FEATURED PROPERTIES ---
const FeaturedSection = ({ isLoaded }: { isLoaded: boolean }) => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(`${API_BASE}/search/featured`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error('Backend unavailable');
        const data = await res.json();
        setProperties(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.warn('Failed to fetch properties:', message);
        setError(message);

        setTimeout(() => {
          setProperties([
            { id: 1, name: "The Cliffhouse", city: "Cape Town", country: "SA", price: 1250, beds: 4, guests: 8, img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80" },
            { id: 2, name: "Serengeti Lodge", city: "Arusha", country: "TZ", price: 890, beds: 3, guests: 6, img: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&q=80" },
            { id: 3, name: "Atlas Retreat", city: "Marrakech", country: "MA", price: 650, beds: 5, guests: 10, img: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&q=80" },
          ]);
          setLoading(false);
        }, 1500);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!isLoaded || loading || !sectionRef.current) return;

    // @ts-ignore
    const gsap = window.gsap;
    if (!gsap) return;

    const elements = sectionRef.current.querySelectorAll('.feat-anim');
    gsap.fromTo(elements, 
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power2.out", 
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%" }
      }
    );
  }, [isLoaded, loading]);

  const handleTilt = useCallback((e: React.MouseEvent, target: HTMLElement) => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    target.style.transform = `perspective(900px) rotateX(${y / -20}deg) rotateY(${x / 20}deg) scale3d(1.02,1.02,1.02)`;
  }, []);

  const resetTilt = useCallback((target: HTMLElement) => {
    target.style.transform = `perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)`;
  }, []);

  return (
    <section ref={sectionRef} className="py-32 px-4 md:px-8 bg-[#f8f9fa]">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 feat-anim">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#1B4332] font-bold mb-4">Our Collection</p>
            <h2 className="font-playfair italic text-[50px] md:text-[80px] leading-tight">Handpicked Villas <br/><span className="text-[#6D28D9]">across Africa.</span></h2>
          </div>
          <p className="text-[16px] font-light text-gray-500 max-w-[400px] mb-4">We've scoured the continent to curate a collection of properties that redefine luxury, solitude, and connection to nature.</p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-12">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-[65%] h-[520px] rounded-2xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] shadow-sm"></div>
              <div className="w-full md:w-[35%] h-[380px] rounded-2xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] shadow-sm md:mt-24"></div>
            </div>
            <style>{`@keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }`}</style>
          </div>
        ) : (
          <div className="flex flex-col gap-12 md:gap-8">
            {properties[0] && (
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="feat-anim interactive w-full md:w-[65%] h-[520px] relative rounded-2xl overflow-hidden group transition-transform duration-300 ease-out will-change-transform"
                  onMouseMove={(e) => handleTilt(e, e.currentTarget)} 
                  onMouseLeave={(e) => resetTilt(e.currentTarget)}>
                  <img src={properties[0].img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={`${properties[0].name} in ${properties[0].city}`} loading="lazy" />
                  <div className="absolute bottom-0 left-0 w-full p-4">
                    <div className="glass-panel w-full rounded-xl p-5 flex justify-between items-center transform transition-transform duration-300 group-hover:-translate-y-2">
                      <div>
                        <h3 className="font-playfair italic text-[24px] text-[#1B4332] font-bold">{properties[0].name}</h3>
                        <p className="text-[13px] text-gray-700 font-medium">{properties[0].city}, {properties[0].country}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-playfair text-[24px] text-[#1B4332] font-bold">${properties[0].price}<span className="text-[12px] font-normal text-gray-600">/night</span></p>
                        <p className="text-[11px] text-gray-600 mt-1">{properties[0].beds} Beds · {properties[0].guests} Guests</p>
                      </div>
                    </div>
                  </div>
                </div>
                {properties[1] && (
                  <div className="feat-anim interactive w-full md:w-[35%] h-[420px] md:mt-24 relative rounded-2xl overflow-hidden group transition-transform duration-300 ease-out will-change-transform"
                    onMouseMove={(e) => handleTilt(e, e.currentTarget)} 
                    onMouseLeave={(e) => resetTilt(e.currentTarget)}>
                    <img src={properties[1].img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={`${properties[1].name} in ${properties[1].city}`} loading="lazy" />
                    <div className="absolute bottom-0 left-0 w-full p-3">
                      <div className="glass-panel w-full rounded-xl p-4 flex flex-col justify-between transform transition-transform duration-300 group-hover:-translate-y-1">
                        <h3 className="font-playfair italic text-[20px] text-[#1B4332] font-bold">{properties[1].name}</h3>
                        <div className="flex justify-between items-end mt-4">
                          <p className="text-[12px] text-gray-700 font-medium">{properties[1].city}</p>
                          <p className="font-playfair text-[20px] text-[#1B4332] font-bold">${properties[1].price}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {properties[2] && (
              <div className="flex flex-col md:flex-row gap-8 items-start mt-4">
                <div className="feat-anim interactive w-full md:w-[40%] h-[460px] relative rounded-2xl overflow-hidden group transition-transform duration-300 ease-out will-change-transform"
                  onMouseMove={(e) => handleTilt(e, e.currentTarget)} 
                  onMouseLeave={(e) => resetTilt(e.currentTarget)}>
                  <img src={properties[2].img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={`${properties[2].name} in ${properties[2].city}`} loading="lazy" />
                  <div className="absolute bottom-0 left-0 w-full p-4">
                    <div className="glass-panel w-full rounded-xl p-5 flex justify-between items-center transform transition-transform duration-300 group-hover:-translate-y-2">
                      <div>
                        <h3 className="font-playfair italic text-[22px] text-[#1B4332] font-bold">{properties[2].name}</h3>
                        <p className="text-[13px] text-gray-700 font-medium">{properties[2].city}, {properties[2].country}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-playfair text-[22px] text-[#1B4332] font-bold">${properties[2].price}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="feat-anim w-full md:w-[60%] h-[460px] md:mt-[-60px] relative rounded-2xl overflow-hidden bg-[#1B4332] flex flex-col items-center justify-center p-12 text-center text-white group cursor-pointer interactive">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay"></div>
                  <h3 className="font-playfair italic text-[40px] mb-6 relative z-10">See all 240+ properties</h3>
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-[#1B4332] transition-colors duration-300 relative z-10">
                    <Icons.ArrowRight />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

// --- SECTION 5 & 6: SPLIT LAYOUTS ---
const SplitSection = ({ image, tag, title1, title2, features, cta, reverse, isLoaded }: any) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!isLoaded || !sectionRef.current) return;

    // @ts-ignore
    const gsap = window.gsap;
    if (!gsap) return;

    gsap.fromTo(panelRef.current, 
      { x: reverse ? -60 : 60, opacity: 0 },
      { x: 0, opacity: 1, duration: 1, ease: "power2.out", scrollTrigger: { trigger: sectionRef.current, start: "top 60%" } }
    );

    gsap.to(imgRef.current, {
      y: -40, scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: true }
    });
  }, [isLoaded, reverse]);

  return (
    <section ref={sectionRef} className="relative w-full h-screen overflow-hidden flex items-center">
      <div className="absolute inset-0 w-full h-full">
        <img ref={imgRef} src={image} className={`absolute inset-[-10%] w-[120%] h-[120%] object-cover ${reverse ? 'object-right' : 'object-left'}`} alt="Section background" loading="lazy" />
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      <div className={`relative z-10 w-full max-w-[1400px] mx-auto px-4 md:px-8 flex ${reverse ? 'justify-start' : 'justify-end'}`}>
        <div ref={panelRef} className="glass-panel p-10 md:p-14 rounded-[24px] w-full max-w-[540px] shadow-[0_24px_64px_rgba(0,0,0,0.12)] border border-white/80 bg-white/70">
          <p className="text-[10px] uppercase tracking-widest text-[#1B4332] font-bold mb-6">{tag}</p>
          <h2 className="font-playfair italic text-[48px] md:text-[56px] leading-[1.1] mb-8 text-gray-900">
            {title1} <br/><span className="text-[#6D28D9]">{title2}</span>
          </h2>
          <div className="flex flex-col gap-4 mb-10">
            {features.map((f: string, i: number) => (
              <div key={i} className="flex items-center gap-4 pb-4 border-b border-black/5">
                <Icons.Check />
                <span className="text-[15px] font-medium text-gray-800">{f}</span>
              </div>
            ))}
          </div>
          <button className={`interactive w-full py-4 rounded-full font-bold text-[15px] transition-all duration-300 flex justify-center items-center gap-2 hover:scale-[1.02] ${
            reverse 
            ? 'border-2 border-[#1B4332] text-[#1B4332] hover:bg-[#1B4332] hover:text-white' 
            : 'bg-[#1B4332] text-white hover:shadow-lg hover:bg-[#6D28D9]'
          }`}>
            {cta} <Icons.ArrowRight />
          </button>
        </div>
      </div>
    </section>
  );
};

// --- SECTION 7: SURPRISE STAYS ---
const SurpriseSection = ({ isLoaded }: { isLoaded: boolean }) => {
  const [state, setState] = useState<'idle' | 'loading' | 'reveal'>('idle');
  const [revealedProp, setRevealedProp] = useState<any>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const particles: any[] = [];
    for(let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        s: Math.random() * 3 + 2,
        vy: (Math.random() * 0.5 + 0.2) * -1,
        color: Math.random() > 0.5 ? COLORS.green : COLORS.purple,
        opacity: Math.random() * 0.4 + 0.3
      });
    }

    let animationId: number;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.y += p.vy;
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(draw);
    };
    draw();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !titleRef.current) return;

    // @ts-ignore
    const gsap = window.gsap;
    if (!gsap) return;

    const words = titleRef.current.querySelectorAll('.word');
    gsap.fromTo(words, 
      { y: 50, opacity: 0, scale: 0.8 },
      { y: 0, opacity: 1, scale: 1, duration: 1, stagger: 0.2, ease: "elastic.out(1, 0.5)", scrollTrigger: { trigger: sectionRef.current, start: "top 60%" } }
    );
  }, [isLoaded]);

  const handleSurprise = useCallback(() => {
    setState('loading');
    setTimeout(() => {
      setRevealedProp({
        name: "Lost City Oasis",
        city: "Kigali",
        country: "Rwanda",
        img: "https://images.unsplash.com/photo-1542314831-c6a4d142104d?auto=format&fit=crop&q=80"
      });
      setState('reveal');
    }, 2000);
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center text-center px-4">
      <img src={PHOTOS.surprise} className="absolute inset-0 w-full h-full object-cover filter blur-[2px] brightness-[0.4]" alt="Surprise background" loading="lazy" />
      <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none" aria-hidden="true" />
      
      <div className="relative z-20 flex flex-col items-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#ECFDF5] font-bold mb-6 word">Something Different</p>
        <h2 ref={titleRef} className="font-playfair italic text-[70px] md:text-[100px] leading-[1.1] mb-6">
          <span className="word inline-block text-white mr-4">Feeling</span>
          <span className="word inline-block text-[#6D28D9]">spontaneous?</span>
        </h2>
        <p className="text-[18px] font-light text-white/80 max-w-[480px] mb-10 word">Tell us your dates and budget. We choose your perfect, unexpected escape.</p>
        
        {state === 'idle' && (
          <button onClick={handleSurprise} className="interactive bg-[#1B4332] text-white rounded-full px-12 py-5 font-bold text-[16px] hover:scale-105 transition-transform duration-300">
            Surprise Me <Icons.ArrowRight />
          </button>
        )}
        
        {state === 'loading' && (
          <div className="w-16 h-16 rounded-full bg-[#1B4332] flex items-center justify-center" aria-label="Loading">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {state === 'reveal' && revealedProp && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 w-full h-full opacity-50">
            <img src={revealedProp.img} className="w-full h-full object-cover animate-[explode_1.5s_cubic-bezier(0.16,1,0.3,1)_forwards]" alt={revealedProp.name} loading="lazy" />
          </div>
          <div className="relative z-10 text-center flex flex-col items-center animate-[fadeIn_2s_ease-out_forwards]">
            <p className="text-white/70 uppercase tracking-widest text-sm mb-4">Your escape awaits</p>
            <h2 className="font-playfair italic text-[60px] md:text-[90px] text-white mb-2">{revealedProp.name}</h2>
            <p className="text-[#ECFDF5] text-xl mb-12">{revealedProp.city}, {revealedProp.country}</p>
            <button onClick={() => setState('idle')} className="interactive bg-white text-[#1B4332] rounded-full px-10 py-4 font-bold hover:bg-[#1B4332] hover:text-white transition-colors duration-300">
              Book Now
            </button>
          </div>
          <style>{`
            @keyframes explode { 0% { transform: scale(0.5); opacity: 0; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
            @keyframes fadeIn { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
          `}</style>
        </div>
      )}
    </section>
  );
};

// --- SECTION 8: REVIEWS ---
const ReviewsSection = ({ isLoaded }: { isLoaded: boolean }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      setTimeout(() => {
        setReviews([
          { id: 1, text: "A masterpiece of design and nature. The silence here is profound.", author: "Elena R., Milan", property: "Zanzibar Clifftop Villa" },
        ]);
      }, 1000);
    };
    fetchReviews();
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section ref={sectionRef} className="relative w-full h-screen bg-black flex items-center justify-center">
      <img src={PHOTOS.exterior} className="absolute inset-0 w-full h-full object-cover filter grayscale brightness-[0.3]" alt="Review background" loading="lazy" />
      <div className="absolute inset-0 bg-black/30"></div>
      
      <div className="relative z-10 text-center max-w-[800px] px-6">
        <div className="text-[160px] font-playfair text-[#1B4332] opacity-40 leading-none h-[100px] -mt-[80px]" aria-hidden="true">"</div>
        <h3 className="font-playfair italic text-[40px] md:text-[52px] text-white leading-[1.2] mb-12">
          {reviews[0].text}
        </h3>
        <div className="flex justify-center text-[#ECFDF5] mb-4 gap-1" aria-label="5 out of 5 stars">
          {[...Array(5)].map((_, i) => <Icons.Star key={i} />)}
        </div>
        <p className="text-[15px] font-light text-white/80 mb-2">— {reviews[0].author}</p>
        <p className="text-[12px] uppercase tracking-[0.2em] text-[#1B4332] font-bold">{reviews[0].property}</p>
      </div>
    </section>
  );
};

// --- SECTION 9: FINAL CTA & FOOTER ---
const FinalCTASection = () => {
  return (
    <section className="relative w-full h-screen flex flex-col justify-between overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={PHOTOS.cta} className="w-full h-full object-cover animate-ken-burns" alt="Final call to action background" loading="lazy" />
        <div className="absolute inset-0 bg-black/25"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4">
        <h2 className="font-playfair italic text-[70px] md:text-[120px] leading-[1] text-white drop-shadow-2xl">Your next stay</h2>
        <h2 className="font-playfair italic text-[70px] md:text-[120px] leading-[1] text-[#1B4332] mb-8 drop-shadow-2xl">is waiting.</h2>
        <p className="text-[18px] font-light text-white/80 max-w-[600px] mb-12 drop-shadow-md">
          Join thousands of guests who found their perfect African escape on Sundowner Stays.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4">
          <button className="interactive bg-[#1B4332] text-white rounded-full px-10 py-5 font-bold text-[16px] transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_40px_rgba(27,67,50,0.4)] active:scale-95">
            Find a Villa
          </button>
          <button className="interactive bg-white text-[#1B4332] rounded-full px-10 py-5 font-bold text-[16px] transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_40px_rgba(255,255,255,0.2)] active:scale-95">
            List Your Property
          </button>
        </div>
      </div>

      <div className="relative z-10 w-full border-t border-white/20 py-6 px-8 flex justify-between items-center backdrop-blur-sm bg-black/10">
        <p className="text-[11px] font-medium text-white/60 uppercase tracking-widest">© 2026 Sundowner Stays</p>
        <p className="text-[11px] font-medium text-white/60 uppercase tracking-widest hidden md:block">Designed for stillness</p>
      </div>
    </section>
  );
};

// --- MAIN PAGE EXPORT ---
export default function SundownerStaysHome() {
  const { loaded: isLoaded, error } = useDependencies();

  return (
    <main className="relative bg-black w-full min-h-screen selection:bg-[#1B4332] selection:text-white">
      <GlobalStyles />
      <CustomCursor />
      
      {!isLoaded && (
        <div className="fixed inset-0 z-[99999] bg-[#0d1f17] flex items-center justify-center flex-col">
          <h1 className="font-playfair italic text-[40px] text-[#ECFDF5] mb-4">Sundowner Stays</h1>
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#1B4332] w-1/2 animate-[slide_1s_ease-in-out_infinite_alternate]"></div>
          </div>
          {error && <p className="text-sm text-red-400 mt-4">Note: {error}</p>}
        </div>
      )}

      <nav className="fixed top-0 left-0 w-full z-[100] px-6 py-6 flex justify-between items-center mix-blend-difference text-white">
        <h1 className="font-playfair italic text-2xl font-bold tracking-wide">Sundowner.</h1>
        <div className="hidden md:flex gap-8 text-[13px] uppercase tracking-widest font-medium">
          <button className="cursor-none interactive hover:text-[#ECFDF5] transition-colors" aria-label="Navigate to destinations">Destinations</button>
          <button className="cursor-none interactive hover:text-[#ECFDF5] transition-colors" aria-label="Navigate to villas">Villas</button>
          <button className="cursor-none interactive hover:text-[#ECFDF5] transition-colors" aria-label="Navigate to journal">Journal</button>
        </div>
        <button className="interactive text-[13px] uppercase tracking-widest font-medium border border-white/30 px-6 py-2 rounded-full hover:bg-white hover:text-black transition-colors" aria-label="Login to account">Login</button>
      </nav>

      <HeroSection isLoaded={isLoaded} />
      <StorySection isLoaded={isLoaded} />
      <DestinationsSection isLoaded={isLoaded} />
      <FeaturedSection isLoaded={isLoaded} />
      
      <SplitSection 
        isLoaded={isLoaded}
        image={PHOTOS.guests}
        tag="For Guests"
        title1="Every stay,"
        title2="perfectly matched."
        features={["Verified properties only", "Flexible cancellation options", "Price drop protection", "24/7 guest support", "Instant booking available"]}
        cta="Browse Villas"
        reverse={false}
      />
      
      <SplitSection 
        isLoaded={isLoaded}
        image={PHOTOS.hosts}
        tag="For Hosts"
        title1="Your property,"
        title2="earning for you."
        features={["List your villa in minutes", "Set your own pricing", "Instant or request-based booking", "Direct payouts to your account", "Full booking management dashboard"]}
        cta="Become a Host"
        reverse={true}
      />

      <SurpriseSection isLoaded={isLoaded} />
      <ReviewsSection isLoaded={isLoaded} />
      <FinalCTASection />
    </main>
  );
}