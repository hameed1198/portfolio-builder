"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import { skillCategories } from "@/lib/data";

const SkillGlobe = dynamic(() => import("./SkillGlobe"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] items-center justify-center rounded-2xl border border-primary/15 bg-surface/40 font-mono text-sm text-muted">
      loading skill matrix...
    </div>
  ),
});

export default function SkillsSection() {
  const [active, setActive] = useState(skillCategories[0].id);
  const activeCategory = skillCategories.find((c) => c.id === active) ?? skillCategories[0];

  return (
    <section id="skills" className="relative section-pad">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="03 — skills"
          title="Tech arsenal"
          description="A matrix of languages, frameworks and platforms I use to ship production systems."
        />

        <div className="grid gap-10 lg:grid-cols-2">
          <SkillGlobe />

          <div>
            <div className="mb-6 flex flex-wrap gap-2">
              {skillCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActive(category.id)}
                  className={`rounded-full px-4 py-2 font-mono text-xs transition ${
                    active === category.id
                      ? "bg-primary text-background shadow-[0_0_20px_rgba(0,255,136,0.35)]"
                      : "border border-primary/25 text-primary hover:bg-primary/10"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="space-y-5"
              >
                {activeCategory.skills.map((skill) => (
                  <div key={skill.name}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-foreground">{skill.name}</span>
                      <span className="font-mono text-primary">{skill.level}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-secondary to-primary"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.level}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        style={{ boxShadow: "0 0 12px rgba(0,255,136,0.5)" }}
                      />
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}