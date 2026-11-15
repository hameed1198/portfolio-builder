"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { ChevronDown } from "lucide-react";
import HeroIdentity, { HERO_FRAME_CLASS, HERO_GRID_CLASS, type IdentityReveal } from "./HeroIdentity";

const AvatarScene = dynamic(() => import("./AvatarScene"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-background" />,
});

type HeroSectionProps = {
  /** `hold` while the cinematic intro covers the Hero, `instant` after it decoded the same text. */
  reveal?: IdentityReveal;
  /** False renders the 3D scene on demand only (intro still playing on top). */
  live?: boolean;
};

export default function HeroSection({ reveal = "decode", live = true }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section id="home" ref={sectionRef} className={`relative overflow-hidden ${HERO_FRAME_CLASS}`}>
      {/* Central 3D avatar + reused particle network + Matrix atmosphere */}
      <AvatarScene sectionRef={sectionRef} paused={!live} />

      <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-background/30 via-transparent to-background" />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-r from-transparent via-transparent to-background/70 lg:to-background/85" />

      {/* Existing typography — right side on desktop, centered on mobile */}
      <div className={HERO_GRID_CLASS}>
        <div className="hidden lg:block" aria-hidden />
        <HeroIdentity reveal={reveal} />
      </div>

      <a
        href="#about"
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-primary"
        aria-label="Scroll to about"
      >
        <ChevronDown
          className="h-7 w-7 animate-bounce"
          style={{ filter: "drop-shadow(0 0 8px #00ff88)" }}
        />
      </a>
    </section>
  );
}
