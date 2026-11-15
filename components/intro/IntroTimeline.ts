import gsap from "gsap";
import {
  findStartScene,
  introTiming,
  resolveSchedule,
  type AvatarMark,
  type CameraKey,
  type IntroSceneKey,
  type IntroStaging,
  type IntroVariant,
  type ScheduledScene,
} from "@/lib/intro/introConfig";
import { introStore } from "@/lib/intro/introStore";

type CamValues = typeof introStore.runtime.cam;

function camValues(k: CameraKey): CamValues {
  return {
    px: k.pos[0],
    py: k.pos[1],
    pz: k.pos[2],
    tx: k.target[0],
    ty: k.target[1],
    tz: k.target[2],
    fov: k.fov,
    fx: k.focus[0],
    fy: k.focus[1],
    fz: k.focus[2],
    bokeh: k.bokeh,
    stage: k.stage ?? 0,
  };
}

function mixCam(a: CamValues, b: CamValues, t: number): CamValues {
  const out = { ...a };
  (Object.keys(a) as (keyof CamValues)[]).forEach((key) => {
    out[key] = a[key] + (b[key] - a[key]) * t;
  });
  return out;
}

function markValues(m: AvatarMark) {
  return { x: m.pos[0], y: m.pos[1], z: m.pos[2], rotY: m.rotY };
}

type SceneContext = {
  tl: gsap.core.Timeline;
  scene: ScheduledScene;
  staging: IntroStaging;
  variant: IntroVariant;
  /** True when the previous scheduled scene isn't the storyboard predecessor. */
  jumped: boolean;
};

/** Environment, camera and avatar mark — shared by every scene. */
function stageScene({ tl, scene, staging, variant, jumped }: SceneContext) {
  const rt = introStore.runtime;
  const at = scene.start;
  const len = scene.length;
  const cut = scene.cut || jumped;

  if (cut) tl.set(rt.env, { ...scene.env }, at);
  else tl.to(rt.env, { ...scene.env, duration: Math.min(introTiming.envFade, len), ease: "power1.inOut" }, at);

  const shot = staging.shots[scene.key];
  const to = camValues(shot.to);
  const motion = variant.cameraMotion;
  if (motion <= 0) {
    tl.set(rt.cam, to, at);
  } else {
    const from = mixCam(to, camValues(shot.from), motion);
    if (cut) tl.set(rt.cam, from, at);
    tl.to(rt.cam, { ...to, duration: len, ease: shot.ease }, at);
  }

  const mark = staging.marks[scene.key];
  tl.set(rt.avatar, markValues(mark.from), at);
  if (scene.key !== "finalHeroPose" && (mark.from.pos !== mark.to.pos || mark.from.rotY !== mark.to.rotY)) {
    tl.to(rt.avatar, { ...markValues(mark.to), duration: len, ease: "none" }, at);
  }
}

type SceneBuilder = (ctx: SceneContext) => void;

const systemBoot: SceneBuilder = (ctx) => stageScene(ctx);
const moduleLoading: SceneBuilder = (ctx) => stageScene(ctx);
const sunglassesCloseup: SceneBuilder = (ctx) => stageScene(ctx);
const characterReveal: SceneBuilder = (ctx) => stageScene(ctx);

const portalWalk: SceneBuilder = (ctx) => {
  stageScene(ctx);
  const { tl, scene } = ctx;
  const rt = introStore.runtime;
  const end = scene.start + scene.length;
  // Portal surge + white-green flash bridging the cut into the emergence.
  tl.to(rt.env, { portal: 1.6, duration: 0.3, ease: "power2.in" }, end - 0.3);
  tl.to(rt.overlay, { flash: 1, duration: 0.18, ease: "power2.in" }, end - 0.18);
  tl.to(rt.overlay, { flash: 0, duration: 0.45, ease: "power2.out" }, end);
};

const portalExit: SceneBuilder = (ctx) => stageScene(ctx);
const heroCloseup: SceneBuilder = (ctx) => stageScene(ctx);
const identityReveal: SceneBuilder = (ctx) => stageScene(ctx);

const techReveal: SceneBuilder = (ctx) => {
  stageScene(ctx);
  const { tl, scene } = ctx;
  tl.fromTo(
    introStore.runtime.env,
    { badges: 0 },
    { badges: 1, duration: scene.length * 0.8, ease: "power1.out", immediateRender: false },
    scene.start
  );
};

