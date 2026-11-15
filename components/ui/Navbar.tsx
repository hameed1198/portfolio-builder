"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import MagneticButton from "@/components/ui/MagneticButton";
import { personalInfo } from "@/lib/data";
import { cn } from "@/lib/utils";

const links = [
  { href: "#about", label: "About" },
  { href: "#experience", label: "Experience" },
  { href: "#skills", label: "Skills" },
  { href: "#projects", label: "Projects" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-[9000] transition-all duration-300",
        scrolled ? "border-b border-primary/10 bg-background/80 backdrop-blur-xl" : "bg-transparent"
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <a href="#home" className="font-mono text-sm text-primary text-glow">
          {personalInfo.firstName.toLowerCase()}
          <span className="text-muted">.dev</span>
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <MagneticButton key={link.href}>
              <a
                href={link.href}
                className="font-mono text-xs uppercase tracking-[0.18em] text-muted transition hover:text-primary"
              >
                {link.label}
              </a>
            </MagneticButton>
          ))}
        </nav>

        <button
          type="button"
          className="rounded-lg border border-primary/30 p-2 text-primary md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-primary/10 bg-background/95 px-5 py-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="font-mono text-sm uppercase tracking-[0.18em] text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}