'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getMyListing } from '@/lib/host';
import ListingWizard from '@/components/host/ListingWizard';

function EditView() {
  const { id } = useParams<{ id: string }>();
  const q = useQuery({ queryKey: ['host-listing', id], queryFn: () => getMyListing(id), staleTime: 0, refetchOnWindowFocus: false });

  if (q.isLoading) return <div className="h-96 rounded-2xl bg-emerald-900/20 animate-pulse" />;
  if (!q.data) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-serif text-[32px] text-white mb-4">Listing not found</h1>
        <Link href="/host/listings" className="text-[16px] font-medium text-emerald-300 underline underline-offset-4">Back to my listings</Link>
      </div>
    );
  }
  // key = id so switching listings resets the form; the form itself is NOT re-created on every save
  return (
    <div>
      <h1 className="font-serif text-[36px] md:text-[44px] text-white tracking-tight leading-[1.1] mb-8 truncate">
        {q.data.title === 'Untitled listing' ? 'New listing' : q.data.title}
      </h1>
      <ListingWizard key={q.data.id} listing={q.data} />
    </div>
  );
}

export default function EditListingPage() {
  return (
    <Suspense fallback={null}>
      <EditView />
    </Suspense>
  );
}