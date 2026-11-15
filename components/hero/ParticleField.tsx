"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { isLowPowerDevice } from "@/lib/utils";
import { createRng, useMutableRef } from "@/lib/three/useMutableRef";

type NetworkParticlesProps = {
  count?: number;
  /** Shift the field so it surrounds the avatar instead of competing with the face */
  centerOffset?: [number, number, number];
  opacity?: number;
  /** `sphere` keeps particles on a shell (holographic globe). */
  shape?: "field" | "sphere";
  radius?: number;
  /** Per-frame opacity multiplier (0–1). */
  getOpacity?: () => number;
};

export function NetworkParticles({
  count = 90,
  centerOffset = [0, 0.6, -0.8],
  opacity = 0.75,
  shape = "field",
  radius: shellRadius = 1,
  getOpacity,
}: NetworkParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const sphere = shape === "sphere";

  const sim = useMemo(() => {
    const rand = createRng(count * 31 + (sphere ? 7 : 1));
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      if (sphere) {
        const theta = rand() * Math.PI * 2;
        const z = rand() * 2 - 1;
        const r = Math.sqrt(1 - z * z) * shellRadius;
        positions[i * 3] = Math.cos(theta) * r + centerOffset[0];
        positions[i * 3 + 1] = z * shellRadius + centerOffset[1];
        positions[i * 3 + 2] = Math.sin(theta) * r + centerOffset[2];
      } else {
        // Bias particles around / behind avatar silhouette
        const angle = rand() * Math.PI * 2;
        const radius = 0.8 + rand() * 3.2;
        positions[i * 3] = Math.cos(angle) * radius + centerOffset[0];
        positions[i * 3 + 1] = (rand() - 0.2) * 3.2 + centerOffset[1];
        positions[i * 3 + 2] = Math.sin(angle) * radius * 0.7 + centerOffset[2];
      }
      velocities[i * 3] = (rand() - 0.5) * 0.003;
      velocities[i * 3 + 1] = (rand() - 0.5) * 0.003;
      velocities[i * 3 + 2] = (rand() - 0.5) * 0.003;
    }
    return {
      positions,
      velocities,
      linePositions: new Float32Array(count * count * 6),
      shell: new THREE.Vector3(),
    };
  }, [count, centerOffset, sphere, shellRadius]);
  const { positions, linePositions } = sim;
  const simRef = useMutableRef(sim);

  useFrame((state) => {
    const { velocities, linePositions, shell } = simRef.current;
    mouse.current.x = state.pointer.x;
    mouse.current.y = state.pointer.y;

    const pts = pointsRef.current;
    const lines = linesRef.current;
    if (!pts) return;

    if (getOpacity) {
      const k = getOpacity();
      (pts.material as THREE.PointsMaterial).opacity = opacity * k;
      if (lines) (lines.material as THREE.LineBasicMaterial).opacity = 0.12 * k;
      pts.visible = k > 0.01;
      if (lines) lines.visible = k > 0.01;
      if (k <= 0.01) return;
    }

    const arr = pts.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3] += velocities[i * 3] + (sphere ? 0 : mouse.current.x * 0.0005);
      arr[i * 3 + 1] += velocities[i * 3 + 1] + (sphere ? 0 : mouse.current.y * 0.0005);
      arr[i * 3 + 2] += velocities[i * 3 + 2];

      if (sphere) {
        shell
          .set(arr[i * 3] - centerOffset[0], arr[i * 3 + 1] - centerOffset[1], arr[i * 3 + 2] - centerOffset[2])
          .setLength(shellRadius);
        arr[i * 3] = shell.x + centerOffset[0];
        arr[i * 3 + 1] = shell.y + centerOffset[1];
        arr[i * 3 + 2] = shell.z + centerOffset[2];
        continue;
      }

      for (let a = 0; a < 3; a++) {
        const idx = i * 3 + a;
        const limit = a === 1 ? 3.5 : 4.5;
        const center = centerOffset[a];
        if (arr[idx] > center + limit || arr[idx] < center - limit) velocities[idx] *= -1;
      }
    }
    pts.geometry.attributes.position.needsUpdate = true;
    if (!sphere) pts.rotation.y = state.clock.elapsedTime * 0.035;

    if (lines) {
      let ptr = 0;
      const maxDist = sphere ? shellRadius * 0.75 : 1.9;
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const dx = arr[i * 3] - arr[j * 3];
          const dy = arr[i * 3 + 1] - arr[j * 3 + 1];
          const dz = arr[i * 3 + 2] - arr[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < maxDist) {
            linePositions[ptr++] = arr[i * 3];
            linePositions[ptr++] = arr[i * 3 + 1];
            linePositions[ptr++] = arr[i * 3 + 2];
            linePositions[ptr++] = arr[j * 3];
            linePositions[ptr++] = arr[j * 3 + 1];
            linePositions[ptr++] = arr[j * 3 + 2];
          }
        }
      }
      lines.geometry.setDrawRange(0, ptr / 3);
      lines.geometry.attributes.position.needsUpdate = true;
      lines.rotation.copy(pts.rotation);
    }
  });

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.045}
          color="#00ff88"
          transparent
          opacity={opacity}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#00ff88" transparent opacity={0.12} />
      </lineSegments>
    </group>
  );
}

function FallbackParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-primary/60"
          style={{
            left: `${(i * 23) % 100}%`,
            top: `${(i * 37) % 100}%`,
            boxShadow: "0 0 10px rgba(0,255,136,0.6)",
            animation: `float-y ${3 + (i % 5)}s ease-in-out ${i * 0.1}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/** Standalone particle canvas (used if AvatarScene is unavailable). */
export default function ParticleField() {
  const [mode, setMode] = useState<"loading" | "3d" | "2d">("loading");

  useEffect(() => {
    setMode(isLowPowerDevice() ? "2d" : "3d");
  }, []);

  if (mode !== "3d") {
    return <FallbackParticles />;
  }

  return (
    <div className="absolute inset-0 -z-10 opacity-80">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <NetworkParticles count={90} />
      </Canvas>
    </div>
  );
}