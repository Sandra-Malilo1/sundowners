'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { searchApi } from '@/lib/api';

// ─── DESIGN TOKENS ────────────────────────────────────
const DESIGN_SYSTEM = {
  // Color Palette: Ultra-minimal Swiss luxury
  colors: {
    bg: {
      primary: '#0f0f0f',      // Near-black
      secondary: '#1a1a1a',    // Slightly lighter
      tertiary: '#2a2a2a',     // Card/subtle backgrounds
    },
    text: {
      primary: '#ffffff',      // White text
      secondary: '#b0b0b0',    // Muted/captions
      muted: '#808080',        // Disabled/hints
    },
    accent: {
      warm: '#d4a574',         // Refined gold
      cool: '#6b9b8f',         // Soft sage (replaces bright emerald)
    },
    border: '#333333',         // Subtle dividers
  },
  
  // Typography scale
  typography: {
    display: { size: '3.5rem', weight: 300, family: 'Playfair Display' },
    title: { size: '1.5rem', weight: 600, family: 'Inter' },
    body: { size: '1rem', weight: 400, family: 'Inter' },
    caption: { size: '0.85rem', weight: 500, family: 'Inter' },
  },

  // Spacing (8px base)
  spacing: {
    xs: '8px',
    sm: '16px',
    md: '24px',
    lg: '32px',
    xl: '48px',
    xxl: '64px',
  },

  // Motion
  motion: {
    fast: { duration: 0.3 },
    normal: { duration: 0.5 },
    slow: { duration: 0.8 },
  },
};

// ─── TYPES ───────────────────────────────────────────
interface Property {
  id: string;
  title: string;
  description: string;
  city: string;
  country: string;
  pricePerNight: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  photos: string[];
  type: string;
  avgRating: number;
  reviewCount: number;
  host: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    isVerified: boolean;
  };
}

interface SearchFilters {
  city?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
  type?: string;
  page?: number;
  limit?: number;
}

// ─── GLOBAL STYLES ───────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,600;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
    
    * {
      font-family: 'Inter', sans-serif;
    }

    .font-serif {
      font-family: 'Playfair Display', serif;
    }

    ::-webkit-scrollbar {
      width: 8px;
    }

    ::-webkit-scrollbar-thumb {
      background: ${DESIGN_SYSTEM.colors.accent.cool};
      opacity: 0.3;
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      opacity: 0.5;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    body {
      background: ${DESIGN_SYSTEM.colors.bg.primary};
      color: ${DESIGN_SYSTEM.colors.text.primary};
    }

    button:focus-visible {
      outline: 2px solid ${DESIGN_SYSTEM.colors.accent.warm};
      outline-offset: 2px;
    }

    input:focus-visible,
    select:focus-visible {
      outline: 2px solid ${DESIGN_SYSTEM.colors.accent.warm};
      outline-offset: 0;
    }
  `}</style>
);

// ─── HEADER/NAVIGATION ───────────────────────────────
const Header = () => (
  <motion.header 
    initial={{ y: -60 }}
    animate={{ y: 0 }}
    transition={DESIGN_SYSTEM.motion.normal}
    className="fixed top-0 left-0 w-full z-50 backdrop-blur-sm border-b"
    style={{
      backgroundColor: `${DESIGN_SYSTEM.colors.bg.primary}dd`,
      borderColor: DESIGN_SYSTEM.colors.border,
    }}
  >
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex justify-between items-center">
      <Link href="/" className="font-serif text-2xl font-light tracking-tight">
        Sundowner
      </Link>
      
      <nav className="hidden md:flex gap-12 text-sm font-medium">
        <Link href="/" style={{ color: DESIGN_SYSTEM.colors.text.secondary }} className="hover:text-white transition">
          Home
        </Link>
        <Link href="/properties" style={{ color: DESIGN_SYSTEM.colors.accent.warm }} className="transition">
          Properties
        </Link>
        <Link href="/experiences" style={{ color: DESIGN_SYSTEM.colors.text.secondary }} className="hover:text-white transition">
          Experiences
        </Link>
        <Link href="/about" style={{ color: DESIGN_SYSTEM.colors.text.secondary }} className="hover:text-white transition">
          About
        </Link>
      </nav>

      <Link href="/auth/login" className="px-6 py-2 font-medium text-sm transition border" style={{
        backgroundColor: DESIGN_SYSTEM.colors.accent.warm,
        color: DESIGN_SYSTEM.colors.bg.primary,
        borderColor: DESIGN_SYSTEM.colors.accent.warm,
      }}>
        Sign In
      </Link>
    </div>
  </motion.header>
);

// ─── HERO BANNER (IMAGE-FIRST) ───────────────────────
const HeroBanner = ({ property }: { property: Property | null }) => {
  if (!property) return null;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={DESIGN_SYSTEM.motion.slow}
      className="relative w-full h-screen md:h-125 overflow-hidden"
    >
      {/* Background Image - Hero */}
      <motion.img
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        src={property.photos[0]}
        alt={property.title}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Minimal overlay - just enough to read text */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to top, ${DESIGN_SYSTEM.colors.bg.primary}99 0%, transparent 40%)`
        }}
      />

      {/* Content - bottom-left, minimal */}
      <div className="absolute inset-0 flex flex-col justify-end">
        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full pb-16 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, ...DESIGN_SYSTEM.motion.normal }}
            className="max-w-2xl"
          >
            {/* Simple location + rating */}
            <div className="flex items-center gap-6 mb-8">
              <div style={{ color: DESIGN_SYSTEM.colors.text.secondary }} className="text-sm font-medium">
                {property.city}, {property.country}
              </div>
              <div className="w-px h-4" style={{ backgroundColor: DESIGN_SYSTEM.colors.border }} />
              <div className="flex items-center gap-2">
                <span style={{ color: DESIGN_SYSTEM.colors.accent.warm }}>★</span>
                <span style={{ color: DESIGN_SYSTEM.colors.text.secondary }} className="text-sm">
                  {property.avgRating.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Title only */}
            <h1 className="font-serif text-5xl md:text-6xl font-light leading-tight mb-8">
              {property.title}
            </h1>

            {/* Single CTA */}
            <Link href={`/properties/${property.id}`}>
              <motion.button
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 font-medium text-sm tracking-wide transition"
                style={{
                  backgroundColor: DESIGN_SYSTEM.colors.accent.warm,
                  color: DESIGN_SYSTEM.colors.bg.primary,
                }}
              >
                Explore Property
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

