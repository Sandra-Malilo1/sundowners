import { supabase } from '@/lib/supabase';
import type { PropertyType } from '@/lib/staycations';

export type ListingStatus = 'draft' | 'pending_review' | 'active' | 'paused' | 'rejected';

export interface HostListing {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  property_type: PropertyType;
  status: ListingStatus;
  country: string;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  base_price: number;
  weekend_price: number | null;
  cleaning_fee: number;
  currency: string;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
  house_rules: Record<string, unknown>;
  check_in_time: string;
  check_out_time: string;
  min_nights: number;
  max_nights: number | null;
  instant_book: boolean;
  cover_url: string | null;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface ListingPhoto {
  id: string;
  url: string;
  position: number;
}

/** Doc: a listing needs at least 10 photos before it can be sent for review. Lower this number while testing. */
export const MIN_PHOTOS = 10;
/** Photos narrower than this are rejected (automatic resolution check). */
export const MIN_PHOTO_WIDTH = 1200;

export const STATUS_LABEL: Record<ListingStatus, { text: string; tone: string }> = {
  draft: { text: 'Draft', tone: 'bg-white/10 text-emerald-100/80' },
  pending_review: { text: 'In review', tone: 'bg-amber-300/15 text-amber-200' },
  active: { text: 'Live', tone: 'bg-emerald-400/20 text-emerald-300' },
  paused: { text: 'Paused', tone: 'bg-white/10 text-emerald-100/80' },
  rejected: { text: 'Needs changes', tone: 'bg-red-400/15 text-red-300' },
};

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error('Please sign in again.');
  return id;
}

export async function getMyListings(): Promise<HostListing[]> {
  const id = await uid();
  const { data, error } = await supabase.from('properties').select('*').eq('host_id', id).order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as HostListing[];
}

export async function getMyListing(listingId: string): Promise<HostListing | null> {
  const id = await uid();
  const { data, error } = await supabase.from('properties').select('*').eq('id', listingId).eq('host_id', id).maybeSingle();
  if (error) {
    if (error.code === '22P02') return null;
    throw error;
  }
  return (data as HostListing | null) ?? null;
}

export async function createDraft(type: PropertyType): Promise<string> {
  const id = await uid();
  const { data, error } = await supabase
    .from('properties')
    .insert({ host_id: id, title: 'Untitled listing', property_type: type, status: 'draft', base_price: 0 })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function saveListing(listingId: string, patch: Partial<HostListing>) {
  const { error } = await supabase.from('properties').update(patch).eq('id', listingId);
  if (error) throw error;
}

export async function deleteListing(listingId: string) {
  const { error } = await supabase.from('properties').delete().eq('id', listingId);
  if (error) throw error;
}

/** Copies a listing (details + photo links) into a new draft. */
export async function duplicateListing(l: HostListing): Promise<string> {
  const id = await uid();
  const { data, error } = await supabase
    .from('properties')
    .insert({
      host_id: id,
      title: `${l.title} (copy)`,
      description: l.description,
      property_type: l.property_type,
      status: 'draft',
      country: l.country,
      city: l.city,
      address: l.address,
      latitude: l.latitude,
      longitude: l.longitude,
      base_price: l.base_price,
      weekend_price: l.weekend_price,
      cleaning_fee: l.cleaning_fee,
      currency: l.currency,
      max_guests: l.max_guests,
      bedrooms: l.bedrooms,
      beds: l.beds,
      bathrooms: l.bathrooms,
      amenities: l.amenities,
      house_rules: l.house_rules,
      check_in_time: l.check_in_time,
      check_out_time: l.check_out_time,
      min_nights: l.min_nights,
      max_nights: l.max_nights,
      instant_book: l.instant_book,
      cover_url: l.cover_url,
    })
    .select('id')
    .single();
  if (error) throw error;
  const newId = data.id as string;

  const photos = await getListingPhotos(l.id);
  if (photos.length > 0) {
    const { error: pe } = await supabase
      .from('property_photos')
      .insert(photos.map((p) => ({ property_id: newId, url: p.url, position: p.position })));
    if (pe) throw pe;
  }
  return newId;
}

/* ------------------------------ photos ------------------------------ */

export async function getListingPhotos(listingId: string): Promise<ListingPhoto[]> {
  const { data, error } = await supabase
    .from('property_photos')
    .select('id, url, position')
    .eq('property_id', listingId)
    .order('position');
  if (error) throw error;
  return (data ?? []) as ListingPhoto[];
}

async function syncCover(listingId: string) {
  const photos = await getListingPhotos(listingId);
  await supabase.from('properties').update({ cover_url: photos[0]?.url ?? null }).eq('id', listingId);
}

export async function uploadPhoto(listingId: string, file: File, position: number): Promise<ListingPhoto> {
  const id = await uid();
  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${id}/${listingId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from('property-photos').upload(path, file, { contentType: file.type, cacheControl: '31536000' });
  if (error) throw error;
  const url = supabase.storage.from('property-photos').getPublicUrl(path).data.publicUrl;

  const { data, error: insertError } = await supabase
    .from('property_photos')
    .insert({ property_id: listingId, url, position })
    .select('id, url, position')
    .single();
  if (insertError) {
    await supabase.storage.from('property-photos').remove([path]);
    throw insertError;
  }
  await syncCover(listingId);
  return data as ListingPhoto;
}

export async function deletePhoto(listingId: string, photo: ListingPhoto) {
  const { error } = await supabase.from('property_photos').delete().eq('id', photo.id);
  if (error) throw error;
  const marker = '/property-photos/';
  const at = photo.url.indexOf(marker);
  if (at !== -1) {
    await supabase.storage.from('property-photos').remove([decodeURIComponent(photo.url.slice(at + marker.length))]);
  }
  await syncCover(listingId);
}

export async function makeCover(listingId: string, photoId: string, photos: ListingPhoto[]) {
  const ordered = [...photos.filter((p) => p.id === photoId), ...photos.filter((p) => p.id !== photoId)];
  await Promise.all(ordered.map((p, i) => supabase.from('property_photos').update({ position: i }).eq('id', p.id)));
  await syncCover(listingId);
}

/** Resolution check done in the browser before uploading. */
export function imageWidth(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img.naturalWidth);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('unreadable image'));
    };
    img.src = url;
  });
}