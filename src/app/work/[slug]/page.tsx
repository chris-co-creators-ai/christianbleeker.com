import { notFound } from "next/navigation";
import { ProjectPage } from "@/components/sites/www-arturospatino-com-b978ad0e/shared/project-page";
import { projectOrder, projects } from "@/components/sites/www-arturospatino-com-b978ad0e/shared/project-data";

export function generateStaticParams() {
  return projectOrder.map(slug => ({ slug }));
}

export default async function WorkProject({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects[slug];
  if (!project) notFound();
  return <ProjectPage project={project} />;
}
