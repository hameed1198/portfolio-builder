"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
  align?: "left" | "center";
};

export default function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  align = "left",
}: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "mb-12 md:mb-16",
        align === "center" && "text-center mx-auto max-w-3xl",
        className
      )}
    >
      <p className="mono-label mb-4">{eyebrow}</p>
      <h2 className="heading-lg text-foreground">
        {title.split(" ").map((word, i) => (
          <span key={`${word}-${i}`} className="inline-block mr-[0.3em]">
            {word}
            {i === title.split(" ").length - 2 ? (
              <span className="text-primary text-glow">.</span>
            ) : null}
          </span>
        ))}
      </h2>
      {description ? (
        <p className="mt-4 max-w-2xl text-muted text-base md:text-lg leading-relaxed">
          {description}
        </p>
      ) : null}
    </motion.div>
  );
}