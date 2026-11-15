"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SectionHeading from "@/components/ui/SectionHeading";
import TimelineCard from "./TimelineCard";
import { experience } from "@/lib/data";

gsap.registerPlugin(ScrollTrigger);

export default function ExperienceSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      const getScrollAmount = () => -(track.scrollWidth - window.innerWidth + 80);

      const tween = gsap.to(track, {
        x: getScrollAmount,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${track.scrollWidth}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <section id="experience" ref={sectionRef} className="relative overflow-hidden section-pad">
      <div className="mx-auto mb-4 max-w-6xl px-0 md:px-0">
        <SectionHeading
          eyebrow="02 — experience"
          title="Career trajectory"
          description="Enterprise delivery across backend, serverless, data pipelines and full-stack product work."
        />
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute left-0 right-0 top-[4.6rem] hidden h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent md:block" />
        <div
          ref={trackRef}
          className="flex gap-6 overflow-x-auto px-4 pb-8 no-scrollbar md:overflow-visible md:px-16 md:pb-4"
        >
          {experience.map((item) => (
            <TimelineCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}