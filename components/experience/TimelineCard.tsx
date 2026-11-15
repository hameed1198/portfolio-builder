"use client";

import GlowCard from "@/components/ui/GlowCard";
import type { ExperienceItem } from "@/lib/data";

type TimelineCardProps = {
  item: ExperienceItem;
};

export default function TimelineCard({ item }: TimelineCardProps) {
  return (
    <div className="relative w-[85vw] max-w-[420px] shrink-0 snap-center md:w-[380px]">
      <div className="mb-4 flex items-center gap-3">
        <span className="h-3 w-3 rounded-full bg-primary shadow-[0_0_12px_#00ff88]" />
        <span className="font-mono text-xs text-muted">{item.period}</span>
      </div>

      <GlowCard className="h-full p-6 transition duration-500 hover:-translate-y-1">
        <p className="mono-label mb-2">{item.company}</p>
        <h3 className="mb-4 text-xl font-semibold text-foreground md:text-2xl">{item.role}</h3>

        {item.projects?.map((project) => (
          <div key={project.name} className="mb-5 border-t border-primary/10 pt-4">
            <h4 className="mb-1 text-sm font-medium text-accent">{project.name}</h4>
            <p className="mb-2 font-mono text-[11px] text-muted">{project.role}</p>
            <ul className="space-y-2">
              {project.bullets.slice(0, 3).map((bullet) => (
                <li key={bullet} className="text-sm leading-relaxed text-foreground/80">
                  <span className="mr-2 text-primary">▹</span>
                  {bullet}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              {project.tech.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] font-mono text-primary"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        ))}

        {item.bullets?.map((bullet) => (
          <p key={bullet} className="mb-3 text-sm leading-relaxed text-foreground/80">
            <span className="mr-2 text-primary">▹</span>
            {bullet}
          </p>
        ))}

        {!item.projects ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {item.tech.map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] font-mono text-primary"
              >
                {tech}
              </span>
            ))}
          </div>
        ) : null}
      </GlowCard>
    </div>
  );
}