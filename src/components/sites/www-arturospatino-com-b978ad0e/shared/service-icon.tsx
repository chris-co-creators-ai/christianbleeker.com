"use client";

import dynamic from "next/dynamic";
import { asset } from "./assets";

const Lottie = dynamic(() => import("lottie-react").then(module => module.Lottie), { ssr: false });

export function ServiceIcon({ number }: { number: number }) {
  return <Lottie src={asset(`service-${number}.json`)} autoplay loop className={`h-full w-full ${number === 2 ? "scale-[2.2]" : ""}`} aria-hidden="true" />;
}
