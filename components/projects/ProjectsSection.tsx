"use client";

import SectionHeading from "@/components/ui/SectionHeading";
import ProjectCard from "./ProjectCard";
import { projects } from "@/lib/data";

export default function ProjectsSection() {
  return (
    <section id="projects" className="relative section-pad grid-bg">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="04 — projects"
          title="Selected builds"
          description="Personal systems that blend Python backends with GenAI interfaces."
        />
        <div className="grid gap-8 perspective-[1200px]">
          {projects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}