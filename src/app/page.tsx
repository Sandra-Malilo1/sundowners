
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence, Variants } from 'framer-motion';

// --- CONFIG & CONSTANTS ---
const ASSETS = {
  videos: [
    "/assets/videos/ext2.mp4",
    "/assets/videos/living.mp4",
    "/assets/videos/kitchen2.mp4",
    "/assets/videos/bedroom.mp4"
  ],
  bgExperiences: "/assets/images/exp.jpg",
  bgProperties: "/assets/images/kitch.jpg",
  bgAbout: "/assets/images/bg-about.jpg",
  bgAmenities: "/assets/images/bg-amenities.jpg",
  bgConservation: "/assets/images/bg-conservation.jpg",
  bgFooter: "/assets/images/bg-footer.jpg",
  
  staycation: "/assets/images/living4.jpg",
  surprise: "/assets/images/surp.jpg",
  experiences: "/assets/images/exp.jpg",
  property1: "/assets/images/prop1.avif",
  property2: "/assets/images/kitch.avif",
  property3: "/assets/images/exte.jpg",
  form: "/assets/images/form.jpg",
  aboutSide: "/assets/images/about.jpeg",
  amenitiesSide: "/assets/images/brb.jpeg",
  conservationSide: "/assets/images/conservation-side.jpg",
};

