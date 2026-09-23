"use client";

import { useState } from "react";
import Image from "next/image";

type YoutubeVideoProps = {
  videoId: string;
  title: string;
  playLabel: string;
  poster: string;
  posterFit?: "contain" | "cover";
};

export function YoutubeVideo({ videoId, title, playLabel, poster, posterFit = "cover" }: YoutubeVideoProps) {
  const [playing, setPlaying] = useState(false);

  return <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
    {playing ? <iframe src={`https://www.youtube.com/embed/${videoId}?autoplay=1`} title={title} allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="h-full w-full" /> :
      <button type="button" aria-label={playLabel} onClick={() => setPlaying(true)} className="group relative block h-full w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white">
        <Image src={poster} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className={posterFit === "contain" ? "object-contain" : "object-cover"} />
        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center"><span className="flex size-16 items-center justify-center rounded-full bg-black/75 pl-1 text-3xl text-white transition-transform group-hover:scale-110">▶</span></span>
      </button>}
  </div>;
}
