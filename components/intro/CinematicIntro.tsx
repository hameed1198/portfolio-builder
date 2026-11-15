"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useProgress } from "@react-three/drei";
import { getHeroFraming } from "@/lib/avatar/avatarConfig";
import {
  buildStaging,
  introQuality,
  introSounds,
  introTiming,
  introVariants,
  type ScheduledScene,
} from "@/lib/intro/introConfig";
import type { IntroLaunch } from "@/lib/intro/introFlags";
import { IntroSoundManager } from "@/lib/intro/introSound";
import { introStore } from "@/lib/intro/introStore";
import { getQualityTier, isMobileDevice } from "@/lib/utils";
import { preloadAvatarModel, probeAvatarModel } from "@/components/hero/HameedAvatar";
import IntroScene from "./IntroScene";
import IntroText from "./IntroText";
import SoundToggle from "./SoundToggle";
import { buildIntroTimeline, type IntroTimeline } from "./IntroTimeline";

export type IntroCompleteInfo = { reachedIdentity: boolean };

type CinematicIntroProps = {
  launch: IntroLaunch;
  /** False while the Preloader is still covering the screen. */
  active: boolean;
  onProgress?: (percent: number) => void;
  onReady?: () => void;
  /** Identity scene reached — the Hero text underneath can switch to its final state. */
  onIdentity?: () => void;
  /** Crossfade into the Hero has started — the Hero canvas should render live. */
  onHandoff?: () => void;
  onComplete: (info: IntroCompleteInfo) => void;
};

function useSetup(launch: IntroLaunch) {
  const [setup] = useState(() => {
    introStore.reset();
    const tier = getQualityTier();
    const framing = getHeroFraming(isMobileDevice());
    return {
      tier,
      quality: introQuality[tier],
      variant: introVariants[launch.variant],
      framing,
      staging: buildStaging(framing),
    };
  });
  return setup;
}

export default function CinematicIntro({
  launch,
  active,
  onProgress,
  onReady,
  onIdentity,
  onHandoff,
  onComplete,
}: CinematicIntroProps) {
  const setup = useSetup(launch);
  const [useGlb, setUseGlb] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [sound] = useState(() => new IntroSoundManager(introSounds));
  const wrapper = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const timeline = useRef<IntroTimeline | null>(null);
  const reachedIdentity = useRef(false);
  const finished = useRef(false);
  const callbacks = useRef({ onIdentity, onHandoff, onComplete });
  useEffect(() => {
    callbacks.current = { onIdentity, onHandoff, onComplete };
  });

  const { progress } = useProgress();
  useEffect(() => onProgress?.(progress), [progress, onProgress]);

  useEffect(() => {
    let cancelled = false;
    probeAvatarModel().then((ok) => {
      if (ok) preloadAvatarModel();
      if (!cancelled) setUseGlb(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleReady = useCallback(() => {
    setReady(true);
    onReady?.();
  }, [onReady]);

  const finish = useCallback(
    (skipped: boolean) => {
      if (finished.current) return;
      finished.current = true;
      callbacks.current.onHandoff?.();
      sound.fadeOut(skipped ? 0.4 : 1);
      const done = () => callbacks.current.onComplete({ reachedIdentity: reachedIdentity.current });
      if (skipped && wrapper.current) {
        timeline.current?.tl.pause();
        gsap.to(wrapper.current, { opacity: 0, duration: 0.5, ease: "power2.out", onComplete: done });
      } else {
        done();
      }
    },
    [sound]
  );

  // Start the master timeline once assets are ready and the Preloader hands off.
  useEffect(() => {
    if (!active || !ready || timeline.current) return;
    window.scrollTo(0, 0);
    const t = buildIntroTimeline(setup.variant, setup.staging, {
      onScene: (scene: ScheduledScene) => {
        sound.cue(scene.sound);
        if (scene.id >= 8 && !reachedIdentity.current) {
          reachedIdentity.current = true;
          callbacks.current.onIdentity?.();
        }
      },
      onHandoff: () => callbacks.current.onHandoff?.(),
      onComplete: () => finish(false),
    });
    timeline.current = t;
    t.seekToScene(launch.startScene ?? introTiming.defaultStartScene);
    t.tl.play();
  }, [active, ready, setup, launch.startScene, sound, finish]);

  // Overlay opacity + portal flash are tweened in the store; mirror them to the DOM.
  useEffect(() => {
    const update = () => {
      const { overlay } = introStore.runtime;
      if (wrapper.current && !finished.current) wrapper.current.style.opacity = String(overlay.opacity);
      if (flash.current) flash.current.style.opacity = String(overlay.flash);
    };
    gsap.ticker.add(update);
    return () => gsap.ticker.remove(update);
  }, []);

  // Skip with Esc; in debug mode number keys jump between scenes (0 = scene 10).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        finish(true);
        return;
      }
      if (!launch.debug || !timeline.current) return;
      const n = Number.parseInt(e.key, 10);
      if (Number.isNaN(n)) return;
      timeline.current.seekToScene(n === 0 ? 10 : n);
      timeline.current.tl.play();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish, launch.debug]);

  useEffect(
    () => () => {
      timeline.current?.kill();
      timeline.current = null;
      sound.dispose();
    },
    [sound]
  );

  return (
    <div
      ref={wrapper}
      className="fixed inset-0 z-[10040] overflow-hidden bg-[#020604]"
      role="region"
      aria-label="Cinematic intro"
    >
      <p className="sr-only">
        Cinematic intro introducing Hameed Khan, Software Engineer. Press Escape or use the Skip button to go
        straight to the portfolio.
      </p>

      {useGlb !== null ? (
        <IntroScene
          quality={setup.quality}
          staging={setup.staging}
          framing={setup.framing}
          useGlb={useGlb}
          cameraMotion={setup.variant.cameraMotion}
          onReady={handleReady}
        />
      ) : null}

      <div
        ref={flash}
        className="pointer-events-none absolute inset-0 z-[5] opacity-0"
        style={{ background: "radial-gradient(circle at 50% 55%, #eafff3 0%, #00ff88 35%, rgba(0,255,136,0) 75%)" }}
      />

      <IntroText debug={launch.debug} />

      <div className="absolute bottom-5 left-5 z-20 md:bottom-7 md:left-7">
        <SoundToggle manager={sound} />
      </div>
      <button
        type="button"
        onClick={() => finish(true)}
        className="absolute bottom-5 right-5 z-20 rounded-full border border-primary/30 bg-background/60 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-primary/80 backdrop-blur transition hover:border-primary/60 hover:text-primary md:bottom-7 md:right-7"
      >
        skip intro
      </button>
    </div>
  );
}
