"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { contactUrl } from "./project-data";

const nav = [["Home", "/"], ["Over", "/about"], ["Werk", "/work"], ["Contact", "#contact"]] as const;

function Navigation({ footer = false }: { footer?: boolean }) {
  const pathname = usePathname();
  return <nav aria-label={footer ? "Footernavigatie" : "Hoofdnavigatie"} className="flex flex-wrap gap-x-4 gap-y-1 md:gap-x-5">
    {nav.map(([label, href]) => {
      const active = href !== "#contact" && pathname === href;
      return <Link key={label} href={href} className={`text-[17px] leading-[1.42857] transition-colors hover:text-[#111] ${active && !footer ? "text-[#111]" : "text-gray-400"}`}>{label}</Link>;
    })}
  </nav>;
}

export function Header() {
  return <header className="border-b border-gray-100 px-4 py-4">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-2">Ga naar inhoud</a>
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end md:gap-0">
      <div className="flex flex-col"><Link href="/" className="text-[17px] font-medium leading-[17px] lg:text-[20px] lg:leading-5">Chris Bleeker</Link><span className="mt-1 text-[17px] leading-[1.42857] text-gray-400">Websites × marketing × AI</span></div>
      <Navigation />
    </div>
  </header>;
}

export function Footer() {
  return <footer id="contact" className="bg-gray-100 px-4 pb-10 pt-10 md:pb-12 md:pt-16">
    <div className="flex flex-col gap-16 md:gap-64">
      <div>
        <h2 className="display footer-display tracking-[-2px] md:tracking-[-2.56px]">Een goed idee?<br />Laten we praten.</h2>
        <a className="display footer-display block text-[#b2b2b2] transition-colors hover:text-[#111]" href={contactUrl} target="_blank" rel="noreferrer">Stuur me een bericht ↗</a>
      </div>
      <a className="display footer-display block text-[#b2b2b2] transition-colors hover:text-[#111]" href={contactUrl} target="_blank" rel="noreferrer" aria-label="Chris Bleeker op LinkedIn (opent in nieuw tabblad)">LinkedIn</a>
    </div>
  </footer>;
}
