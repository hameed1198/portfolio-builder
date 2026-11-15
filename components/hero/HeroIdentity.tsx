"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { personalInfo } from "@/lib/data";
import { cn, preferReducedMotion } from "@/lib/utils";
import MagneticButton from "@/components/ui/MagneticButton";

gsap.registerPlugin(SplitText, ScrambleTextPlugin);

const DECODE_CHARS = "アイウエオカキクケコサシスセソ0123456789ABCDEF";

export type IdentityReveal = "hold" | "decode" | "instant";

type HeroIdentityProps = {
  /** `hold` keeps the text hidden (Hero waiting behind the intro). */
  reveal: IdentityReveal;
  delay?: number;
  /** Replaces the `portfolio // 2026` label (the intro shows `> whoami`). */
  label?: ReactNode;
  /** Tagline + CTAs. When false they still take up space so the layout matches the Hero exactly. */
  interactive?: boolean;
};

/** Shared Hero typography — rendered by the Hero and by the intro's identity reveal. */
export default function HeroIdentity({ reveal, delay = 0.15, label, interactive = true }: HeroIdentityProps) {
  const nameRef = useRef<HTMLHeadingElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const [decoded, setDecoded] = useState(false);
  const tagsVisible = reveal === "instant" || (reveal === "decode" && decoded);

  useLayoutEffect(() => {
    if (reveal !== "decode") return;
    const name = nameRef.current;
    const title = titleRef.current;
    if (!name || !title) return;

    if (preferReducedMotion()) {
      const ctx = gsap.context(() => {
        gsap
          .timeline({ delay })
          .fromTo([name, title], { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power1.out" })
          .call(() => setDecoded(true));
      });
      return () => ctx.revert();
    }

    const ctx = gsap.context(() => {
      const split = SplitText.create(name, { type: "words,chars", charsClass: "char" });
      const tl = gsap.timeline({ delay });
      tl.from(split.chars, { yPercent: 120, opacity: 0, duration: 0.85, stagger: 0.04, ease: "power3.out" }, 0);
      split.chars.forEach((char, i) => {
        const text = char.textContent ?? "";
        if (!text.trim()) return;
        tl.to(char, { duration: 0.7, scrambleText: { text, chars: DECODE_CHARS, speed: 0.6 } }, i * 0.04);
      });
      tl.fromTo(title, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.75);
      tl.to(
        title,
        { duration: 1, scrambleText: { text: personalInfo.title, chars: "01", revealDelay: 0.15, speed: 0.5 } },
        0.75
      );
      tl.call(() => setDecoded(true), [], 1.6);
    });
    return () => ctx.revert();
  }, [reveal, delay]);

  const hidden = reveal === "hold";

  return (
    <div className={cn("text-center lg:text-left", hidden && "invisible")}>
      <div className="mono-label mb-6">{label ?? "portfolio // 2026"}</div>
      <h1 ref={nameRef} className="heading-xl mb-6 text-foreground" aria-label={personalInfo.shortName}>
        {personalInfo.shortName}
      </h1>
      <div className="mb-8 font-mono text-lg text-primary md:text-2xl">
        <span ref={titleRef}>{personalInfo.title}</span>
        <span className="cursor-blink text-accent">|</span>
      </div>
      <p className={cn("mx-auto mb-10 max-w-xl text-muted md:text-lg lg:mx-0", !interactive && "invisible")}>
        {personalInfo.tagline}
      </p>

      <div className="mb-12 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
        {personalInfo.heroTags.map((tag, i) => (
          <span
            key={tag}
            className="rounded-full border border-primary/30 bg-primary/5 px-4 py-2 font-mono text-sm text-primary transition-all duration-500"
            style={{
              opacity: tagsVisible ? 1 : 0,
              transform: tagsVisible ? "translateY(0)" : "translateY(12px)",
              transitionDelay: `${i * 120}ms`,
              boxShadow: tagsVisible ? "0 0 20px rgba(0,255,136,0.15)" : "none",
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      <div
        className={cn("flex flex-wrap items-center justify-center gap-4 lg:justify-start", !interactive && "invisible")}
        aria-hidden={!interactive}
      >
        <MagneticButton>
          <a
            href="#projects"
            tabIndex={interactive ? undefined : -1}
            className="inline-flex items-center rounded-full bg-primary px-7 py-3 font-medium text-background transition hover:bg-accent energy-pulse"
          >
            View Work
          </a>
        </MagneticButton>
        <MagneticButton>
          <a
            href="#contact"
            tabIndex={interactive ? undefined : -1}
            className="inline-flex items-center rounded-full border border-primary/40 px-7 py-3 font-medium text-primary transition hover:bg-primary/10"
          >
            Contact Me
          </a>
        </MagneticButton>
      </div>
    </div>
  );
}

/** Classes shared by the Hero section and the intro overlay so the text lands in the same place. */
export const HERO_FRAME_CLASS = "flex min-h-[100svh] items-center section-pad pt-24";
export const HERO_GRID_CLASS = "relative z-10 mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-2";
