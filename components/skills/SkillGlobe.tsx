"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { allSkills } from "@/lib/data";
import { isLowPowerDevice } from "@/lib/utils";

function fibonacciSphere(samples: number, radius: number) {
  const points: THREE.Vector3[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < samples; i++) {
    const y = 1 - (i / Math.max(samples - 1, 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = phi * i;
    points.push(
      new THREE.Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius)
    );
  }
  return points;
}

function SkillTags({ skills }: { skills: string[] }) {
  const group = useRef<THREE.Group>(null);
  const positions = useMemo(() => fibonacciSphere(skills.length, 2.4), [skills.length]);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshBasicMaterial color="#00ff88" wireframe transparent opacity={0.08} />
      </mesh>
      {skills.map((skill, i) => (
        <Text
          key={skill}
          position={positions[i]}
          fontSize={0.16}
          color="#00ff88"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.004}
          outlineColor="#003322"
        >
          {skill}
        </Text>
      ))}
    </group>
  );
}

function FlatSkillCloud({ skills }: { skills: string[] }) {
  return (
    <div className="flex h-[320px] flex-wrap items-center justify-center gap-3 rounded-2xl border border-primary/15 bg-surface/50 p-6">
      {skills.map((skill, i) => (
        <span
          key={skill}
          className="rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 font-mono text-xs text-primary"
          style={{
            transform: `translateY(${Math.sin(i) * 8}px)`,
            boxShadow: "0 0 12px rgba(0,255,136,0.12)",
          }}
        >
          {skill}
        </span>
      ))}
    </div>
  );
}

export default function SkillGlobe() {
  const [mode, setMode] = useState<"loading" | "3d" | "2d">("loading");
  const skills = allSkills.slice(0, 24);

  useEffect(() => {
    setMode(isLowPowerDevice() ? "2d" : "3d");
  }, []);

  if (mode !== "3d") {
    return <FlatSkillCloud skills={skills} />;
  }

  return (
    <div className="h-[360px] w-full overflow-hidden rounded-2xl border border-primary/15 bg-surface/40 md:h-[420px]">
      <Canvas camera={{ position: [0, 0, 7], fov: 50 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.6} />
        <SkillTags skills={skills} />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.6} />
      </Canvas>
    </div>
  );
}