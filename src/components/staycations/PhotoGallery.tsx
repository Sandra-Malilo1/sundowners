'use client';

import { useCallback, useEffect, useState } from 'react';

export default function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (dir: 1 | -1) => setOpen((i) => (i === null ? i : (i + dir + photos.length) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, close, step]);

  if (photos.length === 0) {
    return <div className="h-72 md:h-125 rounded-sm border border-emerald-300/15 bg-emerald-900/20" />;
  }

  const tile = 'relative overflow-hidden rounded-sm border border-emerald-300/15 bg-[#0a1f12] group cursor-pointer';
  const img = 'absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500';
  const extra = photos.length - 5;

  return (
    <>
      {/* Mobile: one hero image */}
      <button type="button" onClick={() => setOpen(0)} className={`${tile} md:hidden w-full h-72 block`} aria-label="Open photo gallery">
        <img src={photos[0]} alt={title} className={img} />
        <span className="absolute bottom-4 right-4 glass-panel px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] uppercase text-white">
          {photos.length} photos
        </span>
      </button>

      {/* Desktop: mosaic */}
      <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-3 h-125">
        <button type="button" onClick={() => setOpen(0)} className={`${tile} col-span-2 row-span-2`} aria-label="Open photo 1">
          <img src={photos[0]} alt={title} className={img} />
        </button>
        {photos.slice(1, 5).map((src, i) => (
          <button type="button" key={src + i} onClick={() => setOpen(i + 1)} className={tile} aria-label={`Open photo ${i + 2}`}>
            <img src={src} alt="" loading="lazy" className={img} />
            {i === 3 && extra > 0 && (
              <span className="absolute inset-0 bg-[#051009]/60 flex items-center justify-center font-mono text-[11px] tracking-[0.2em] uppercase text-white">
                +{extra} more
              </span>
            )}
          </button>
        ))}
      </div>

      {open !== null && (
        <div className="fixed inset-0 z-50 bg-[#020603]/95 flex items-center justify-center" role="dialog" aria-modal="true" onClick={close}>
          <img src={photos[open]} alt={title} className="max-w-[92vw] max-h-[84vh] object-contain" onClick={(e) => e.stopPropagation()} />
          <button type="button" onClick={close} aria-label="Close" className="absolute top-6 right-6 w-11 h-11 rounded-full border border-emerald-300/30 text-white hover:bg-emerald-500/20 transition-colors">✕</button>
          {photos.length > 1 && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); step(-1); }} aria-label="Previous photo" className="absolute left-4 md:left-8 w-11 h-11 rounded-full border border-emerald-300/30 text-white hover:bg-emerald-500/20 transition-colors">←</button>
              <button type="button" onClick={(e) => { e.stopPropagation(); step(1); }} aria-label="Next photo" className="absolute right-4 md:right-8 w-11 h-11 rounded-full border border-emerald-300/30 text-white hover:bg-emerald-500/20 transition-colors">→</button>
            </>
          )}
          <span className="absolute bottom-6 font-mono text-[10px] tracking-[0.3em] text-emerald-100/70">
            {open + 1} / {photos.length}
          </span>
        </div>
      )}
    </>
  );
}