// ─── SEARCH BAR (SIMPLIFIED) ──────────────────────────
const SearchFilterBar = ({ onFilterChange }: { onFilterChange: (filters: SearchFilters) => void }) => {
  const [filters, setFilters] = useState<SearchFilters>({ page: 1, limit: 12 });

  const handleFilterChange = useCallback((key: string, value: any) => {
    const updated = { ...filters, [key]: value || undefined, page: 1 };
    setFilters(updated);
    onFilterChange(updated);
  }, [filters, onFilterChange]);

  const hasActiveFilters = Object.keys(filters).some(
    k => k !== 'page' && k !== 'limit' && filters[k as keyof SearchFilters]
  );

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={DESIGN_SYSTEM.motion.normal}
      className="max-w-7xl mx-auto px-6 md:px-12"
      style={{ paddingTop: DESIGN_SYSTEM.spacing.xxl, paddingBottom: DESIGN_SYSTEM.spacing.xl }}
    >
      {/* Search Grid - Simplified to 2 columns on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Location */}
        <div>
          <label className="text-xs font-medium mb-3 block" style={{ color: DESIGN_SYSTEM.colors.text.secondary }}>
            Location
          </label>
          <input
            type="text"
            placeholder="City or region"
            onChange={(e) => handleFilterChange('city', e.target.value)}
            className="w-full px-4 py-3 text-sm font-medium transition border"
            style={{
              backgroundColor: DESIGN_SYSTEM.colors.bg.secondary,
              borderColor: DESIGN_SYSTEM.colors.border,
              color: DESIGN_SYSTEM.colors.text.primary,
            }}
          />
        </div>

        {/* Price Range */}
        <div>
          <label className="text-xs font-medium mb-3 block" style={{ color: DESIGN_SYSTEM.colors.text.secondary }}>
            Price Range
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
              className="flex-1 px-4 py-3 text-sm font-medium transition border"
              style={{
                backgroundColor: DESIGN_SYSTEM.colors.bg.secondary,
                borderColor: DESIGN_SYSTEM.colors.border,
                color: DESIGN_SYSTEM.colors.text.primary,
              }}
            />
            <input
              type="number"
              placeholder="Max"
              onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
              className="flex-1 px-4 py-3 text-sm font-medium transition border"
              style={{
                backgroundColor: DESIGN_SYSTEM.colors.bg.secondary,
                borderColor: DESIGN_SYSTEM.colors.border,
                color: DESIGN_SYSTEM.colors.text.primary,
              }}
            />
          </div>
        </div>

        {/* Property Type */}
        <div>
          <label className="text-xs font-medium mb-3 block" style={{ color: DESIGN_SYSTEM.colors.text.secondary }}>
            Type
          </label>
          <select
            onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
            className="w-full px-4 py-3 text-sm font-medium transition border appearance-none"
            style={{
              backgroundColor: DESIGN_SYSTEM.colors.bg.secondary,
              borderColor: DESIGN_SYSTEM.colors.border,
              color: DESIGN_SYSTEM.colors.text.primary,
            }}
          >
            <option value="">All Types</option>
            <option value="VILLA">Villa</option>
            <option value="HOUSE">House</option>
            <option value="APARTMENT">Apartment</option>
            <option value="GUESTHOUSE">Guesthouse</option>
            <option value="SAFARI_LODGE">Safari Lodge</option>
            <option value="CAMP">Camp</option>
          </select>
        </div>

        {/* Guests */}
        <div>
          <label className="text-xs font-medium mb-3 block" style={{ color: DESIGN_SYSTEM.colors.text.secondary }}>
            Guests
          </label>
          <input
            type="number"
            placeholder="Any"
            min="1"
            onChange={(e) => handleFilterChange('guests', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-4 py-3 text-sm font-medium transition border"
            style={{
              backgroundColor: DESIGN_SYSTEM.colors.bg.secondary,
              borderColor: DESIGN_SYSTEM.colors.border,
              color: DESIGN_SYSTEM.colors.text.primary,
            }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <motion.button
          whileHover={{ opacity: 0.8 }}
          onClick={() => {
            setFilters({ page: 1, limit: 12 });
            onFilterChange({ page: 1, limit: 12 });
          }}
          disabled={!hasActiveFilters}
          className="px-6 py-3 text-sm font-medium transition border"
          style={{
            borderColor: hasActiveFilters ? DESIGN_SYSTEM.colors.border : DESIGN_SYSTEM.colors.border,
            color: hasActiveFilters ? DESIGN_SYSTEM.colors.accent.warm : DESIGN_SYSTEM.colors.text.secondary,
            opacity: hasActiveFilters ? 1 : 0.5,
          }}
        >
          Clear Filters
        </motion.button>
      </div>
    </motion.section>
  );
};

// ─── PROPERTY CARD (IMAGE-DOMINANT) ────────────────
const PropertyCard = ({ property, index }: { property: Property; index: number }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay: index * 0.05, ...DESIGN_SYSTEM.motion.normal }}
    >
      <Link href={`/properties/${property.id}`}>
        <div
          className="group cursor-pointer overflow-hidden border transition-all duration-500"
          style={{
            borderColor: isHovered ? DESIGN_SYSTEM.colors.accent.warm : DESIGN_SYSTEM.colors.border,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Image - 70% of card */}
          <div className="relative h-96 overflow-hidden bg-black">
            <motion.img
              src={property.photos[0]}
              alt={property.title}
              className="w-full h-full object-cover"
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.6 }}
              onLoad={() => setImageLoaded(true)}
            />

            {/* Minimal overlay on hover - rating */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 backdrop-blur-sm"
                  style={{
                    backgroundColor: `${DESIGN_SYSTEM.colors.bg.primary}cc`,
                    border: `1px solid ${DESIGN_SYSTEM.colors.border}`,
                  }}
                >
                  <span style={{ color: DESIGN_SYSTEM.colors.accent.warm }}>★</span>
                  <span className="text-sm font-medium">{property.avgRating.toFixed(1)}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Content - Minimal, clean */}
          <div className="p-8 space-y-6">
            {/* Meta */}
            <div className="space-y-2">
              <p style={{ color: DESIGN_SYSTEM.colors.text.secondary }} className="text-xs font-medium">
                {property.city} • {property.country}
              </p>
              <h3 className="font-serif text-xl font-light leading-snug">
                {property.title}
              </h3>
            </div>

            {/* Specs - Horizontal, clean */}
            <div className="flex gap-8 pt-4" style={{ borderTop: `1px solid ${DESIGN_SYSTEM.colors.border}` }}>
              <div>
                <p style={{ color: DESIGN_SYSTEM.colors.text.secondary }} className="text-xs font-medium mb-1">
                  Bedrooms
                </p>
                <p className="text-lg font-light">{property.bedrooms}</p>
              </div>
              <div>
                <p style={{ color: DESIGN_SYSTEM.colors.text.secondary }} className="text-xs font-medium mb-1">
                  Bathrooms
                </p>
                <p className="text-lg font-light">{property.bathrooms}</p>
              </div>
              <div>
                <p style={{ color: DESIGN_SYSTEM.colors.text.secondary }} className="text-xs font-medium mb-1">
                  Guests
                </p>
                <p className="text-lg font-light">{property.maxGuests}</p>
              </div>
            </div>

            {/* Price - Bold accent */}
            <div className="pt-4" style={{ borderTop: `1px solid ${DESIGN_SYSTEM.colors.border}` }}>
              <p style={{ color: DESIGN_SYSTEM.colors.text.secondary }} className="text-xs font-medium mb-2">
                Starting from
              </p>
              <p className="font-serif text-2xl font-light" style={{ color: DESIGN_SYSTEM.colors.accent.warm }}>
                KES {(property.pricePerNight / 1000).toFixed(1)}K
              </p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

