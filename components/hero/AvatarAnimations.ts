import * as THREE from "three";
import { avatarConfig, type AvatarClipName } from "@/lib/avatar/avatarConfig";

/* ------------------------------------------------------------------ */
/* Controller — the single interface both avatar backends obey          */
/* ------------------------------------------------------------------ */

export type AvatarControllerState = {
  clip: AvatarClipName;
  fade: number;
  /** Seconds into the clip to start from (e.g. already seated). */
  offset: number;
  version: number;
  lookX: number;
  lookY: number;
  /** Ground speed in m/s — keeps the walk cycle from sliding. */
  walkSpeed: number;
};

export type PlayOptions = { fade?: number; offset?: number; restart?: boolean };

export type AvatarController = {
  state: AvatarControllerState;
  play: (clip: AvatarClipName, options?: PlayOptions) => void;
  setLookTarget: (x: number, y: number) => void;
  setWalkSpeed: (speed: number) => void;
};

export function createAvatarController(
  initial: AvatarClipName = "idle",
  options: PlayOptions = {}
): AvatarController {
  const state: AvatarControllerState = {
    clip: initial,
    fade: 0,
    offset: options.offset ?? 0,
    version: 0,
    lookX: 0,
    lookY: 0,
    walkSpeed: 0,
  };
  return {
    state,
    play(clip, opts = {}) {
      if (clip === state.clip && !opts.restart) return;
      state.clip = clip;
      state.fade = opts.fade ?? avatarConfig.clipFade;
      state.offset = opts.offset ?? 0;
      state.version += 1;
    },
    setLookTarget(x, y) {
      state.lookX = x;
      state.lookY = y;
    },
    setWalkSpeed(speed) {
      state.walkSpeed = speed;
    },
  };
}

const ONE_SHOTS = new Set<AvatarClipName>(avatarConfig.oneShotClips);

/* ------------------------------------------------------------------ */
/* Procedural poses (stand-in avatar)                                    */
/* Character faces +z; character's left is +x.                           */
/* Forward arm/leg swing = negative x rotation; knee bend = positive x.  */
/* ------------------------------------------------------------------ */

export const JOINTS = [
  "hips",
  "spine",
  "chest",
  "neck",
  "head",
  "shoulderL",
  "shoulderR",
  "elbowL",
  "elbowR",
  "wristL",
  "wristR",
  "thighL",
  "thighR",
  "kneeL",
  "kneeR",
  "ankleL",
  "ankleR",
] as const;

export type JointName = (typeof JOINTS)[number];
type Rot = { x: number; y: number; z: number };

export type Pose = {
  joints: Record<JointName, Rot>;
  rootY: number;
  /** 0 standing → 1 seated (drives coat drape). */
  sit: number;
  /** 0–1 coat sway amplitude from walking. */
  walk: number;
  walkPhase: number;
  glassesLift: number;
  breath: number;
};

export function createPose(): Pose {
  const joints = {} as Record<JointName, Rot>;
  for (const j of JOINTS) joints[j] = { x: 0, y: 0, z: 0 };
  return { joints, rootY: 0, sit: 0, walk: 0, walkPhase: 0, glassesLift: 0, breath: 0 };
}

function resetPose(p: Pose) {
  for (const j of JOINTS) {
    const r = p.joints[j];
    r.x = 0;
    r.y = 0;
    r.z = 0;
  }
  p.rootY = 0;
  p.sit = 0;
  p.walk = 0;
  p.glassesLift = 0;
}

function blendPose(out: Pose, a: Pose, b: Pose, w: number) {
  const lerp = THREE.MathUtils.lerp;
  for (const j of JOINTS) {
    const o = out.joints[j];
    const ra = a.joints[j];
    const rb = b.joints[j];
    o.x = lerp(ra.x, rb.x, w);
    o.y = lerp(ra.y, rb.y, w);
    o.z = lerp(ra.z, rb.z, w);
  }
  out.rootY = lerp(a.rootY, b.rootY, w);
  out.sit = lerp(a.sit, b.sit, w);
  out.walk = lerp(a.walk, b.walk, w);
  out.glassesLift = lerp(a.glassesLift, b.glassesLift, w);
}

