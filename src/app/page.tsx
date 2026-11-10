'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIG & CONSTANTS ---
const ASSETS = {
  videos: [
    "/assets/videos/ext2.mp4",
    "/assets/videos/living.mp4",
    "/assets/videos/kitchen2.mp4",
    "/assets/videos/bedroom.mp4"
  ],
  bgExperiences: "/assets/images/exp.jpg",
  bgAbout: "/assets/images/bg-about.jpg",
  bgAmenities: "/assets/images/bg-amenities.jpg",
  bgConservation: "/assets/images/bg-conservation.jpg",

  staycation: "/assets/images/living4.jpg",
  surprise: "/assets/images/surp.jpg",
  experiences: "/assets/images/exp.jpg",
  property1: "/assets/images/prop1.avif",
  property2: "/assets/images/kitch.avif",
  property3: "/assets/images/exte.jpg",
  form: "/assets/images/form.jpg",
  aboutSide: "/assets/images/about.jpeg",
  amenitiesSide: "/assets/images/brb.jpeg",
};

// --- ONE SIMPLE, CHEAP ANIMATION (opacity + transform only, runs once) ---
const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
});

// --- GLOBAL STYLES (lightweight) ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,800;1,400&family=JetBrains+Mono:wght@300;400;700&family=Inter:wght@300;400;500;600&display=swap');

    html { scroll-behavior: smooth; }

    body {
      font-family: 'Inter', sans-serif;
      background-color: #051009;
      color: #ffffff;
      overflow-x: hidden;
    }

    .font-serif { font-family: 'Playfair Display', serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    .font-sans { font-family: 'Inter', sans-serif; }

    /* Light glass: small blur radius is MUCH cheaper than the old blur(80px) */
    .glass-panel {
      background: rgba(10, 30, 18, 0.45);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(163, 191, 174, 0.35);
      border-radius: 8px;
    }

    .form-input, .form-textarea, .form-select {
      background: rgba(5, 16, 9, 0.6);
      border: 1px solid rgba(163, 191, 174, 0.3);
      border-radius: 6px;
      color: #ffffff;
      transition: border-color 0.2s ease, background-color 0.2s ease;
    }
    .form-input:focus, .form-textarea:focus, .form-select:focus {
      background: rgba(5, 16, 9, 0.85);
      border-color: rgba(163, 191, 174, 0.8);
      outline: none;
    }
    .form-input::placeholder, .form-textarea::placeholder {
      color: rgba(163, 191, 174, 0.3);
    }

    ::-webkit-scrollbar { width: 8px; background: #051009; }
    ::-webkit-scrollbar-thumb { background: rgba(163, 191, 174, 0.4); border-radius: 4px; }

    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior: auto; }
      * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
  `}</style>
);

// --- SVG ICONS ---
const Icons = {
  ArrowRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>,
  Crosshair: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line></svg>,
  Quote: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="opacity-20"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>,
  Globe: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>,
  Facebook: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>,
  Twitter: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
  Instagram: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
};

// --- NAVIGATION (no backdrop blur, no staggered entrances) ---
const Navigation = () => (
  <nav className="fixed top-0 left-0 w-full z-100 px-8 md:px-16 py-8 flex justify-between items-center bg-linear-to-b from-[#051009]/90 to-transparent">
    <h1 className="font-sans font-bold text-xl tracking-tighter uppercase text-white">
      <span className="text-emerald-400">Love</span>Africa
    </h1>
    <div className="hidden md:flex gap-12 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-100/80">
      {[
        { label: 'Staycations', href: '/staycations' },
        { label: 'Experiences', href: '/experiences' },
        { label: 'About', href: '#about' },
        { label: 'Contact', href: '#contact' }
      ].map((item) => (
        <a key={item.label} href={item.href} className="hover:text-emerald-400 transition-colors">
          {item.label}
        </a>
      ))}
    </div>
    <button className="font-mono text-[10px] uppercase tracking-[0.2em] text-white border border-emerald-400/50 px-6 py-3 hover:bg-emerald-500 hover:text-black transition-colors">
      Book Now
    </button>
  </nav>
);

// --- 1. HERO (no scroll-linked transforms, no overlay animations) ---
const HeroSection = () => {
  const [currentVideo, setCurrentVideo] = useState(0);

  const titleChars = ['L', 'O', 'V', 'E', 'A', 'F', 'R', 'I', 'C', 'A'];

  return (
    <section className="relative w-full h-screen overflow-hidden bg-[#051009] flex items-end pb-32 md:pb-40 px-6 md:px-16">
      <div className="absolute inset-0 z-0">
        <video
          key={currentVideo}
          src={ASSETS.videos[currentVideo]}
          autoPlay
          muted
          playsInline
          preload="metadata"
          onEnded={() => setCurrentVideo((prev) => (prev + 1) % ASSETS.videos.length)}
          className="absolute inset-0 w-full h-full object-cover opacity-95"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#051009] via-[#051009]/40 to-transparent pointer-events-none" />
      </div>

      <div className="relative z-20 w-full max-w-400 mx-auto flex flex-col md:flex-row justify-between items-end gap-10">
        <div className="flex flex-col">
          <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-emerald-200 mb-4">
            Experience Africa through extraordinary stays.
          </p>
          <h1 className="font-serif font-bold text-[18vw] md:text-[10vw] leading-[0.8] tracking-tighter uppercase flex overflow-hidden">
            {titleChars.map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 + i * 0.04 }}
                className={`inline-block ${i % 2 === 0 ? 'text-white' : 'text-emerald-100'}`}
              >
                {char}
              </motion.span>
            ))}
          </h1>
        </div>

        <div className="glass-panel w-full md:w-auto p-6 flex items-center gap-4">
          <button
            aria-label="Explore stays"
            className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 hover:bg-emerald-500 hover:text-black transition-colors"
          >
            <Icons.ArrowRight />
          </button>
        </div>
      </div>
    </section>
  );
};

// --- 2. EXPERIENCES SECTION (simple reveal, plain CSS hover) ---
const CardsSection = () => {
  const cardData = [
    { title: "Love Africa Staycations", subtitle: "01 // Africa", img: ASSETS.staycation, href: '/staycations', cta: 'Staycations' },
    { title: "Surprise A Loved One", subtitle: "02 // Surprise", img: ASSETS.surprise, href: '/surprise', cta: 'Surprise' },
    { title: "Explore Africa's Experiences", subtitle: "03 // Experiences", img: ASSETS.experiences, href: '/experiences', cta: 'Experiences' },
  ];

  return (
    <section className="relative py-32 px-6 md:px-16 overflow-hidden" id="experiences">
      <div className="absolute inset-0 z-0">
        <img src={ASSETS.bgExperiences} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-linear-to-b from-[#051009] via-[#051009]/90 to-[#051009]" />
      </div>

      <div className="max-w-400 mx-auto relative z-20">
        <motion.div {...reveal()} className="mb-20 flex flex-col md:flex-row justify-between items-end gap-8">
          <div>
            <p className="font-mono text-[10px] tracking-[0.3em] text-emerald-300 uppercase mb-6 flex items-center gap-4">
              <span className="w-10 h-px bg-emerald-400/50"></span> High-End Hospitality
            </p>
            <h2 className="font-serif text-[36px] md:text-[48px] font-medium leading-none tracking-tighter text-white">
              Find Your Perfect<br />
              <span className="text-emerald-100">Stays.</span>
            </h2>
          </div>
          <p className="font-sans text-emerald-100/70 max-w-sm text-sm leading-relaxed">
            A collection of Africa's most remarkable villas, retreats, and boutique stays, chosen for travelers who expect more than just a place to sleep.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {cardData.map((card, idx) => (
            <motion.a
              key={card.href}
              href={card.href}
              {...reveal(idx * 0.1)}
              className="group relative h-125 md:h-150 rounded-sm overflow-hidden block border border-emerald-300/15 hover:border-emerald-300/35 transition-colors duration-300"
            >
              <img
                src={card.img}
                alt={card.title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover opacity-65 group-hover:opacity-80 transition-opacity duration-300"
              />
              <div className="absolute inset-0 bg-linear-to-t from-[#051009]/90 via-[#051009]/30 to-transparent" />

              <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col justify-end z-20">
                <p className="font-mono text-[10px] tracking-[0.2em] text-emerald-300 uppercase mb-3">{card.subtitle}</p>
                <h3 className="font-serif text-[32px] md:text-[40px] text-white mb-6 leading-tight">{card.title}</h3>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-emerald-200/30 flex items-center justify-center text-emerald-100 group-hover:bg-emerald-500/25 group-hover:border-emerald-400 transition-colors duration-300">
                    <Icons.ArrowRight />
                  </div>
                  <span className="font-mono text-[10px] uppercase text-emerald-100/70 tracking-[0.2em]">
                    Explore {card.cta}
                  </span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- 3. VILLA SHOWCASE ---
const VillaShowcaseSection = () => {
  const features = [
    { icon: '🏛️', label: 'Elegant Living' },
    { icon: '👨‍🍳', label: 'Culinary Excellence' },
    { icon: '🌅', label: 'Resort-Inspired Escape' },
  ];

  const tiles = [
    { img: ASSETS.property1, alt: 'Luxury Living Room', tag: 'Living Spaces', title: 'Curated interiors' },
    { img: ASSETS.property2, alt: 'Designed Kitchen', tag: 'Culinary', title: 'Designed Kitchen' },
    { img: ASSETS.property3, alt: 'Scenic Exterior', tag: 'Vistas', title: 'Breathtaking Views' },
  ];

  return (
    <section className="relative py-32 px-6 md:px-16 overflow-hidden border-t border-emerald-900/50 bg-[#040c06]" id="properties">
      <div className="absolute inset-0 z-0">
        <img src={ASSETS.bgConservation} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover opacity-10 grayscale" />
        <div className="absolute inset-0 bg-linear-to-t from-[#051009] via-transparent to-[#051009]" />
      </div>

      <div className="max-w-400 mx-auto relative z-20">
        <motion.div {...reveal()} className="mb-20 max-w-2xl">
          <p className="font-mono text-[10px] tracking-[0.3em] text-emerald-400 uppercase mb-4">Sanctuary Living</p>
          <h2 className="font-serif text-[40px] md:text-[56px] text-white tracking-tighter leading-[1.1] mb-8">
            Protecting <br /><span className="text-emerald-100">Tomorrow.</span>
          </h2>
          <p className="font-sans text-emerald-50/70 text-[15px] leading-relaxed max-w-lg mb-12">
            At LoveAfrica, we believe great hospitality extends beyond our properties. We partner with local communities, property owners, and service providers to create meaningful opportunities while delivering exceptional guest experiences.
            <br /><br />
            Every booking contributes to a stronger hospitality ecosystem that benefits travelers and communities alike.
          </p>

          <div className="flex flex-wrap gap-8 md:gap-12">
            {features.map((feature) => (
              <div key={feature.label} className="flex flex-col items-start">
                <div className="text-4xl mb-3">{feature.icon}</div>
                <p className="font-mono text-[10px] tracking-[0.2em] text-emerald-300 uppercase">{feature.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {tiles.map((tile, i) => (
            <motion.div key={tile.title} {...reveal(i * 0.1)} className="relative h-100 md:h-125 rounded-sm overflow-hidden group">
              <img
                src={tile.img}
                alt={tile.alt}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-[#051009] via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 w-full p-6">
                <p className="font-mono text-[10px] tracking-[0.2em] text-emerald-300 uppercase mb-2">{tile.tag}</p>
                <h3 className="font-serif text-2xl text-white">{tile.title}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- 5. SPLIT CONTENT SECTION (no scroll-linked transforms) ---
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

const SplitSection = ({ title, highlightTitle, subtitle, text, img, bgImg, reversed = false, id }: SplitSectionProps) => (
  <section id={id} className="relative py-24 md:py-40 px-6 md:px-16 border-t border-emerald-900/50 overflow-hidden">
    <div className="absolute inset-0 z-0">
      <img src={bgImg} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover opacity-20" />
      <div className="absolute inset-0 bg-linear-to-b from-[#051009] via-[#051009]/95 to-[#051009]" />
    </div>

    <div className={`max-w-400 mx-auto relative z-20 flex flex-col ${reversed ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-16 md:gap-32`}>
      <motion.div {...reveal()} className="w-full md:w-1/2 relative h-125 md:h-175 overflow-hidden rounded-sm">
        <img src={img} alt={title} loading="lazy" decoding="async" className="w-full h-full object-cover opacity-90" />
        <div className="absolute top-6 left-6 w-16 h-16 border-t border-l border-emerald-200/30" />
        <div className="absolute bottom-6 right-6 w-16 h-16 border-b border-r border-emerald-200/30" />
      </motion.div>

      <motion.div {...reveal(0.1)} className="w-full md:w-1/2 flex flex-col justify-center">
        <p className="font-mono text-[10px] tracking-[0.4em] text-emerald-400 uppercase mb-6">{subtitle}</p>
        <h2 className="font-serif text-[40px] md:text-[56px] leading-[1.1] tracking-tighter text-white mb-8">
          {title} <br />
          <span className="text-emerald-100">{highlightTitle}</span>
        </h2>
        <div className="font-sans text-emerald-50/70 text-[15px] leading-relaxed mb-10 max-w-lg space-y-6">
          {text}
        </div>

        <button className="group flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white w-fit">
          <span className="border-b border-emerald-400/30 pb-1 group-hover:border-emerald-400 transition-colors">Discover More</span>
          <div className="w-8 h-8 rounded-full border border-emerald-400/30 flex items-center justify-center text-emerald-200 group-hover:bg-emerald-400 group-hover:text-[#051009] transition-colors">
            <Icons.ArrowRight />
          </div>
        </button>
      </motion.div>
    </div>
  </section>
);

// --- 6. TESTIMONIALS (fade only, no blur filter) ---
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

const TestimonialsSection = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative py-32 px-6 md:px-16 overflow-hidden border-t border-emerald-900/50 bg-[#030805]">
      <div className="max-w-300 mx-auto relative z-20 flex flex-col items-center text-center">
        <Icons.Quote />

        <div className="mt-12 h-70 md:h-50 w-full relative flex justify-center items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
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
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${current === idx ? 'bg-emerald-400 w-8' : 'bg-emerald-900/50 w-2 hover:bg-emerald-700'}`}
              aria-label={`Go to testimonial ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// --- 7. CONTACT FORM (one reveal per column, CSS focus styles) ---
const properties = [
  'Select a property',
  'Kitusuru Residence',
  'Riverfront Villa',
  'Canopy Suites',
  'Other / Inquiry'
];

const labelClass = "font-mono text-[9px] uppercase tracking-[0.3em] text-emerald-300 mb-3 block";
const inputClass = "w-full px-4 py-3 text-white placeholder-emerald-200/20 font-sans text-sm";

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    property: '',
    dates: '',
    guests: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

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

  return (
    <section className="relative py-32 px-6 md:px-16 overflow-hidden border-t border-emerald-900/50 bg-linear-to-b from-[#040c06] to-[#051009]" id="contact">
      <div className="max-w-400 mx-auto relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 lg:gap-20 items-stretch">

          {/* LEFT - IMAGE */}
          <motion.div {...reveal()} className="relative h-125 md:h-175 rounded-sm overflow-hidden hidden lg:block">
            <img
              src={ASSETS.form}
              alt="Contact us - African landscape"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-linear-to-t from-[#051009]/60 via-[#051009]/20 to-transparent" />
            <div className="absolute top-6 left-6 w-16 h-16 border-t-2 border-l-2 border-emerald-400/40" />
            <div className="absolute bottom-6 right-6 w-16 h-16 border-b-2 border-r-2 border-emerald-400/40" />

            <div className="absolute bottom-0 left-0 right-0 p-8 glass-panel m-6">
              <p className="font-mono text-[10px] tracking-[0.3em] text-emerald-400 uppercase mb-3">Your Journey Starts Here</p>
              <h3 className="font-serif text-2xl md:text-3xl text-white leading-tight">
                Discover Africa's Most Exclusive Properties
              </h3>
            </div>
          </motion.div>

          {/* RIGHT - FORM */}
          <motion.div {...reveal(0.1)} className="flex flex-col justify-center">
            <div className="mb-12">
              <p className="font-mono text-[10px] tracking-[0.4em] text-emerald-400 uppercase mb-4 flex items-center gap-3">
                <span className="w-8 h-px bg-emerald-400"></span> Get in Touch
              </p>
              <h2 className="font-serif text-[36px] md:text-[48px] text-white tracking-tighter leading-[1.1] mb-6">
                Plan Your<br /><span className="text-emerald-100">African Escape</span>
              </h2>
              <p className="font-sans text-emerald-50/70 text-[14px] leading-relaxed">
                Let our experts curate the perfect stay. Share your preferences and we'll send personalized recommendations.
              </p>
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Full Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Sarah Anderson" className={`form-input ${inputClass}`} />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="sarah@example.com" className={`form-input ${inputClass}`} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Property Interest</label>
                    <select name="property" value={formData.property} onChange={handleChange} className="form-select w-full px-4 py-3 text-white font-sans text-sm appearance-none cursor-pointer">
                      {properties.map((prop) => (
                        <option key={prop} value={prop} className="bg-[#051009] text-white">{prop}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Number of Guests</label>
                    <input type="number" name="guests" value={formData.guests} onChange={handleChange} min="1" max="20" placeholder="2" className={`form-input ${inputClass}`} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Preferred Dates</label>
                  <input type="text" name="dates" value={formData.dates} onChange={handleChange} placeholder="e.g., June 15 - June 22, 2026" className={`form-input ${inputClass}`} />
                </div>

                <div>
                  <label className={labelClass}>Message</label>
                  <textarea name="message" value={formData.message} onChange={handleChange} required placeholder="Tell us about your preferences..." rows={4} className={`form-textarea ${inputClass}`} />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-sm font-mono text-[10px] uppercase tracking-[0.2em] text-black font-medium bg-emerald-400 hover:bg-emerald-300 active:scale-[0.99] transition-colors flex items-center justify-center gap-3"
                >
                  <span>Send Inquiry</span>
                  <Icons.ArrowRight />
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="py-12"
              >
                <div className="w-16 h-16 mb-6 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h3 className="font-serif text-[28px] text-white mb-3">Inquiry Received</h3>
                <p className="font-sans text-emerald-50/70 mb-4 text-[14px]">
                  Thank you! Our team will review your inquiry and send personalized recommendations to your email within 24 hours.
                </p>
                <div className="font-mono text-[10px] text-emerald-400 uppercase tracking-[0.2em]">
                  ✓ Message confirmed
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// --- FOOTER ---
const footerColumns = [
  { title: 'Support', links: ['Help Center', 'Safety Information', 'Cancellation Options', 'Contact Support'] },
  { title: 'Hosting', links: ['Try Hosting', 'Host Resources', 'Community Forum', 'Host Responsibly'] },
  { title: 'LoveAfrica', links: ['Newsroom', 'New Features', 'Careers', 'Investors'] },
];

const Footer = () => (
  <footer className="relative bg-[#020603] pt-20 pb-8 px-6 md:px-16 border-t border-emerald-900/50 z-20 overflow-hidden">
    <div className="max-w-400 mx-auto relative z-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 border-b border-emerald-900/30 pb-12">
        {footerColumns.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <h4 className="font-sans font-medium text-white mb-1">{col.title}</h4>
            {col.links.map((link) => (
              <a key={link} href="#" className="font-sans text-sm text-emerald-50/70 hover:text-white hover:underline transition-colors w-fit">{link}</a>
            ))}
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-emerald-50/70 font-sans text-sm">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-4">
          <span>© 2026 LoveAfrica, Inc.</span>
          <span className="hidden md:inline">·</span>
          <a href="#" className="hover:text-white hover:underline">Privacy</a>
          <span className="hidden md:inline">·</span>
          <a href="#" className="hover:text-white hover:underline">Terms</a>
          <span className="hidden md:inline">·</span>
          <a href="#" className="hover:text-white hover:underline">Sitemap</a>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 hover:text-white cursor-pointer">
            <Icons.Globe />
            <span className="font-medium hover:underline">English (US)</span>
          </div>
          <div className="flex items-center gap-2 hover:text-white cursor-pointer">
            <span className="font-medium hover:underline">$ USD</span>
          </div>
          <div className="flex items-center gap-4 ml-4">
            <a href="#" aria-label="Facebook" className="hover:text-white"><Icons.Facebook /></a>
            <a href="#" aria-label="X" className="hover:text-white"><Icons.Twitter /></a>
            <a href="#" aria-label="Instagram" className="hover:text-white"><Icons.Instagram /></a>
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
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="relative bg-[#051009] w-full min-h-screen selection:bg-emerald-500/30 selection:text-white">
      <GlobalStyles />

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="fixed inset-0 z-99999 bg-[#051009] flex items-center justify-center"
          >
            <h1 className="font-mono text-[12px] tracking-[0.5em] text-emerald-400 uppercase">
              LoveAfrica
            </h1>
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
            <li className="flex items-center gap-4"><span className="text-emerald-400"><Icons.Crosshair /></span>Reliable hospitality service</li>
            <li className="flex items-center gap-4"><span className="text-emerald-400"><Icons.Crosshair /></span>24/7 Support whenever you need it</li>
          </ul>
        </>}
      />

      <TestimonialsSection />
      <ContactSection />
      <Footer />
    </main>
  );
}