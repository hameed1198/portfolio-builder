"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction, type DepthOfFieldEffect } from "postprocessing";
import type { QualitySettings } from "@/lib/intro/introConfig";
import { introStore } from "@/lib/intro/introStore";

/** Rack focus: follow the timeline's focus point; range tightens in close-ups. */
function FocusDriver({ dofRef }: { dofRef: React.RefObject<DepthOfFieldEffect | null> }) {
  useFrame(() => {
    const effect = dofRef.current;
    if (!effect) return;
    const c = introStore.runtime.cam;
    effect.target?.set(c.fx, c.fy, c.fz);
    const dist = Math.hypot(c.px - c.fx, c.py - c.fy, c.pz - c.fz);
    effect.cocMaterial.focusRange = Math.max(0.05, dist * 0.35);
    effect.bokehScale = c.bokeh;
  });
  return null;
}

export default function IntroPostFX({ quality }: { quality: QualitySettings }) {
  const dof = useRef<DepthOfFieldEffect>(null);

  if (quality.dof) {
    return (
      <>
        <FocusDriver dofRef={dof} />
        <EffectComposer multisampling={quality.multisampling}>
          <DepthOfField ref={dof} target={[0, 0, 0]} focusRange={1} bokehScale={0} />
          <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.55} luminanceSmoothing={0.2} />
          <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.18} />
          <Vignette offset={0.25} darkness={0.75} />
        </EffectComposer>
      </>
    );
  }

  return (
    <EffectComposer multisampling={quality.multisampling}>
      <Bloom mipmapBlur intensity={0.5} luminanceThreshold={0.6} luminanceSmoothing={0.2} />
      <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.15} />
      <Vignette offset={0.25} darkness={0.7} />
    </EffectComposer>
  );
}
