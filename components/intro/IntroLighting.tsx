"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { AvatarLightRig } from "@/components/hero/AvatarLighting";
import type { IntroStaging, QualitySettings } from "@/lib/intro/introConfig";
import { introStore } from "@/lib/intro/introStore";

RectAreaLightUniformsLib.init();

type IntroLightingProps = {
  quality: QualitySettings;
  staging: IntroStaging;
};

/**
 * The Hero's avatar light rig (travelling with the character) plus a strong
 * portal area light. Only the key light casts shadows.
 */
export default function IntroLighting({ quality, staging }: IntroLightingProps) {
  const portalArea = useRef<THREE.RectAreaLight>(null);
  const portalPoint = useRef<THREE.PointLight>(null);
  const { position: portalPos, width, height } = staging.portal;

  useEffect(() => {
    portalArea.current?.lookAt(portalPos[0], portalPos[1] + height / 2, portalPos[2] + 5);
  }, [portalPos, height]);

  useFrame(() => {
    const k = introStore.runtime.env.portal;
    if (portalArea.current) portalArea.current.intensity = k * 7;
    if (portalPoint.current) portalPoint.current.intensity = k * 9;
  });

  return (
    <>
      <ambientLight intensity={0.12} color="#0d1a12" />
      <hemisphereLight args={["#3a5a48", "#020403", 0.35]} />
      <AvatarLightRig
        getOrigin={() => introStore.runtime.avatar}
        getLevel={() => introStore.runtime.env.avatar}
        shadows={quality.shadows}
        shadowMapSize={quality.shadowMapSize}
      />
      <rectAreaLight
        ref={portalArea}
        position={[portalPos[0], portalPos[1] + height / 2, portalPos[2] + 0.05]}
        width={width}
        height={height}
        color="#00ff88"
        intensity={0}
      />
      <pointLight
        ref={portalPoint}
        position={[portalPos[0], portalPos[1] + height * 0.55, portalPos[2] + 0.4]}
        color="#00ff88"
        intensity={0}
        distance={7}
        decay={2}
      />
    </>
  );
}