// --- ENHANCED GLOBAL STYLES ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,800;1,400&family=JetBrains+Mono:wght@100;300;400;700&family=Inter:wght@300;400;500;600&display=swap');
    
    body {
      font-family: 'Inter', sans-serif;
      background-color: #051009;
      color: #ffffff;
      overflow-x: hidden;
      cursor: none;
    }

    .font-serif { font-family: 'Playfair Display', serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    .font-sans { font-family: 'Inter', sans-serif; }
    
    /* ENHANCED GLASS EFFECT */
    .glass-panel {
      background: linear-gradient(135deg, rgba(10, 30, 18, 0.15) 0%, rgba(20, 40, 30, 0.08) 100%);
      backdrop-filter: blur(80px) saturate(300%) brightness(1.4) contrast(1.1);
      -webkit-backdrop-filter: blur(80px) saturate(300%) brightness(1.4) contrast(1.1);
      border: 1px solid rgba(163, 191, 174, 0.6);
      box-shadow: 
        0 20px 50px rgba(0, 0, 0, 0.2),
        inset 0 1px 3px rgba(255, 255, 255, 0.4),
        inset 0 0 60px rgba(163, 191, 174, 0.15),
        0 0 60px rgba(163, 191, 174, 0.15);
      position: relative;
      overflow: hidden;
      border-radius: 8px;
    }
    
    .glass-panel::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(163, 191, 174, 1), transparent);
      pointer-events: none;
    }

    .glass-panel::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(135% 135% at 50% 0%, rgba(163, 191, 174, 0.08) 0%, transparent 70%);
      pointer-events: none;
    }

    /* PREMIUM FORM INPUTS */
    .form-input, .form-textarea, .form-select {
      background: linear-gradient(135deg, rgba(5, 16, 9, 0.6) 0%, rgba(10, 25, 15, 0.5) 100%);
      border: 1px solid rgba(163, 191, 174, 0.3);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 6px;
      color: #ffffff;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
    }

    .form-input:focus, .form-textarea:focus, .form-select:focus {
      background: linear-gradient(135deg, rgba(5, 16, 9, 0.8) 0%, rgba(10, 25, 15, 0.7) 100%);
      border-color: rgba(163, 191, 174, 0.8);
      box-shadow: 
        0 0 20px rgba(163, 191, 174, 0.2),
        inset 0 0 20px rgba(163, 191, 174, 0.05);
      outline: none;
    }

    .form-input::placeholder, .form-textarea::placeholder {
      color: rgba(163, 191, 174, 0.3);
    }

    ::-webkit-scrollbar { width: 8px; background: #051009; }
    ::-webkit-scrollbar-thumb { 
      background: rgba(163, 191, 174, 0.4); 
      border-radius: 4px;
      backdrop-filter: blur(10px);
    }
    ::-webkit-scrollbar-thumb:hover { 
      background: rgba(163, 191, 174, 0.6); 
    }

    .film-grain {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      pointer-events: none;
      z-index: 50;
      opacity: 0.05;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    }

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
    
    .animate-ken-burns {
      animation: ken-burns 8s ease-in-out infinite alternate;
    }
    
    .animate-drift { animation: drift 4s ease-in-out infinite; }

    /* Radial gradient support */
    .bg-radial-gradient {
      background: radial-gradient(var(--tw-gradient-stops));
    }
  `}</style>
);

// --- SVG ICONS ---
const Icons = {
  ArrowRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>,
  ChevronDown: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="6 9 12 15 18 9"></polyline></svg>,
  Crosshair: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line></svg>,
  Quote: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="opacity-20"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>,
  Globe: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>,
  Facebook: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>,
  Twitter: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
  Instagram: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
};

// --- CUSTOM CURSOR ---
const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const cursorXSpring = useSpring(mousePosition.x, springConfig);
  const cursorYSpring = useSpring(mousePosition.y, springConfig);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      cursorXSpring.set(e.clientX);
      cursorYSpring.set(e.clientY);
    };
    
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest('button, a, input, .hover-target')) setIsHovering(true);
      else setIsHovering(false);
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);
    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [cursorXSpring, cursorYSpring]);

  return (
    <>
      <motion.div 
        className="fixed top-0 left-0 w-10 h-10 border border-emerald-200/50 rounded-full pointer-events-none z-[9999] hidden md:flex items-center justify-center mix-blend-difference"
        style={{ x: cursorXSpring, y: cursorYSpring, translateX: '-50%', translateY: '-50%' }}
        animate={{ scale: isHovering ? 1.5 : 1, backgroundColor: isHovering ? 'rgba(163,191,174,0.2)' : 'rgba(0,0,0,0)' }}
      >
        <div className="w-[2px] h-[4px] bg-emerald-200 absolute top-0" />
        <div className="w-[2px] h-[4px] bg-emerald-200 absolute bottom-0" />
        <div className="w-[4px] h-[2px] bg-emerald-200 absolute left-0" />
        <div className="w-[4px] h-[2px] bg-emerald-200 absolute right-0" />
      </motion.div>
      <motion.div 
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-emerald-300 rounded-full pointer-events-none z-[9999] hidden md:block mix-blend-difference"
        style={{ x: mousePosition.x, y: mousePosition.y, translateX: '-50%', translateY: '-50%' }}
      />
    </>
  );
};

// --- HUD OVERLAY ---
const HUDOverlay = () => (
  <div className="fixed inset-6 md:inset-10 border border-emerald-100/10 pointer-events-none z-[90] flex flex-col justify-between p-6 opacity-80">
    <div className="flex justify-between items-start font-mono text-[10px] text-emerald-200/70 tracking-[0.2em] uppercase">
      <div className="flex flex-col gap-1">
        <p className="text-white">LoveAfrica // 2026</p>
        <p className="text-emerald-400">StayCation</p>
      </div>
      <div className="text-right flex flex-col gap-1">
        <p>LAT: -3.0674</p>
        <p>LNG: 37.3556</p>
      </div>
    </div>
    <div className="flex justify-between items-end font-mono text-[10px] text-emerald-200/70 tracking-[0.2em] uppercase">
      <div className="flex items-center gap-3">
        <motion.div 
          animate={{ opacity: [1, 0.3, 1] }} 
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} 
          className="w-2 h-2 bg-emerald-400 rounded-full" 
        />
        <span>LIVE</span>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className="text-white">SCROLL TO EXPLORE</span>
        <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
          <Icons.ChevronDown />
        </motion.div>
      </div>
    </div>
  </div>
);

// --- NAVIGATION ---
const Navigation = () => (
  <nav className="fixed top-0 left-0 w-full z-[100] px-8 md:px-16 py-8 flex justify-between items-center pointer-events-auto bg-gradient-to-b from-[#051009]/80 to-transparent backdrop-blur-sm">
    <motion.h1 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.5 }}
      className="font-sans font-bold text-xl tracking-tighter uppercase text-white cursor-pointer hover-target"
    >
      <span className="text-emerald-400">Love</span>Africa
    </motion.h1>
    <div className="hidden md:flex gap-12 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-100/80">
      {[
        { label: 'Staycations', href: '/staycations' },
        { label: 'Experiences', href: '/experiences' },
        { label: 'About', href: '#about' },
        { label: 'Contact', href: '#contact' }
      ].map((item, i: number) => (
        <motion.a 
          key={item.label} href={item.href}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 + (i * 0.1) }}
          className="hover:text-emerald-400 transition-colors hover-target"
        >
          {item.label}
        </motion.a>
      ))}
    </div>
    <motion.button 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 1 }}
      className="font-mono text-[10px] uppercase tracking-[0.2em] text-white border border-emerald-400/50 px-6 py-3 hover:bg-emerald-500 hover:text-black transition-colors hover-target"
    >
      Book Now
    </motion.button>
  </nav>
);

// --- 1. ENHANCED HERO SECTION ---
const HeroSection = () => {
  const { scrollY } = useScroll();
  const yImage = useTransform(scrollY, [0, 1000], [0, 300]);
  const opacityHero = useTransform(scrollY, [0, 600], [1, 0]);
  const scaleHero = useTransform(scrollY, [0, 600], [1, 0.9]);
  
  const [currentVideo, setCurrentVideo] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentVideo((prev) => (prev + 1) % ASSETS.videos.length);
    }, 6000); 
    return () => clearInterval(timer);
  }, []);

  const textVariants: Variants = {
    hidden: { opacity: 0, y: 100 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { 
        duration: 1.2, 
        ease: [0.2, 0.65, 0.3, 0.9] as [number, number, number, number], 
        delay: 0.5 + (i * 0.05) 
      }
    })
  };

  const titleChars = ['L', 'O', 'V', 'E','A', 'F', 'R', 'I', 'C', 'A'];

  return (
    <section className="relative w-full h-screen overflow-hidden bg-[#051009] flex items-end pb-32 md:pb-40 px-6 md:px-16">
      {/* ENHANCED Background Video with Layers */}
      <motion.div style={{ y: yImage, opacity: opacityHero, scale: scaleHero }} className="absolute inset-0 z-0">
        <video
          key={currentVideo}
          src={ASSETS.videos[currentVideo]}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover opacity-95"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        />
        {/* Video Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#051009] via-[#051009]/40 to-transparent pointer-events-none" />
        
        {/* Subtle Vignette */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-[#051009]/30 pointer-events-none" />
        
        {/* Cinematic Color Grade Overlay */}
        <motion.div 
          className="absolute inset-0 mix-blend-overlay pointer-events-none"
          animate={{ opacity: [0.15, 0.25, 0.15] }}
          transition={{ repeat: Infinity, duration: 6 }}
          style={{
            background: 'linear-gradient(135deg, rgba(163, 191, 174, 0.1) 0%, rgba(52, 211, 153, 0.05) 50%, rgba(5, 16, 9, 0.1) 100%)'
          }}
        />
      </motion.div>

      <div className="relative z-20 w-full max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-end gap-10">
        <div className="flex flex-col">
          <motion.div 
            initial={{ opacity: 0, width: 0 }} 
            animate={{ opacity: 1, width: "100px" }} 
            transition={{ duration: 1, delay: 0.2 }}
            className="h-[1px] bg-gradient-to-r from-emerald-400 to-transparent mb-6 hidden md:block" 
          />
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 1, delay: 0.4 }}
            className="font-mono text-[11px] uppercase tracking-[0.4em] text-emerald-200 mb-4"
          >
            Experience Africa through extraordinary stays.
          </motion.p>
          <h1 className="font-serif font-bold text-[18vw] md:text-[10vw] leading-[0.8] tracking-tighter uppercase flex overflow-hidden">
            {titleChars.map((char: string, i: number) => (
              <motion.span 
                key={i} custom={i} variants={textVariants} initial="hidden" animate="visible" 
                className={`inline-block ${i % 2 === 0 ? 'text-white' : 'text-emerald-100'}`}
              >
                {char}
              </motion.span>
            ))}
          </h1>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 50 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 1, delay: 1.2 }}
          whileHover={{ y: -5 }}
          className="glass-panel w-full md:w-auto p-6 flex flex-col sm:flex-row items-center gap-4"
        >
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 hover:bg-emerald-500 hover:text-black transition-all"
          >
            <Icons.ArrowRight />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

// --- 2. EXPERIENCES SECTION (ENHANCED GLASS + NO MOTION) ---
const CardsSection = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const cardData = [
    { title: "Love Africa Staycations", subtitle: "01 // Africa", img: ASSETS.staycation },
    { title: "Surprise A Loved One", subtitle: "02 // Surprise", img: ASSETS.surprise },
    { title: "Explore Africa's Experiences", subtitle: "03 // Experiences", img: ASSETS.experiences },
  ];

  return (
    <section ref={containerRef} className="relative py-32 px-6 md:px-16 overflow-hidden" id="experiences">
      <div className="absolute inset-0 z-0">
        <img src={ASSETS.bgExperiences} alt="Experiences Background" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#051009] via-[#051009]/90 to-[#051009]" />
      </div>

      <div className="max-w-[1600px] mx-auto relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 50 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true, margin: "-100px" }} 
          transition={{ duration: 0.8 }}
          className="mb-20 flex flex-col md:flex-row justify-between items-end gap-8"
        >
          <div>
            <p className="font-mono text-[10px] tracking-[0.3em] text-emerald-300 uppercase mb-6 flex items-center gap-4">
              <span className="w-10 h-[1px] bg-emerald-400/50"></span> High-End Hospitality
            </p>
            <h2 className="font-serif text-[36px] md:text-[56px] lg:text-[48px] font-medium leading-none tracking-tighter text-white">
              Find Your Perfect<br /> 
              <span className="text-emerald-100">Stays.</span> 
            </h2>
          </div>
          <p className="font-sans text-emerald-100/70 max-w-sm text-sm leading-relaxed">
            A collection of Africa's most remarkable villas, retreats, and boutique stays, chosen for travelers who expect more than just a place to sleep.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {cardData.map((card, idx) => {
            const cardProgress = useTransform(scrollYProgress, 
              [(idx) * 0.25, (idx + 1) * 0.25], 
              [0, 1]
            );
            const cardY = useTransform(cardProgress, [0, 1], [80, 0]);
            const cardOpacity = useTransform(cardProgress, [0, 0.5, 1], [0, 0.5, 1]);
            const cardScale = useTransform(cardProgress, [0, 1], [0.9, 1]);

            return (
              <motion.a 
                key={idx}
                href={idx === 0 ? '/staycations' : idx === 1 ? '/surprise' : '/experiences'}
                style={{ y: cardY, opacity: cardOpacity, scale: cardScale }}
                className="group relative h-[500px] md:h-[600px] rounded-sm overflow-hidden hover-target cursor-pointer block transition-all duration-500 hover:shadow-2xl hover:border-emerald-300/40"
              >
                {/* Enhanced Glassmorphic Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/15 via-emerald-900/5 to-transparent pointer-events-none z-5 group-hover:from-emerald-500/20 group-hover:via-emerald-800/10 transition-all duration-500" />
                
                {/* Enhanced Glass Border */}
                <div className="absolute inset-0 border border-emerald-300/15 pointer-events-none z-5 group-hover:border-emerald-300/35 transition-colors duration-500" />

                <img 
                  src={card.img} 
                  alt={card.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-65 group-hover:opacity-80 transition-opacity duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#051009]/92 via-[#051009]/30 to-transparent group-hover:from-[#051009]/88 transition-all duration-500" />
                
                <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col justify-end z-20">
                  <p className="font-mono text-[10px] tracking-[0.2em] text-emerald-300 uppercase mb-3 group-hover:text-emerald-200 transition-colors duration-300">{card.subtitle}</p>
                  <h3 className="font-serif text-[32px] md:text-[40px] text-white mb-6 leading-tight group-hover:text-emerald-50 transition-colors duration-300">{card.title}</h3>
                  
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div 
                      className="w-10 h-10 rounded-full border border-emerald-200/30 flex items-center justify-center text-emerald-100 group-hover:bg-emerald-500/25 group-hover:text-white group-hover:border-emerald-400 transition-all duration-500"
                    >
                      <Icons.ArrowRight />
                    </div>
                    <span 
                      className="font-mono text-[10px] uppercase text-emerald-100/70 tracking-[0.2em] group-hover:text-emerald-100 transition-all duration-500"
                      style={{
                        opacity: 1,
                        transform: 'translateX(0)',
                      }}
                    >
                      Explore {idx === 0 ? 'Staycations' : idx === 1 ? 'Surprise' : 'Experiences'}
                    </span>
                  </div>
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// --- 3. VILLA SHOWCASE SECTION (MAINTAINED) ---
const VillaShowcaseSection = () => {
  const features = [
    { icon: '🏛️', label: 'Elegant Living' },
    { icon: '👨‍🍳', label: 'Culinary Excellence' },
    { icon: '🌅', label: 'Resort-Inspired Escape' },
  ];

  return (
    <section className="relative py-32 px-6 md:px-16 overflow-hidden border-t border-emerald-900/50 bg-[#040c06]" id="properties">
      <div className="absolute inset-0 z-0">
        <img src={ASSETS.bgConservation} alt="Background" className="w-full h-full object-cover opacity-10 grayscale-[50%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#051009] via-transparent to-[#051009]" />
      </div>

      <div className="max-w-[1600px] mx-auto relative z-20">
        <div className="mb-20 max-w-2xl">
          <motion.p 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} 
            className="font-mono text-[10px] tracking-[0.3em] text-emerald-400 uppercase mb-4"
          >
            Sanctuary Living
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} 
            className="font-serif text-[40px] md:text-[56px] text-white tracking-tighter leading-[1.1] mb-8"
          >
            Protecting <br /><span className="text-emerald-100">Tomorrow.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} 
            className="font-sans text-emerald-50/70 text-[15px] leading-relaxed max-w-lg mb-12"
          >
            At LoveAfrica, we believe great hospitality extends beyond our properties. We partner with local communities, property owners, and service providers to create meaningful opportunities while delivering exceptional guest experiences.

Every booking contributes to a stronger hospitality ecosystem that benefits travelers and communities alike.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-8 md:gap-12"
          >
            {features.map((feature, idx) => (
              <div key={idx} className="flex flex-col items-start">
                <div className="text-4xl mb-3">{feature.icon}</div>
                <p className="font-mono text-[10px] tracking-[0.2em] text-emerald-300 uppercase">{feature.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            whileInView={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.8 }} 
            viewport={{ once: true }} 
            className="relative h-[400px] md:h-[500px] rounded-sm overflow-hidden group"
          >
            <img 
              src={ASSETS.property1} 
              alt="Luxury Living Room" 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#051009] via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 w-full p-6">
              <p className="font-mono text-[10px] tracking-[0.2em] text-emerald-300 uppercase mb-2">Living Spaces</p>
              <h3 className="font-serif text-2xl text-white">Curated interiors</h3>
            </div>
            <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-emerald-400/30 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            whileInView={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.8, delay: 0.1 }} 
            viewport={{ once: true }} 
            className="relative h-[400px] md:h-[500px] rounded-sm overflow-hidden group"
          >
            <img 
              src={ASSETS.property2} 
              alt="Designed Kitchen" 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#051009] via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 w-full p-6">
              <p className="font-mono text-[10px] tracking-[0.2em] text-emerald-300 uppercase mb-2">Culinary</p>
              <h3 className="font-serif text-2xl text-white">Designed Kitchen</h3>
            </div>
            <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-emerald-400/30 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            whileInView={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.8, delay: 0.2 }} 
            viewport={{ once: true }} 
            className="relative h-[400px] md:h-[500px] rounded-sm overflow-hidden group"
          >
            <img 
              src={ASSETS.property3} 
              alt="Scenic Exterior" 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#051009] via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 w-full p-6">
              <p className="font-mono text-[10px] tracking-[0.2em] text-emerald-300 uppercase mb-2">Vistas</p>
              <h3 className="font-serif text-2xl text-white">Breathtaking Views</h3>
            </div>
            <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-emerald-400/30 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// --- 5. SPLIT CONTENT SECTION (MAINTAINED) ---
interface SplitSectionProps {
  title: string;
  highlightTitle: string;
  subtitle: string;
  text: React.ReactNode;
  img: string;
  bgImg: string;
  reversed?: boolean;
  id: string;
}

const SplitSection = ({ title, highlightTitle, subtitle, text, img, bgImg, reversed = false, id }: SplitSectionProps) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const imageScale = useTransform(scrollYProgress, [0, 1], [1.1, 1]);
  const imageOpacity = useTransform(scrollYProgress, [0, 0.3, 1], [0, 1, 1]);
  const contentY = useTransform(scrollYProgress, [0, 1], [60, 0]);

  return (
    <section ref={containerRef} id={id} className="relative py-24 md:py-40 px-6 md:px-16 border-t border-emerald-900/50 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={bgImg} alt="Section Background" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#051009] via-[#051009]/95 to-[#051009]" />
      </div>

      <div className={`max-w-[1600px] mx-auto relative z-20 flex flex-col ${reversed ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-16 md:gap-32`}>
        <motion.div 
          className="w-full md:w-1/2 relative h-[500px] md:h-[700px] overflow-hidden rounded-sm"
          style={{ opacity: imageOpacity }}
        >
          <motion.div
            style={{ scale: imageScale }}
            className="w-full h-full"
          >
            <img src={img} alt={title} className="w-full h-full object-cover grayscale-[30%] hover:grayscale-0 transition-all duration-700 opacity-90" />
          </motion.div>
          <div className="absolute top-6 left-6 w-16 h-16 border-t border-l border-emerald-200/30" />
          <div className="absolute bottom-6 right-6 w-16 h-16 border-b border-r border-emerald-200/30" />
        </motion.div>

        <motion.div 
          className="w-full md:w-1/2 flex flex-col justify-center"
          style={{ y: contentY }}
        >
          <motion.p 
            initial={{ opacity: 0, x: reversed ? 50 : -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            className="font-mono text-[10px] tracking-[0.4em] text-emerald-400 uppercase mb-6"
          >
            {subtitle}
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}
            className="font-serif text-[40px] md:text-[56px] leading-[1.1] tracking-tighter text-white mb-8"
          >
            {title} <br />
            <span className="text-emerald-100">{highlightTitle}</span>
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 }}
            className="font-sans text-emerald-50/70 text-[15px] leading-relaxed mb-10 max-w-lg space-y-6"
          >
            {text}
          </motion.div>
          
          <motion.button 
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.5 }}
            whileHover={{ x: 8 }}
            className="group flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white w-fit hover-target"
          >
            <span className="border-b border-emerald-400/30 pb-1 group-hover:border-emerald-400 transition-colors">Discover More</span>
            <motion.div 
              className="w-8 h-8 rounded-full border border-emerald-400/30 flex items-center justify-center text-emerald-200 group-hover:bg-emerald-400 group-hover:text-[#051009] transition-all"
              whileHover={{ scale: 1.15 }}
            >
              <Icons.ArrowRight />
            </motion.div>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

// --- 6. TESTIMONIALS SECTION (MAINTAINED) ---
const TestimonialsSection = () => {
 const testimonials = [
  {
    quote: "From booking to checkout, every detail was seamless. The property was beautifully designed, impeccably maintained, and exceeded every expectation.",
    author: "Sarah K.",
    location: "Stayed at Kitusuru Residence"
  },
  {
    quote: "The perfect blend of luxury and comfort. The space felt like home from the moment we arrived, with exceptional amenities and outstanding hospitality.",
    author: "David M.",
    location: "Stayed at Riverfront Villa"
  },
  {
    quote: "One of the finest stays we've experienced. Stunning interiors, breathtaking views, and a level of service that made every moment effortless.",
    author: "Grace W.",
    location: "Stayed at Canopy Suites"
  }
];
  
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <section className="relative py-32 px-6 md:px-16 overflow-hidden border-t border-emerald-900/50 bg-[#030805]">
      <div className="max-w-[1200px] mx-auto relative z-20 flex flex-col items-center text-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
          <Icons.Quote />
        </motion.div>
        
        <div className="mt-12 h-[280px] md:h-[200px] w-full relative flex justify-center items-center">
          <AnimatePresence mode="wait">
            <motion.div 
              key={current} 
              initial={{ opacity: 0, y: 15, filter: "blur(4px)" }} 
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} 
              exit={{ opacity: 0, y: -15, filter: "blur(4px)" }} 
              transition={{ duration: 0.8 }} 
              className="absolute w-full px-4"
            >
              <p className="font-serif text-[24px] md:text-[36px] text-white leading-snug md:leading-relaxed max-w-4xl mx-auto mb-8">
                "{testimonials[current].quote}"
              </p>
              <p className="font-mono text-[10px] tracking-[0.2em] text-emerald-400 uppercase">
                {testimonials[current].author}
              </p>
              <p className="font-sans text-[12px] text-emerald-100/50 mt-2">
                {testimonials[current].location}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-3 mt-12">
          {testimonials.map((_, idx) => (
            <motion.button 
              key={idx} 
              onClick={() => setCurrent(idx)}
              whileHover={{ scale: 1.2 }}
              className={`h-1.5 rounded-full transition-all duration-500 hover-target ${current === idx ? 'bg-emerald-400 w-8' : 'bg-emerald-900/50 w-2 hover:bg-emerald-700'}`}
              aria-label={`Go to testimonial ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// --- 7. PREMIUM CONTACT FORM SECTION ---
const ContactSection = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const imageX = useTransform(scrollYProgress, [0, 1], [-100, 0]);
  const formX = useTransform(scrollYProgress, [0, 1], [100, 0]);

  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    property: '',
    dates: '',
    guests: '',
    message: '' 
  });
  const [submitted, setSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', property: '', dates: '', guests: '', message: '' });
      setSubmitted(false);
    }, 4000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const properties = [
    'Select a property',
    'Kitusuru Residence',
    'Riverfront Villa',
    'Canopy Suites',
    'Other / Inquiry'
  ];

  return (
    <section ref={containerRef} className="relative py-32 px-6 md:px-16 overflow-hidden border-t border-emerald-900/50 bg-gradient-to-b from-[#040c06] to-[#051009]" id="contact">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#051009]/40 to-[#051009]" />
      </div>

      <div className="max-w-[1600px] mx-auto relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 lg:gap-20 items-stretch">
          
          {/* LEFT SIDE - IMAGE */}
          <motion.div
            style={{ x: imageX }}
            initial={{ opacity: 0, filter: "blur(20px)" }}
            whileInView={{ opacity: 1, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative h-[500px] md:h-[700px] rounded-sm overflow-hidden group hidden lg:block"
          >
            <img 
              src={ASSETS.form}
              alt="Contact us - African landscape"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-85 group-hover:opacity-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#051009]/60 via-[#051009]/20 to-transparent" />
            
            {/* Premium Decorative Corners */}
            <motion.div 
              className="absolute top-6 left-6 w-16 h-16 border-t-2 border-l-2 border-emerald-400/40 group-hover:border-emerald-400 transition-colors duration-500" 
              whileHover={{ scale: 1.1 }}
            />
            <motion.div 
              className="absolute bottom-6 right-6 w-16 h-16 border-b-2 border-r-2 border-emerald-400/40 group-hover:border-emerald-400 transition-colors duration-500" 
              whileHover={{ scale: 1.1 }}
            />

            {/* Text overlay with glass effect */}
            <div className="absolute bottom-0 left-0 w-full p-8 glass-panel m-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <p className="font-mono text-[10px] tracking-[0.3em] text-emerald-400 uppercase mb-3">Your Journey Starts Here</p>
                <h3 className="font-serif text-2xl md:text-3xl text-white leading-tight">
                  Discover Africa's Most Exclusive Properties
                </h3>
              </motion.div>
            </div>
          </motion.div>

          {/* RIGHT SIDE - PREMIUM FORM */}
          <motion.div
            style={{ x: formX }}
            initial={{ opacity: 0, filter: "blur(20px)" }}
            whileInView={{ opacity: 1, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="flex flex-col justify-center"
          >
            {/* Header */}
            <div className="mb-12">
              <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="font-mono text-[10px] tracking-[0.4em] text-emerald-400 uppercase mb-4 flex items-center gap-3"
              >
                <span className="w-8 h-[1px] bg-emerald-400"></span> Get in Touch
              </motion.p>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="font-serif text-[36px] md:text-[48px] text-white tracking-tighter leading-[1.1] mb-6"
              >
                Plan Your<br /><span className="text-emerald-100">African Escape</span>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="font-sans text-emerald-50/70 text-[14px] leading-relaxed"
              >
                Let our experts curate the perfect stay. Share your preferences and we'll send personalized recommendations.
              </motion.p>
            </div>

            {/* Form Container */}
            {!submitted ? (
              <motion.form
                initial={{ opacity: 0, y: 40, filter: "blur(20px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Row 1: Name & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                  >
                    <label className="font-mono text-[9px] uppercase tracking-[0.3em] text-emerald-300 mb-3 block">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      required
                      placeholder="Sarah Anderson"
                      className="form-input w-full px-4 py-3 text-white placeholder-emerald-200/20 font-sans text-sm"
                    />
                    <motion.div 
                      className="h-[1px] bg-gradient-to-r from-emerald-400 to-transparent mt-2"
                      initial={{ scaleX: 0, transformOrigin: 'left' }}
                      animate={{ scaleX: focusedField === 'name' ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.35 }}
                  >
                    <label className="font-mono text-[9px] uppercase tracking-[0.3em] text-emerald-300 mb-3 block">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      required
                      placeholder="sarah@example.com"
                      className="form-input w-full px-4 py-3 text-white placeholder-emerald-200/20 font-sans text-sm"
                    />
                    <motion.div 
                      className="h-[1px] bg-gradient-to-r from-emerald-400 to-transparent mt-2"
                      initial={{ scaleX: 0, transformOrigin: 'left' }}
                      animate={{ scaleX: focusedField === 'email' ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                </div>

                {/* Row 2: Property & Guests */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                  >
                    <label className="font-mono text-[9px] uppercase tracking-[0.3em] text-emerald-300 mb-3 block">Property Interest</label>
                    <select
                      name="property"
                      value={formData.property}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('property')}
                      onBlur={() => setFocusedField(null)}
                      className="form-select w-full px-4 py-3 text-white font-sans text-sm appearance-none cursor-pointer"
                    >
                      {properties.map((prop) => (
                        <option key={prop} value={prop} className="bg-[#051009] text-white">{prop}</option>
                      ))}
                    </select>
                    <motion.div 
                      className="h-[1px] bg-gradient-to-r from-emerald-400 to-transparent mt-2"
                      initial={{ scaleX: 0, transformOrigin: 'left' }}
                      animate={{ scaleX: focusedField === 'property' ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.45 }}
                  >
                    <label className="font-mono text-[9px] uppercase tracking-[0.3em] text-emerald-300 mb-3 block">Number of Guests</label>
                    <input
                      type="number"
                      name="guests"
                      value={formData.guests}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('guests')}
                      onBlur={() => setFocusedField(null)}
                      min="1"
                      max="20"
                      placeholder="2"
                      className="form-input w-full px-4 py-3 text-white placeholder-emerald-200/20 font-sans text-sm"
                    />
                    <motion.div 
                      className="h-[1px] bg-gradient-to-r from-emerald-400 to-transparent mt-2"
                      initial={{ scaleX: 0, transformOrigin: 'left' }}
                      animate={{ scaleX: focusedField === 'guests' ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                </div>

                {/* Dates */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                >
                  <label className="font-mono text-[9px] uppercase tracking-[0.3em] text-emerald-300 mb-3 block">Preferred Dates</label>
                  <input
                    type="text"
                    name="dates"
                    value={formData.dates}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('dates')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="e.g., June 15 - June 22, 2026"
                    className="form-input w-full px-4 py-3 text-white placeholder-emerald-200/20 font-sans text-sm"
                  />
                  <motion.div 
                    className="h-[1px] bg-gradient-to-r from-emerald-400 to-transparent mt-2"
                    initial={{ scaleX: 0, transformOrigin: 'left' }}
                    animate={{ scaleX: focusedField === 'dates' ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>

                {/* Message */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.55 }}
                >
                  <label className="font-mono text-[9px] uppercase tracking-[0.3em] text-emerald-300 mb-3 block">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('message')}
                    onBlur={() => setFocusedField(null)}
                    required
                    placeholder="Tell us about your preferences..."
                    rows={4}
                    className="form-textarea w-full px-4 py-3 text-white placeholder-emerald-200/20 font-sans text-sm"
                  />
                  <motion.div 
                    className="h-[1px] bg-gradient-to-r from-emerald-400 to-transparent mt-2"
                    initial={{ scaleX: 0, transformOrigin: 'left' }}
                    animate={{ scaleX: focusedField === 'message' ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>

                {/* Submit Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="pt-4"
                >
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(52, 211, 153, 0.3)' }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full group relative overflow-hidden py-4 rounded-sm font-mono text-[10px] uppercase tracking-[0.2em] text-black font-medium transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 transition-all duration-300" />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400 opacity-0"
                      whileHover={{ opacity: 1 }}
                    />
                    <div className="relative flex items-center justify-center gap-3">
                      <span>Send Inquiry</span>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <Icons.ArrowRight />
                      </motion.div>
                    </div>
                  </motion.button>
                </motion.div>
              </motion.form>
            ) : (
              /* Success State */
              <motion.div
                initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                className="py-12"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 mb-6 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center"
                >
                  <motion.svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-emerald-400"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </motion.svg>
                </motion.div>

                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="font-serif text-[28px] text-white mb-3"
                >
                  Inquiry Received
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="font-sans text-emerald-50/70 mb-4 text-[14px]"
                >
                  Thank you! Our team will review your inquiry and send personalized recommendations to your email within 24 hours.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="font-mono text-[10px] text-emerald-400 uppercase tracking-[0.2em]"
                >
                  ✓ Message confirmed
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// --- FOOTER (MAINTAINED) ---
const Footer = () => (
  <footer className="relative bg-[#020603] pt-20 pb-8 px-6 md:px-16 border-t border-emerald-900/50 z-20 overflow-hidden">
    <div className="absolute inset-0 z-0 opacity-20">
      <svg className="w-full h-full" viewBox="0 0 1200 400" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="silhouetteGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#a3bfae', stopOpacity: 0.15 }} />
            <stop offset="100%" style={{ stopColor: '#a3bfae', stopOpacity: 0.05 }} />
          </linearGradient>
        </defs>
        <path d="M 0 300 Q 100 250 200 280 T 400 270 T 600 290 T 800 260 T 1000 285 T 1200 270 L 1200 400 L 0 400 Z" fill="url(#silhouetteGradient)" />
        <path d="M 0 320 Q 80 280 160 310 T 320 300 T 480 315 T 640 295 T 800 320 T 960 305 T 1200 320 L 1200 400 L 0 400 Z" fill="#a3bfae" opacity="0.08" />
      </svg>
    </div>

    <div className="max-w-[1600px] mx-auto relative z-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 border-b border-emerald-900/30 pb-12">
        <div className="flex flex-col gap-3">
          <h4 className="font-sans font-medium text-white mb-1">Support</h4>
          <a href="#" className="font-sans text-sm text-emerald-50/70 hover:text-white hover:underline transition-all hover-target w-fit">Help Center</a>
          <a href="#" className="font-sans text-sm text-emerald-50/70 hover:text-white hover:underline transition-all hover-target w-fit">Safety Information</a>
          <a href="#" className="font-sans text-sm text-emerald-50/70 hover:text-white hover:underline transition-all hover-target w-fit">Cancellation Options</a>
          <a href="#" className="font-sans text-sm text-emerald-50/70 hover:text-white hover:underline transition-all hover-target w-fit">Contact Support</a>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="font-sans font-medium text-white mb-1">Hosting</h4>
          <a href="#" className="font-sans text-sm text-emerald-50/70 hover:text-white hover:underline transition-all hover-target w-fit">Try Hosting</a>
          <a href="#" className="font-sans text-sm text-emerald-50/70 hover:text-white hover:underline transition-all hover-target w-fit">Host Resources</a>
          <a href="#" className="font-sans text-sm text-emerald-50/70 hover:text-white hover:underline transition-all hover-target w-fit">Community Forum</a>
          <a href="#" className="font-sans text-sm text-emerald-50/70 hover:text-white hover:underline transition-all hover-target w-fit">Host Responsibly</a>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="font-sans font-medium text-white mb-1">LoveAfrica</h4>
          <a href="#" className="font-sans text-sm text-emerald-50/70 hover:text-white hover:underline transition-all hover-target w-fit">Newsroom</a>
          <a href="#" className="font-sans text-sm text-emerald-50/70 hover:text-white hover:underline transition-all hover-target w-fit">New Features</a>
          <a href="#" className="font-sans text-sm text-emerald-50/70 hover:text-white hover:underline transition-all hover-target w-fit">Careers</a>
          <a href="#" className="font-sans text-sm text-emerald-50/70 hover:text-white hover:underline transition-all hover-target w-fit">Investors</a>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-emerald-50/70 font-sans text-sm">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-4">
          <span>© 2026 LoveAfrica, Inc.</span>
          <span className="hidden md:inline">·</span>
          <a href="#" className="hover:text-white hover:underline hover-target">Privacy</a>
          <span className="hidden md:inline">·</span>
          <a href="#" className="hover:text-white hover:underline hover-target">Terms</a>
          <span className="hidden md:inline">·</span>
          <a href="#" className="hover:text-white hover:underline hover-target">Sitemap</a>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 hover:text-white cursor-pointer hover-target">
            <Icons.Globe />
            <span className="font-medium hover:underline">English (US)</span>
          </div>
          <div className="flex items-center gap-2 hover:text-white cursor-pointer hover-target">
            <span className="font-medium hover:underline">$ USD</span>
          </div>
          <div className="flex items-center gap-4 ml-4">
            <a href="#" className="hover:text-white hover-target"><Icons.Facebook /></a>
            <a href="#" className="hover:text-white hover-target"><Icons.Twitter /></a>
            <a href="#" className="hover:text-white hover-target"><Icons.Instagram /></a>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

// --- MAIN EXPORT ---
export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="relative bg-[#051009] w-full min-h-screen selection:bg-emerald-500/30 selection:text-white">
      <GlobalStyles />
      <div className="film-grain" />
      <CustomCursor />
      
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 1, ease: "easeInOut" } }}
            className="fixed inset-0 z-[99999] bg-[#051009] flex items-center justify-center flex-col"
          >
            <div className="overflow-hidden mb-8">
              <motion.h1 
                initial={{ y: 50 }} animate={{ y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}
                className="font-mono text-[12px] tracking-[0.5em] text-emerald-400 uppercase"
              >
                Initializing Sanctuary
              </motion.h1>
            </div>
            <div className="w-64 h-[1px] bg-emerald-900 relative overflow-hidden">
              <motion.div 
                initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="absolute top-0 left-0 h-full w-1/2 bg-emerald-400" 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Navigation />
      <HeroSection />
      <CardsSection />
      <VillaShowcaseSection />
      
      <SplitSection 
        id="about"
        subtitle="The Philosophy"
        title="Luxury Redefined"
        highlightTitle="in Our luxury Stays."
        img={ASSETS.aboutSide}
        bgImg={ASSETS.bgAbout}
        text={<>
          <p>Since 2025, we've been connecting travelers, families, and professionals with exceptional properties across Africa.</p>
          <p>Every stay in our collection is carefully selected for its quality, comfort, and distinctive character.</p>
          <p>From urban retreats to coastal escapes, we create seamless accommodation experiences designed around convenience, style, and genuine hospitality.</p>
        </>}
      />

      <SplitSection 
        id="amenities"
        reversed={true}
        subtitle="Sanctuary"
        title="Unmatched Comfort"
        highlightTitle="& Serenity."
        img={ASSETS.amenitiesSide}
        bgImg={ASSETS.bgAmenities}
        text={<>
          <p>Every LoveAfrica stay is built around ease and quality. From interior design to guest service, everything is handled with care so your experience feels effortless.</p>
          <ul className="space-y-4 mt-6 text-emerald-100">
            <li className="flex items-center gap-4"><span className="text-emerald-400"><Icons.Crosshair /></span>Beautifully maintained homes</li>
            <li className="flex items-center gap-4"><span className="text-emerald-400"><Icons.Crosshair /></span> Reliable hospitality service</li>
            <li className="flex items-center gap-4"><span className="text-emerald-400"><Icons.Crosshair /></span> 24/7 Support whenever you need it</li>
          </ul>
        </>}
      />

      <TestimonialsSection />
      <ContactSection />
      <Footer />
    </main>
  );
}