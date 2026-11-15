"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { Project } from "@/lib/data";
import MagneticButton from "@/components/ui/MagneticButton";

type ProjectCardProps = {
  project: Project;
  index: number;
};

export default function ProjectCard({ project, index }: ProjectCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), {
    stiffness: 200,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), {
    stiffness: 200,
    damping: 20,
  });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.15, duration: 0.7 }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="group relative overflow-hidden rounded-3xl border border-primary/20 bg-surface p-1"
    >
      <div
        className="relative overflow-hidden rounded-[22px] p-6 md:p-8"
        style={{
          background: `linear-gradient(145deg, rgba(17,17,17,0.95), rgba(10,10,10,0.98)), radial-gradient(circle at top right, ${project.accent}22, transparent 45%)`,
        }}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mono-label mb-3">project_0{index + 1}</p>
            <h3 className="heading-lg text-2xl md:text-3xl">{project.title}</h3>
          </div>
          {project.metric ? (
            <div className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-right">
              <p className="font-mono text-[10px] text-muted">METRIC</p>
              <p className="font-mono text-sm text-primary text-glow">{project.metric}</p>
            </div>
          ) : null}
        </div>

        <p className="mb-6 max-w-2xl text-muted leading-relaxed">{project.description}</p>

        <ul className="mb-8 space-y-2">
          {project.highlights.map((item) => (
            <li key={item} className="text-sm text-foreground/85">
              <span className="mr-2 text-primary">✦</span>
              {item}
            </li>
          ))}
        </ul>

        <div className="mb-8 flex flex-wrap gap-2">
          {project.tech.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-primary/20 bg-background/60 px-3 py-1 font-mono text-[11px] text-primary transition group-hover:border-primary/50 group-hover:shadow-[0_0_12px_rgba(0,255,136,0.25)]"
            >
              {tech}
            </span>
          ))}
        </div>

        <MagneticButton>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-2.5 text-sm text-primary transition hover:bg-primary hover:text-background"
          >
            Discuss Project
            <span aria-hidden>→</span>
          </a>
        </MagneticButton>

        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-3xl transition duration-500 group-hover:opacity-60"
          style={{ background: project.accent }}
        />
      </div>
    </motion.div>
  );
}