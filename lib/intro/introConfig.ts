import type { AvatarClipName, HeroFraming, Vec3 } from "@/lib/avatar/avatarConfig";
import { avatarConfig, FLOOR_Y } from "@/lib/avatar/avatarConfig";
import type { QualityTier } from "@/lib/utils";

export type IntroSceneKey =
  | "systemBoot"
  | "moduleLoading"
  | "sunglassesCloseup"
  | "characterReveal"
  | "portalWalk"
  | "portalExit"
  | "heroCloseup"
  | "identityReveal"
  | "techReveal"
  | "finalHeroPose";

export type IntroVariantName = "desktop" | "mobile" | "reduced";

export type SoundCue =
  | "boot"
  | "processing"
  | "bassHit"
  | "sunglasses"
  | "portal"
  | "rise"
  | "ambience";

export type EnvLevels = {
  rain: number;
  dust: number;
  globe: number;
  grid: number;
  portal: number;
  city: number;
  panels: number;
  chair: number;
  badges: number;
  avatar: number;
};

/** `at` is a 0–1 fraction of the scene; `offset` starts the clip that many seconds in. */
export type ClipCue = { at: number; clip: AvatarClipName; offset?: number };

export type IntroSceneDef = {
  id: number;
  key: IntroSceneKey;
  title: string;
  /** Desktop duration in seconds; variants override per scene (0 = skipped). */
  duration: number;
  /** Hard cut — camera and environment snap instead of blending. */
  cut: boolean;
  clips: ClipCue[];
  env: EnvLevels;
  sound?: SoundCue;
};

const env = (levels: Partial<EnvLevels>): EnvLevels => ({
  rain: 0,
  dust: 0,
  globe: 0,
  grid: 0,
  portal: 0,
  city: 0,
  panels: 0,
  chair: 0,
  badges: 0,
  avatar: 0,
  ...levels,
});

export const introScenes: IntroSceneDef[] = [
  {
    id: 1,
    key: "systemBoot",
    title: "System boot",
    duration: 2,
    cut: true,
    clips: [{ at: 0, clip: "idle" }],
    env: env({ rain: 1, dust: 0.5 }),
    sound: "boot",
  },
  {
    id: 2,
    key: "moduleLoading",
    title: "Loading modules",
    duration: 2,
    cut: false,
    clips: [{ at: 0, clip: "idle" }],
    env: env({ rain: 0.6, dust: 0.8, globe: 1, grid: 0.4, city: 0.3 }),
    sound: "processing",
  },
  {
    id: 3,
    key: "sunglassesCloseup",
    title: "Sunglasses close-up",
    duration: 2,
    cut: true,
    clips: [{ at: 0, clip: "idle" }],
    env: env({ rain: 0.7, dust: 0.4, grid: 0.6, portal: 0.3, city: 0.4, avatar: 1 }),
    sound: "bassHit",
  },
  {
    id: 4,
    key: "characterReveal",
    title: "Character reveal",
    duration: 2,
    cut: false,
    clips: [{ at: 0.08, clip: "adjustSunglasses" }],
    env: env({ rain: 0.8, dust: 0.5, grid: 1, portal: 0.5, city: 0.6, avatar: 1 }),
    sound: "sunglasses",
  },
  {
    id: 5,
    key: "portalWalk",
    title: "Walking into the portal",
    duration: 2,
    cut: true,
    clips: [{ at: 0, clip: "walking" }],
    env: env({ rain: 1, dust: 0.8, grid: 1, portal: 1, city: 0.8, avatar: 1 }),
    sound: "portal",
  },
  {
    id: 6,
    key: "portalExit",
    title: "Portal emergence",
    duration: 2,
    cut: true,
    clips: [{ at: 0, clip: "walking" }],
    env: env({ rain: 1, dust: 0.9, grid: 1, portal: 0.65, city: 1, panels: 0.3, avatar: 1 }),
  },
  {
    id: 7,
    key: "heroCloseup",
    title: "Hero close-up",
    duration: 2,
    cut: true,
    clips: [{ at: 0, clip: "lookUp" }],
    env: env({ rain: 0.7, dust: 0.5, grid: 0.8, portal: 0.6, city: 0.7, avatar: 1 }),
    sound: "rise",
  },
  {
    id: 8,
    key: "identityReveal",
    title: "Identity reveal",
    duration: 2,
    cut: false,
    clips: [{ at: 0, clip: "heroPose" }],
    env: env({ rain: 0.45, dust: 0.5, grid: 0.7, city: 0.4, avatar: 1 }),
  },
  {
    id: 9,
    key: "techReveal",
    title: "Technology reveal",
    duration: 2,
    cut: false,
    clips: [{ at: 0, clip: "heroPose" }],
    env: env({ rain: 0.4, dust: 0.5, grid: 0.7, city: 0.35, badges: 1, avatar: 1 }),
    sound: "ambience",
  },
  {
    id: 10,
    key: "finalHeroPose",
    title: "Final hero pose",
    duration: 2,
    cut: false,
    clips: [
      { at: 0, clip: "heroPose" },
      { at: 0.15, clip: "sitting" },
    ],
    env: env({ rain: 0.35, dust: 0.4, grid: 0.6, city: 0.3, panels: 1, chair: 1, badges: 1, avatar: 1 }),
  },
];