// ─── LOADING SKELETON ─────────────────────────────────
const PropertyCardSkeleton = () => (
  <div className="space-y-4" style={{ backgroundColor: DESIGN_SYSTEM.colors.bg.secondary }}>
    <div className="h-96 animate-pulse" style={{ backgroundColor: DESIGN_SYSTEM.colors.border }} />
    <div className="p-8 space-y-4">
      <div className="h-3 w-1/2 animate-pulse" style={{ backgroundColor: DESIGN_SYSTEM.colors.border }} />
      <div className="h-6 w-full animate-pulse" style={{ backgroundColor: DESIGN_SYSTEM.colors.border }} />
      <div className="h-12 w-1/3 animate-pulse" style={{ backgroundColor: DESIGN_SYSTEM.colors.border }} />
    </div>
  </div>
);

// ─── MAIN COMPONENT ──────────────────────────────────
export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [featured, setFeatured] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [error, setError] = useState<string | null>(null);

  // Fetch featured property
  useEffect(() => {
    const getFeatured = async () => {
      try {
        const response = await searchApi.getFeatured();
        if (response.data && response.data.length > 0) {
          setFeatured(response.data[0]);
        }
      } catch (err) {
        console.error('Error fetching featured:', err);
      }
    };
    getFeatured();
  }, []);

  // Fetch properties with debounce
  useEffect(() => {
    const getProperties = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await searchApi.search(filters);
        setProperties(response.data.results || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load properties');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(getProperties, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  return (
    <main style={{ backgroundColor: DESIGN_SYSTEM.colors.bg.primary }}>
      <GlobalStyles />
      <Header />
      <div className="h-20" />

      {/* Hero Banner */}
      {featured && <HeroBanner property={featured} />}

      {/* Search & Filter Bar */}
      <SearchFilterBar onFilterChange={setFilters} />

      {/* Properties Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-12" style={{ paddingTop: DESIGN_SYSTEM.spacing.xl, paddingBottom: DESIGN_SYSTEM.spacing.xxl }}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="font-serif text-4xl font-light mb-4">
            Explore Properties
          </h2>
          <p style={{ color: DESIGN_SYSTEM.colors.text.secondary }} className="text-sm font-medium">
            {loading ? 'Loading...' : `${properties.length} luxury properties`}
          </p>
        </motion.div>

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 p-6 border" 
              style={{
                borderColor: '#dc2626',
                backgroundColor: `#7f1d1d33`,
              }}
            >
              <p className="font-medium mb-2">Error Loading Properties</p>
              <p style={{ color: DESIGN_SYSTEM.colors.text.secondary }} className="text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Grid */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Properties Grid */}
        {!loading && properties.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={DESIGN_SYSTEM.motion.normal}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {properties.map((property, index) => (
              <PropertyCard key={property.id} property={property} index={index} />
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && properties.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <p style={{ color: DESIGN_SYSTEM.colors.text.secondary }} className="text-lg font-medium mb-4">
              No properties found
            </p>
            <p style={{ color: DESIGN_SYSTEM.colors.text.muted }} className="text-sm mb-8 max-w-md mx-auto">
              Try adjusting your filters
            </p>
            <motion.button
              whileHover={{ opacity: 0.8 }}
              onClick={() => setFilters({})}
              className="px-6 py-3 text-sm font-medium border transition"
              style={{
                borderColor: DESIGN_SYSTEM.colors.accent.warm,
                color: DESIGN_SYSTEM.colors.accent.warm,
              }}
            >
              Clear Filters
            </motion.button>
          </motion.div>
        )}
      </section>

      {/* Footer */}
      <footer
        className="text-center text-sm font-medium py-16 border-t"
        style={{
          borderColor: DESIGN_SYSTEM.colors.border,
          color: DESIGN_SYSTEM.colors.text.secondary,
        }}
      >
        <p>Discover luxury stays across Africa</p>
      </footer>
    </main>
  );
}