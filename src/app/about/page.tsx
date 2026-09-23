import Image from "next/image";
import { asset } from "@/components/sites/www-arturospatino-com-b978ad0e/shared/assets";
import { projectOrder, projects } from "@/components/sites/www-arturospatino-com-b978ad0e/shared/project-data";
import { YoutubeVideo } from "./youtube-video";

const bio = [
  "Hoi, ik ben Chris Bleeker. Ik maak websites voor ondernemers, makers en teams die hun verhaal helder op het web willen zetten.",
  "Ik neem vijftien jaar marketingervaring mee in mijn werk. Daardoor kijk ik niet alleen naar hoe een website eruitziet, maar vooral naar wat bezoekers nodig hebben om je te begrijpen en een volgende stap te zetten.",
  "Ik houd van de combinatie van inhoud, ontwerp en technologie. Een goede website begint voor mij bij de mensen erachter: wat maakt hun werk waardevol, en hoe laat je dat online voelen?",
  "Naast websites werk ik met AI en digitale producten. Met Dicteren.ai bouwen we aan een manier om gesproken ideeën om te zetten in bruikbare tekst. Ik gaf een TEDx-talk over AI en sprak in podcasts over technologie en ondernemerschap.",
  "Wil je samen iets maken dat echt bij jouw verhaal past? Stuur me gerust een bericht.",
];

const knownFor = [
  { name: "DenkProducties", image: "media/denkproducties_logo.jpg", width: 900, height: 900, href: "https://www.denkproducties.nl/experts/chris-bleeker" },
  { name: "TEDxEindhoven", image: "media/tedxeindhoven-logo.jpeg", width: 200, height: 200, href: "https://www.youtube.com/watch?v=eOZOeLhRdcs" },
  { name: "Dat is wel speciaal", image: "media/dat_is_wel_speciaal_podcast.jpg", width: 544, height: 617, href: "https://open.spotify.com/episode/3En3qEFfzzAaWAwRslOUJq" },
];

const recommendations = [
  { name: "Sven Dresen", file: "review_sven_christian_bleeker_ai_expert.png", width: 776, height: 284 },
  { name: "Gina Schinkel", file: "review_gina_christian_bleeker_ai_expert.png", width: 788, height: 417 },
  { name: "Els Verheirstraeten", file: "review_els_christian_bleeker_ai_expert.png", width: 786, height: 343 },
  { name: "Annemieke Jongbloed", file: "review_annemieke_christian_bleeker_ai_expert.png", width: 778, height: 415 },
  { name: "Bernard Albada Jelgersma", file: "review_bernard_christian_bleeker_ai_expert.png", width: 781, height: 407 },
  { name: "Edwin van Beers", file: "review_edwin_christian_bleeker_ai_expert.png", width: 776, height: 179 },
  { name: "Ela Zakrzewska", file: "review_ela_christian_bleeker_ai_expert.png", width: 778, height: 299 },
];