export const introTiming = {
  /** Environment cross-blend for non-cut scenes. */
  envFade: 0.6,
  /** Final crossfade from the intro canvas into the live Hero. */
  heroTransition: 0.9,
  /** The Preloader covers scene 1, so a normal visit starts here. */
  defaultStartScene: 2,
  /** Seated transition inside the `sitting` clip (seconds). */
  sitDuration: avatarConfig.sitDuration,
  /** Hard ceiling for waiting on assets before the intro starts anyway. */
  maxLoadWait: 12,
  /** Preloader boot screen minimum time (Frame 01). */
  minBootTime: 2,
};

export type IntroVariant = {
  durations: Partial<Record<IntroSceneKey, number>>;
  /** 1 = full camera movement, 0 = locked-off shots. */
  cameraMotion: number;
};

export const introVariants: Record<IntroVariantName, IntroVariant> = {
  desktop: { durations: {}, cameraMotion: 1 },
  mobile: {
    durations: {
      characterReveal: 4,
      portalWalk: 2,
      portalExit: 2,
      heroCloseup: 0,
      identityReveal: 3,
      techReveal: 0,
      finalHeroPose: 3,
    },
    cameraMotion: 0.5,
  },
  reduced: {
    durations: {
      systemBoot: 1,
      moduleLoading: 0,
      sunglassesCloseup: 0,
      characterReveal: 0,
      portalWalk: 0,
      portalExit: 0,
      heroCloseup: 0,
      identityReveal: 2,
      techReveal: 0,
      finalHeroPose: 1.5,
    },
    cameraMotion: 0,
  },
};

export type ScheduledScene = IntroSceneDef & { start: number; length: number };

export function resolveSchedule(variant: IntroVariant): ScheduledScene[] {
  let cursor = 0;
  const schedule: ScheduledScene[] = [];
  for (const scene of introScenes) {
    const length = variant.durations[scene.key] ?? scene.duration;
    if (length <= 0) continue;
    schedule.push({ ...scene, start: cursor, length });
    cursor += length;
  }
  return schedule;
}

/** First scheduled scene whose id is >= the requested id. */
export function findStartScene(schedule: ScheduledScene[], id: number): ScheduledScene {
  return schedule.find((s) => s.id >= id) ?? schedule[schedule.length - 1];
}

export const introModules = ["PROFILE", "EXPERIENCE", "PROJECTS", "SKILLS", "PORTFOLIO"];

export const introSounds: Record<SoundCue, string> = {
  boot: "/audio/intro/boot.mp3",
  processing: "/audio/intro/processing.mp3",
  bassHit: "/audio/intro/bass-hit.mp3",
  sunglasses: "/audio/intro/sunglasses.mp3",
  portal: "/audio/intro/portal.mp3",
  rise: "/audio/intro/rise.mp3",
  ambience: "/audio/intro/ambience.mp3",
};

export type QualitySettings = {
  dpr: [number, number];
  rain: number;
  dust: number;
  globeParticles: number;
  city: number;
  panels: number;
  shadows: boolean;
  shadowMapSize: number;
  postfx: boolean;
  dof: boolean;
  multisampling: number;
};

