"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { avatarConfig } from "@/lib/avatar/avatarConfig";
import { createGlbAnimator, type AvatarController } from "./AvatarAnimations";
import { useLensMaterial } from "./AvatarEffects";
import StandInAvatar from "./StandInAvatar";

export type HameedAvatarProps = {
  controller: AvatarController;
  /** Use the rigged GLB at `modelPath` (see `probeAvatarModel`). */
  useGlb?: boolean;
  modelPath?: string;
  castShadow?: boolean;
};

let modelProbe: Promise<boolean> | null = null;

/** Resolves true once `public/models/hameed-avatar.glb` exists. Cached per page load. */
export function probeAvatarModel(path = avatarConfig.modelPath) {
  if (!modelProbe) {
    modelProbe = fetch(path, { method: "HEAD" })
      .then((res) => res.ok && !(res.headers.get("content-type") ?? "").includes("text/html"))
      .catch(() => false);
  }
  return modelProbe;
}

function GlbAvatar({
  modelPath,
  controller,
  lens,
  castShadow,
}: {
  modelPath: string;
  controller: AvatarController;
  lens: THREE.Material;
  castShadow: boolean;
}) {
  const { scene, animations } = useGLTF(modelPath, avatarConfig.dracoPath);
  // Cloned so the intro and the Hero can show the avatar at the same time.
  const model = useMemo(() => cloneSkinned(scene), [scene]);
  const headBone = useRef<THREE.Object3D | null>(null);
  const applied = useRef({ x: 0, y: 0 });

  const animator = useMemo(
    () => createGlbAnimator(new THREE.AnimationMixer(model), animations),
    [model, animations]
  );

  useEffect(() => {
    headBone.current = null;
    model.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = castShadow;
        mesh.receiveShadow = castShadow;
        if (avatarConfig.lensMeshPattern.test(mesh.name)) mesh.material = lens;
      }
      if (!headBone.current && /head/i.test(obj.name) && !(obj as THREE.Mesh).isMesh) {
        headBone.current = obj;
      }
    });
    return () => animator.dispose();
  }, [model, lens, castShadow, animator]);

  useFrame((_, dt) => {
    const head = headBone.current;
    if (head) {
      head.rotation.x -= applied.current.x;
      head.rotation.y -= applied.current.y;
    }
    animator.update(controller, Math.min(dt, 0.1));
    if (head) {
      const s = controller.state;
      const targetY = s.lookX * avatarConfig.headTracking.yaw;
      const targetX = -s.lookY * avatarConfig.headTracking.pitch;
      applied.current.x = THREE.MathUtils.lerp(applied.current.x, targetX, 0.08);
      applied.current.y = THREE.MathUtils.lerp(applied.current.y, targetY, 0.08);
      head.rotation.x += applied.current.x;
      head.rotation.y += applied.current.y;
    }
  });

  return <primitive object={model} />;
}

/**
 * The one avatar used in every intro shot and in the Hero.
 * Drop a rigged character at `public/models/hameed-avatar.glb` to replace
 * the procedural stand-in — the controller API stays the same.
 */
export default function HameedAvatar({
  controller,
  useGlb = false,
  modelPath = avatarConfig.modelPath,
  castShadow = true,
}: HameedAvatarProps) {
  const lens = useLensMaterial();
  const standIn = <StandInAvatar controller={controller} lens={lens} castShadow={castShadow} />;

  if (!useGlb) return standIn;
  return (
    <Suspense fallback={standIn}>
      <GlbAvatar modelPath={modelPath} controller={controller} lens={lens} castShadow={castShadow} />
    </Suspense>
  );
}

export function preloadAvatarModel(path = avatarConfig.modelPath) {
  useGLTF.preload(path, avatarConfig.dracoPath);
}
