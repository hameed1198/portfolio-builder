"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { createHoloPanelTexture, createRadialTexture } from "@/lib/three/holoCanvas";
import { projects } from "@/lib/data";
import { useMutableRef } from "@/lib/three/useMutableRef";

type HeroWorkstationProps = {
  /** 0–1 materialise amount, read every frame. Omit for fully visible. */
  getFade?: () => number;
  panels?: number;
  castShadow?: boolean;
};

const PANEL_LAYOUT: { pos: [number, number, number]; rotY: number; scale: number }[] = [
  { pos: [-0.95, 1.3, -0.6], rotY: 0.45, scale: 1 },
  { pos: [0.62, 1.6, -0.85], rotY: -0.35, scale: 0.7 },
  { pos: [-0.55, 1.95, -1.05], rotY: 0.2, scale: 0.65 },
  { pos: [-1.35, 0.7, -0.9], rotY: 0.6, scale: 0.6 },
];

/**
 * Futuristic chair + holographic project panels. Coordinates are in the
 * avatar's local frame (feet at origin, facing +z) so the seated pose lines up.
 */
export default function HeroWorkstation({ getFade, panels = 3, castShadow = true }: HeroWorkstationProps) {
  const group = useRef<THREE.Group>(null);
  const panelGroup = useRef<THREE.Group>(null);
  const fading = Boolean(getFade);

  const assets = useMemo(() => {
    const shell = new THREE.MeshPhysicalMaterial({
      color: "#0c0d0d",
      roughness: 0.35,
      clearcoat: 0.6,
      clearcoatRoughness: 0.3,
      transparent: fading,
    });
    const metal = new THREE.MeshStandardMaterial({
      color: "#161818",
      metalness: 0.8,
      roughness: 0.3,
      transparent: fading,
    });
    const accent = new THREE.MeshBasicMaterial({ color: "#00ff88", toneMapped: false, transparent: fading });
    const glow = new THREE.MeshBasicMaterial({
      map: createRadialTexture(),
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const panelTextures = [
      createHoloPanelTexture(projects[0]?.title ?? "project.ai", [
        "from fastapi import FastAPI",
        "app = FastAPI()",
        "@app.post('/chat')",
        "async def chat(q: Query):",
        "  return await llm.answer(q)",
        "# 34,000+ records analysed",
      ]),
      createHoloPanelTexture(projects[1]?.title ?? "resume.match", [
        "score = semantic_match(cv, jd)",
        "skills = extract(cv).top(10)",
        "rag.index(chunks)",
        "return {'match': score}",
      ]),
      createHoloPanelTexture("aws.deploy", [
        "$ sam build && sam deploy",
        "lambda: hameed-api  ✓",
        "s3://portfolio  ✓",
        "status: ONLINE",
      ]),
      createHoloPanelTexture("whoami", ["> Hameed Khan", "> Software Engineer", "> Python | AWS | GenAI"]),
    ];
    const panelMaterials = panelTextures.map(
      (map) =>
        new THREE.MeshBasicMaterial({
          map,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          toneMapped: false,
        })
    );
    return { shell, metal, accent, glow, panelTextures, panelMaterials };
  }, [fading]);

  useEffect(
    () => () => {
      assets.shell.dispose();
      assets.metal.dispose();
      assets.accent.dispose();
      assets.glow.map?.dispose();
      assets.glow.dispose();
      assets.panelTextures.forEach((t) => t.dispose());
      assets.panelMaterials.forEach((m) => m.dispose());
    },
    [assets]
  );

  const assetsRef = useMutableRef(assets);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const fade = getFade ? getFade() : 1;
    const a = assetsRef.current;
    if (group.current) group.current.visible = fade > 0.01;
    if (fading) {
      a.shell.opacity = fade;
      a.metal.opacity = fade;
      a.accent.opacity = fade;
    }
    a.glow.opacity = 0.35 * fade;
    a.panelMaterials.forEach((m, i) => {
      m.opacity = (0.7 + Math.sin(t * 1.3 + i) * 0.08) * fade;
    });
    panelGroup.current?.children.forEach((child, i) => {
      child.position.y = PANEL_LAYOUT[i].pos[1] + Math.sin(t * 0.6 + i * 1.7) * 0.025;
    });
  });

  const shadow = { castShadow, receiveShadow: castShadow };
  const legs = [0, 1, 2, 3, 4];

  return (
    <group ref={group}>
      {/* Seat */}
      <RoundedBox args={[0.52, 0.07, 0.5]} radius={0.03} position={[0, 0.4, 0.1]} material={assets.shell} {...shadow} />
      {/* Backrest + headrest */}
      <group position={[0, 0.85, -0.19]} rotation={[-0.1, 0, 0]}>
        <RoundedBox args={[0.5, 0.75, 0.06]} radius={0.03} material={assets.shell} {...shadow} />
        {[1, -1].map((side) => (
          <mesh key={side} position={[0.25 * side, 0, 0.034]} material={assets.accent}>
            <boxGeometry args={[0.008, 0.68, 0.008]} />
          </mesh>
        ))}
        <RoundedBox args={[0.3, 0.14, 0.06]} radius={0.03} position={[0, 0.48, -0.04]} material={assets.shell} />
      </group>
      {/* Armrests */}
      {[1, -1].map((side) => (
        <group key={`arm${side}`}>
          <RoundedBox
            args={[0.06, 0.04, 0.38]}
            radius={0.015}
            position={[0.3 * side, 0.68, 0.05]}
            material={assets.shell}
            {...shadow}
          />
          <mesh position={[0.3 * side, 0.54, -0.05]} material={assets.metal}>
            <boxGeometry args={[0.04, 0.26, 0.04]} />
          </mesh>
          <mesh position={[0.3 * side, 0.703, 0.05]} material={assets.accent}>
            <boxGeometry args={[0.006, 0.004, 0.3]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.438, 0.351]} material={assets.accent}>
        <boxGeometry args={[0.44, 0.006, 0.006]} />
      </mesh>
      {/* Column + star base */}
      <mesh position={[0, 0.22, 0.08]} material={assets.metal} {...shadow}>
        <cylinderGeometry args={[0.035, 0.045, 0.32, 16]} />
      </mesh>
      {legs.map((i) => {
        const a = (i / legs.length) * Math.PI * 2;
        return (
          <group key={`leg${i}`} position={[0, 0.06, 0.08]} rotation={[0, a, 0]}>
            <mesh position={[0, 0, 0.16]} material={assets.metal}>
              <boxGeometry args={[0.04, 0.03, 0.32]} />
            </mesh>
            <mesh position={[0, -0.03, 0.3]} material={assets.metal}>
              <sphereGeometry args={[0.025, 10, 8]} />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, 0.002, 0.1]} rotation={[-Math.PI / 2, 0, 0]} material={assets.glow}>
        <planeGeometry args={[1.8, 1.8]} />
      </mesh>

      {/* Holographic project panels */}
      <group ref={panelGroup}>
        {PANEL_LAYOUT.slice(0, panels).map((p, i) => (
          <mesh
            key={`panel${i}`}
            position={p.pos}
            rotation={[0, p.rotY, 0]}
            scale={p.scale}
            material={assets.panelMaterials[i]}
          >
            <planeGeometry args={[0.8, 0.5]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
