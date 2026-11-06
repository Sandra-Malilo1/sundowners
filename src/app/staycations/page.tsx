"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
  useScroll,
} from "framer-motion";
import { createClient } from "@/lib/supabase";
import {
  MapPin,
  Star,
  Bed,
  Users,
  Heart,
  ArrowRight,
  Search,
  ShieldCheck,
  Bath,
  X,
  Menu,
  Home,
  DollarSign,
  ChevronDown,
} from "lucide-react";

interface StayProperty {
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
    isVerified: boolean;
  };
  amenities: string[];
}

interface SearchFilters {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
  type?: string;
}

const FALLBACK_PROPERTIES: StayProperty[] = [];

async function fetchStayProperties(): Promise<StayProperty[]> {
  const supabase = createClient();

  const { data: listings, error } = await supabase
    .from("listings")
    .select(
      `
      id,
      title,
      description,
      location_text,
      base_price,
      currency,
      type,
      rating_average,
      review_count,
      owner_id,
      properties (
        id,
        bedrooms,
        bathrooms,
        max_guests,
        profiles (
          id,
          full_name,
          verification_status
        )
      )
    `
    )
    .eq("type", "stay")
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("rating_average", { ascending: false })
    .limit(24);

  if (error) {
    console.error("Failed to load stays:", error.message);
    return [];
  }

  if (!listings || listings.length === 0) {
    return [];
  }

  const listingIds = listings.map(
    (listing: { id: string }) => listing.id
  );

  const { data: images } = await supabase
    .from("listing_images")
    .select("listing_id, url, sort_order, is_cover")
    .in("listing_id", listingIds)
    .order("sort_order", { ascending: true });

  const propertyIds = listings
    .map(
      (listing: any) =>
        listing.properties?.[0]?.id as string | undefined
    )
    .filter((id: any): id is string => Boolean(id));

  const { data: propertyAmenities } = await supabase
    .from("property_amenities")
    .select(
      `
      property_id,
      amenities (
        name
      )
    `
    )
    .in("property_id", propertyIds);

  const imagesByListing = new Map<string, string[]>();
  const amenitiesByProperty = new Map<string, string[]>();

  for (const image of images ?? []) {
    const current = imagesByListing.get(image.listing_id) ?? [];
    current.push(image.url);
    imagesByListing.set(image.listing_id, current);
  }

  for (const item of propertyAmenities ?? []) {
    const current =
      amenitiesByProperty.get(item.property_id) ?? [];

    if (item.amenities?.[0]?.name) {
      current.push(item.amenities[0].name);
    }

    amenitiesByProperty.set(item.property_id, current);
  }

  return listings.map((listing: any) => {
    const property = listing.properties?.[0];
    const fullName = property?.profiles?.full_name ?? "Host";
    const nameParts = fullName.split(" ");

    return {
      id: listing.id,
      title: listing.title,
      description: listing.description ?? "",
      city: listing.location_text ?? "",
      country: "",
      pricePerNight: Number(listing.base_price),
      bedrooms: property?.bedrooms ?? 0,
      bathrooms: Number(property?.bathrooms ?? 0),
      maxGuests: property?.max_guests ?? 1,
      photos: imagesByListing.get(listing.id) ?? [
        "/placeholder-property.jpg",
      ],
      type: listing.type,
      avgRating: Number(listing.rating_average),
      reviewCount: listing.review_count ?? 0,
      host: {
        id: property?.profiles?.id ?? listing.owner_id,
        firstName: nameParts[0] ?? "Host",
        lastName: nameParts.slice(1).join(" "),
        isVerified:
          property?.profiles?.verification_status === "verified",
      },
      amenities:
        amenitiesByProperty.get(property?.id) ?? [],
    };
  });
}

const fmt = (n: number) =>
  n >= 1000
    ? `${(n / 1000).toFixed(0)}K`
    : n.toString();

const TYPE_LABELS: Record<string, string> = {
  VILLA: "Villa",
  HOUSE: "House",
  APARTMENT: "Apartment",
  GUESTHOUSE: "Guesthouse",
  SAFARI_LODGE: "Lodge",
  CAMP: "Camp",
};

const AMENITY_ICONS: Record<
  string,
  { icon: string; label: string }
> = {
  pool: { icon: "⬡", label: "Pool" },
  wifi: { icon: "⬡", label: "WiFi" },
  kitchen: { icon: "⬡", label: "Kitchen" },
  parking: { icon: "⬡", label: "Parking" },
  ac: { icon: "⬡", label: "A/C" },
  gym: { icon: "⬡", label: "Gym" },
  garden: { icon: "⬡", label: "Garden" },
  view: { icon: "⬡", label: "View" },
};

const PROPERTY_AMENITIES: Record<string, string[]> = {
  "1": ["pool", "view", "garden", "wifi", "parking"],
  "2": ["pool", "gym", "wifi", "ac", "parking"],
  "3": ["wifi", "kitchen", "view", "garden"],
  "4": ["pool", "view", "wifi", "ac"],
  "5": ["pool", "parking", "garden", "wifi", "gym"],
  "6": ["pool", "wifi", "kitchen", "ac", "garden"],
  "7": ["view", "wifi", "garden"],
  "8": ["view", "pool", "wifi", "parking"],
  "9": ["view", "wifi", "kitchen", "garden"],
};

function Section3D({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.92", "start 0.25"],
  });

  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [22, 0]),
    { stiffness: 80, damping: 18 }
  );

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.45],
    [0, 1]
  );

  const y = useSpring(
    useTransform(scrollYProgress, [0, 1], [50, 0]),
    { stiffness: 80, damping: 18 }
  );

  return (
    <div ref={ref} style={{ perspective: "1200px" }}>
      <motion.div
        style={{
          rotateX,
          opacity,
          y,
          transformOrigin: "top center",
        }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  );
}