export const introQuality: Record<QualityTier, QualitySettings> = {
  high: {
    dpr: [1, 1.75],
    rain: 240,
    dust: 600,
    globeParticles: 70,
    city: 120,
    panels: 4,
    shadows: true,
    shadowMapSize: 2048,
    postfx: true,
    dof: true,
    multisampling: 4,
  },
  medium: {
    dpr: [1, 1.5],
    rain: 150,
    dust: 320,
    globeParticles: 45,
    city: 70,
    panels: 3,
    shadows: true,
    shadowMapSize: 1024,
    postfx: true,
    dof: false,
    multisampling: 0,
  },
  low: {
    dpr: [1, 1.25],
    rain: 80,
    dust: 140,
    globeParticles: 25,
    city: 36,
    panels: 2,
    shadows: false,
    shadowMapSize: 512,
    postfx: false,
    dof: false,
    multisampling: 0,
  },
};

/* ------------------------------------------------------------------ */
/* Staging: world positions for every shot                              */
/* ------------------------------------------------------------------ */

export type CameraKey = {
  pos: Vec3;
  target: Vec3;
  fov: number;
  /** World point the depth of field focuses on. */
  focus: Vec3;
  /** Bokeh strength (0 = sharp). */
  bokeh: number;
  /** 1 = match the Hero canvas projection exactly (final frame only). */
  stage?: number;
};

export type Shot = { from: CameraKey; to: CameraKey; ease: string };
export type AvatarMark = { pos: Vec3; rotY: number };

const EYE_Y = FLOOR_Y + 1.67;
const CHEST_Y = FLOOR_Y + 1.45;

function orbitPoint(center: Vec3, radius: number, angle: number, y: number): Vec3 {
  return [center[0] + Math.sin(angle) * radius, y, center[2] + Math.cos(angle) * radius];
}

function ahead(mark: AvatarMark, distance: number): Vec3 {
  return [
    mark.pos[0] + Math.sin(mark.rotY) * distance,
    mark.pos[1],
    mark.pos[2] + Math.cos(mark.rotY) * distance,
  ];
}

