"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import { certifications, education } from "@/lib/data";

function CertCard({
  title,
  issuer,
  detail,
  index,
}: {
  title: string;
  issuer: string;
  detail: string;
  index: number;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      onClick={() => setFlipped((v) => !v)}
      className="group relative h-56 w-full [perspective:1000px]"
      aria-label={`${title} certificate`}
    >
      <div
        className="relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d]"
        style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        <div className="absolute inset-0 rounded-2xl border border-primary/25 bg-gradient-to-br from-surface-elevated to-background p-6 [backface-visibility:hidden] box-glow">
          <p className="mono-label mb-6">cert_0{index + 1}</p>
          <h3 className="mb-2 text-xl font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-primary">{issuer}</p>
          <p className="mt-8 font-mono text-[11px] text-muted">hover / tap to flip</p>
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(120deg,transparent_30%,rgba(0,255,136,0.12)_50%,transparent_70%)] opacity-0 transition group-hover:opacity-100" />
        </div>
        <div className="absolute inset-0 rounded-2xl border border-accent/30 bg-surface p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <p className="mono-label mb-4">details</p>
          <p className="text-sm leading-relaxed text-foreground/85">{detail}</p>
          <p className="mt-8 font-mono text-xs text-accent">{issuer}</p>
        </div>
      </div>
    </motion.button>
  );
}

export default function CertsSection() {
  return (
    <section id="certifications" className="relative section-pad">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="05 — credentials"
          title="Certified & educated"
          description="Cloud and data foundations that back production engineering decisions."
        />

        <div className="mb-12 grid gap-6 md:grid-cols-3">
          {certifications.map((cert, index) => (
            <CertCard key={cert.id} {...cert} index={index} />
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {education.map((item) => (
            <div
              key={item.degree}
              className="rounded-2xl border border-primary/15 bg-surface/60 p-5"
            >
              <p className="mono-label mb-2">education</p>
              <h3 className="text-lg font-medium text-foreground">{item.degree}</h3>
              <p className="mt-1 text-sm text-muted">{item.school}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}