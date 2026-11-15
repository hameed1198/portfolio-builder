export const AVATAR_MODEL_PATH = "/models/hameed-avatar.glb";

export type Vec3 = [number, number, number];

export type HeroFraming = {
  /** Avatar root (feet) position — the chair is placed here too. */
  position: Vec3;
  rotationY: number;
  scale: number;
  camera: { position: Vec3; lookAt: Vec3; fov: number };
};

export const FLOOR_Y = -1.25;

export const avatarConfig = {
  modelPath: AVATAR_MODEL_PATH,
  /** Drop your final rigged character here — HameedAvatar loads it automatically. */
  modelDropInPath: "public/models/hameed-avatar.glb",
  /** Self-hosted Draco decoder (copied from three/examples/jsm/libs/draco/gltf). */
  dracoPath: "/draco/",
  referenceTexture: "/textures/avatar/reference.jpg",
  fallbackPortrait: "/images/profile.jpg",
  /** GLB meshes whose names match get the Matrix-reflection lens material. */
  lensMeshPattern: /lens|glass|sunglass/i,
  /** Final intro frame and the interactive Hero share this framing. */
  hero: {
    desktop: {
      position: [-0.85, FLOOR_Y, 0],
      rotationY: 0.25,
      scale: 1,
      camera: { position: [0.15, 0.05, 3.7], lookAt: [-0.4, -0.35, 0], fov: 36 },
    } satisfies HeroFraming,
    mobile: {
      position: [0, FLOOR_Y, -0.3],
      rotationY: 0,
      // Keep 1: the intro's avatar is never scaled, so a smaller Hero framing
      // is done with camera distance instead.
      scale: 1,
      camera: { position: [0, 0.4, 5.23], lookAt: [0, -0.13, 0.05], fov: 38 },
    } satisfies HeroFraming,
  },
  headTracking: {
    yaw: 0.12,
    pitch: 0.07,
  },
  particles: {
    desktop: 65,
    mobile: 25,
  },
  /** Seconds — default crossfade between clips. */
  clipFade: 0.45,
  /** Seconds the `sitting` clip takes to go from standing to seated. */
  sitDuration: 1.4,
  expectedClips: [
    "idle",
    "breathing",
    "adjustSunglasses",
    "walking",
    "lookUp",
    "heroPose",
    "sitting",
    "typing",
  ] as const,
  /** Clips that play once and hold their last frame. */
  oneShotClips: ["adjustSunglasses", "sitting"] as const,
};

export type AvatarClipName = (typeof avatarConfig.expectedClips)[number];

export function getHeroFraming(mobile: boolean): HeroFraming {
  return mobile ? avatarConfig.hero.mobile : avatarConfig.hero.desktop;
}
