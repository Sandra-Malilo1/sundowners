'use client';

import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MIN_PHOTOS, MIN_PHOTO_WIDTH, deletePhoto, getListingPhotos, imageWidth, makeCover, uploadPhoto } from '@/lib/host';

const MAX_BYTES = 10 * 1024 * 1024;
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export default function PhotoUploader({ listingId }: { listingId: string }) {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [problems, setProblems] = useState<string[]>([]);

  const photosQ = useQuery({ queryKey: ['host-photos', listingId], queryFn: () => getListingPhotos(listingId), staleTime: 0 });
  const photos = photosQ.data ?? [];
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ['host-photos', listingId] }), qc.invalidateQueries({ queryKey: ['host-listing', listingId] })]);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setProblems([]);
    const issues: string[] = [];
    let pos = photos.length;
    const list = Array.from(files);

    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      setProgress(`Uploading ${i + 1} of ${list.length}…`);
      if (!OK_TYPES.includes(f.type)) { issues.push(`${f.name}: use a JPG, PNG, WebP or AVIF image.`); continue; }
      if (f.size > MAX_BYTES) { issues.push(`${f.name}: over 10 MB.`); continue; }
      try {
        const w = await imageWidth(f);
        if (w < MIN_PHOTO_WIDTH) { issues.push(`${f.name}: too small (${w}px wide, needs ${MIN_PHOTO_WIDTH}px or more).`); continue; }
        await uploadPhoto(listingId, f, pos);
        pos += 1;
      } catch (e) {
        issues.push(`${f.name}: ${e instanceof Error ? e.message : 'upload failed'}`);
      }
    }
    setBusy(false);
    setProgress('');
    setProblems(issues);
    if (input.current) input.current.value = '';
    await refresh();
  };

  const remove = async (id: string) => {
    const photo = photos.find((p) => p.id === id);
    if (!photo) return;
    setBusy(true);
    try {
      await deletePhoto(listingId, photo);
    } finally {
      setBusy(false);
      await refresh();
    }
  };

  const cover = async (id: string) => {
    setBusy(true);
    try {
      await makeCover(listingId, id, photos);
    } finally {
      setBusy(false);
      await refresh();
    }
  };

  const enough = photos.length >= MIN_PHOTOS;

  return (
    <div>
      <label
        htmlFor="photo-input"
        className={`block rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
          busy ? 'border-emerald-300/20 opacity-60 pointer-events-none' : 'border-emerald-300/30 hover:border-emerald-300/60 hover:bg-white/5'
        }`}
      >
        <p className="text-[18px] font-medium text-white mb-1">{busy ? progress || 'Working…' : 'Click to add photos'}</p>
        <p className="text-[15px] text-emerald-100/60">JPG, PNG, WebP or AVIF · at least {MIN_PHOTO_WIDTH}px wide · up to 10 MB each</p>
        <input id="photo-input" ref={input} type="file" accept={OK_TYPES.join(',')} multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} />
      </label>

      <p className={`mt-4 text-[16px] font-medium ${enough ? 'text-emerald-300' : 'text-amber-300'}`}>
        {photos.length} of {MIN_PHOTOS} photos {enough ? '✓' : `(add ${MIN_PHOTOS - photos.length} more to send for review)`}
      </p>

      {problems.length > 0 && (
        <ul role="alert" className="mt-4 space-y-1 rounded-xl border border-red-400/40 bg-red-500/10 px-5 py-4 text-[15px] text-red-200">
          {problems.map((p) => <li key={p}>{p}</li>)}
        </ul>
      )}

      {photos.length > 0 && (
        <ul className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((p, i) => (
            <li key={p.id} className="rounded-xl overflow-hidden border border-emerald-300/15 bg-[#0a1f12]">
              <div className="relative aspect-4/3">
                <img src={p.url} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                {i === 0 && <span className="absolute top-2 left-2 rounded-full bg-emerald-400 px-3 py-1 text-[12px] font-semibold text-black">Cover</span>}
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 text-[14px]">
                {i === 0 ? <span className="text-emerald-100/50">Main photo</span> : (
                  <button type="button" onClick={() => cover(p.id)} className="font-medium text-emerald-300 hover:text-white transition-colors">Make cover</button>
                )}
                <button type="button" onClick={() => remove(p.id)} className="font-medium text-red-300 hover:text-red-200 transition-colors">Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 rounded-xl bg-white/5 p-5">
        <p className="text-[15px] font-semibold text-white mb-2">Shots guests look for</p>
        <p className="text-[15px] text-emerald-100/65 leading-relaxed">
          Outside / front of the property · Living area · Kitchen · Every bedroom · Bathrooms · The view · Pool, garden or terrace · A detail that makes it special
        </p>
      </div>
    </div>
  );
}