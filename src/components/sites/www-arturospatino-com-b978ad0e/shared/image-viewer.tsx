"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { asset } from "./assets";

export function ImageViewer({ images, columns = "grid-cols-3 md:grid-cols-5", className = "" }: { images: string[]; columns?: string; className?: string }) {
  const [active, setActive] = useState<number | null>(null);
  const close = useCallback(() => setActive(null), []);
  const shift = useCallback((delta: number) => setActive(current => current === null ? null : (current + delta + images.length) % images.length), [images.length]);
  useEffect(() => {
    if (active === null) return;
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") shift(-1);
      if (event.key === "ArrowRight") shift(1);
    };
    document.addEventListener("keydown", keydown);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", keydown); document.body.style.overflow = original; };
  }, [active, close, shift]);
  return <>
    <div className={`grid gap-1 ${columns} ${className}`}>{images.map((name, index) => <button key={name} type="button" aria-label={`Open projectbeeld ${index + 1}`} onClick={() => setActive(index)} className="image-frame aspect-[3/4] cursor-pointer bg-gray-100 focus-visible:outline-2 focus-visible:outline-[#111]"><Image src={asset(name)} alt={`Projectbeeld ${index + 1}`} fill sizes="(min-width: 1024px) 20vw, 33vw" className="object-cover hover-image" /></button>)}</div>
    {active !== null && <div role="dialog" aria-modal="true" aria-label="Projectbeelden" className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90" onClick={close}>
      <button type="button" aria-label="Sluiten" className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={close}>×</button>
      <button type="button" aria-label="Vorige" className="absolute left-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20" onClick={event => { event.stopPropagation(); shift(-1); }}>‹</button>
      <div className="relative h-[80vh] w-[80vw]" onClick={event => event.stopPropagation()}><Image src={asset(images[active])} alt={`Projectbeeld ${active + 1}`} fill sizes="80vw" className="object-contain" /></div>
      <button type="button" aria-label="Volgende" className="absolute right-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20" onClick={event => { event.stopPropagation(); shift(1); }}>›</button>
      <span className="absolute bottom-6 text-sm text-white">{active + 1} / {images.length}</span>
    </div>}
  </>;
}
