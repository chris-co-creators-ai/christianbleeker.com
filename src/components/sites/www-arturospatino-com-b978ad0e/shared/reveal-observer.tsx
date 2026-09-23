"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const elements = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute("data-reveal-visible", "");
        observer.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -5% 0px", threshold: 0.05 });

    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
