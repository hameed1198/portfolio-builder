"use client";

const BLOCKS = 18;

type BootTerminalProps = {
  progress: number;
  status?: string;
};

/** Frame 01 terminal — shared by the Preloader (boot mode) and the intro's scene 1. */
export default function BootTerminal({ progress, status }: BootTerminalProps) {
  const pct = Math.max(0, Math.min(100, Math.round(progress)));
  const filled = Math.round((pct / 100) * BLOCKS);

  return (
    <div className="terminal-window box-glow w-full max-w-md bg-background/80 text-left font-mono backdrop-blur-sm">
      <div className="terminal-bar">
        <span className="terminal-dot bg-primary/80" />
        <span className="terminal-dot bg-secondary/70" />
        <span className="terminal-dot bg-accent/60" />
        <span className="ml-2 text-[10px] tracking-[0.2em] text-muted">hameed@matrix:~</span>
      </div>
      <div className="p-5 md:p-6" role="status" aria-live="polite">
        <p className="text-sm text-primary text-glow md:text-base">
          {"> INITIALIZING SYSTEM..."}
          <span className="cursor-blink text-accent">_</span>
        </p>
        <div className="mt-4 flex items-center gap-3 text-sm md:text-base" aria-label={`${pct} percent`}>
          <span className="whitespace-pre text-primary" aria-hidden>
            [{"█".repeat(filled)}
            <span className="text-primary/25">{"░".repeat(BLOCKS - filled)}</span>]
          </span>
          <span className="tabular-nums text-foreground">{pct}%</span>
        </div>
        {status ? (
          <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-primary/70">{status}</p>
        ) : null}
      </div>
    </div>
  );
}
