import Image from "next/image";
import Link from "next/link";
import { asset } from "./assets";
import type { Project } from "./project-data";

export function CaseCard({ project }: { project: Project }) {
  return <Link href={`/work/${project.slug}`} data-reveal className="group block min-w-0"><div className="image-frame relative mb-3 aspect-[3/4] bg-gray-100"><Image src={asset(project.cover)} alt={`Portfolio-creative voor de website van ${project.name}`} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover hover-image" priority={project.slug === "offbeat-peak"} /></div><p className="text-[17px] leading-6">{project.name}</p><p className="text-[14px] text-gray-400">{project.type}</p></Link>;
}
