import { createAvatarController, type AvatarController } from "@/components/hero/AvatarAnimations";
import type { EnvLevels, IntroSceneKey } from "./introConfig";

/**
 * Mutable values tweened directly by the GSAP master timeline and read inside
 * `useFrame`. Only coarse scene changes go through the subscribe layer.
 */
export type IntroRuntime = {
  cam: {
    px: number;
    py: number;
    pz: number;
    tx: number;
    ty: number;
    tz: number;
    fov: number;
    fx: number;
    fy: number;
    fz: number;
    bokeh: number;
    /** 0–1 blend into the Hero's taller-than-viewport projection. */
    stage: number;
  };
  avatar: { x: number; y: number; z: number; rotY: number; walkSpeed: number };
  env: EnvLevels;
  overlay: { flash: number; opacity: number };
  /** Seconds since the intro scene started — drives shader time. */
  time: number;
};

export type IntroSnapshot = {
  sceneId: number;
  sceneKey: IntroSceneKey | null;
  sceneStart: number;
  sceneLength: number;
  /** Variant-aware duration of the whole intro (without the hero crossfade). */
  total: number;
  playing: boolean;
};

type Listener = () => void;

function createRuntime(): IntroRuntime {
  return {
    cam: { px: 0, py: 0.4, pz: 9, tx: 0, ty: 0.2, tz: 0, fov: 50, fx: 0, fy: 0.2, fz: 0, bokeh: 0, stage: 0 },
    avatar: { x: 0, y: -1.25, z: 0, rotY: 0, walkSpeed: 0 },
    env: {
      rain: 1,
      dust: 0.5,
      globe: 0,
      grid: 0,
      portal: 0,
      city: 0,
      panels: 0,
      chair: 0,
      badges: 0,
      avatar: 0,
    },
    overlay: { flash: 0, opacity: 1 },
    time: 0,
  };
}

const initialSnapshot: IntroSnapshot = {
  sceneId: 0,
  sceneKey: null,
  sceneStart: 0,
  sceneLength: 0,
  total: 0,
  playing: false,
};

function createIntroStore() {
  let runtime = createRuntime();
  let controller: AvatarController = createAvatarController("idle");
  let snapshot = initialSnapshot;
  const listeners = new Set<Listener>();

  const emit = () => listeners.forEach((l) => l());

  return {
    get runtime() {
      return runtime;
    },
    get controller() {
      return controller;
    },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => initialSnapshot,
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    update(patch: Partial<IntroSnapshot>) {
      snapshot = { ...snapshot, ...patch };
      emit();
    },
    reset() {
      runtime = createRuntime();
      controller = createAvatarController("idle");
      snapshot = initialSnapshot;
      emit();
    },
  };
}

export const introStore = createIntroStore();
