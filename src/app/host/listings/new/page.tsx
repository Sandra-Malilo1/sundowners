'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { createDraft } from '@/lib/host';
import { Card, TypePicker } from '@/components/host/formBits';
import type { PropertyType } from '@/lib/staycations';

export default function NewListingPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [type, setType] = useState<PropertyType | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const start = async () => {
    if (!type) return;
    setBusy(true);
    setError('');
    try {
      const id = await createDraft(type);
      await qc.invalidateQueries({ queryKey: ['host-listings'] });
      router.replace(`/host/listings/${id}/edit?step=2`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the listing.');
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-[40px] md:text-[48px] text-white tracking-tight leading-[1.1] mb-3">New listing</h1>
      <p className="text-[17px] text-emerald-50/70 mb-10">Let’s start with the kind of place you’re listing.</p>

      <Card title="What kind of place is it?" subtitle="Pick the closest match. You can change this later.">
        <TypePicker value={type} onChange={setType} />
      </Card>

      {error && <div role="alert" className="mt-6 px-5 py-4 rounded-xl border border-red-400/40 bg-red-500/10 text-red-200 text-[16px]">{error}</div>}

      <div className="mt-8 flex items-center justify-between">
        <Link href="/host/listings" className="text-[15px] font-medium text-emerald-100/70 underline underline-offset-4 hover:text-white transition-colors">Cancel</Link>
        <button type="button" onClick={start} disabled={!type || busy} className="h-13 px-8 rounded-xl bg-emerald-400 text-black text-[16px] font-semibold hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {busy ? 'Creating…' : 'Continue'}
        </button>
      </div>
    </div>
  );
}