"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MatrixRain from "./MatrixRain";
import BootTerminal from "./BootTerminal";
import { personalInfo } from "@/lib/data";
import { introTiming } from "@/lib/intro/introConfig";

export type PreloaderVariant = "pending" | "classic" | "boot";

type PreloaderProps = {
  /** `boot` = Frame 01 of the cinematic intro; `pending` = blank until the client decides. */
  variant?: PreloaderVariant;
  /** 0–100 real asset progress (boot mode). */
  assetProgress?: number;
  /** Intro scene compiled and ready (boot mode). */
  assetsReady?: boolean;
  /** Fired when the exit animation starts — the intro begins underneath. */
  onReveal?: () => void;
  onComplete: () => void;
};

const BOOT_STATUS = [
  "INITIALIZING...",
  "LOADING MATRIX CORE...",
  "LOADING AVATAR...",
  "LOADING NEURAL NETWORK...",
  "SYSTEM READY",
];

const INTRO_STATUS = [
  "LOADING MATRIX CORE...",
  "LOADING AVATAR...",
  "COMPILING SHADERS...",
  "SYNCING NEURAL NETWORK...",
  "SYSTEM READY",
];

function statusFor(list: string[], pct: number) {
  return list[Math.min(list.length - 1, Math.floor((pct / 100) * list.length))];
}

function useClassicBoot(enabled: boolean, finish: () => void) {
  const [progress, setProgress] = useState(0);
  const [bootLine, setBootLine] = useState("");
  const [status, setStatus] = useState(BOOT_STATUS[0]);

  useEffect(() => {
    if (!enabled) return;
    const name = personalInfo.shortName;
    let i = 0;
    const typeInterval = setInterval(() => {
      i += 1;
      setBootLine(name.slice(0, i));
      if (i >= name.length) clearInterval(typeInterval);
    }, 60);

    const start = performance.now();
    const duration = 2600;
    let raf = 0;
    let timeout = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const pct = Math.round((1 - Math.pow(1 - t, 3)) * 100);
      setProgress(pct);
      setStatus(statusFor(BOOT_STATUS, pct));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setStatus("SYSTEM READY");
        timeout = window.setTimeout(finish, 350);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      clearInterval(typeInterval);
      cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
    };
  }, [enabled, finish]);

  return { progress, bootLine, status };
}

/** Frame 01: progress follows real loading, never faster than `minBootTime`. */
function useIntroBoot(enabled: boolean, assetProgress: number, assetsReady: boolean, finish: () => void) {
  const [progress, setProgress] = useState(12);
  const live = useRef({ assetProgress, assetsReady });
  useEffect(() => {
    live.current = { assetProgress, assetsReady };
  }, [assetProgress, assetsReady]);

  useEffect(() => {
    if (!enabled) return;
    const start = performance.now();
    let shown = 12;
    let raf = 0;
    let timeout = 0;

    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      const timeCap = 12 + 88 * Math.min(1, elapsed / introTiming.minBootTime);
      const ready = live.current.assetsReady || elapsed > introTiming.maxLoadWait;
      const loadCap = ready ? 100 : Math.min(95, 12 + live.current.assetProgress * 0.83);
      const target = Math.min(timeCap, loadCap);
      shown += (target - shown) * 0.12;
      if (target - shown < 0.4) shown = target;
      setProgress(shown);
      if (shown >= 100) {
        timeout = window.setTimeout(finish, 250);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
    };
  }, [enabled, finish]);

  return progress;
}

export default function Preloader({
  variant = "classic",
  assetProgress = 0,
  assetsReady = false,
  onReveal,
  onComplete,
}: PreloaderProps) {
  const [done, setDone] = useState(false);
  const revealRef = useRef(onReveal);
  useEffect(() => {
    revealRef.current = onReveal;
  }, [onReveal]);

  const [finish] = useState(() => () => {
    setDone(true);
    revealRef.current?.();
  });

  const classic = useClassicBoot(variant === "classic", finish);
  const bootProgress = useIntroBoot(variant === "boot", assetProgress, assetsReady, finish);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {!done ? (
        <motion.div
          key="preloader"
          className="fixed inset-0 z-[10050] flex items-center justify-center overflow-hidden bg-background"
          exit={variant === "boot" ? { opacity: 0 } : { y: "-100%" }}
          transition={{ duration: variant === "boot" ? 0.7 : 0.9, ease: [0.76, 0, 0.24, 1] }}
        >
          {variant === "pending" ? null : <MatrixRain />}

          {variant === "classic" ? (
            <div className="relative z-10 flex w-full max-w-lg flex-col items-center px-6 text-center">
              <p className="mono-label mb-6">system.boot</p>
              <div className="mb-8 font-mono text-2xl tracking-[0.25em] text-primary text-glow md:text-3xl">
                {classic.bootLine}
                <span className="cursor-blink text-accent">_</span>
              </div>
              <div className="mb-3 font-mono text-5xl font-bold text-foreground md:text-7xl">
                {classic.progress}
                <span className="text-primary">%</span>
              </div>
              <div className="h-[2px] w-full max-w-xs overflow-hidden rounded bg-white/10">
                <motion.div
                  className="h-full bg-primary"
                  style={{ width: `${classic.progress}%`, boxShadow: "0 0 16px rgba(0,255,136,0.7)" }}
                />
              </div>
              <p className="mt-6 font-mono text-xs text-primary/80">{classic.status}</p>
            </div>
          ) : null}

          {variant === "boot" ? (
            <div className="relative z-10 flex w-full justify-center px-6">
              <BootTerminal progress={bootProgress} status={statusFor(INTRO_STATUS, bootProgress)} />
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
