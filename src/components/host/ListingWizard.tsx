'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AMENITIES, type PropertyType } from '@/lib/staycations';
import { MIN_PHOTOS, STATUS_LABEL, getListingPhotos, saveListing, type HostListing } from '@/lib/host';
import { Card, Counter, Field, TypePicker, Toggle, inputClass, textareaClass } from '@/components/host/formBits';
import PhotoUploader from '@/components/host/PhotoUploader';

const STEPS = ['Type', 'Basics', 'Details', 'Photos', 'Pricing & rules', 'Review'];

interface Form {
  property_type: PropertyType;
  title: string;
  description: string;
  country: string;
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
  base_price: string;
  weekend_price: string;
  cleaning_fee: string;
  min_nights: string;
  max_nights: string;
  instant_book: boolean;
  check_in_time: string;
  check_out_time: string;
  smoking: boolean;
  pets: boolean;
  parties: boolean;
  custom_rules: string;
}

const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const num = (s: string) => (s.trim() === '' ? null : Number(s));

function fromListing(l: HostListing): Form {
  const r = l.house_rules ?? {};
  return {
    property_type: l.property_type,
    title: l.title === 'Untitled listing' ? '' : l.title,
    description: l.description ?? '',
    country: l.country || 'Kenya',
    city: l.city ?? '',
    address: l.address ?? '',
    latitude: str(l.latitude),
    longitude: str(l.longitude),
    max_guests: l.max_guests,
    bedrooms: l.bedrooms,
    beds: l.beds,
    bathrooms: Number(l.bathrooms),
    amenities: l.amenities ?? [],
    base_price: Number(l.base_price) > 0 ? str(l.base_price) : '',
    weekend_price: str(l.weekend_price),
    cleaning_fee: Number(l.cleaning_fee) > 0 ? str(l.cleaning_fee) : '',
    min_nights: str(l.min_nights),
    max_nights: str(l.max_nights),
    instant_book: l.instant_book,
    check_in_time: l.check_in_time.slice(0, 5),
    check_out_time: l.check_out_time.slice(0, 5),
    smoking: r.smoking === true,
    pets: r.pets === true,
    parties: r.parties === true,
    custom_rules: typeof r.custom === 'string' ? r.custom : '',
  };
}

function toPatch(f: Form): Partial<HostListing> {
  const rules: Record<string, unknown> = { smoking: f.smoking, pets: f.pets, parties: f.parties };
  if (f.custom_rules.trim()) rules.custom = f.custom_rules.trim();
  return {
    property_type: f.property_type,
    title: f.title.trim() || 'Untitled listing',
    description: f.description.trim() || null,
    country: f.country.trim() || 'Kenya',
    city: f.city.trim() || null,
    address: f.address.trim() || null,
    latitude: num(f.latitude),
    longitude: num(f.longitude),
    max_guests: f.max_guests,
    bedrooms: f.bedrooms,
    beds: f.beds,
    bathrooms: f.bathrooms,
    amenities: f.amenities,
    base_price: num(f.base_price) ?? 0,
    weekend_price: num(f.weekend_price),
    cleaning_fee: num(f.cleaning_fee) ?? 0,
    min_nights: Math.max(1, num(f.min_nights) ?? 1),
    max_nights: num(f.max_nights),
    instant_book: f.instant_book,
    check_in_time: f.check_in_time || '14:00',
    check_out_time: f.check_out_time || '10:00',
    house_rules: rules,
  };
}

