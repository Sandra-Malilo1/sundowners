'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface StayProperty {
  id: string;
  title: string;
  description: string;
  locationText: string;
  basePrice: number;
  currency: string;
  type: string;
  ratingAverage: number;
  reviewCount: number;
  photos: string[];
  amenities: string[];
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  hostName: string;
  hostVerified: boolean;
}

export default function StaycationDetailPage() {
  const params = useParams();
  const listingId = params?.id as string;

  const [property, setProperty] = useState<StayProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [booking, setBooking] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    if (!listingId) return;

    const loadProperty = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: supabaseError } = await supabase
          .from('listings')
          .select(`
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
            listing_images (
              url,
              sort_order,
              is_cover
            ),
            properties (
              id,
              bedrooms,
              bathrooms,
              max_guests,
              property_amenities (
                amenities (
                  name
                )
              ),
              profiles (
                id,
                full_name,
                verification_status
              )
            )
          `)
          .eq('id', listingId)
          .eq('type', 'stay')
          .eq('status', 'published')
          .maybeSingle();

        if (supabaseError) {
          throw new Error(supabaseError.message);
        }

        if (!data) {
          setError('This property could not be found.');
          return;
        }

        const propertyData = data.properties?.[0];
        const images = (data.listing_images ?? [])
          .sort(
            (a: any, b: any) =>
              Number(b.is_cover) - Number(a.is_cover) ||
              a.sort_order - b.sort_order
          )
          .map((image: any) => image.url);

        const hostName = propertyData?.profiles?.[0]?.full_name ?? 'Host';
        const nameParts = hostName.split(' ');

        setProperty({
          id: data.id,
          title: data.title,
          description: data.description ?? '',
          locationText: data.location_text ?? '',
          basePrice: Number(data.base_price),
          currency: data.currency ?? 'KES',
          type: data.type,
          ratingAverage: Number(data.rating_average),
          reviewCount: data.review_count ?? 0,
          photos:
            images.length > 0 ? images : ['/placeholder-property.jpg'],
          amenities: (propertyData?.property_amenities ?? []).map(
            (item: any) => item.amenities?.name
          ),
          bedrooms: propertyData?.bedrooms ?? 0,
          bathrooms: Number(propertyData?.bathrooms ?? 0),
          maxGuests: propertyData?.max_guests ?? 1,
          hostName,
          hostVerified:
           propertyData?.profiles?.[0]?.verification_status === 'verified',
        });
      } catch (err: any) {
        setError(err.message ?? 'Failed to load property');
      } finally {
        setLoading(false);
      }
    };

    loadProperty();
  }, [listingId]);

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const difference = end.getTime() - start.getTime();

    return Math.max(0, Math.round(difference / (1000 * 60 * 60 * 24)));
  };

  const nights = calculateNights();
  const subtotal = nights * (property?.basePrice ?? 0);
  const serviceFee = subtotal * 0.1;
  const total = subtotal + serviceFee;

  const handleReserve = async () => {
    setBookingError(null);
    setBookingMessage(null);

    if (!property) return;

    if (!checkIn || !checkOut) {
      setBookingError('Please select check-in and check-out dates.');
      return;
    }

    if (nights < 1) {
      setBookingError('Check-out must be after check-in.');
      return;
    }

    try {
      setBooking(true);

      const { data, error: rpcError } = await supabase.rpc(
        'create_booking',
        {
          p_listing_id: property.id,
          p_property_unit_id: null,
          p_start_date: checkIn,
          p_end_date: checkOut,
          p_start_time: null,
          p_end_time: null,
          p_guest_count: guests,
          p_cleaning_fee: 0,
          p_special_requests: null,
        }
      );

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      setBookingMessage(
        `Booking request created. Reference: ${data?.reference ?? 'confirmed'}`
      );
    } catch (err: any) {
      setBookingError(err.message ?? 'Could not create booking');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center">
        <p>Loading property…</p>
      </main>
    );
  }

  if (error || !property) {
    return (
      <main className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-serif mb-4">
          {error ?? 'Property not found'}
        </h1>
        <Link
          href="/staycation"
          className="px-6 py-3 bg-[#d4a574] text-black rounded-sm"
        >
          Back to stays
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-28 pb-20">
        <Link
          href="/staycation"
          className="text-sm text-[#b0b0b0] hover:text-white transition"
        >
          ← Back to stays
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-8"
        >
          <h1 className="font-serif text-4xl md:text-6xl font-light mb-4">
            {property.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-[#b0b0b0]">
            <span>{property.locationText}</span>
            <span>★ {property.ratingAverage.toFixed(1)}</span>
            <span>{property.reviewCount} reviews</span>
            <span>
              {property.bedrooms} bedrooms · {property.bathrooms} bathrooms ·
              up to {property.maxGuests} guests
            </span>
          </div>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {property.photos.slice(0, 4).map((photo, index) => (
                <div
                  key={photo + index}
                  className={`overflow-hidden rounded-xl bg-[#1a1a1a] ${
                    index === 0 ? 'md:col-span-2 h-80' : 'h-56'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            <div className="mt-10">
              <h2 className="font-serif text-2xl mb-4">About this stay</h2>
              <p className="text-[#b0b0b0] leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            {property.amenities.length > 0 && (
              <div className="mt-10">
                <h2 className="font-serif text-2xl mb-4">Amenities</h2>
                <div className="flex flex-wrap gap-3">
                  {property.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="px-4 py-2 text-sm border border-[#333333] rounded-full text-[#b0b0b0]"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="lg:col-span-1">
            <div className="border border-[#333333] rounded-xl p-6 sticky top-28">
              <p className="text-sm text-[#b0b0b0] mb-1">From</p>
              <p className="font-serif text-3xl text-[#d4a574]">
                {property.currency} {property.basePrice.toLocaleString()}
                <span className="text-sm text-[#808080]"> / night</span>
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs text-[#b0b0b0] mb-2">
                    Check-in
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(event) => setCheckIn(event.target.value)}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333333] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#b0b0b0] mb-2">
                    Check-out
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(event) => setCheckOut(event.target.value)}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333333] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#b0b0b0] mb-2">
                    Guests
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={property.maxGuests}
                    value={guests}
                    onChange={(event) =>
                      setGuests(Number(event.target.value) || 1)
                    }
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333333] rounded-lg"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-2 text-sm text-[#b0b0b0]">
                <div className="flex justify-between">
                  <span>
                    {property.currency} {property.basePrice.toLocaleString()} ×{' '}
                    {nights} nights
                  </span>
                  <span>{property.currency} {subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between">
                  <span>Service fee</span>
                  <span>{property.currency} {serviceFee.toLocaleString()}</span>
                </div>

                <div className="flex justify-between border-t border-[#333333] pt-3 text-white font-semibold">
                  <span>Total</span>
                  <span>{property.currency} {total.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleReserve}
                disabled={booking}
                className="mt-6 w-full py-4 bg-[#d4a574] text-black font-semibold rounded-lg disabled:opacity-60"
              >
                {booking ? 'Creating booking…' : 'Reserve'}
              </button>

              {bookingError && (
                <p className="mt-4 text-sm text-red-400">{bookingError}</p>
              )}

              {bookingMessage && (
                <p className="mt-4 text-sm text-green-400">
                  {bookingMessage}
                </p>
              )}

              <div className="mt-6 pt-6 border-t border-[#333333]">
                <p className="text-xs text-[#808080] mb-1">Hosted by</p>
                <p className="font-medium">
                  {property.hostName}
                  {property.hostVerified && ' · Verified'}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}