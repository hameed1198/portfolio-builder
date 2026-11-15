"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { introStore } from "@/lib/intro/introStore";

const PORTRAIT_MIN_ASPECT = 0.62;

type IntroCameraProps = {
  /** 0 = locked-off (reduced motion), 1 = full operator drift. */
  motion: number;
};

/** Applies the timeline-driven camera every frame. Cuts are just instant `set`s in the timeline. */
export default function IntroCamera({ motion }: IntroCameraProps) {
  const targetRef = useRef(new THREE.Vector3());

  useFrame((state) => {
    const camera = state.camera as THREE.PerspectiveCamera;
    const target = targetRef.current;
    const c = introStore.runtime.cam;
    const t = state.clock.elapsedTime;
    // Barely-there operator drift, scaled down in close-ups so it never reads as shake.
    const dist = Math.hypot(c.px - c.tx, c.py - c.ty, c.pz - c.tz);
    const drift = motion * Math.min(0.006, dist * 0.0015);
    camera.position.set(
      c.px + Math.sin(t * 0.7) * drift,
      c.py + Math.sin(t * 0.53 + 1.2) * drift * 0.6,
      c.pz
    );
    target.set(c.tx, c.ty, c.tz);
    camera.lookAt(target);
    // Shots are authored with a vertical fov; on tall portrait screens widen it so
    // close-ups aren't cropped to a sliver. The final shot (stage 1) uses the Hero's exact fov.
    const { width, height } = state.size;
    const aspect = width / height;
    const portraitFov =
      aspect < PORTRAIT_MIN_ASPECT
        ? THREE.MathUtils.radToDeg(
            2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(c.fov) / 2) * (PORTRAIT_MIN_ASPECT / aspect))
          )
        : c.fov;
    const fov = THREE.MathUtils.lerp(portraitFov, c.fov, c.stage);
    if (Math.abs(camera.fov - fov) > 0.001) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    // The Hero canvas fills #home, which can outgrow the viewport on short
    // screens; its visible part is the top slice of that taller frame.
    const stageHeight = c.stage > 0 ? (document.getElementById("home")?.offsetHeight ?? 0) : 0;
    const extra = stageHeight > height ? (stageHeight - height) * c.stage : 0;
    const view = camera.view;
    if (extra > 0.5) {
      if (!view?.enabled || Math.abs(view.fullHeight - (height + extra)) > 0.5 || view.width !== width) {
        // With a view offset, fov/aspect describe the full (virtual) frame.
        camera.aspect = width / (height + extra);
        camera.setViewOffset(width, height + extra, 0, 0, width, height);
      }
    } else if (view?.enabled) {
      camera.aspect = width / height;
      camera.clearViewOffset();
    }
  });

  return null;
}