export function buildStaging(framing: HeroFraming) {
  const portal = { position: [0, FLOOR_Y, -5] as Vec3, width: 1.7, height: 2.7 };
  const globe = { position: [0, 0.15, -1.5] as Vec3, radius: 1.15 };

  const heroSeat: AvatarMark = { pos: framing.position, rotY: framing.rotationY };
  /** Standing just in front of the chair so the chair can materialise behind him. */
  const heroStand: AvatarMark = { pos: ahead(heroSeat, 0.4 * framing.scale), rotY: framing.rotationY };
  const origin: AvatarMark = { pos: [0, FLOOR_Y, 0], rotY: 0 };

  const cam = framing.camera;
  const heroFinal: CameraKey = {
    pos: cam.position,
    target: cam.lookAt,
    fov: cam.fov,
    focus: [heroSeat.pos[0], heroSeat.pos[1] + 1.2, heroSeat.pos[2]],
    bokeh: 0,
    stage: 1,
  };
  const heroStanding: CameraKey = {
    pos: [cam.position[0], cam.position[1] + 0.35, cam.position[2] + 0.25],
    target: [cam.lookAt[0], cam.lookAt[1] + 0.45, cam.lookAt[2]],
    fov: cam.fov,
    focus: [heroStand.pos[0], EYE_Y, heroStand.pos[2]],
    bokeh: 0.6,
  };
  const heroDrift: CameraKey = {
    ...heroStanding,
    pos: [heroStanding.pos[0] + 0.12, heroStanding.pos[1] - 0.05, heroStanding.pos[2] - 0.2],
  };

  const closeCenter: Vec3 = [heroStand.pos[0], CHEST_Y, heroStand.pos[2]];
  const lensFocus: Vec3 = [0, EYE_Y, 0.14];

  const shots: Record<IntroSceneKey, Shot> = {
    systemBoot: {
      from: { pos: [0, 0.4, 9], target: [0, 0.2, 0], fov: 50, focus: [0, 0.2, 0], bokeh: 0 },
      to: { pos: [0, 0.4, 7.6], target: [0, 0.2, 0], fov: 50, focus: [0, 0.2, 0], bokeh: 0 },
      ease: "none",
    },
    moduleLoading: {
      from: { pos: [1.6, 0.6, 3.4], target: globe.position, fov: 42, focus: globe.position, bokeh: 0 },
      to: { pos: [-0.9, 0.45, 2.9], target: globe.position, fov: 42, focus: globe.position, bokeh: 0 },
      ease: "power1.inOut",
    },
    sunglassesCloseup: {
      from: { pos: [-0.16, EYE_Y + 0.01, 0.52], target: [-0.03, EYE_Y, 0.12], fov: 28, focus: lensFocus, bokeh: 4 },
      to: { pos: [0.16, EYE_Y + 0.02, 0.5], target: [0.03, EYE_Y, 0.12], fov: 28, focus: lensFocus, bokeh: 4 },
      ease: "sine.inOut",
    },
    characterReveal: {
      from: { pos: [0.05, EYE_Y - 0.02, 0.9], target: [0, EYE_Y - 0.06, 0], fov: 32, focus: lensFocus, bokeh: 3 },
      to: { pos: [0.45, 0.1, 3.0], target: [0, 0, 0], fov: 36, focus: [0, CHEST_Y, 0], bokeh: 1 },
      ease: "power2.inOut",
    },
    portalWalk: {
      from: { pos: [0.35, 0.25, 1.6], target: [0, -0.1, -5], fov: 40, focus: [0, CHEST_Y, -1], bokeh: 1.2 },
      to: { pos: [0.2, 0.2, -1.2], target: [0, -0.1, -6], fov: 40, focus: [0, CHEST_Y, -5], bokeh: 1.2 },
      ease: "none",
    },
    portalExit: {
      from: { pos: [0.3, -0.15, -2.2], target: [0, 0.1, -5.2], fov: 38, focus: [0, CHEST_Y, -5.2], bokeh: 1 },
      to: { pos: [0.15, -0.1, 0.6], target: [0, 0.15, -2.4], fov: 38, focus: [0, CHEST_Y, -2.4], bokeh: 1 },
      ease: "none",
    },
    heroCloseup: {
      from: {
        pos: orbitPoint(closeCenter, 1.35, heroStand.rotY - 0.09, CHEST_Y - 0.12),
        target: [closeCenter[0], CHEST_Y + 0.08, closeCenter[2]],
        fov: 30,
        focus: [heroStand.pos[0], EYE_Y, heroStand.pos[2]],
        bokeh: 2.5,
      },
      to: {
        pos: orbitPoint(closeCenter, 1.3, heroStand.rotY + 0.08, CHEST_Y - 0.1),
        target: [closeCenter[0], CHEST_Y + 0.08, closeCenter[2]],
        fov: 30,
        focus: [heroStand.pos[0], EYE_Y, heroStand.pos[2]],
        bokeh: 2.5,
      },
      ease: "sine.inOut",
    },
    identityReveal: {
      from: {
        pos: orbitPoint(closeCenter, 1.3, heroStand.rotY + 0.08, CHEST_Y - 0.1),
        target: [closeCenter[0], CHEST_Y + 0.08, closeCenter[2]],
        fov: 30,
        focus: [heroStand.pos[0], EYE_Y, heroStand.pos[2]],
        bokeh: 2,
      },
      to: heroStanding,
      ease: "power2.inOut",
    },
    techReveal: { from: heroStanding, to: heroDrift, ease: "sine.inOut" },
    finalHeroPose: { from: heroDrift, to: heroFinal, ease: "power2.inOut" },
  };

  const marks: Record<IntroSceneKey, { from: AvatarMark; to: AvatarMark }> = {
    systemBoot: { from: origin, to: origin },
    moduleLoading: { from: origin, to: origin },
    sunglassesCloseup: { from: origin, to: origin },
    characterReveal: { from: origin, to: origin },
    portalWalk: {
      from: { pos: [0, FLOOR_Y, -1.0], rotY: Math.PI },
      to: { pos: [0, FLOOR_Y, -5.3], rotY: Math.PI },
    },
    portalExit: {
      from: { pos: [0, FLOOR_Y, -5.3], rotY: 0 },
      to: { pos: [0, FLOOR_Y, -2.4], rotY: 0 },
    },
    heroCloseup: { from: heroStand, to: heroStand },
    identityReveal: { from: heroStand, to: heroStand },
    techReveal: { from: heroStand, to: heroStand },
    finalHeroPose: { from: heroStand, to: heroSeat },
  };

  return { portal, globe, heroSeat, heroStand, heroFinal, shots, marks };
}

export type IntroStaging = ReturnType<typeof buildStaging>;
