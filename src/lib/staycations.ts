import { supabase } from '@/lib/supabase';

export type PropertyType = 'apartment' | 'hotel_guesthouse' | 'safari_lodge_camp' | 'villa_holiday_home';
export type Sort = 'recommended' | 'price_asc' | 'price_desc' | 'rating';

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'hotel_guesthouse', label: 'Hotel / Guesthouse' },
  { value: 'safari_lodge_camp', label: 'Safari Lodge / Camp' },
  { value: 'villa_holiday_home', label: 'Villa / Holiday Home' },
];

export const AMENITIES: { value: string; label: string }[] = [
  { value: 'wifi', label: 'WiFi' },
  { value: 'pool', label: 'Pool' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'parking', label: 'Parking' },
  { value: 'ac', label: 'Air conditioning' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'beach_access', label: 'Beach access' },
  { value: 'workspace', label: 'Workspace' },
  { value: 'gym', label: 'Gym' },
  { value: 'garden', label: 'Garden' },
  { value: 'fireplace', label: 'Fireplace' },
  { value: 'pet_friendly', label: 'Pet friendly' },
];

export const SORTS: { value: Sort; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
];

export interface Property {
  id: string;
  title: string;
  property_type: PropertyType;
  city: string | null;
  country: string;
  base_price: number;
  weekend_price: number | null;
  currency: string;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
  cover_url: string | null;
  rating_avg: number;
  rating_count: number;
  instant_book: boolean;
}

export interface Filters {
  q: string;
  checkIn: string;
  checkOut: string;
  guests: number | null;
  types: PropertyType[];
  minPrice: number | null;
  maxPrice: number | null;
  amenities: string[];
  minRating: number | null;
  sort: Sort;
}

export const EMPTY_FILTERS: Filters = {
  q: '', checkIn: '', checkOut: '', guests: null, types: [],
  minPrice: null, maxPrice: null, amenities: [], minRating: null, sort: 'recommended',
};

const num = (v: string | null) => {
  if (v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const list = (v: string | null) => (v ? v.split(',').filter(Boolean) : []);

// URL <-> filters. The URL is the single source of truth, so a search is shareable.
export function parseFilters(sp: URLSearchParams): Filters {
  const validTypes = PROPERTY_TYPES.map((t) => t.value);
  const sort = sp.get('sort') as Sort | null;
  return {
    q: sp.get('q') ?? '',
    checkIn: sp.get('in') ?? '',
    checkOut: sp.get('out') ?? '',
    guests: num(sp.get('guests')),
    types: list(sp.get('types')).filter((t): t is PropertyType => validTypes.includes(t as PropertyType)),
    minPrice: num(sp.get('min')),
    maxPrice: num(sp.get('max')),
    amenities: list(sp.get('amenities')),
    minRating: num(sp.get('rating')),
    sort: sort && SORTS.some((s) => s.value === sort) ? sort : 'recommended',
  };
}

export function buildQuery(f: Filters): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set('q', f.q);
  if (f.checkIn) sp.set('in', f.checkIn);
  if (f.checkOut) sp.set('out', f.checkOut);
  if (f.guests) sp.set('guests', String(f.guests));
  if (f.types.length) sp.set('types', f.types.join(','));
  if (f.minPrice !== null) sp.set('min', String(f.minPrice));
  if (f.maxPrice !== null) sp.set('max', String(f.maxPrice));
  if (f.amenities.length) sp.set('amenities', f.amenities.join(','));
  if (f.minRating !== null) sp.set('rating', String(f.minRating));
  if (f.sort !== 'recommended') sp.set('sort', f.sort);
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export async function searchProperties(f: Filters) {
  const datesOk = f.checkIn && f.checkOut && f.checkOut > f.checkIn;
  const { data, error } = await supabase.rpc('search_properties', {
    p_query: f.q || null,
    p_check_in: datesOk ? f.checkIn : null,
    p_check_out: datesOk ? f.checkOut : null,
    p_guests: f.guests,
    p_types: f.types.length ? f.types : null,
    p_min_price: f.minPrice,
    p_max_price: f.maxPrice,
    p_amenities: f.amenities.length ? f.amenities : null,
    p_min_rating: f.minRating,
    p_sort: f.sort,
  });
  return { data: (data ?? []) as Property[], error };
}

export const formatPrice = (amount: number, currency = 'KES') =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);