const Header = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () =>
      window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      className="fixed top-0 left-0 w-full z-50 transition-all duration-500"
      style={{
        background: scrolled
          ? "rgba(5,16,9,0.92)"
          : "transparent",
        backdropFilter: scrolled ? "blur(24px)" : "none",
        borderBottom: scrolled
          ? "1px solid rgba(163,191,174,0.07)"
          : "none",
      }}
    >
      <div className="max-w-[1440px] mx-auto px-8 md:px-16 py-5 flex justify-between items-center">
        <a href="/" className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full border border-emerald-400/60 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>

          <span
            className="font-serif font-bold text-lg text-white"
            style={{
              fontFamily: "'Playfair Display', serif",
            }}
          >
            <span className="text-emerald-400">Love</span>
            Africa
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-10">
          {[
            { label: "Properties", active: true },
            { label: "Experiences" },
            { label: "How It Works" },
            { label: "About" },
          ].map((item) => (
            <a
              key={item.label}
              href={`/${item.label
                .toLowerCase()
                .replace(/\s/g, "-")}`}
              className={`nav-link ${
                item.active ? "active" : ""
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <a
            href="/host"
            className="hidden md:block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40 hover:text-white transition"
          >
            Become a Host
          </a>

          <a
            href="/auth/login"
            className="hidden md:block px-5 py-2 text-[10px] font-bold uppercase tracking-[0.15em] border border-emerald-400/50 text-emerald-400 hover:bg-emerald-400 hover:text-[#051009] transition-all duration-300 rounded-sm"
          >
            Sign In
          </a>

          <button
            className="md:hidden text-white/60 hover:text-emerald-400 transition"
            onClick={() => setOpen(!open)}
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              background: "rgba(5,16,9,0.96)",
              backdropFilter: "blur(24px)",
            }}
            className="md:hidden px-8 py-6 flex flex-col gap-5 border-b border-white/5"
          >
            {[
              "Properties",
              "Experiences",
              "How It Works",
              "About",
            ].map((item) => (
              <a
                key={item}
                href={`/${item
                  .toLowerCase()
                  .replace(/\s/g, "-")}`}
                className="text-sm uppercase tracking-widest font-medium text-white/60 hover:text-emerald-400 transition"
              >
                {item}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

const HeroBanner = ({
  property,
}: {
  property: StayProperty;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const imgY = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", "28%"]
  );

  const textY = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", "45%"]
  );

  const fade = useTransform(
    scrollYProgress,
    [0, 0.55],
    [1, 0]
  );

  return (
    <section
      ref={ref}
      className="relative w-full h-screen min-h-[800px] bg-[#051009] overflow-hidden"
    >
      <motion.div
        className="absolute inset-0 scale-110"
        style={{ y: imgY }}
      >
        <img
          src={property.photos[0]}
          alt={property.title}
          className="w-full h-full object-cover"
        />
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-t from-[#051009] via-[#051009]/35 to-[#051009]/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#051009]/75 via-transparent to-transparent" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(5,16,9,0.55) 100%)",
        }}
      />

      <motion.div
        style={{ y: textY, opacity: fade }}
        className="absolute inset-0 flex flex-col justify-end"
      >
        <div className="max-w-[1440px] mx-auto px-8 md:px-16 pb-24 md:pb-32 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.3,
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex items-center gap-4 mb-8"
          >
            <div className="w-8 h-px bg-emerald-400/60" />

            <span className="text-[9px] uppercase tracking-[0.28em] text-emerald-400/80 font-semibold">
              Tonight&apos;s Featured Stay
            </span>

            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full"
              style={{
                background: "rgba(52,211,153,0.08)",
                border: "1px solid rgba(52,211,153,0.14)",
              }}
            >
              <Star
                className="fill-emerald-400 text-emerald-400"
                size={10}
              />

              <span className="text-white/80 text-[10px] font-semibold">
                {property.avgRating}
              </span>

              <span className="text-white/30 text-[10px]">
                · {property.reviewCount} reviews
              </span>
            </div>
          </motion.div>

          <div className="overflow-hidden mb-6">
            <motion.h1
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{
                delay: 0.4,
                duration: 1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="font-serif font-bold text-white leading-[0.9] tracking-tight"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(3.5rem, 9vw, 8rem)",
              }}
            >
              {property.title}
            </motion.h1>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-wrap items-center gap-6 mb-10"
          >
            <div className="flex items-center gap-2">
              <MapPin
                className="text-emerald-400/60"
                size={13}
              />

              <span className="text-white/50 text-sm font-light">
                {property.city}, {property.country}
              </span>
            </div>

            <div className="w-px h-3 bg-white/10" />

            <span className="text-white/30 text-[10px] uppercase tracking-[0.18em]">
              {TYPE_LABELS[property.type] ?? property.type}
            </span>

            <div className="w-px h-3 bg-white/10" />

            <span className="text-white/30 text-[10px] uppercase tracking-[0.18em]">
              Up to {property.maxGuests} guests
            </span>

            <div className="w-px h-3 bg-white/10" />

            <span
              className="font-serif text-emerald-400 font-semibold text-lg"
              style={{
                fontFamily: "'Playfair Display', serif",
              }}
            >
              KES {fmt(property.pricePerNight)}
              <span className="text-white/30 text-xs font-normal ml-1">
                / night
              </span>
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.7 }}
            className="flex items-center gap-5"
          >
            <motion.a
              href={`/staycation/${property.id}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-3 px-9 py-4 bg-emerald-400 hover:bg-emerald-300 text-[#051009] font-bold text-[10px] uppercase tracking-[0.2em] rounded-sm transition-all duration-300"
            >
              View Property <ArrowRight size={13} />
            </motion.a>

            <a
              href="#browse"
              className="text-white/40 hover:text-white text-[10px] uppercase tracking-[0.18em] font-semibold transition flex items-center gap-2"
            >
              Browse all <ArrowRight size={11} />
            </a>
          </motion.div>
        </div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 py-4 px-8 md:px-16 flex justify-between items-center border-t border-white/5">
        <span className="text-white/15 text-[9px] uppercase tracking-[0.25em]">
          LoveAfrica · Premium Stays
        </span>

        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="text-white/20 text-[9px] uppercase tracking-widest"
        >
          ↓ scroll
        </motion.div>
      </div>
    </section>
  );
};

const NumbersRow = () => (
  <Section3D className="py-16 border-b border-white/4">
    <div className="max-w-[1440px] mx-auto px-8 md:px-16">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { n: "200+", sub: "Verified Properties" },
          { n: "4.9", sub: "Average Guest Rating" },
          { n: "50K+", sub: "Happy Guests" },
          { n: "9+", sub: "Countries" },
        ].map((item, i) => (
          <motion.div
            key={item.sub}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              delay: i * 0.1,
              duration: 0.6,
            }}
            className="text-center md:text-left"
          >
            <p
              className="font-serif font-bold text-white"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(2rem, 4vw, 3.5rem)",
              }}
            >
              {item.n}
            </p>

            <p className="text-white/25 text-[10px] uppercase tracking-[0.2em] mt-1">
              {item.sub}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  </Section3D>
);

