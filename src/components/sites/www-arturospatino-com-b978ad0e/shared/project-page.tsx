import Image from "next/image";
import Link from "next/link";
import { asset } from "./assets";
import { projects, type Project } from "./project-data";

export function ProjectPage({ project }: { project: Project }) {
  const next = projects[project.next];
  return <main id="main-content">
    <section className="px-4 pb-10 pt-10 md:pb-14 md:pt-14"><div className="site-grid gap-y-6"><div className="hidden md:block" /><div>
      <h1 className="display mb-8" data-reveal>{project.name}</h1>
      <div className="flex flex-wrap gap-x-8 gap-y-5">
        <div><p className="mb-1 text-[14px] leading-[1.333333] text-gray-400">Project</p><p className="text-[17px] leading-[1.42857]">{project.type}</p></div>
        <div><p className="mb-1 text-[14px] leading-[1.333333] text-gray-400">In het kort</p><p className="text-[17px] leading-[1.42857]">{project.summary}</p></div>
      </div>
    </div></div></section>
    <div data-reveal className="px-4"><div className="image-frame relative aspect-[10/7] w-full bg-gray-100"><Image src={asset(project.hero)} alt={`Casebeeld van de website van ${project.name}`} fill sizes="100vw" className="object-cover" priority /></div></div>
    <section className="site-grid gap-y-6 px-4 py-10 md:py-16"><div className="hidden md:block" /><div className="space-y-4" data-reveal>{project.intro.map(text => <p key={text} className="copy">{text}</p>)}</div></section>
    <section className="divider-section site-grid case-editorial"><h2 className="section-title">Ontwerpdoel</h2><p className="copy" data-reveal>{project.designGoals}</p></section>
    <Link href={`/work/${next.slug}`} className="block border-t border-gray-100 bg-white px-4 py-8 transition-colors hover:bg-gray-50 md:py-10"><div className="flex items-end justify-between"><div><span className="mb-1 block text-[14px] leading-[1.333333] text-gray-800">Volgend project</span><span className="display next-project-title block">{next.name}</span></div><span className="pb-4 text-[17px] leading-[1.42857]">Bekijk →</span></div></Link>
  </main>;
}
