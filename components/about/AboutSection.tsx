"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import TextReveal from "@/components/ui/TextReveal";
import StatCard from "./StatCard";
import { personalInfo, stats } from "@/lib/data";

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [imgError, setImgError] = useState(false);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <section id="about" ref={sectionRef} className="relative section-pad grid-bg">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="01 — about"
          title="Engineer with a cinematic edge"
          description="Backend-heavy full stack builder who ships reliable systems and GenAI products."
        />

        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.div style={{ y }} className="relative mx-auto w-full max-w-sm">
            <div className="hologram-border relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface">
              {!imgError ? (
                <Image
                  src={personalInfo.photo}
                  alt={personalInfo.name}
                  fill
                  className="object-cover opacity-90 contrast-125 saturate-75"
                  onError={() => setImgError(true)}
                  priority={false}
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-surface-elevated to-background p-8 text-center">
                  <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-full border border-primary/40 bg-primary/10 font-mono text-4xl text-primary text-glow">
                    HK
                  </div>
                  <p className="font-mono text-sm text-muted">Photo placeholder</p>
                  <p className="mt-2 text-xs text-muted/70">
                    Replace /public/images/profile.svg with your photo
                  </p>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-primary/5" />
              <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-primary/20 bg-background/70 px-3 py-2 backdrop-blur-md">
                <p className="font-mono text-xs text-primary">{personalInfo.location}</p>
                <p className="text-sm text-foreground">{personalInfo.title}</p>
              </div>
            </div>
          </motion.div>

          <div>
            <TextReveal
              text={personalInfo.summary}
              className="mb-8 text-base leading-relaxed text-foreground/90 md:text-lg"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {stats.map((stat, index) => (
                <StatCard key={stat.label} {...stat} index={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}