const finalHeroPose: SceneBuilder = (ctx) => {
  stageScene(ctx);
  const { tl, scene, staging } = ctx;
  const sitCue = scene.clips.find((c) => c.clip === "sitting");
  const sitAt = scene.start + (sitCue?.at ?? 0) * scene.length;
  const sitLen = Math.min(introTiming.sitDuration, scene.start + scene.length - sitAt);
  tl.to(
    introStore.runtime.avatar,
    { ...markValues(staging.marks.finalHeroPose.to), duration: sitLen, ease: "power1.inOut" },
    sitAt
  );
};

const builders: Record<IntroSceneKey, SceneBuilder> = {
  systemBoot,
  moduleLoading,
  sunglassesCloseup,
  characterReveal,
  portalWalk,
  portalExit,
  heroCloseup,
  identityReveal,
  techReveal,
  finalHeroPose,
};

const heroTransition = (tl: gsap.core.Timeline, at: number) => {
  tl.to(introStore.runtime.overlay, { opacity: 0, duration: introTiming.heroTransition, ease: "power2.inOut" }, at);
};

export type IntroTimelineCallbacks = {
  onScene?: (scene: ScheduledScene) => void;
  /** Fired when the crossfade into the live Hero begins. */
  onHandoff?: () => void;
  onComplete?: () => void;
};

export function buildIntroTimeline(
  variant: IntroVariant,
  staging: IntroStaging,
  callbacks: IntroTimelineCallbacks = {}
) {
  const schedule = resolveSchedule(variant);
  const last = schedule[schedule.length - 1];
  const total = last.start + last.length;
  const rt = introStore.runtime;
  const tl = gsap.timeline({ paused: true, onComplete: callbacks.onComplete });

  tl.fromTo(
    rt,
    { time: 0 },
    { time: total + introTiming.heroTransition, duration: total + introTiming.heroTransition, ease: "none" },
    0
  );

  schedule.forEach((scene, i) => {
    const prev = schedule[i - 1];
    tl.addLabel(scene.key, scene.start);
    builders[scene.key]({
      tl,
      scene,
      staging,
      variant,
      jumped: i > 0 && prev.id !== scene.id - 1,
    });
  });
  heroTransition(tl, total);
  tl.call(() => callbacks.onHandoff?.(), [], total);

  let currentScene = -1;
  let currentCue = "";
  let lastTime = 0;

  tl.eventCallback("onUpdate", () => {
    const time = tl.time();
    const jumpedTime = Math.abs(time - lastTime) > 0.25;
    lastTime = time;

    let idx = schedule.findIndex((s) => time >= s.start && time < s.start + s.length);
    if (idx === -1) idx = schedule.length - 1;
    const scene = schedule[idx];

    if (idx !== currentScene) {
      currentScene = idx;
      introStore.update({
        sceneId: scene.id,
        sceneKey: scene.key,
        sceneStart: scene.start,
        sceneLength: scene.length,
        total,
        playing: true,
      });
      callbacks.onScene?.(scene);
    }

    // Latest clip cue that has started — derived from time so seeking is exact.
    let cueIndex = -1;
    scene.clips.forEach((cue, i) => {
      if (time >= scene.start + cue.at * scene.length) cueIndex = i;
    });
    if (cueIndex === -1) return;
    const cue = scene.clips[cueIndex];
    const key = `${scene.id}:${cueIndex}`;
    if (key !== currentCue) {
      currentCue = key;
      const cueTime = scene.start + cue.at * scene.length;
      const instant = jumpedTime || (scene.cut && cue.at === 0);
      introStore.controller.play(cue.clip, {
        fade: instant ? 0 : undefined,
        offset: (cue.offset ?? 0) + Math.max(0, time - cueTime),
        restart: true,
      });
    }
  });

  return {
    tl,
    schedule,
    total,
    /** Jump to scene `id` (or the next scheduled one if that scene is skipped). */
    seekToScene(id: number) {
      const scene = findStartScene(schedule, id);
      tl.seek(scene.start, true);
      return scene;
    },
    kill() {
      tl.kill();
    },
  };
}

export type IntroTimeline = ReturnType<typeof buildIntroTimeline>;
