"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Vec3 } from "@/lib/avatar/avatarConfig";

type AvatarLightRigProps = {
  /** Static avatar position, or a per-frame getter (intro). */
  origin?: Vec3;
  getOrigin?: () => { x: number; y: number; z: number };
  shadows?: boolean;
  shadowMapSize?: number;
  /** 0–1 extra rim intensity (hover). */
  rimBoost?: number;
  /** 0–1 rig level read every frame (the intro dims it while the avatar is off-screen). */
  getLevel?: () => number;
};

/**
 * Soft neutral key + emerald rims, positioned relative to the avatar.
 * Shared by the intro and the Hero so the hand-off frame is lit identically.
 */
export function AvatarLightRig({
  origin = [0, 0, 0],
  getOrigin,
  shadows = false,
  shadowMapSize = 1024,
  rimBoost = 0,
  getLevel,
}: AvatarLightRigProps) {
  const rig = useRef<THREE.Group>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const rimL = useRef<THREE.SpotLight>(null);
  const rimR = useRef<THREE.SpotLight>(null);
  const fill = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const o = getOrigin ? getOrigin() : { x: origin[0], y: origin[1], z: origin[2] };
    rig.current?.position.set(o.x, o.y, o.z);
    for (const light of [key.current, rimL.current, rimR.current]) {
      if (!light) continue;
      light.target.position.set(o.x, o.y + 1.4, o.z);
      light.target.updateMatrixWorld();
    }
    const level = getLevel ? getLevel() : 1;
    if (key.current) key.current.intensity = 2.1 * level;
    if (rimL.current) rimL.current.intensity = (16 + rimBoost * 6) * level;
    if (rimR.current) rimR.current.intensity = 10 * level;
    if (fill.current) fill.current.intensity = 1.2 * level;
  });

  return (
    <group ref={rig}>
      <directionalLight
        ref={key}
        position={[2.2, 3.2, 3.6]}
        intensity={1.5}
        color="#eef2f4"
        castShadow={shadows}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-camera-left={-2.5}
        shadow-camera-right={2.5}
        shadow-camera-top={2.5}
        shadow-camera-bottom={-2.5}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <spotLight ref={rimL} position={[-1.4, 2.9, -2.2]} angle={0.6} penumbra={0.7} intensity={16} color="#35d89a" decay={2} />
      <spotLight ref={rimR} position={[1.6, 2.4, -2.0]} angle={0.6} penumbra={0.8} intensity={10} color="#55c9ad" decay={2} />
      <pointLight ref={fill} position={[0.35, 0.95, 1.7]} intensity={1.2} color="#ffe0cc" distance={4} decay={2} />
    </group>
  );
}

type AvatarLightingProps = {
  hoverBoost?: number;
  origin?: Vec3;
  shadows?: boolean;
};

export default function AvatarLighting({ hoverBoost = 0, origin, shadows = false }: AvatarLightingProps) {
  return (
    <>
      <ambientLight intensity={0.22} color="#18201b" />
      <hemisphereLight args={["#586b5e", "#090a09", 0.42]} />
      <AvatarLightRig origin={origin} shadows={shadows} rimBoost={hoverBoost} />
    </>
  );
}
