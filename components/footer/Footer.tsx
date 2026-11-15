"use client";

import { ArrowUp } from "lucide-react";
import MagneticButton from "@/components/ui/MagneticButton";
import { personalInfo } from "@/lib/data";

export default function Footer() {
  return (
    <footer className="border-t border-primary/10 section-pad !py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
        <p className="font-mono text-sm text-muted">
          Designed & Built by {personalInfo.firstName} Khan
          <span className="cursor-blink text-primary">_</span>
        </p>
        <MagneticButton>
          <a
            href="#home"
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-4 py-2 text-sm text-primary transition hover:bg-primary/10"
          >
            Back to top
            <ArrowUp className="h-4 w-4" />
          </a>
        </MagneticButton>
      </div>
    </footer>
  );
}