export default function ListingWizard({ listing }: { listing: HostListing }) {
  const router = useRouter();
  const qc = useQueryClient();
  const sp = useSearchParams();
  const step = Math.min(6, Math.max(1, Number(sp.get('step')) || 1));

  const [form, setForm] = useState<Form>(() => fromListing(listing));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);

  const photosQ = useQuery({ queryKey: ['host-photos', listing.id], queryFn: () => getListingPhotos(listing.id), staleTime: 0 });
  const photoCount = photosQ.data?.length ?? 0;

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggleAmenity = (a: string) => set('amenities', form.amenities.includes(a) ? form.amenities.filter((x) => x !== a) : [...form.amenities, a]);

  const go = (n: number) => router.replace(`/host/listings/${listing.id}/edit?step=${n}`, { scroll: true });

  const persist = async (extra: Partial<HostListing> = {}) => {
    setSaving(true);
    setError('');
    try {
      await saveListing(listing.id, { ...toPatch(form), ...extra });
      await Promise.all([qc.invalidateQueries({ queryKey: ['host-listing', listing.id] }), qc.invalidateQueries({ queryKey: ['host-listings'] })]);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const next = async () => {
    if (step === 2 && form.title.trim().length < 5) return setError('Give your listing a title (at least 5 characters).');
    if (await persist()) go(Math.min(6, step + 1));
  };
  const back = async () => {
    if (await persist()) go(Math.max(1, step - 1));
  };
  const saveExit = async () => {
    if (await persist()) router.push('/host/listings');
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return setError('Your browser can’t share its location.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('latitude', pos.coords.latitude.toFixed(6));
        set('longitude', pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError('We couldn’t get your location. You can type the coordinates instead.');
      },
    );
  };

  /* ---- review checklist ---- */
  const price = num(form.base_price) ?? 0;
  const checks = [
    { ok: form.title.trim().length >= 5, text: 'A title' },
    { ok: form.description.trim().length >= 50, text: 'A description of at least 50 characters' },
    { ok: !!form.city.trim() && !!form.address.trim(), text: 'City and address' },
    { ok: photoCount >= MIN_PHOTOS, text: `At least ${MIN_PHOTOS} photos (you have ${photoCount})` },
    { ok: price > 0, text: 'A nightly price' },
  ];
  const ready = checks.every((c) => c.ok);
  const live = listing.status === 'active' || listing.status === 'paused';
  const st = STATUS_LABEL[listing.status];

  const submit = async () => {
    if (!ready && !live) return;
    const ok = await persist(live ? {} : { status: 'pending_review' });
    if (ok) router.push(`/host/listings?${live ? 'saved=1' : 'submitted=1'}`);
  };

  const lat = Number(form.latitude);
  const lng = Number(form.longitude);
  const hasPin = form.latitude !== '' && form.longitude !== '' && Number.isFinite(lat) && Number.isFinite(lng);
  const mapSrc = hasPin
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.008}%2C${lat - 0.005}%2C${lng + 0.008}%2C${lat + 0.005}&layer=mapnik&marker=${lat}%2C${lng}`
    : '';

  const btnPrimary = 'h-13 px-8 rounded-xl bg-emerald-400 text-black text-[16px] font-semibold hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';
  const btnGhost = 'h-13 px-6 rounded-xl border border-emerald-300/30 text-[16px] font-medium text-white hover:bg-white/5 disabled:opacity-50 transition-colors';

  return (
    <div className="max-w-3xl">
      {/* Progress */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <p className="text-[15px] font-medium text-emerald-300">Step {step} of 6 · {STEPS[step - 1]}</p>
        <span className={`rounded-full px-3 py-1 text-[13px] font-medium ${st.tone}`}>{st.text}</span>
      </div>
      <div className="flex gap-2 mb-10" aria-hidden>
        {STEPS.map((s, i) => (
          <button key={s} type="button" onClick={() => go(i + 1)} className={`h-1.5 flex-1 rounded-full transition-colors ${i + 1 <= step ? 'bg-emerald-400' : 'bg-white/15 hover:bg-white/25'}`} title={s} />
        ))}
      </div>

      <div className="space-y-6">
        {/* ---------- 1. TYPE ---------- */}
        {step === 1 && (
          <Card title="What kind of place is it?" subtitle="Pick the closest match. You can change this later.">
            <TypePicker value={form.property_type} onChange={(t) => set('property_type', t)} />
          </Card>
        )}

        {/* ---------- 2. BASICS ---------- */}
        {step === 2 && (
          <>
            <Card title="Tell guests about your place">
              <div className="space-y-6">
                <Field label="Title" htmlFor="l-title" hint="Short and specific, like “Riverside villa with a private deck”.">
                  <input id="l-title" value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={80} placeholder="Kitusuru Residence" className={inputClass} />
                </Field>
                <Field label="Description" htmlFor="l-desc" hint={`${form.description.trim().length} characters · at least 50 to send for review`}>
                  <textarea id="l-desc" rows={6} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What makes it special? Describe the space, the setting and what guests will enjoy." className={textareaClass} />
                </Field>
              </div>
            </Card>

            <Card title="Where is it?">
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Field label="Country" htmlFor="l-country">
                    <input id="l-country" value={form.country} onChange={(e) => set('country', e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="City or town" htmlFor="l-city">
                    <input id="l-city" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Nairobi" className={inputClass} />
                  </Field>
                </div>
                <Field label="Address or area" htmlFor="l-address">
                  <input id="l-address" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Kitusuru Road, Nairobi" className={inputClass} />
                </Field>

                <div>
                  <p className="text-[15px] font-medium text-emerald-300 mb-2">Map pin</p>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-end">
                    <Field label="Latitude" htmlFor="l-lat"><input id="l-lat" inputMode="decimal" value={form.latitude} onChange={(e) => set('latitude', e.target.value)} placeholder="-1.2300" className={inputClass} /></Field>
                    <Field label="Longitude" htmlFor="l-lng"><input id="l-lng" inputMode="decimal" value={form.longitude} onChange={(e) => set('longitude', e.target.value)} placeholder="36.7800" className={inputClass} /></Field>
                    <button type="button" onClick={useMyLocation} disabled={locating} className={`${btnGhost} whitespace-nowrap`}>{locating ? 'Locating…' : 'Use my location'}</button>
                  </div>
                  <p className="mt-2 text-[14px] text-emerald-100/55">Standing at the property? Tap “Use my location”. Or copy the coordinates from Google Maps (right-click the spot).</p>
                  {hasPin && (
                    <div className="relative mt-5 h-64 rounded-xl overflow-hidden border border-emerald-300/15">
                      <iframe title="Map preview" src={mapSrc} className="absolute inset-0 w-full h-full" style={{ filter: 'grayscale(0.35) brightness(0.9)' }} />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </>
        )}

        {/* ---------- 3. DETAILS ---------- */}
        {step === 3 && (
          <>
            <Card title="The space" subtitle="How much room is there?">
              <Counter label="Guests" value={form.max_guests} min={1} max={30} onChange={(n) => set('max_guests', n)} />
              <Counter label="Bedrooms" value={form.bedrooms} min={0} max={30} onChange={(n) => set('bedrooms', n)} />
              <Counter label="Beds" value={form.beds} min={1} max={50} onChange={(n) => set('beds', n)} />
              <Counter label="Bathrooms" value={form.bathrooms} min={0.5} max={30} step={0.5} onChange={(n) => set('bathrooms', n)} />
            </Card>

            <Card title="Amenities" subtitle="Tick everything guests can use.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AMENITIES.map((a) => {
                  const on = form.amenities.includes(a.value);
                  return (
                    <label key={a.value} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border cursor-pointer transition-colors ${on ? 'border-emerald-400 bg-emerald-400/10' : 'border-emerald-300/20 hover:border-emerald-300/50'}`}>
                      <input type="checkbox" checked={on} onChange={() => toggleAmenity(a.value)} className="sr-only peer" />
                      <span className={`w-5 h-5 shrink-0 rounded-md border flex items-center justify-center peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-300 ${on ? 'bg-emerald-400 border-emerald-400 text-black' : 'border-emerald-300/40'}`}>
                        {on && <span className="text-[13px] font-bold leading-none">✓</span>}
                      </span>
                      <span className="text-[16px] text-white">{a.label}</span>
                    </label>
                  );
                })}
              </div>
            </Card>
          </>
        )}

        {/* ---------- 4. PHOTOS ---------- */}
        {step === 4 && (
          <Card title="Add photos" subtitle="Great photos get more bookings. The first photo is your cover.">
            <PhotoUploader listingId={listing.id} />
          </Card>
        )}

        {/* ---------- 5. PRICING & RULES ---------- */}
        {step === 5 && (
          <>
            <Card title="Pricing" subtitle="All amounts in Kenyan shillings (KES).">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Price per night" htmlFor="l-base"><input id="l-base" type="number" min={0} value={form.base_price} onChange={(e) => set('base_price', e.target.value)} placeholder="25000" className={inputClass} /></Field>
                <Field label="Weekend price (Fri & Sat nights)" htmlFor="l-wk" hint="Optional. Leave empty to use the normal price."><input id="l-wk" type="number" min={0} value={form.weekend_price} onChange={(e) => set('weekend_price', e.target.value)} placeholder="30000" className={inputClass} /></Field>
                <Field label="Cleaning fee" htmlFor="l-clean" hint="One-off per booking. Optional."><input id="l-clean" type="number" min={0} value={form.cleaning_fee} onChange={(e) => set('cleaning_fee', e.target.value)} placeholder="2500" className={inputClass} /></Field>
              </div>
              <p className="mt-6 text-[15px] text-emerald-100/60">Guests also pay a 10% service fee on top. It’s shown to them before they book.</p>
            </Card>

            <Card title="Stay length & booking">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
                <Field label="Minimum nights" htmlFor="l-min"><input id="l-min" type="number" min={1} value={form.min_nights} onChange={(e) => set('min_nights', e.target.value)} placeholder="1" className={inputClass} /></Field>
                <Field label="Maximum nights" htmlFor="l-max" hint="Optional."><input id="l-max" type="number" min={1} value={form.max_nights} onChange={(e) => set('max_nights', e.target.value)} placeholder="30" className={inputClass} /></Field>
              </div>
              <Toggle label="Instant book" desc="Guests book and pay straight away. Turn off to approve each request yourself." on={form.instant_book} onChange={(v) => set('instant_book', v)} />
            </Card>

            <Card title="House rules">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
                <Field label="Check-in from" htmlFor="l-in"><input id="l-in" type="time" value={form.check_in_time} onChange={(e) => set('check_in_time', e.target.value)} className={inputClass} /></Field>
                <Field label="Check-out by" htmlFor="l-out"><input id="l-out" type="time" value={form.check_out_time} onChange={(e) => set('check_out_time', e.target.value)} className={inputClass} /></Field>
              </div>
              <Toggle label="Smoking allowed" on={form.smoking} onChange={(v) => set('smoking', v)} />
              <Toggle label="Pets allowed" on={form.pets} onChange={(v) => set('pets', v)} />
              <Toggle label="Parties or events allowed" on={form.parties} onChange={(v) => set('parties', v)} />
              <div className="mt-6">
                <Field label="Anything else guests should know?" htmlFor="l-rules">
                  <textarea id="l-rules" rows={3} value={form.custom_rules} onChange={(e) => set('custom_rules', e.target.value)} placeholder="Quiet hours after 10pm. Please remove shoes indoors." className={textareaClass} />
                </Field>
              </div>
            </Card>
          </>
        )}

        {/* ---------- 6. REVIEW ---------- */}
        {step === 6 && (
          <Card title={live ? 'Save your changes' : 'Review and send'} subtitle={live ? 'Your listing is already visible to guests. Changes go live when you save.' : 'Our team checks every new listing before it goes live.'}>
            <ul className="space-y-3 mb-8">
              {checks.map((c) => (
                <li key={c.text} className="flex items-center gap-3 text-[17px]">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[13px] font-bold ${c.ok ? 'bg-emerald-400 text-black' : 'bg-white/10 text-amber-300'}`}>{c.ok ? '✓' : '!'}</span>
                  <span className={c.ok ? 'text-white' : 'text-amber-200'}>{c.text}</span>
                </li>
              ))}
            </ul>
            {!ready && !live && <p className="mb-6 text-[15px] text-emerald-100/65">Finish the items marked ! to send this for review. Use the bar above to jump to any step.</p>}
            <button type="button" onClick={submit} disabled={saving || (!ready && !live)} className={`${btnPrimary} w-full sm:w-auto`}>
              {saving ? 'Saving…' : live ? 'Save changes' : 'Send for review'}
            </button>
          </Card>
        )}

        {error && <div role="alert" className="px-5 py-4 rounded-xl border border-red-400/40 bg-red-500/10 text-red-200 text-[16px]">{error}</div>}

        {/* Footer nav */}
        {step < 6 && (
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3">
              {step > 1 && <button type="button" onClick={back} disabled={saving} className={btnGhost}>Back</button>}
              <button type="button" onClick={saveExit} disabled={saving} className="text-[15px] font-medium text-emerald-100/70 underline underline-offset-4 hover:text-white transition-colors">Save and exit</button>
            </div>
            <button type="button" onClick={next} disabled={saving} className={btnPrimary}>{saving ? 'Saving…' : 'Save and continue'}</button>
          </div>
        )}
        {step === 6 && (
          <div className="flex items-center gap-3">
            <button type="button" onClick={back} disabled={saving} className={btnGhost}>Back</button>
            <Link href="/host/listings" className="text-[15px] font-medium text-emerald-100/70 underline underline-offset-4 hover:text-white transition-colors">Cancel</Link>
          </div>
        )}
      </div>
    </div>
  );
}