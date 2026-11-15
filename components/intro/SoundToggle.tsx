"use client";

import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import type { IntroSoundManager } from "@/lib/intro/introSound";

export default function SoundToggle({ manager }: { manager: IntroSoundManager }) {
  const muted = useSyncExternalStore(manager.subscribe, manager.isMuted, () => true);
  const Icon = muted ? VolumeX : Volume2;

  return (
    <button
      type="button"
      onClick={() => void manager.setMuted(!muted)}
      aria-pressed={!muted}
      aria-label={muted ? "Turn intro sound on" : "Turn intro sound off"}
      className="flex items-center gap-2 rounded-full border border-primary/30 bg-background/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-primary/80 backdrop-blur transition hover:border-primary/60 hover:text-primary"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {muted ? "sound off" : "sound on"}
    </button>
  );
}
