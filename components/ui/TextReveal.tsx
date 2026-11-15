"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

type TextRevealProps = {
  text: string;
  className?: string;
  as?: "p" | "h2" | "h3" | "div";
  delay?: number;
};

export default function TextReveal({
  text,
  className,
  as: Tag = "p",
  delay = 0,
}: TextRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const words = text.split(" ");
    el.innerHTML = words
      .map(
        (word) =>
          `<span class="inline-block overflow-hidden mr-[0.28em] align-bottom"><span class="word-inner inline-block translate-y-[110%]">${word}</span></span>`
      )
      .join("");

    const inners = el.querySelectorAll(".word-inner");
    const tween = gsap.to(inners, {
      y: 0,
      duration: 0.8,
      stagger: 0.03,
      delay,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        once: true,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [text, delay]);

  return <Tag ref={ref as never} className={cn(className)} aria-label={text} />;
}