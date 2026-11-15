"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import * as THREE from "three";
import { techBadges } from "@/lib/data";
import { createBadgeTexture } from "@/lib/three/holoCanvas";

type TechBadgesProps = {
  /** 0–1 reveal, read every frame. Omit for fully visible. */
  getReveal?: () => number;
  /** Overall opacity multiplier (the Hero keeps them subtle). */
  intensity?: number;
  showSecondary?: boolean;
};

/**
 * Positions are in the avatar's local frame (seat at origin, facing +z).
 * Everything sits on his right (screen-left): the Hero text column starts just
 * past local x ≈ 0.45, the head must stay clear both standing (intro) and
 * seated (Hero), and the slots avoid HeroWorkstation's project panels.
 */
const PRIMARY_LAYOUT: [number, number, number][] = [
  [-0.95, 1.62, 0.15],
  [-0.75, 0.98, 0.3],
  [-1.02, 0.62, 0.25],
  [-0.55, 0.3, 0.35],
];
const SECONDARY_LAYOUT: [number, number, number][] = [
  [-1.22, 1.02, -0.25],
  [0.28, 1.82, -0.2],
  [-1.15, 0.22, -0.25],
];

export default function TechBadges({ getReveal, intensity = 1, showSecondary = true }: TechBadgesProps) {
  const items = useMemo(() => {
    const list = [
      ...techBadges.primary.map((b, i) => ({ ...b, pos: PRIMARY_LAYOUT[i], size: 0.36, weight: 1 })),
      ...(showSecondary
        ? techBadges.secondary.map((b, i) => ({ ...b, pos: SECONDARY_LAYOUT[i], size: 0.26, weight: 0.55 }))
        : []),
    ];
    return list.map((item) => {
      const map = createBadgeTexture(item.label, item.icon);
      const material = new THREE.MeshBasicMaterial({
        map,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });
      return { ...item, map, material };
    });
  }, [showSecondary]);

  const nodes = useRef<(THREE.Group | null)[]>([]);

  useEffect(
    () => () =>
      items.forEach((item) => {
        item.map.dispose();
        item.material.dispose();
      }),
    [items]
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const reveal = getReveal ? getReveal() : 1;
    items.forEach((item, i) => {
      const local = THREE.MathUtils.clamp(reveal * (items.length * 0.5 + 1) - i * 0.5, 0, 1);
      const eased = 1 - Math.pow(1 - local, 3);
      item.material.opacity = eased * item.weight * intensity * (0.85 + Math.sin(t * 2 + i) * 0.08);
      const node = nodes.current[i];
      if (!node) return;
      node.visible = local > 0.001;
      node.position.set(item.pos[0], item.pos[1] + Math.sin(t * 0.8 + i * 1.3) * 0.03, item.pos[2]);
      node.scale.setScalar(0.6 + eased * 0.4);
    });
  });

  return (
    <group>
      {items.map((item, i) => (
        <group
          key={item.label}
          ref={(g) => {
            nodes.current[i] = g;
          }}
          position={item.pos}
        >
          <Billboard>
            <mesh material={item.material}>
              <planeGeometry args={[item.size, item.size * 0.375]} />
            </mesh>
          </Billboard>
        </group>
      ))}
    </group>
  );
}
