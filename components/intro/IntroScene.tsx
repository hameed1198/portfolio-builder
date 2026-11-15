"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import HameedAvatar from "@/components/hero/HameedAvatar";
import type { HeroFraming } from "@/lib/avatar/avatarConfig";
import type { IntroStaging, QualitySettings } from "@/lib/intro/introConfig";
import { introStore } from "@/lib/intro/introStore";
import IntroCamera from "./IntroCamera";
import IntroLighting from "./IntroLighting";
import IntroEnvironment from "./IntroEnvironment";
import IntroTechBadges from "./IntroTechBadges";
import IntroPostFX from "./IntroPostFX";

export type IntroSceneProps = {
  quality: QualitySettings;
  staging: IntroStaging;
  framing: HeroFraming;
  useGlb: boolean;
  cameraMotion: number;
  onReady: () => void;
};

function IntroAvatarRig({ useGlb, castShadow }: { useGlb: boolean; castShadow: boolean }) {
  const group = useRef<THREE.Group>(null);
  const last = useRef<{ x: number; z: number } | null>(null);
  const speed = useRef(0);
  const controller = introStore.controller;

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const { avatar, env } = introStore.runtime;
    g.position.set(avatar.x, avatar.y, avatar.z);
    g.rotation.y = avatar.rotY;
    g.visible = env.avatar > 0.5;

    // Derive ground speed from actual movement so the stride matches (ignores cuts).
    if (last.current && dt > 0) {
      const v = Math.hypot(avatar.x - last.current.x, avatar.z - last.current.z) / dt;
      if (v < 6) speed.current = THREE.MathUtils.lerp(speed.current, v, 0.15);
    }
    last.current = { x: avatar.x, z: avatar.z };
    controller.setWalkSpeed(speed.current);
  });

  return (
    <group ref={group}>
      <HameedAvatar controller={controller} useGlb={useGlb} castShadow={castShadow} />
    </group>
  );
}

/** Compiles every material up front (hidden ones too) so hard cuts never stutter. */
function ReadySignal({ onReady }: { onReady: () => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    const hidden: THREE.Object3D[] = [];
    scene.traverse((o) => {
      if (!o.visible) {
        hidden.push(o);
        o.visible = true;
      }
    });
    gl.compile(scene, camera);
    hidden.forEach((o) => {
      o.visible = false;
    });
    const id = requestAnimationFrame(() => onReady());
    return () => cancelAnimationFrame(id);
  }, [gl, scene, camera, onReady]);

  return null;
}

export default function IntroScene({
  quality,
  staging,
  framing,
  useGlb,
  cameraMotion,
  onReady,
}: IntroSceneProps) {
  return (
    <Canvas
      dpr={quality.dpr}
      shadows={quality.shadows ? "percentage" : false}
      gl={{ antialias: quality.multisampling === 0, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [0, 0.4, 9], fov: 50, near: 0.03, far: 80 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <color attach="background" args={["#020604"]} />
      <fog attach="fog" args={["#020604", 7, 26]} />
      <IntroCamera motion={cameraMotion} />
      <IntroLighting quality={quality} staging={staging} />
      <Suspense fallback={null}>
        <IntroEnvironment quality={quality} staging={staging} framing={framing} />
        <IntroAvatarRig useGlb={useGlb} castShadow={quality.shadows} />
        <IntroTechBadges framing={framing} />
        <ReadySignal onReady={onReady} />
      </Suspense>
      {quality.postfx ? <IntroPostFX quality={quality} /> : null}
    </Canvas>
  );
}