const smooth = (edge0: number, edge1: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

function standBase(p: Pose, t: number) {
  const j = p.joints;
  j.shoulderL.z = 0.08;
  j.shoulderR.z = -0.08;
  j.elbowL.x = -0.14;
  j.elbowR.x = -0.12;
  j.wristL.z = -0.05;
  j.wristR.z = 0.05;
  j.hips.z = Math.sin(t * 0.5) * 0.012;
  j.spine.z = -Math.sin(t * 0.5) * 0.008;
}

function heroStance(p: Pose, t: number) {
  standBase(p, t);
  const j = p.joints;
  j.thighL.z = 0.06;
  j.thighR.z = -0.06;
  j.ankleL.z = -0.06;
  j.ankleR.z = 0.06;
  j.chest.x = -0.04;
  j.shoulderL.z = 0.13;
  j.shoulderR.z = -0.13;
  j.head.x = -0.03;
  j.head.y = Math.sin(t * 0.3) * 0.025;
}

function seated(p: Pose, t: number) {
  const j = p.joints;
  p.rootY = -0.445;
  p.sit = 1;
  j.thighL.x = -1.5;
  j.thighR.x = -1.5;
  j.thighL.z = 0.08;
  j.thighR.z = -0.08;
  j.kneeL.x = 1.5;
  j.kneeR.x = 1.5;
  j.spine.x = -0.06;
  j.chest.x = -0.04;
  j.neck.x = 0.02;
  j.head.y = Math.sin(t * 0.25) * 0.02;
  j.shoulderL.x = -0.35;
  j.shoulderR.x = -0.35;
  j.shoulderL.z = 0.28;
  j.shoulderR.z = -0.28;
  j.elbowL.x = -1.1;
  j.elbowR.x = -1.1;
  j.wristL.x = 0.12;
  j.wristR.x = 0.12;
}

type ClipFn = (p: Pose, t: number, ct: number, walkPhase: number) => void;

const scratch = createPose();

const clipFns: Record<AvatarClipName, ClipFn> = {
  idle(p, t) {
    standBase(p, t);
    p.joints.head.y = Math.sin(t * 0.3) * 0.04;
  },
  breathing(p, t) {
    standBase(p, t);
  },
  heroPose(p, t) {
    heroStance(p, t);
  },
  lookUp(p, t) {
    heroStance(p, t);
    const j = p.joints;
    j.chest.x = -0.06;
    j.neck.x = -0.05;
    j.head.x = -0.2 + Math.sin(t * 0.6) * 0.015;
    j.head.y = Math.sin(t * 0.35) * 0.03;
  },
  adjustSunglasses(p, t, ct) {
    standBase(p, t);
    const raise = smooth(0, 0.45, ct) * (1 - smooth(1.25, 1.8, ct));
    const j = p.joints;
    j.shoulderR.x = THREE.MathUtils.lerp(0, -1.0, raise);
    j.shoulderR.y = THREE.MathUtils.lerp(0, 0.5, raise);
    j.shoulderR.z = THREE.MathUtils.lerp(-0.08, 0, raise);
    j.elbowR.x = THREE.MathUtils.lerp(-0.12, -2.3, raise);
    j.wristR.x = -0.2 * raise;
    j.head.x = 0.06 * raise - 0.04 * smooth(1.3, 1.9, ct);
    j.head.y = 0.05 * raise;
    p.glassesLift = 0.006 * smooth(0.55, 0.9, ct) * (1 - smooth(1.2, 1.5, ct));
  },
  walking(p, t, _ct, phase) {
    const j = p.joints;
    const s = Math.sin(phase);
    const c = Math.cos(phase);
    p.walk = 1;
    j.thighL.x = -s * 0.42;
    j.thighR.x = s * 0.42;
    j.kneeL.x = 0.1 + 0.85 * Math.pow(Math.max(0, c), 1.5);
    j.kneeR.x = 0.1 + 0.85 * Math.pow(Math.max(0, -c), 1.5);
    j.ankleL.x = 0.2 * Math.max(0, -c) - 0.1 * Math.max(0, c);
    j.ankleR.x = 0.2 * Math.max(0, c) - 0.1 * Math.max(0, -c);
    j.shoulderL.x = s * 0.32;
    j.shoulderR.x = -s * 0.32;
    j.shoulderL.z = 0.07;
    j.shoulderR.z = -0.07;
    j.elbowL.x = -0.25 - 0.18 * Math.max(0, -s);
    j.elbowR.x = -0.25 - 0.18 * Math.max(0, s);
    j.hips.y = s * 0.07;
    j.chest.y = -s * 0.09;
    j.chest.x = 0.05;
    j.spine.z = c * 0.015;
    j.head.x = -0.02;
    j.head.y = s * 0.02;
    p.rootY = 0.022 * Math.cos(2 * phase) - 0.012;
  },
  sitting(p, t, ct) {
    const k = smooth(0, avatarConfig.sitDuration, ct);
    resetPose(scratch);
    heroStance(scratch, t);
    resetPose(p);
    seated(p, t);
    blendPose(p, scratch, p, k);
    // Slight forward lean mid-transition, like a real person sitting down.
    p.joints.spine.x += Math.sin(k * Math.PI) * 0.35;
    p.joints.thighL.x -= Math.sin(k * Math.PI) * 0.15;
    p.joints.thighR.x -= Math.sin(k * Math.PI) * 0.15;
  },
  typing(p, t) {
    seated(p, t);
    const j = p.joints;
    j.shoulderL.x = -0.55;
    j.shoulderR.x = -0.55;
    j.shoulderL.z = 0.1;
    j.shoulderR.z = -0.1;
    j.elbowL.x = -1.0;
    j.elbowR.x = -1.0;
    j.wristL.x = 0.1 + Math.sin(t * 14) * 0.06;
    j.wristR.x = 0.1 + Math.sin(t * 15 + 1.3) * 0.06;
    j.head.x = 0.12;
  },
};

function evaluateClip(clip: AvatarClipName, p: Pose, t: number, ct: number, walkPhase: number) {
  resetPose(p);
  clipFns[clip](p, t, ct, walkPhase);
}

const STRIDE_CYCLE = 1.4;

/** Procedural animator: crossfades between clips and layers breathing + look-at on top. */
export function createProceduralAnimator() {
  const current = createPose();
  const previous = createPose();
  const out = createPose();
  let version = -1;
  let clip: AvatarClipName = "idle";
  let clipStart = 0;
  let prevClip: AvatarClipName = "idle";
  let prevStart = 0;
  let fadeStart = 0;
  let fadeDuration = 0;
  let walkPhase = 0;
  const look = { x: 0, y: 0 };

  return {
    update(controller: AvatarController, t: number, dt: number): Pose {
      const s = controller.state;
      if (s.version !== version) {
        const first = version === -1;
        prevClip = clip;
        prevStart = clipStart;
        clip = s.clip;
        clipStart = t - s.offset;
        fadeStart = t;
        fadeDuration = first ? 0 : s.fade;
        version = s.version;
      }

      const speed = s.walkSpeed > 0.05 ? s.walkSpeed : 1.3;
      walkPhase += (dt * speed * Math.PI * 2) / STRIDE_CYCLE;

      evaluateClip(clip, current, t, t - clipStart, walkPhase);
      const w = fadeDuration > 0 ? smooth(0, 1, (t - fadeStart) / fadeDuration) : 1;
      if (w < 1) {
        evaluateClip(prevClip, previous, t, t - prevStart, walkPhase);
        blendPose(out, previous, current, w);
      } else {
        blendPose(out, current, current, 1);
      }
      out.walkPhase = walkPhase;

      // Breathing — always on, additive.
      const breath = Math.sin(t * 1.6);
      out.breath = breath;
      out.joints.chest.x += breath * 0.012;
      out.joints.shoulderL.z += breath * 0.008;
      out.joints.shoulderR.z -= breath * 0.008;
      out.joints.neck.x -= breath * 0.006;

      look.x = THREE.MathUtils.lerp(look.x, s.lookX, Math.min(1, dt * 4));
      look.y = THREE.MathUtils.lerp(look.y, s.lookY, Math.min(1, dt * 4));
      out.joints.head.y += look.x * avatarConfig.headTracking.yaw;
      out.joints.head.x -= look.y * avatarConfig.headTracking.pitch;
      return out;
    },
  };
}

/* ------------------------------------------------------------------ */
/* GLB animator (AnimationMixer crossfades)                               */
/* ------------------------------------------------------------------ */

export type AvatarActionMap = Partial<Record<AvatarClipName, THREE.AnimationAction>>;

/** Map GLB clips to known avatar states (case-insensitive / fuzzy). */
export function buildAvatarActions(
  mixer: THREE.AnimationMixer,
  clips: THREE.AnimationClip[]
): AvatarActionMap {
  const actions: AvatarActionMap = {};
  for (const name of avatarConfig.expectedClips) {
    const lower = name.toLowerCase();
    const clip = clips.find(
      (c) => c.name.toLowerCase() === lower || c.name.toLowerCase().includes(lower)
    );
    if (!clip) continue;

    if (name === "breathing") {
      const additive = THREE.AnimationUtils.makeClipAdditive(clip.clone());
      const action = mixer.clipAction(additive);
      action.blendMode = THREE.AdditiveAnimationBlendMode;
      actions.breathing = action;
      continue;
    }

    const action = mixer.clipAction(clip);
    if (ONE_SHOTS.has(name)) {
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
    }
    actions[name] = action;
  }
  if (!actions.idle && clips[0]) actions.idle = mixer.clipAction(clips[0]);
  return actions;
}

export function createGlbAnimator(mixer: THREE.AnimationMixer, clips: THREE.AnimationClip[]) {
  const actions = buildAvatarActions(mixer, clips);
  actions.breathing?.play();
  let version = -1;
  let active: THREE.AnimationAction | null = null;

  return {
    actions,
    update(controller: AvatarController, dt: number) {
      const s = controller.state;
      if (s.version !== version) {
        const next = actions[s.clip] ?? actions.idle ?? null;
        if (next && next !== active) {
          next.reset();
          next.time = s.offset;
          next.setEffectiveWeight(1);
          next.play();
          if (active && version !== -1 && s.fade > 0) active.crossFadeTo(next, s.fade, false);
          else active?.stop();
          active = next;
        }
        version = s.version;
      }
      mixer.update(dt);
    },
    dispose() {
      mixer.stopAllAction();
      mixer.uncacheRoot(mixer.getRoot());
    },
  };
}