export default function About() {
  return <main id="main-content">
    <section className="px-4 pb-4 pt-4 md:pb-14"><div className="image-frame relative aspect-[2/1]" data-reveal><Image src={asset("media/tedx-stage-original.png")} alt="Chris Bleeker op het podium bij TEDxEindhoven" fill sizes="100vw" className="object-cover" priority /></div></section>
    <section className="site-grid about-grid about-intro divider-section"><h1 className="section-title">Over mij</h1><div className="space-y-4" data-reveal>{bio.map(text => <p key={text} className="copy">{text}</p>)}</div></section>
    <section className="divider-section"><div className="site-grid about-grid"><h2 className="section-title md:sticky md:top-4 md:self-start">Bekend van</h2><div className="grid grid-cols-1 gap-3 sm:grid-cols-3" data-reveal>{knownFor.map(item => <a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer" className="group min-w-0"><div className="flex aspect-square items-center justify-center rounded-lg border border-gray-100 bg-white p-5"><Image src={asset(item.image)} alt={item.name} width={item.width} height={item.height} sizes="(min-width: 640px) 17vw, 100vw" className="max-h-36 w-auto max-w-full object-contain" /></div><span className="mt-3 block text-[17px] text-gray-500 transition-colors group-hover:text-[#111]">{item.name} ↗</span></a>)}</div></div></section>
    <section className="divider-section"><div className="site-grid about-grid"><h2 className="section-title md:sticky md:top-4 md:self-start">Websites</h2><div className="grid grid-cols-3 items-center gap-x-4 md:grid-cols-4" data-reveal>{projectOrder.map(slug => { const project = projects[slug]; return <div key={slug} className="relative h-[60px] w-full md:h-20"><Image src={asset(project.cover)} alt={project.name} fill sizes="(min-width: 1024px) 200px, 33vw" className="object-contain object-left" /></div>; })}</div></div></section>
    <section className="divider-section"><div className="mb-8 flex items-baseline justify-between gap-4"><h2 className="section-title">Ervaringen</h2><p className="text-[14px] text-gray-400">Klik om te vergroten</p></div><div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">{[0, 1].map(column => <div key={column} className={`flex flex-col gap-4 lg:gap-6 ${column === 1 ? "lg:pt-12" : ""}`}>{recommendations.filter((_, index) => index % 2 === column).map(recommendation => <figure key={recommendation.file} data-reveal className="overflow-hidden rounded-lg border border-gray-200 bg-white p-2"><a href={asset(`reviews/${recommendation.file}`)} target="_blank" rel="noopener noreferrer" aria-label={`Open de volledige LinkedIn-aanbeveling van ${recommendation.name}`} className="block focus-visible:outline-2 focus-visible:outline-[#111]"><Image src={asset(`reviews/${recommendation.file}`)} alt={`LinkedIn-aanbeveling van ${recommendation.name} voor Christian Bleeker`} width={recommendation.width} height={recommendation.height} sizes="(min-width: 1024px) 50vw, 100vw" className="h-auto w-full" /></a></figure>)}</div>)}</div></section>
    <section className="divider-section"><div className="site-grid about-grid"><h2 className="section-title md:sticky md:top-4 md:self-start">In gesprek</h2><div className="space-y-12" data-reveal>
      <article><h3 className="mb-4 text-[20px] font-medium">Mijn TEDx-talk</h3><YoutubeVideo videoId="eOZOeLhRdcs" title="TEDx-talk van Christian Bleeker" playLabel="Speel mijn TEDx-talk af" poster={asset("media/tedx-stage-original.png")} posterFit="contain" /><a href="https://www.youtube.com/watch?v=eOZOeLhRdcs" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-[17px] text-gray-500 underline underline-offset-4 hover:text-[#111]">Bekijk op YouTube ↗</a></article>
      <article><h3 className="mb-4 text-[20px] font-medium">Dat is wel speciaal</h3><iframe src="https://open.spotify.com/embed/episode/3En3qEFfzzAaWAwRslOUJq" title="Dat is wel speciaal-podcast met Christian Bleeker" width="100%" height="352" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowFullScreen className="block w-full rounded-lg" /><a href="https://open.spotify.com/episode/3En3qEFfzzAaWAwRslOUJq" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-[17px] text-gray-500 underline underline-offset-4 hover:text-[#111]">Luister op Spotify ↗</a></article>
      <article><h3 className="mb-4 text-[20px] font-medium">DenkTank bij DenkProducties</h3><YoutubeVideo videoId="ZAmHKw7I4YM" title="DenkTank #137 met Chris Bleeker van DenkProducties" playLabel="Speel de DenkTank-video af" poster="https://i.ytimg.com/vi/ZAmHKw7I4YM/maxresdefault.jpg" /><a href="https://www.youtube.com/watch?v=ZAmHKw7I4YM" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-[17px] text-gray-500 underline underline-offset-4 hover:text-[#111]">Bekijk op YouTube ↗</a><a href="https://www.denkproducties.nl/podcast/denktank-137-chris-bleeker-over-ai-partners-technologie-die-je-denken-verrijkt" target="_blank" rel="noopener noreferrer" className="ml-5 inline-block text-[17px] text-gray-500 underline underline-offset-4 hover:text-[#111]">Meer bij DenkProducties ↗</a></article>
    </div></div></section>
  </main>;
}
