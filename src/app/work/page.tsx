import Image from "next/image";
import { asset } from "@/components/sites/www-arturospatino-com-b978ad0e/shared/assets";
import { CaseCard } from "@/components/sites/www-arturospatino-com-b978ad0e/shared/case-card";
import { projectOrder, projects } from "@/components/sites/www-arturospatino-com-b978ad0e/shared/project-data";

const dicterenTeam = [
  { name: "Chris", file: "chris.png" },
  { name: "Brian", file: "brian.jpeg" },
  { name: "Lars", file: "lars.png" },
];

export default function Work() {
  return <main id="main-content"><section className="px-4 pb-12 pt-10 md:pb-[100px] md:pt-14"><div className="site-grid"><div className="hidden md:block" /><div><h1 data-reveal className="display work-display"><span className="muted">Elk merk heeft een </span>eigen verhaal<span className="muted">. Ik help het </span>zichtbaar<span className="muted"> te maken op het web.</span></h1></div></div></section>
    <section className="px-4 pb-10 pt-6 md:pb-12 md:pt-0"><h2 className="section-title mb-6">Websites</h2><div className="grid grid-cols-2 gap-2 md:grid-cols-4">{projectOrder.map(slug => <CaseCard key={slug} project={projects[slug]} />)}</div></section>
    <section className="border-t border-gray-100 px-4 py-10 md:py-12">
      <div className="site-grid about-grid" data-reveal>
        <h2 className="section-title mb-6 md:mb-8">Eigen product</h2>
        <div>
          <div className="image-frame relative aspect-[5/3] bg-gray-100"><Image src={asset("brand/dicteren.png")} alt="Dicteren.ai" fill sizes="(min-width: 768px) 60vw, 100vw" className="object-contain p-8" /></div>
          <p className="copy mt-5">Met Dicteren.ai bouw ik samen met Brian en Lars aan een app die gesproken ideeën omzet in bruikbare tekst.</p>
        </div>
      </div>
      <div role="group" aria-label="Het team van Dicteren.ai" className="mt-10 grid grid-cols-1 gap-2 md:mt-14 md:grid-cols-3" data-reveal>
        {dicterenTeam.map(({ name, file }, index) => <figure key={name} className={index === 1 ? "md:pt-8" : ""}>
          <div className="image-frame relative aspect-[4/5] bg-gray-100"><Image src={asset(`team/${file}`)} alt={`Portret van ${name}`} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover object-top" /></div>
          <figcaption className="mt-3 text-[17px] text-gray-500">{name}</figcaption>
        </figure>)}
      </div>
    </section>
  </main>;
}
