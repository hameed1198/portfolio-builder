"use client";

import { FormEvent, useState, type SVGProps } from "react";
import { Mail, Phone } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import MagneticButton from "@/components/ui/MagneticButton";
import { personalInfo } from "@/lib/data";

function GitHubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2C6.477 2 2 6.586 2 12.253c0 4.53 2.865 8.367 6.839 9.72.5.094.683-.222.683-.486 0-.24-.009-.875-.014-1.717-2.782.618-3.37-1.372-3.37-1.372-.454-1.178-1.11-1.492-1.11-1.492-.908-.636.069-.623.069-.623 1.004.072 1.532 1.055 1.532 1.055.892 1.566 2.341 1.114 2.91.852.091-.662.35-1.114.636-1.37-2.22-.259-4.555-1.138-4.555-5.067 0-1.12.39-2.035 1.029-2.752-.103-.253-.446-1.27.098-2.647 0 0 .84-.275 2.75 1.05A9.35 9.35 0 0 1 12 7.14a9.34 9.34 0 0 1 2.504.345c1.909-1.325 2.748-1.05 2.748-1.05.546 1.377.203 2.394.1 2.647.64.717 1.028 1.632 1.028 2.752 0 3.939-2.338 4.805-4.566 5.058.36.318.68.945.68 1.905 0 1.375-.012 2.483-.012 2.82 0 .267.18.585.688.485C19.138 20.616 22 16.78 22 12.253 22 6.586 17.523 2 12 2Z" />
    </svg>
  );
}

function LinkedInIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M4.98 3.5C4.98 4.881 3.87 6 2.5 6S0 4.881 0 3.5 1.12 1 2.5 1s2.48 1.119 2.48 2.5zM.22 8.25h4.56V24H.22V8.25zM8.34 8.25h4.37v2.145h.062c.608-1.152 2.093-2.365 4.308-2.365 4.608 0 5.46 3.033 5.46 6.977V24h-4.56v-6.88c0-1.641-.03-3.752-2.287-3.752-2.29 0-2.64 1.788-2.64 3.635V24H8.34V8.25z" />
    </svg>
  );
}

const socials = [
  { href: personalInfo.github, label: "GitHub", icon: GitHubIcon },
  { href: personalInfo.linkedin, label: "LinkedIn", icon: LinkedInIcon },
  { href: `mailto:${personalInfo.email}`, label: "Email", icon: Mail },
  { href: `tel:${personalInfo.phone}`, label: "Phone", icon: Phone },
];

export default function ContactSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Portfolio contact from ${name || "someone"}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:${personalInfo.email}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <section id="contact" className="relative overflow-hidden section-pad">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-primary/50"
            style={{
              left: `${(i * 17) % 100}%`,
              top: `${(i * 29) % 100}%`,
              animation: `float-y ${4 + (i % 4)}s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="06 — contact"
          title="Let's build something"
          description="Open to backend, full-stack, cloud and GenAI opportunities. Drop a message."
          align="center"
        />

        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={onSubmit} className="glass rounded-3xl p-6 md:p-8">
            <div className="mb-6">
              <label className="mono-label mb-2 block" htmlFor="name">
                name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border-b border-primary/25 bg-transparent py-3 text-foreground transition focus:border-primary"
                placeholder="Your name"
              />
            </div>
            <div className="mb-6">
              <label className="mono-label mb-2 block" htmlFor="email">
                email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border-b border-primary/25 bg-transparent py-3 text-foreground transition focus:border-primary"
                placeholder="you@example.com"
              />
            </div>
            <div className="mb-8">
              <label className="mono-label mb-2 block" htmlFor="message">
                message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                className="w-full resize-none border-b border-primary/25 bg-transparent py-3 text-foreground transition focus:border-primary"
                placeholder="Tell me about the project..."
              />
            </div>

            <MagneticButton className="w-full sm:w-auto">
              <button
                type="submit"
                className="w-full rounded-full bg-primary px-8 py-3 font-medium text-background energy-pulse sm:w-auto"
              >
                {sent ? "Opening mail client..." : "Send Message"}
              </button>
            </MagneticButton>
          </form>

          <div className="flex flex-col justify-center gap-6">
            <div className="rounded-3xl border border-primary/20 bg-surface/70 p-6">
              <p className="mono-label mb-4">direct channels</p>
              <p className="mb-2 text-foreground">{personalInfo.email}</p>
              <p className="mb-2 text-foreground">{personalInfo.phone}</p>
              <p className="text-muted">{personalInfo.location}</p>
            </div>

            <div className="flex flex-wrap gap-4">
              {socials.map(({ href, label, icon: Icon }) => (
                <MagneticButton key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/5 text-primary transition hover:bg-primary hover:text-background"
                    style={{ boxShadow: "0 0 18px rgba(0,255,136,0.15)" }}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                </MagneticButton>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}