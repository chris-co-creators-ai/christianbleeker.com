"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { websiteChecklistPrompt } from "@/lib/website-checklist-prompt";
import { contactUrl } from "./project-data";

const nav = [["Home", "/"], ["Over", "/about"], ["Werk", "/work"], ["Contact", "#contact"]] as const;
const websiteChecklistUrl = `https://chatgpt.com/?${new URLSearchParams({ prompt: websiteChecklistPrompt })}`;

function Navigation({ footer = false }: { footer?: boolean }) {
  const pathname = usePathname();
  return <nav aria-label={footer ? "Footernavigatie" : "Hoofdnavigatie"} className="flex flex-wrap items-center gap-x-4 gap-y-1 md:gap-x-5">
    {nav.map(([label, href]) => {
      const active = href !== "#contact" && pathname === href;
      return <Link key={label} href={href} className={`text-[17px] leading-[1.42857] transition-colors hover:text-[#111] ${active && !footer ? "text-[#111]" : "text-gray-400"}`}>{label}</Link>;
    })}
    {!footer && <a href={websiteChecklistUrl} target="_blank" rel="noopener noreferrer" aria-label="Website-checklist prompt openen in ChatGPT (nieuw tabblad)" className="inline-flex items-center gap-2 rounded-full border border-gray-200 py-1.5 pl-1.5 pr-3 text-[15px] leading-none transition-colors hover:border-gray-400 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
      <span className="relative block h-7 w-7 shrink-0 overflow-hidden rounded-[7px]" aria-hidden="true"><Image src="/chris/media/chatgpt_logo.png" alt="" width={83} height={46} className="absolute left-0 top-[-7px] max-w-none" /></span>
      <span>Website-checklist prompt</span>
      <span aria-hidden="true" className="text-gray-400">↗</span>
    </a>}
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