function PerspectiveCard({
  property,
  index,
}: {
  property: StayProperty;
  index: number;
}) {
  const [fav, setFav] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const ry = useSpring(
    useTransform(mx, [-0.5, 0.5], [-10, 10]),
    { stiffness: 260, damping: 24 }
  );

  const rx = useSpring(
    useTransform(my, [-0.5, 0.5], [7, -7]),
    { stiffness: 260, damping: 24 }
  );

  const glowX = useTransform(
    mx,
    [-0.5, 0.5],
    ["0%", "100%"]
  );

  const glowY = useTransform(
    my,
    [-0.5, 0.5],
    ["0%", "100%"]
  );

  const onMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();

    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const isTall = index === 0 || index === 3;

  const amenities = (
    PROPERTY_AMENITIES[property.id] ?? ["wifi", "pool"]
  ).slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        delay: index * 0.07,
        duration: 0.75,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`group ${isTall ? "row-span-2" : ""}`}
      style={{ perspective: "700px" }}
    >
      <motion.div
        ref={cardRef}
        style={{
          rotateX: rx,
          rotateY: ry,
          transformStyle: "preserve-3d",
          background: "rgba(8,20,12,0.6)",
          border: "1px solid rgba(163,191,174,0.12)",
        }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        whileHover={{
          scale: 1.025,
          boxShadow:
            "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(52,211,153,0.12)",
        }}
        transition={{
          type: "spring",
          stiffness: 220,
          damping: 26,
        }}
        className="relative overflow-hidden rounded-2xl h-full cursor-pointer"
      >
        <motion.div
          className="absolute inset-0 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at ${glowX} ${glowY}, rgba(52,211,153,0.08) 0%, transparent 60%)`,
          }}
        />

        <a
          href={`/staycation/${property.id}`}
          className={`block relative overflow-hidden ${
            isTall ? "h-64 md:h-80" : "h-44"
          }`}
        >
          <motion.img
            src={property.photos[0]}
            alt={property.title}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.07 }}
            transition={{
              duration: 0.9,
              ease: [0.22, 1, 0.36, 1],
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#051009]/80 via-[#051009]/10 to-transparent" />

          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <span className="glass-light px-2.5 py-1 rounded-full type-tag">
              {TYPE_LABELS[property.type] ?? property.type}
            </span>

            <motion.button
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.88 }}
              onClick={(e) => {
                e.preventDefault();
                setFav(!fav);
              }}
              className="glass-light w-8 h-8 rounded-full flex items-center justify-center"
            >
              <Heart
                size={12}
                fill={fav ? "#f87171" : "none"}
                className={
                  fav ? "text-red-400" : "text-white/45"
                }
              />
            </motion.button>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
            <div className="flex items-center gap-1 glass-light px-2 py-0.5 rounded-full">
              <Star
                className="fill-emerald-400 text-emerald-400"
                size={9}
              />

              <span className="text-white text-[10px] font-semibold">
                {property.avgRating}
              </span>

              <span className="text-white/30 text-[9px]">
                ({property.reviewCount})
              </span>
            </div>

            <div className="glass-light px-2.5 py-1 rounded-full">
              <span
                className="font-serif text-emerald-400 font-bold text-[13px]"
                style={{
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                KES {fmt(property.pricePerNight)}
              </span>

              <span className="text-white/28 text-[8px] ml-1">
                /night
              </span>
            </div>
          </div>
        </a>

        <div
          className="p-5"
          style={{
            transform: "translateZ(14px)",
            transformStyle: "preserve-3d",
          }}
        >
          <a
            href={`/staycation/${property.id}`}
            className="block"
          >
            <p className="text-emerald-400/55 text-[8px] uppercase tracking-[0.18em] font-bold mb-1.5">
              {property.city} · {property.country}
            </p>

            <h4
              className="font-serif font-bold text-white leading-snug mb-3 group-hover:text-emerald-400/90 transition-colors duration-300"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: isTall ? "1.15rem" : "1rem",
              }}
            >
              {property.title}
            </h4>
          </a>

          <div className="flex items-center gap-3 text-white/25 text-[10px] mb-3">
            <div className="flex items-center gap-1">
              <Bed size={10} />
              <span>{property.bedrooms} bed</span>
            </div>

            <div className="flex items-center gap-1">
              <Users size={10} />
              <span>{property.maxGuests} guests</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/5">
            {amenities.map((key) => {
              const amenity = AMENITY_ICONS[key];

              if (!amenity) return null;

              return (
                <span
                  key={key}
                  className="px-2 py-1 rounded-md text-[9px] text-white/32"
                  style={{
                    background:
                      "rgba(52,211,153,0.05)",
                    border:
                      "1px solid rgba(52,211,153,0.08)",
                  }}
                >
                  {amenity.label}
                </span>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const PerspectiveShowcase = ({
  properties,
}: {
  properties: StayProperty[];
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const gridRotateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [-28, 0]),
    { stiffness: 60, damping: 20 }
  );

  const gridScale = useSpring(
    useTransform(scrollYProgress, [0, 1], [0.88, 1]),
    { stiffness: 60, damping: 20 }
  );

  const gridOpacity = useTransform(
    scrollYProgress,
    [0, 0.3],
    [0, 1]
  );

  return (
    <section ref={ref} className="py-20 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-8 md:px-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-14"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-px bg-emerald-400/60" />

              <span className="text-[9px] uppercase tracking-[0.28em] text-emerald-400/70 font-semibold">
                Featured Collection
              </span>
            </div>

            <h2
              className="font-serif font-bold text-white leading-[0.95]"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
              }}
            >
              Properties worth
              <br />
              <em className="text-emerald-400 not-italic">
                every penny
              </em>
            </h2>
          </div>

          <a
            href="#browse"
            className="hidden md:flex items-center gap-2 text-white/25 hover:text-emerald-400 text-[10px] uppercase tracking-widest font-semibold transition"
          >
            See all <ArrowRight size={11} />
          </a>
        </motion.div>

        <div
          style={{
            perspective: "1100px",
            perspectiveOrigin: "50% 30%",
          }}
        >
          <motion.div
            style={{
              rotateX: gridRotateX,
              scale: gridScale,
              opacity: gridOpacity,
              transformStyle: "preserve-3d",
            }}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[220px]">
              {properties.map((property, index) => (
                <PerspectiveCard
                  key={property.id}
                  property={property}
                  index={index}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const CinematicCard = ({
  property,
  index,
}: {
  property: StayProperty;
  index: number;
}) => {
  const [fav, setFav] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-12, 12]),
    { stiffness: 200, damping: 22 }
  );

  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [8, -8]),
    { stiffness: 200, damping: 22 }
  );

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();

    mouseX.set(
      (e.clientX - rect.left) / rect.width - 0.5
    );
    mouseY.set(
      (e.clientY - rect.top) / rect.height - 0.5
    );
  };

  const onLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const amenities =
    PROPERTY_AMENITIES[property.id] ?? ["wifi", "pool"];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        delay: index * 0.05,
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="shrink-0 w-[340px] md:w-[400px] group"
      style={{ perspective: "800px" }}
    >
      <a
        href={`/staycation/${property.id}`}
        className="block"
      >
        <motion.div
          ref={ref}
          style={{
            rotateY,
            rotateX,
            transformStyle: "preserve-3d",
          }}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          whileHover={{ scale: 1.02 }}
          transition={{
            type: "spring",
            stiffness: 250,
            damping: 28,
          }}
        >
          <div
            className="relative h-[480px] md:h-[540px] rounded-2xl overflow-hidden mb-5 bg-[#051009]"
            style={{ transformStyle: "preserve-3d" }}
          >
            <motion.img
              src={property.photos[0]}
              alt={property.title}
              className="w-full h-full object-cover"
              onLoad={() => setLoaded(true)}
              whileHover={{ scale: 1.06 }}
              transition={{
                duration: 0.9,
                ease: [0.22, 1, 0.36, 1],
              }}
            />

            {!loaded && (
              <div className="absolute inset-0 shimmer" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#051009]/90 via-[#051009]/10 to-transparent" />

            <div className="absolute top-5 left-5 right-5 flex justify-between items-start">
              <span className="glass-light px-3 py-1 rounded-full type-tag">
                {TYPE_LABELS[property.type] ??
                  property.type}
              </span>

              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.preventDefault();
                  setFav(!fav);
                }}
                className="glass-light w-9 h-9 rounded-full flex items-center justify-center"
              >
                <Heart
                  size={14}
                  fill={fav ? "#f87171" : "none"}
                  className={
                    fav
                      ? "text-red-400"
                      : "text-white/50"
                  }
                />
              </motion.button>
            </div>

            <div className="absolute bottom-5 left-5 flex items-center gap-1.5 glass-light px-2.5 py-1 rounded-full">
              <Star
                className="fill-emerald-400 text-emerald-400"
                size={10}
              />

              <span className="text-white text-[11px] font-semibold">
                {property.avgRating}
              </span>

              <span className="text-white/35 text-[10px]">
                ({property.reviewCount})
              </span>
            </div>

            <div className="absolute bottom-5 right-5 glass-light px-3 py-1.5 rounded-full">
              <span
                className="font-serif text-emerald-400 font-bold text-sm"
                style={{
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                KES {fmt(property.pricePerNight)}
              </span>

              <span className="text-white/30 text-[9px] ml-1">
                /night
              </span>
            </div>

            <div
              className="absolute -bottom-4 inset-x-10 h-6 blur-xl rounded-full opacity-50"
              style={{
                background: "rgba(52,211,153,0.1)",
                transform: "translateZ(-20px)",
              }}
            />
          </div>

          <div
            className="px-1"
            style={{
              transform: "translateZ(15px)",
              transformStyle: "preserve-3d",
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MapPin
                    className="text-emerald-400/50 shrink-0"
                    size={10}
                  />

                  <span className="text-emerald-400/60 text-[9px] uppercase tracking-[0.18em] font-bold">
                    {property.city} · {property.country}
                  </span>
                </div>

                <h3
                  className="font-serif font-bold text-white text-xl leading-snug group-hover:text-emerald-400 transition-colors duration-300 pr-4"
                  style={{
                    fontFamily:
                      "'Playfair Display', serif",
                  }}
                >
                  {property.title}
                </h3>
              </div>

              <motion.div
                whileHover={{ x: 3 }}
                className="w-8 h-8 rounded-full border border-emerald-400/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-400 group-hover:text-[#051009] group-hover:border-transparent transition-all duration-300 shrink-0 mt-1"
              >
                <ArrowRight size={12} />
              </motion.div>
            </div>

            <div className="flex items-center gap-4 text-white/30 text-xs mb-4">
              <div className="flex items-center gap-1.5">
                <Bed size={11} />
                <span>{property.bedrooms} bed</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Bath size={11} />
                <span>{property.bathrooms} bath</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Users size={11} />
                <span>{property.maxGuests} guests</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5">
              <p className="text-[8px] uppercase tracking-[0.18em] text-white/18 font-semibold mb-2">
                Amenities
              </p>

              <div className="flex flex-wrap gap-1.5">
                {amenities.map((key) => {
                  const amenity = AMENITY_ICONS[key];

                  if (!amenity) return null;

                  return (
                    <span
                      key={key}
                      className="px-2.5 py-1 rounded-lg text-[10px] text-white/35 font-medium"
                      style={{
                        background:
                          "rgba(52,211,153,0.05)",
                        border:
                          "1px solid rgba(52,211,153,0.09)",
                      }}
                    >
                      {amenity.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </a>
    </motion.div>
  );
};

const HorizontalScroll = ({
  properties,
}: {
  properties: StayProperty[];
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const check = () => {
    const element = ref.current;

    if (!element) return;

    setCanScrollLeft(element.scrollLeft > 10);
    setCanScrollRight(
      element.scrollLeft <
        element.scrollWidth - element.clientWidth - 10
    );
  };

  const scroll = (direction: "left" | "right") => {
    ref.current?.scrollBy({
      left: direction === "right" ? 440 : -440,
      behavior: "smooth",
    });
  };

  return (
    <Section3D className="py-20 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-8 md:px-16">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-px bg-emerald-400/60" />

              <span className="text-[9px] uppercase tracking-[0.28em] text-emerald-400/70 font-semibold">
                Top Picks
              </span>
            </div>

            <h2
              className="font-serif font-bold text-white leading-[0.95]"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
              }}
            >
              Stays guests
              <br />
              <em className="text-emerald-400 not-italic">
                love most
              </em>
            </h2>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:border-emerald-400/40 hover:text-emerald-400 disabled:opacity-20 transition"
            >
              <ArrowRight
                size={14}
                className="rotate-180"
              />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:border-emerald-400/40 hover:text-emerald-400 disabled:opacity-20 transition"
            >
              <ArrowRight size={14} />
            </motion.button>
          </div>
        </div>
      </div>

      <div
        ref={ref}
        onScroll={check}
        className="flex gap-6 overflow-x-auto pb-4 cursor-grab active:cursor-grabbing"
        style={{
          paddingLeft:
            "max(2rem, calc((100vw - 1440px)/2 + 4rem))",
          paddingRight:
            "max(2rem, calc((100vw - 1440px)/2 + 4rem))",
          scrollbarWidth: "none",
        }}
      >
        {properties.map((property, index) => (
          <CinematicCard
            key={property.id}
            property={property}
            index={index}
          />
        ))}
      </div>
    </Section3D>
  );
};

const HowItWorks = () => (
  <Section3D className="border-y border-white/4 py-24">
    <div className="max-w-[1440px] mx-auto px-8 md:px-16">
      <div className="mb-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-px bg-emerald-400/60" />

          <span className="text-[9px] uppercase tracking-[0.28em] text-emerald-400/70 font-semibold">
            Simple Process
          </span>
        </div>

        <h2
          className="font-serif font-bold text-white"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
          }}
        >
          How it works
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
        {[
          {
            n: "01",
            title: "Search & Filter",
            body: "Browse verified stays by location, price, type, and dates. Real-time availability, no hidden fees.",
            icon: (
              <Search
                size={22}
                className="text-emerald-400"
              />
            ),
          },
          {
            n: "02",
            title: "Book Instantly",
            body: "Secure your stay in seconds with instant confirmation. Flexible cancellation on most properties.",
            icon: (
              <ShieldCheck
                size={22}
                className="text-emerald-400"
              />
            ),
          },
          {
            n: "03",
            title: "Check In & Enjoy",
            body: "Get access details directly from your host. Our 24/7 support team is always a message away.",
            icon: (
              <Home
                size={22}
                className="text-emerald-400"
              />
            ),
          },
        ].map((step) => (
          <motion.div
            key={step.n}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              delay: Number(step.n) * 0.14,
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  background:
                    "rgba(52,211,153,0.08)",
                  border:
                    "1px solid rgba(52,211,153,0.14)",
                }}
              >
                {step.icon}
              </div>

              <span
                className="font-serif text-5xl font-bold text-white/5"
                style={{
                  fontFamily:
                    "'Playfair Display', serif",
                }}
              >
                {step.n}
              </span>
            </div>

            <h3 className="font-semibold text-white text-lg mb-3">
              {step.title}
            </h3>

            <p className="text-white/30 text-sm leading-relaxed">
              {step.body}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  </Section3D>
);

const FilterBar = ({
  onFilterChange,
}: {
  onFilterChange: (filters: SearchFilters) => void;
}) => {
  const [filters, setFilters] =
    useState<SearchFilters>({});

  const handleChange = useCallback(
    (
      key: keyof SearchFilters,
      value: string | number | undefined
    ) => {
      const nextFilters = {
        ...filters,
        [key]: value || undefined,
      };

      setFilters(nextFilters);
      onFilterChange(nextFilters);
    },
    [filters, onFilterChange]
  );

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const hasActiveFilters = Object.values(
    filters
  ).some(Boolean);

  return (
    <Section3D className="max-w-[1440px] mx-auto px-8 md:px-16 py-10">
      <div
        className="glass rounded-2xl p-1"
        style={{
          border: "1px solid rgba(52,211,153,0.11)",
          boxShadow:
            "0 0 0 1px rgba(52,211,153,0.04), 0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        <div className="flex flex-col lg:flex-row">
          {[
            {
              key: "city",
              label: "Location",
              placeholder: "City or country",
              type: "text",
              icon: (
                <MapPin
                  size={14}
                  className="text-emerald-400/50"
                />
              ),
            },
            {
              key: "minPrice",
              label: "Min Price",
              placeholder: "No minimum",
              type: "number",
              icon: (
                <DollarSign
                  size={14}
                  className="text-emerald-400/50"
                />
              ),
            },
            {
              key: "maxPrice",
              label: "Max Price",
              placeholder: "No maximum",
              type: "number",
              icon: (
                <DollarSign
                  size={14}
                  className="text-emerald-400/50"
                />
              ),
            },
            {
              key: "guests",
              label: "Guests",
              placeholder: "Any",
              type: "number",
              icon: (
                <Users
                  size={14}
                  className="text-emerald-400/50"
                />
              ),
            },
          ].map((field, index) => (
            <React.Fragment key={field.key}>
              {index > 0 && (
                <div className="divider-v hidden lg:block" />
              )}

              <div className="h-px lg:hidden bg-white/4 mx-4" />

              <div className="flex-1 flex items-center gap-3 px-5 py-4">
                {field.icon}

                <div className="flex-1 min-w-0">
                  <label className="block text-[8px] uppercase tracking-[0.2em] text-emerald-400/50 mb-0.5 font-bold">
                    {field.label}
                  </label>

                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={
                      (filters[
                        field.key as keyof SearchFilters
                      ] as string | number) || ""
                    }
                    onChange={(e) =>
                      handleChange(
                        field.key as keyof SearchFilters,
                        field.type === "number"
                          ? e.target.value
                            ? Number(e.target.value)
                            : undefined
                          : e.target.value
                      )
                    }
                    className="search-input text-sm"
                  />
                </div>
              </div>
            </React.Fragment>
          ))}

          <div className="divider-v hidden lg:block" />
          <div className="h-px lg:hidden bg-white/4 mx-4" />

          <div className="flex-1 flex items-center gap-3 px-5 py-4">
            <Home
              size={14}
              className="text-emerald-400/50 shrink-0"
            />

            <div className="flex-1 min-w-0">
              <label className="block text-[8px] uppercase tracking-[0.2em] text-emerald-400/50 mb-0.5 font-bold">
                Type
              </label>

              <select
                value={filters.type || ""}
                onChange={(e) =>
                  handleChange("type", e.target.value)
                }
                className="select-custom text-sm"
              >
                <option value="">All Types</option>

                {Object.entries(TYPE_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>
            </div>

            <ChevronDown
              size={12}
              className="text-white/20 shrink-0"
            />
          </div>

          <div className="p-2">
            <button className="h-full min-h-[52px] px-8 bg-emerald-400 hover:bg-emerald-300 text-[#051009] font-bold text-[10px] uppercase tracking-[0.18em] rounded-xl transition-all duration-300 flex items-center gap-2 w-full lg:w-auto justify-center">
              <Search size={13} /> Search
            </button>
          </div>
        </div>

        <AnimatePresence>
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-3 flex items-center gap-2">
                <span className="text-white/20 text-xs">
                  Active filters
                </span>

                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-emerald-400/70 text-xs font-semibold hover:text-emerald-400 transition"
                >
                  <X size={10} /> Clear
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Section3D>
  );
};

const GridCard = ({
  property,
  index,
  tall = false,
}: {
  property: StayProperty;
  index: number;
  tall?: boolean;
}) => {
  const [fav, setFav] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-6, 6]),
    { stiffness: 250, damping: 28 }
  );

  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [4, -4]),
    { stiffness: 250, damping: 28 }
  );

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();

    mouseX.set(
      (e.clientX - rect.left) / rect.width - 0.5
    );
    mouseY.set(
      (e.clientY - rect.top) / rect.height - 0.5
    );
  };

  const onLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const amenities = (
    PROPERTY_AMENITIES[property.id] ?? ["wifi", "pool"]
  ).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: 12 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        delay: index * 0.05,
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group h-full"
      style={{ perspective: "700px" }}
    >
      <a
        href={`/staycation/${property.id}`}
        className="block h-full"
      >
        <motion.div
          ref={ref}
          style={{
            rotateY,
            rotateX,
            transformStyle: "preserve-3d",
            background: "rgba(5,16,9,0.5)",
            border: "1px solid rgba(163,191,174,0.12)",
            backdropFilter: "blur(16px)",
          }}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          whileHover={{
            y: -8,
            boxShadow:
              "0 32px 64px rgba(52,211,153,0.07), 0 8px 24px rgba(0,0,0,0.4)",
          }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 25,
          }}
          className="h-full flex flex-col rounded-2xl overflow-hidden"
        >
          <div
            className={`relative overflow-hidden shrink-0 ${
              tall ? "h-80 md:h-[420px]" : "h-56"
            }`}
          >
            <motion.img
              src={property.photos[0]}
              alt={property.title}
              className="w-full h-full object-cover"
              onLoad={() => setLoaded(true)}
              whileHover={{ scale: 1.07 }}
              transition={{
                duration: 0.9,
                ease: [0.22, 1, 0.36, 1],
              }}
            />

            {!loaded && (
              <div className="absolute inset-0 shimmer" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#051009]/70 via-transparent to-transparent" />

            <div className="absolute top-4 left-4 right-4 flex justify-between">
              <span className="glass-light px-2.5 py-1 rounded-full type-tag">
                {TYPE_LABELS[property.type] ??
                  property.type}
              </span>

              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.preventDefault();
                  setFav(!fav);
                }}
                className="glass-light w-8 h-8 rounded-full flex items-center justify-center"
              >
                <Heart
                  size={13}
                  fill={fav ? "#f87171" : "none"}
                  className={
                    fav
                      ? "text-red-400"
                      : "text-white/50"
                  }
                />
              </motion.button>
            </div>

            <div className="absolute bottom-4 left-4 flex items-center gap-1.5 glass-light px-2 py-1 rounded-full">
              <Star
                className="fill-emerald-400 text-emerald-400"
                size={9}
              />

              <span className="text-white text-[10px] font-semibold">
                {property.avgRating}
              </span>

              <span className="text-white/30 text-[9px]">
                ({property.reviewCount})
              </span>
            </div>
          </div>

          <div
            className="p-5 flex flex-col flex-1"
            style={{ transform: "translateZ(12px)" }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin
                className="text-emerald-400/50"
                size={10}
              />

              <span className="text-emerald-400/60 text-[9px] uppercase tracking-[0.18em] font-bold">
                {property.city} · {property.country}
              </span>
            </div>

            <h3
              className="font-serif font-bold text-white text-lg line-clamp-2 group-hover:text-emerald-400 transition-colors duration-300 mb-2 leading-snug"
              style={{
                fontFamily: "'Playfair Display', serif",
              }}
            >
              {property.title}
            </h3>

            <p className="text-white/25 text-xs leading-relaxed line-clamp-2 flex-1 mb-3">
              {property.description}
            </p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {amenities.map((key) => {
                const amenity = AMENITY_ICONS[key];

                if (!amenity) return null;

                return (
                  <span
                    key={key}
                    className="px-2 py-1 rounded-md text-[9px] text-white/30"
                    style={{
                      background:
                        "rgba(52,211,153,0.05)",
                      border:
                        "1px solid rgba(52,211,153,0.08)",
                    }}
                  >
                    {amenity.label}
                  </span>
                );
              })}
            </div>

            <div className="flex items-center gap-4 py-3 border-t border-white/5 mb-3">
              <div className="flex items-center gap-1.5 text-white/30 text-xs">
                <Bed size={11} />
                <span>{property.bedrooms}</span>
              </div>

              <div className="flex items-center gap-1.5 text-white/30 text-xs">
                <Bath size={11} />
                <span>{property.bathrooms}</span>
              </div>

              <div className="flex items-center gap-1.5 text-white/30 text-xs">
                <Users size={11} />
                <span>Up to {property.maxGuests}</span>
              </div>

              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-emerald-900/50 border border-emerald-700/30 flex items-center justify-center">
                  <span className="text-emerald-400 text-[8px] font-bold">
                    {property.host.firstName[0]}
                  </span>
                </div>

                {property.host.isVerified && (
                  <ShieldCheck
                    className="text-emerald-400/60"
                    size={9}
                  />
                )}
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/20 text-[9px] uppercase tracking-widest mb-0.5">
                  From
                </p>

                <p
                  className="font-serif text-xl font-bold text-emerald-400"
                  style={{
                    fontFamily:
                      "'Playfair Display', serif",
                  }}
                >
                  KES {fmt(property.pricePerNight)}
                </p>

                <p className="text-white/20 text-[9px]">
                  per night
                </p>
              </div>

              <motion.div
                whileHover={{ x: 3 }}
                className="w-8 h-8 rounded-full border border-emerald-400/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-400 group-hover:text-[#051009] group-hover:border-transparent transition-all duration-300"
              >
                <ArrowRight size={12} />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </a>
    </motion.div>
  );
};

const applyFilters = (
  properties: StayProperty[],
  filters: SearchFilters
) =>
  properties.filter((property) => {
    if (
      filters.city &&
      !property.city
        .toLowerCase()
        .includes(filters.city.toLowerCase()) &&
      !property.country
        .toLowerCase()
        .includes(filters.city.toLowerCase())
    ) {
      return false;
    }

    if (
      filters.minPrice &&
      property.pricePerNight < filters.minPrice
    ) {
      return false;
    }

    if (
      filters.maxPrice &&
      property.pricePerNight > filters.maxPrice
    ) {
      return false;
    }

    if (
      filters.guests &&
      property.maxGuests < filters.guests
    ) {
      return false;
    }

    if (
      filters.type &&
      property.type !== filters.type
    ) {
      return false;
    }

    return true;
  });

const PropertiesGrid = ({
  properties,
  filters,
}: {
  properties: StayProperty[];
  filters: SearchFilters;
}) => {
  const filteredProperties = applyFilters(
    properties,
    filters
  );

  return (
    <section className="max-w-[1440px] mx-auto px-8 md:px-16 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex items-end justify-between mb-14"
      >
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-emerald-400/60" />

            <span className="text-[9px] uppercase tracking-[0.28em] text-emerald-400/70 font-semibold">
              All Stays
            </span>
          </div>

          <h2
            className="font-serif font-bold text-white"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
            }}
          >
            Browse Properties
          </h2>
        </div>

        <div className="hidden md:block text-right">
          <p
            className="font-serif text-4xl font-bold text-white/8"
            style={{
              fontFamily: "'Playfair Display', serif",
            }}
          >
            {filteredProperties.length}
          </p>

          <p className="text-white/20 text-[9px] uppercase tracking-widest">
            Results
          </p>
        </div>
      </motion.div>

      {filteredProperties.length === 0 && (
        <div className="text-center py-32">
          <div className="w-14 h-14 rounded-full border border-white/6 flex items-center justify-center mx-auto mb-5">
            <Search
              className="text-white/15"
              size={22}
            />
          </div>

          <h3
            className="font-serif text-2xl font-bold text-white/25 mb-2"
            style={{
              fontFamily: "'Playfair Display', serif",
            }}
          >
            No properties found
          </h3>

          <p className="text-white/15 text-sm">
            Try adjusting your filters
          </p>
        </div>
      )}

      {filteredProperties.length > 0 && (
        <div>
          {filteredProperties.length >= 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
              <div className="lg:row-span-2">
                <GridCard
                  property={filteredProperties[0]}
                  index={0}
                  tall
                />
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredProperties
                  .slice(1, 5)
                  .map((property, index) => (
                    <GridCard
                      key={property.id}
                      property={property}
                      index={index + 1}
                    />
                  ))}
              </div>
            </div>
          )}

          {filteredProperties.length > 5 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProperties
                .slice(5)
                .map((property, index) => (
                  <GridCard
                    key={property.id}
                    property={property}
                    index={index + 5}
                  />
                ))}
            </div>
          )}

          {filteredProperties.length < 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProperties.map(
                (property, index) => (
                  <GridCard
                    key={property.id}
                    property={property}
                    index={index}
                  />
                )
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

const InquiryModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);

    setTimeout(() => {
      setSent(false);
      onClose();
    }, 2500);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{
            background: "rgba(5,16,9,0.88)",
            backdropFilter: "blur(16px)",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{
              scale: 0.92,
              y: 20,
              opacity: 0,
            }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{
              scale: 0.92,
              y: 20,
              opacity: 0,
            }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 26,
            }}
            className="w-full max-w-lg rounded-2xl p-8"
            style={{
              background: "rgba(8,24,12,0.95)",
              border:
                "1px solid rgba(163,191,174,0.18)",
              backdropFilter: "blur(32px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-8">
              <div>
                <h3
                  className="font-serif text-2xl font-bold text-white mb-1.5"
                  style={{
                    fontFamily:
                      "'Playfair Display', serif",
                  }}
                >
                  Can&apos;t find the right stay?
                </h3>

                <p className="text-white/35 text-sm">
                  Tell us what you need — we&apos;ll
                  match you within 2 hours.
                </p>
              </div>

              <button
                onClick={onClose}
                className="text-white/25 hover:text-white transition mt-1 ml-4"
              >
                <X size={18} />
              </button>
            </div>

            {!sent ? (
              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {[
                  {
                    label: "Your Name",
                    placeholder: "Jane Doe",
                    type: "text",
                  },
                  {
                    label: "Email",
                    placeholder: "jane@email.com",
                    type: "email",
                  },
                  {
                    label: "Preferred Location",
                    placeholder:
                      "Nairobi, Zanzibar…",
                    type: "text",
                  },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="text-[9px] uppercase tracking-[0.2em] text-emerald-400/60 font-bold block mb-1.5">
                      {field.label}
                    </label>

                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      required
                      className="w-full px-4 py-3 rounded-lg text-white text-sm placeholder:text-white/20 outline-none"
                      style={{
                        background:
                          "rgba(255,255,255,0.04)",
                        border:
                          "1px solid rgba(255,255,255,0.08)",
                      }}
                    />
                  </div>
                ))}

                <div>
                  <label className="text-[9px] uppercase tracking-[0.2em] text-emerald-400/60 font-bold block mb-1.5">
                    Tell Us More
                  </label>

                  <textarea
                    placeholder="Dates, guests, budget, special requests…"
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg text-white text-sm placeholder:text-white/20 outline-none resize-none"
                    style={{
                      background:
                        "rgba(255,255,255,0.04)",
                      border:
                        "1px solid rgba(255,255,255,0.08)",
                    }}
                  />
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 bg-emerald-400 hover:bg-emerald-300 text-[#051009] font-bold text-[10px] uppercase tracking-[0.2em] rounded-lg transition-all duration-300"
                >
                  Send Enquiry
                </motion.button>
              </form>
            ) : (
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.95,
                }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{
                    background:
                      "rgba(52,211,153,0.1)",
                    border:
                      "1px solid rgba(52,211,153,0.25)",
                  }}
                >
                  <ShieldCheck
                    className="text-emerald-400"
                    size={24}
                  />
                </div>

                <h4
                  className="font-serif text-xl font-bold text-white mb-2"
                  style={{
                    fontFamily:
                      "'Playfair Display', serif",
                  }}
                >
                  Enquiry Sent!
                </h4>

                <p className="text-white/35 text-sm">
                  We&apos;ll get back to you within 2
                  hours.
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const CTA = ({
  onOpen,
}: {
  onOpen: () => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const imgY = useTransform(
    scrollYProgress,
    [0, 1],
    ["-8%", "8%"]
  );

  return (
    <Section3D className="max-w-[1440px] mx-auto px-8 md:px-16 py-6 pb-20">
      <div
        ref={ref}
        className="relative overflow-hidden rounded-2xl"
        style={{ minHeight: "400px" }}
      >
        <motion.div
          className="absolute inset-0 scale-110"
          style={{ y: imgY }}
        >
          <img
            src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1400&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-r from-[#051009]/95 via-[#051009]/70 to-[#051009]/30" />

        <div className="relative px-10 md:px-16 py-16 md:py-20 max-w-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-6 h-px bg-emerald-400/60" />

            <span className="text-[9px] uppercase tracking-[0.28em] text-emerald-400/70 font-semibold">
              Need Help?
            </span>
          </div>

          <h3
            className="font-serif font-bold text-white mb-5 leading-snug"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(2rem, 3.5vw, 3rem)",
            }}
          >
            Can&apos;t find the right stay?
          </h3>

          <p className="text-white/40 text-sm leading-relaxed mb-8">
            Send us your requirements — dates, location,
            budget, group size — and our team will
            shortlist the best available properties within
            2 hours.
          </p>

          <div className="flex flex-wrap gap-4">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpen}
              className="inline-flex items-center gap-3 px-8 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-[#051009] font-bold text-[10px] uppercase tracking-[0.2em] rounded-sm transition-all duration-300"
            >
              Send Enquiry <ArrowRight size={12} />
            </motion.button>

            <a
              href="/how-it-works"
              className="inline-flex items-center gap-2 px-6 py-3.5 border border-white/15 text-white/50 hover:text-white hover:border-white/30 text-[10px] uppercase tracking-[0.18em] font-semibold rounded-sm transition"
            >
              How It Works
            </a>
          </div>
        </div>
      </div>
    </Section3D>
  );
};

const Footer = ({
  onOpen,
}: {
  onOpen: () => void;
}) => (
  <footer className="relative overflow-hidden">
    <div className="absolute inset-0 z-0">
      <img
        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1800&q=80"
        alt=""
        className="w-full h-full object-cover opacity-18"
        style={{ objectPosition: "center 30%" }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-[#051009] via-[#051009]/90 to-[#051009]" />
    </div>

    <div className="relative z-10 max-w-[1440px] mx-auto px-8 md:px-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 py-20">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-6 h-6 rounded-full border border-emerald-400/40 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
            </div>

            <span
              className="font-serif font-bold text-xl text-white/70"
              style={{
                fontFamily:
                  "'Playfair Display', serif",
              }}
            >
              <span className="text-emerald-400">
                Love
              </span>
              Africa
            </span>
          </div>

          <p className="text-white/25 text-sm leading-relaxed max-w-xs mb-8">
            Book unique stays from private villas and
            safari lodges to city apartments and
            beachfront retreats — all verified, all
            premium.
          </p>

          <p className="text-[9px] uppercase tracking-[0.2em] text-white/18 font-bold mb-3">
            Get the best stays in your inbox
          </p>

          <div className="flex max-w-xs overflow-hidden rounded-sm border border-white/8">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 bg-transparent px-4 py-2.5 text-white text-xs placeholder:text-white/15 outline-none min-w-0"
            />

            <button className="px-4 bg-emerald-400/80 hover:bg-emerald-400 text-[#051009] text-[9px] font-bold uppercase tracking-widest transition whitespace-nowrap">
              Join
            </button>
          </div>
        </div>

        {[
          {
            title: "Stays",
            links: [
              "Villas",
              "Safari Lodges",
              "Beach Houses",
              "City Apartments",
              "Camps & Glamping",
            ],
          },
          {
            title: "Support",
            links: [
              "Help Centre",
              "Cancellation Policy",
              "Safety Information",
              "Accessibility",
            ],
          },
          {
            title: "Company",
            links: [
              "About Us",
              "How It Works",
              "Host Your Property",
              "Press",
              "Careers",
            ],
          },
        ].map((column) => (
          <div key={column.title}>
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/18 font-bold mb-5">
              {column.title}
            </p>

            <ul className="space-y-3">
              {column.links.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-white/28 text-sm hover:text-emerald-400/80 transition"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/5 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-white/15 text-[9px] tracking-widest uppercase">
          © {new Date().getFullYear()} LoveAfrica
          Properties · All Rights Reserved
        </p>

        <div className="flex items-center gap-6">
          {["Privacy", "Terms", "Cookies"].map(
            (link) => (
              <a
                key={link}
                href="#"
                className="text-white/15 text-[9px] hover:text-emerald-400/50 transition uppercase tracking-widest"
              >
                {link}
              </a>
            )
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />

          <span className="text-white/15 text-[9px] tracking-widest uppercase">
            24/7 Support
          </span>
        </div>
      </div>
    </div>
  </footer>
);

export default function PropertiesPage() {
  const [filters, setFilters] =
    useState<SearchFilters>({});

  const [inquiryOpen, setInquiryOpen] =
    useState(false);

  const [properties, setProperties] = useState<
    StayProperty[]
  >([]);

  const [loading, setLoading] = useState(true);

  const featuredProperty = properties[0];
  const showcaseProperties = properties.slice(0, 6);

  useEffect(() => {
    let isMounted = true;

    const loadProperties = async () => {
      setLoading(true);

      const data = await fetchStayProperties();

      if (isMounted) {
        setProperties(data);
        setLoading(false);
      }
    };

    loadProperties();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#051009] flex items-center justify-center">
        <p className="text-white/40 text-sm uppercase tracking-widest">
          Loading stays…
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#051009]">
      <Header />

      {featuredProperty && (
        <HeroBanner property={featuredProperty} />
      )}

      <NumbersRow />

      <PerspectiveShowcase
        properties={showcaseProperties}
      />

      <HorizontalScroll properties={properties} />

      <HowItWorks />

      <div id="browse">
        <FilterBar onFilterChange={setFilters} />

        <PropertiesGrid
          properties={properties}
          filters={filters}
        />
      </div>

      <CTA onOpen={() => setInquiryOpen(true)} />

      <Footer onOpen={() => setInquiryOpen(true)} />

      <InquiryModal
        open={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
      />
    </main>
  );
}