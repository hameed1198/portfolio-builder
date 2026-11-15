"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { getGlyphAtlas, MATRIX_GLSL } from "@/lib/three/matrixGlyphs";
import { createRng, useMutableRef } from "@/lib/three/useMutableRef";

type LensUniforms = {
  uTime: { value: number };
  uGlyphs: { value: THREE.Texture };
  uStrength: { value: number };
};

/**
 * Dark reflective sunglasses lens. The Matrix code is a view-dependent
 * reflection weighted by fresnel — not an emissive glow — so it slides
 * across the glass as the camera moves.
 */
export function createLensMaterial(strength = 0.55) {
  const material = new THREE.MeshPhysicalMaterial({
    color: "#040605",
    roughness: 0.14,
    metalness: 0.35,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    side: THREE.DoubleSide,
  });
  const uniforms: LensUniforms = {
    uTime: { value: 0 },
    uGlyphs: { value: getGlyphAtlas() },
    uStrength: { value: strength },
  };
  material.userData.uniforms = uniforms;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uTime;
uniform sampler2D uGlyphs;
uniform float uStrength;
${MATRIX_GLSL}`
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
vec3 mxView = normalize(vViewPosition);
vec3 mxRefl = reflect(-mxView, normal);
float mxFresnel = 0.3 + 0.7 * pow(1.0 - clamp(dot(normal, mxView), 0.0, 1.0), 2.0);
vec2 mxCode = matrixRain(mxRefl.xy * 0.5 + 0.5, vec2(22.0, 16.0), uTime, uGlyphs);
totalEmissiveRadiance += (vec3(0.02, 0.85, 0.42) * mxCode.x + vec3(0.6, 1.0, 0.8) * mxCode.y * 0.6) * mxFresnel * uStrength;`
      );
  };
  material.customProgramCacheKey = () => "hameed-lens";
  return material;
}

export function useLensMaterial(strength?: number) {
  const material = useMemo(() => createLensMaterial(strength), [strength]);
  const materialRef = useMutableRef(material);
  useFrame((state) => {
    (materialRef.current.userData.uniforms as LensUniforms).uTime.value = state.clock.elapsedTime;
  });
  useEffect(() => () => material.dispose(), [material]);
  return material;
}

type AvatarEffectsProps = {
  hovered?: boolean;
  reducedMotion?: boolean;
};

function ScanRing({
  y,
  speed,
  radius,
  color = "#00ff88",
}: {
  y: number;
  speed: number;
  radius: number;
  color?: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.z += dt * speed;
  });
  return (
    <mesh ref={ref} position={[-0.85, y, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius, radius + 0.012, 80]} />
      <meshBasicMaterial color={color} transparent opacity={0.18} side={THREE.DoubleSide} />
    </mesh>
  );
}

function FloatingCode({ hovered }: { hovered: boolean }) {
  const group = useRef<THREE.Group>(null);
  const snippets = useMemo(
    () => [
      "> whoami",
      "def deploy():",
      "aws.lambda",
      "RAG.search()",
      ">_ online",
      "fastapi.run()",
    ],
    []
  );

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.children.forEach((child, i) => {
      child.position.y = 0.8 + Math.sin(t * 0.5 + i * 0.7) * 0.12 + i * 0.2;
      child.position.x = 0.12 + Math.cos(t * 0.3 + i * 0.5) * 0.06;
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = hovered ? 0.5 : 0.22;
    });
  });

  return (
    <group ref={group}>
      {snippets.map((text, i) => (
        <Text
          key={text}
          position={[0.12, 0.8 + i * 0.2, -0.35]}
          fontSize={0.065}
          color="#00ff88"
          anchorX="left"
          anchorY="middle"
          fillOpacity={0.22}
          font={undefined}
        >
          {text}
        </Text>
      ))}
    </group>
  );
}

/** Matrix rain columns in background — tall falling green chars. */
function MatrixRainColumns() {
  const group = useRef<THREE.Group>(null);
  const columns = useMemo(() => {
    const rand = createRng(18);
    const arr: { x: number; z: number; speed: number; phase: number }[] = [];
    for (let i = 0; i < 18; i++) {
      arr.push({
        x: (rand() - 0.5) * 8,
        z: -2 - rand() * 5,
        speed: 0.3 + rand() * 0.5,
        phase: rand() * 10,
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.children.forEach((child, i) => {
      const col = columns[i];
      child.position.y = ((t * col.speed + col.phase) % 6) - 1;
    });
  });

  return (
    <group ref={group}>
      {columns.map((col, i) => (
        <mesh key={i} position={[col.x, 2, col.z]}>
          <planeGeometry args={[0.04, 2.5]} />
          <meshBasicMaterial color="#00ff88" transparent opacity={0.06 + (i % 3) * 0.02} />
        </mesh>
      ))}
    </group>
  );
}

export default function AvatarEffects({
  hovered = false,
  reducedMotion = false,
}: AvatarEffectsProps) {
  return (
    <group>
      {!reducedMotion ? (
        <>
          <ScanRing y={-0.55} speed={0.2} radius={1.15} />
          <ScanRing y={1.4} speed={-0.15} radius={0.7} color="#00ffcc" />
          <MatrixRainColumns />
        </>
      ) : null}

      <FloatingCode hovered={hovered} />

      {/* Distant atmosphere plane */}
      <mesh position={[0, 0.5, -7]}>
        <planeGeometry args={[20, 12]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.025} />
      </mesh>

      {hovered ? (
        <Text
          position={[-0.85, 1.55, 0.15]}
          fontSize={0.07}
          color="#00ff88"
          anchorX="center"
          anchorY="middle"
        >
          {"> SYSTEM ONLINE"}
        </Text>
      ) : null}
    </group>
  );
}