import { isMobileDevice, preferReducedMotion } from "@/lib/utils";
import type { IntroVariantName } from "./introConfig";

export const INTRO_STORAGE_KEY = "hameed-intro-played";

export type IntroLaunch = {
  play: boolean;
  /** Scene id requested with `?introScene=N` (forces the intro). */
  startScene: number | null;
  /** Shows the scene indicator overlay. */
  debug: boolean;
  variant: IntroVariantName;
};

/**
 * `?intro=true` forces the intro, `?intro=false` skips it,
 * `?introScene=N` forces it and jumps to scene N.
 */
export function resolveIntroLaunch(): IntroLaunch {
  const params = new URLSearchParams(window.location.search);
  const flag = params.get("intro");
  const sceneParam = params.get("introScene");
  const parsedScene = sceneParam ? Number.parseInt(sceneParam, 10) : Number.NaN;
  const startScene = Number.isFinite(parsedScene) ? Math.min(10, Math.max(1, parsedScene)) : null;

  const variant: IntroVariantName = preferReducedMotion()
    ? "reduced"
    : isMobileDevice()
      ? "mobile"
      : "desktop";

  if (flag === "false" || flag === "0") {
    return { play: false, startScene: null, debug: false, variant };
  }

  const forced = flag === "true" || flag === "1" || startScene !== null;
  let played = false;
  try {
    played = window.sessionStorage.getItem(INTRO_STORAGE_KEY) === "1";
  } catch {
    // Storage unavailable (private mode) — treat as first visit.
  }

  return { play: forced || !played, startScene, debug: startScene !== null, variant };
}

export function markIntroPlayed() {
  try {
    window.sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
  } catch {
    // ignore
  }
}
