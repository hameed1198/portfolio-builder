"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import BootTerminal from "@/components/preloader/BootTerminal";
import HeroIdentity, { HERO_FRAME_CLASS, HERO_GRID_CLASS } from "@/components/hero/HeroIdentity";
import { introModules, introScenes } from "@/lib/intro/introConfig";
import { introStore } from "@/lib/intro/introStore";

function useIntroSnapshot() {
  return useSyncExternalStore(introStore.subscribe, introStore.getSnapshot, introStore.getServerSnapshot);
}

/** Scene 1 when started via `?introScene=1` (normally the Preloader covers it). */
function SceneBoot({ start, length }: { start: number; length: number }) {
  const [progress, setProgress] = useState(12);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const k = Math.min(1, Math.max(0, (introStore.runtime.time - start) / (length * 0.9)));
      setProgress(12 + 88 * (1 - Math.pow(1 - k, 2)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, length]);

  return (
    <div className="absolute inset-0 flex items-center justify-center px-6">
      <BootTerminal progress={progress} status="LOADING MATRIX CORE..." />
    </div>
  );
}

function SceneModules({ length }: { length: number }) {
  const step = (length * 0.7) / introModules.length;
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute bottom-[12vh] left-1/2 w-[min(88vw,22rem)] -translate-x-1/2 md:bottom-auto md:left-auto md:right-[7vw] md:top-1/2 md:-translate-y-1/2 md:translate-x-0"
    >
      <div className="terminal-window box-glow bg-background/70 p-5 font-mono backdrop-blur-sm">
        <p className="mb-4 text-sm text-primary text-glow">
          {"> LOADING MODULES..."}
          <span className="cursor-blink text-accent">_</span>
        </p>
        <ul className="space-y-2.5" aria-label="Loading modules">
          {introModules.map((mod, i) => (
            <motion.li
              key={mod}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * step, duration: 0.3 }}
              className="flex items-center gap-3 text-sm tracking-[0.18em] text-foreground/90"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-[3px] border border-primary/70 bg-primary/15">
                <Check className="h-3 w-3 text-primary" aria-hidden />
              </span>
              {mod}
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

function WhoAmI() {
  const [typed, setTyped] = useState("");
  useEffect(() => {
    const cmd = "> whoami";
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(cmd.slice(0, i));
      if (i >= cmd.length) window.clearInterval(id);
    }, 45);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span className="normal-case tracking-[0.08em] text-glow">
      {typed}
      <span className="cursor-blink text-accent">_</span>
    </span>
  );
}

/** Same frame + grid as `HeroSection`, so the decoded text lands exactly where the Hero's does. */
function SceneIdentity() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`pointer-events-none absolute inset-0 ${HERO_FRAME_CLASS}`}
    >
      <div className={HERO_GRID_CLASS}>
        <div className="hidden lg:block" aria-hidden />
        <HeroIdentity reveal="decode" delay={0.45} label={<WhoAmI />} interactive={false} />
      </div>
    </motion.div>
  );
}

const LETTERBOX_SCENES = new Set([3, 4, 5, 6, 7]);

export default function IntroText({ debug }: { debug: boolean }) {
  const snap = useIntroSnapshot();
  const id = snap.sceneId;
  const letterbox = LETTERBOX_SCENES.has(id);
  const title = introScenes.find((s) => s.id === id)?.title;

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* Cinematic letterbox */}
      <div
        className="absolute inset-x-0 top-0 bg-black transition-[height] duration-700 ease-out"
        style={{ height: letterbox ? "7vh" : 0 }}
      />
      <div
        className="absolute inset-x-0 bottom-0 bg-black transition-[height] duration-700 ease-out"
        style={{ height: letterbox ? "7vh" : 0 }}
      />

      <AnimatePresence>
        {snap.sceneKey === "systemBoot" ? (
          <SceneBoot key="boot" start={snap.sceneStart} length={snap.sceneLength} />
        ) : null}
        {snap.sceneKey === "moduleLoading" ? <SceneModules key="modules" length={snap.sceneLength} /> : null}
      </AnimatePresence>

      {id >= 8 ? <SceneIdentity /> : null}

      {debug && title ? (
        <div className="absolute left-4 top-4 rounded border border-primary/30 bg-background/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
          scene {String(id).padStart(2, "0")} — {title} · keys 1–9, 0
        </div>
      ) : null}
    </div>
  );
}
