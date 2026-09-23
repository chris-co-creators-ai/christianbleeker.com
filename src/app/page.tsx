import Image from "next/image";
import Link from "next/link";
import { asset } from "@/components/sites/www-arturospatino-com-b978ad0e/shared/assets";
import { CaseCard } from "@/components/sites/www-arturospatino-com-b978ad0e/shared/case-card";
import { ImageViewer } from "@/components/sites/www-arturospatino-com-b978ad0e/shared/image-viewer";
import { projects } from "@/components/sites/www-arturospatino-com-b978ad0e/shared/project-data";
import { ServiceIcon } from "@/components/sites/www-arturospatino-com-b978ad0e/shared/service-icon";

const services = [
  { number: "001", name: "Websites", tagline: "Jouw verhaal helder op het web.", text: "Ik maak een website die laat zien wie je bent, wat je doet en waarom dat voor jouw bezoekers belangrijk is.", icon: 1 },
  { number: "002", name: "Ontwerp", tagline: "Een uitstraling die bij je past.", text: "Van eerste indruk tot laatste detail: inhoud en vorm werken samen om jouw merk herkenbaar te maken.", icon: 2 },
  { number: "003", name: "Marketing", tagline: "Vijftien jaar ervaring in de mix.", text: "Ik kijk niet alleen naar een mooie pagina, maar ook naar de mensen die je wilt bereiken en de stap die zij willen zetten.", icon: 3 },
  { number: "004", name: "AI & producten", tagline: "Technologie met een menselijk doel.", text: "Ik onderzoek hoe AI en digitale producten echte vragen kunnen helpen oplossen, zonder jouw eigen stem te verliezen.", icon: 4 },
];
const logoNames = ["brand/kinderopvang-ikke.png", "brand/radstok-interim.svg", "brand/win-instituut.png", "brand/driftawave.svg", "brand/co-creatie.png", "brand/souplesse.svg", "brand/offbeat-peak.png", "brand/digital-waves.svg", "brand/fuselabs.png"];
const logoTone: Record<string, string> = { "brand/kinderopvang-ikke.png": "marquee-line-logo" };
const heroWords = ["Jouw", "verhaal.", "Sterk", "op", "het", "web."];

function HeroTitle() {
  return <h1 className="display home-hero-title max-w-[540px]" aria-label="Jouw verhaal. Sterk op het web.">
    {heroWords.map((word, index) => <span key={word} className="inline-block whitespace-nowrap" aria-hidden="true">{[...word].map((letter, letterIndex) => <span key={letterIndex} className={`hero-letter inline-block ${index >= 2 ? "muted" : ""}`} style={{ animationDelay: `${(heroWords.slice(0, index).join("").length + letterIndex) * 18}ms` }}>{letter}</span>)}{index < heroWords.length - 1 && <span className="inline-block">{"\u00a0"}</span>}</span>)}
  </h1>;
}

export default function Home() {
  return <main id="main-content">
    <section className="px-4 pb-2 pt-4"><div className="site-grid home-hero-grid mx-auto max-w-[1440px] items-stretch"><div className="flex flex-col justify-end gap-6 py-4 md:gap-10 md:py-16">
      <HeroTitle />
      <p className="copy home-hero-copy max-w-[540px]">Ik bouw websites voor MKB-bedrijven, zelfstandig ondernemers en makers. Met 15 jaar marketingervaring en een slimme blik op AI.</p>
    </div><div><div className="image-frame relative aspect-[3/4] md:aspect-square"><Image src={asset("chris-hero.jpg")} alt="Chris Bleeker glimlacht en steekt beide duimen op" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover object-[center_27%]" priority /></div></div></div></section>
    <section className="px-4 pb-10 md:pb-16"><div className="image-frame relative mx-auto aspect-square max-w-[1440px] md:aspect-[2/1]"><Image src={asset("media/tedx-stage-original.png")} alt="Chris Bleeker op het podium bij TEDxEindhoven" fill sizes="(min-width: 1472px) 1440px, 100vw" className="object-cover" priority /></div></section>
    <section className="site-grid home-info-grid border-t border-gray-100 px-4 py-16 md:py-24"><h2 className="section-title">Over mij</h2><div data-reveal><p className="copy max-w-[650px] text-gray-500">Ik ben Chris Bleeker. Ik help ondernemers en teams hun verhaal online duidelijk te maken. Mijn achtergrond in marketing en mijn nieuwsgierigheid naar AI neem ik mee in websites en digitale producten die voor mensen werken.</p><Link href="/about" className="mt-4 inline-block text-[17px] text-gray-400 underline underline-offset-4 transition-colors hover:text-[#111] lg:text-[20px]">Meer over mij</Link></div></section>
    <section className="border-t border-gray-100 px-4 py-16 md:py-24"><div className="site-grid mb-6 md:mb-8"><h2 className="section-title">Wat ik doe</h2></div><div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">{services.map(service => <div key={service.number} data-reveal className="flex flex-col gap-28 rounded-lg border border-gray-200 p-6"><div className="flex flex-col"><span className="text-[14px] leading-[1.333333] text-gray-400">{service.number}</span><div className="relative mt-6 size-20 md:size-[100px]"><ServiceIcon number={service.icon} /></div></div><div><h3 className="text-[24px] font-medium leading-[1.4] tracking-[-.03em] lg:text-[28px]">{service.name}</h3><p className="mb-4 mt-2 text-[17px] font-medium leading-[1.42857]">{service.tagline}</p><p className="text-[17px] leading-[1.625] text-gray-400">{service.text}</p></div></div>)}</div></section>
    <section className="border-t border-gray-100 px-4 py-16 md:py-24"><div className="site-grid home-work-grid mb-6 md:mb-8" data-reveal><h2 className="section-title">Werk</h2><div><p className="text-[17px] leading-[1.625] text-gray-500">Een selectie van websites die ik heb mogen maken, van kinderopvang en coaching tot teamreizen en AI.</p><Link href="/work" className="mt-4 inline-block text-[17px] text-gray-400 underline underline-offset-4 transition-colors hover:text-[#111]">Bekijk alle projecten</Link></div></div><div className="grid grid-cols-1 gap-2 md:grid-cols-3"><CaseCard project={projects["offbeat-peak"]} /><CaseCard project={projects["digital-waves"]} /><div data-reveal><ImageViewer images={["projects/driftawave-cover.png", "projects/radstok-interim-cover.png", "projects/fuselabs-cover.png", "projects/souplesse-runners-boutique-cover.png"]} columns="grid-cols-2" /><p className="mt-3 text-[17px]">Meer projecten</p><p className="text-[14px] text-gray-400">Verschillende merken, hun eigen verhaal</p></div></div></section>
    <section className="overflow-hidden border-t border-gray-100 py-16 md:py-24"><div className="logo-marquee flex w-max items-center">{[...logoNames, ...logoNames].map((name, index) => <Image key={`${name}-${index}`} src={asset(name)} alt="" width={160} height={80} sizes="240px" className={`h-12 w-auto shrink-0 object-contain md:h-20 ${logoTone[name] ?? ""}`} />)}</div></section>
  </main>;
}
