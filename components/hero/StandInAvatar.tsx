"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import {
  createProceduralAnimator,
  JOINTS,
  type AvatarController,
  type JointName,
} from "./AvatarAnimations";
import { useMutableRef } from "@/lib/three/useMutableRef";

type StandInAvatarProps = {
  controller: AvatarController;
  lens: THREE.Material;
  castShadow?: boolean;
};

const SKIRT_HEIGHT = 0.46;

type CoatUniforms = {
  uWalk: { value: number };
  uPhase: { value: number };
  uSit: { value: number };
  uTime: { value: number };
};

function createCoatSkirtMaterial(base: THREE.MeshPhysicalMaterial) {
  const material = base.clone();
  material.side = THREE.DoubleSide;
  const uniforms: CoatUniforms = {
    uWalk: { value: 0 },
    uPhase: { value: 0 },
    uSit: { value: 0 },
    uTime: { value: 0 },
  };
  material.userData.uniforms = uniforms;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uWalk;
uniform float uPhase;
uniform float uSit;
uniform float uTime;`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
float halfH = ${(SKIRT_HEIGHT / 2).toFixed(3)};
float drop = clamp((halfH - position.y) / (halfH * 2.0), 0.0, 1.0);
float d2 = drop * drop;
transformed.z -= (0.03 + abs(sin(uPhase)) * 0.06) * uWalk * d2;
transformed.x += sin(uPhase + position.y * 2.5) * 0.035 * uWalk * d2;
transformed.y += abs(cos(uPhase)) * 0.015 * uWalk * d2;
transformed.x += sin(uTime * 1.3 + position.z * 6.0) * 0.003 * drop;
transformed.z += cos(uTime * 1.1 + position.x * 5.0) * 0.003 * drop;

vec3 seatedPos = transformed;
float front = smoothstep(-0.02, 0.14, position.z);
float back = 1.0 - smoothstep(-0.14, 0.02, position.z);
seatedPos.y = mix(seatedPos.y, halfH + 0.06 - drop * 0.08, front);
seatedPos.z = mix(seatedPos.z, position.z + drop * halfH * 2.0 * 0.85, front);
seatedPos.y = mix(seatedPos.y, halfH - drop * 0.32, back);
seatedPos.z = mix(seatedPos.z, position.z - drop * 0.06, back);
seatedPos.x *= 1.0 + drop * 0.25 * (1.0 - front);
transformed = mix(transformed, seatedPos, uSit);`
      );
  };
  material.customProgramCacheKey = () => "hameed-coat-skirt";
  return material;
}

function makeHairGeometry() {
  const g = new THREE.SphereGeometry(1, 32, 24);
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const wave = Math.sin(v.x * 7 + v.z * 3) * 0.45 + Math.sin(v.z * 8 - v.y * 5) * 0.35;
    const top = THREE.MathUtils.smoothstep(v.y, -0.35, 0.45);
    v.multiplyScalar(1 + wave * 0.025 * top + 0.045 * top);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

function makeBeardGeometry() {
  const g = new THREE.SphereGeometry(1, 24, 18);
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = Math.sin(v.x * 23 + v.y * 17) * Math.cos(v.z * 19 - v.y * 11);
    v.multiplyScalar(1 + n * 0.012);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

function roundedRect<T extends THREE.Path>(w: number, h: number, r: number, path: T): T {
  const x = -w / 2;
  const y = -h / 2;
  path.moveTo(x + r, y);
  path.lineTo(x + w - r, y);
  path.quadraticCurveTo(x + w, y, x + w, y + r);
  path.lineTo(x + w, y + h - r);
  path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  path.lineTo(x + r, y + h);
  path.quadraticCurveTo(x, y + h, x, y + h - r);
  path.lineTo(x, y + r);
  path.quadraticCurveTo(x, y, x + r, y);
  return path;
}

function makeLensGeometry() {
  const shape = roundedRect(0.054, 0.04, 0.012, new THREE.Shape());
  const g = new THREE.ShapeGeometry(shape, 10);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    pos.setZ(i, -(x * x + y * y) * 3);
  }
  g.computeVertexNormals();
  return g;
}

function makeFrameGeometry() {
  const shape = roundedRect(0.062, 0.047, 0.015, new THREE.Shape());
  shape.holes.push(roundedRect(0.054, 0.04, 0.012, new THREE.Path()));
  return new THREE.ExtrudeGeometry(shape, { depth: 0.005, bevelEnabled: false, curveSegments: 10 });
}

export default function StandInAvatar({ controller, lens, castShadow = true }: StandInAvatarProps) {
  const root = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const glasses = useRef<THREE.Group>(null);
  const joints = useRef<Partial<Record<JointName, THREE.Object3D>>>({});
  const animator = useMemo(() => createProceduralAnimator(), []);

  const assets = useMemo(() => {
    const coat = new THREE.MeshPhysicalMaterial({
      color: "#202321",
      roughness: 0.62,
      clearcoat: 0.18,
      clearcoatRoughness: 0.55,
    });
    return {
      coat,
      skirt: createCoatSkirtMaterial(coat),
      skin: new THREE.MeshPhysicalMaterial({
        color: "#b77c60",
        roughness: 0.72,
        sheen: 0.18,
        sheenRoughness: 0.85,
        sheenColor: new THREE.Color("#d49a78"),
      }),
      hair: new THREE.MeshPhysicalMaterial({
        color: "#171311",
        roughness: 0.68,
        sheen: 0.45,
        sheenRoughness: 0.55,
        sheenColor: new THREE.Color("#554033"),
      }),
      beard: new THREE.MeshStandardMaterial({ color: "#241a16", roughness: 0.82 }),
      cloth: new THREE.MeshStandardMaterial({ color: "#151817", roughness: 0.82 }),
      boots: new THREE.MeshPhysicalMaterial({ color: "#111312", roughness: 0.62, clearcoat: 0.18 }),
      frame: new THREE.MeshStandardMaterial({ color: "#1c201f", metalness: 0.28, roughness: 0.42 }),
      hairGeo: makeHairGeometry(),
      beardGeo: makeBeardGeometry(),
      lensGeo: makeLensGeometry(),
      frameGeo: makeFrameGeometry(),
    };
  }, []);

  useEffect(
    () => () => {
      Object.values(assets).forEach((a) => (a as { dispose?: () => void }).dispose?.());
    },
    [assets]
  );

  useEffect(() => {
    const found: Partial<Record<JointName, THREE.Object3D>> = {};
    root.current?.traverse((obj) => {
      if (!obj.name.startsWith("j:")) return;
      const name = obj.name.slice(2) as JointName;
      if (name.startsWith("shoulder")) obj.rotation.order = "YXZ";
      found[name] = obj;
    });
    joints.current = found;
  }, []);

  const frameRef = useMutableRef({ animator, skirt: assets.skirt, controller });

  useFrame((state, dt) => {
    const { animator: anim, skirt, controller: ctrl } = frameRef.current;
    const t = state.clock.elapsedTime;
    const pose = anim.update(ctrl, t, Math.min(dt, 0.1));
    for (const name of JOINTS) {
      const g = joints.current[name];
      if (!g) continue;
      const r = pose.joints[name];
      g.rotation.set(r.x, r.y, r.z);
    }
    if (root.current) root.current.position.y = pose.rootY;
    if (torso.current) {
      torso.current.scale.set(1 + pose.breath * 0.006, 1, 1 + pose.breath * 0.012);
    }
    if (glasses.current) glasses.current.position.y = 0.065 + pose.glassesLift;
    const u = skirt.userData.uniforms as CoatUniforms;
    u.uWalk.value = pose.walk;
    u.uPhase.value = pose.walkPhase;
    u.uSit.value = pose.sit;
    u.uTime.value = t;
  });

  const shadow = { castShadow, receiveShadow: castShadow };

  const leg = (side: 1 | -1) => {
    const s = side === 1 ? "L" : "R";
    return (
      <group name={`j:thigh${s}`} position={[0.095 * side, -0.04, 0]}>
        <mesh position={[0, -0.22, 0]} material={assets.cloth} {...shadow}>
          <capsuleGeometry args={[0.068, 0.32, 6, 14]} />
        </mesh>
        <group name={`j:knee${s}`} position={[0, -0.45, 0]}>
          <mesh position={[0, -0.21, 0]} material={assets.cloth} {...shadow}>
            <capsuleGeometry args={[0.054, 0.32, 6, 14]} />
          </mesh>
          <group name={`j:ankle${s}`} position={[0, -0.42, 0]}>
            <mesh position={[0, 0.06, 0]} material={assets.boots} {...shadow}>
              <capsuleGeometry args={[0.06, 0.08, 6, 14]} />
            </mesh>
            <RoundedBox
              args={[0.11, 0.1, 0.27]}
              radius={0.035}
              smoothness={3}
              position={[0, 0, 0.05]}
              material={assets.boots}
              {...shadow}
            />
          </group>
        </group>
      </group>
    );
  };

  const arm = (side: 1 | -1) => {
    const s = side === 1 ? "L" : "R";
    return (
      <group name={`j:shoulder${s}`} position={[0.18 * side, 0.19, 0]}>
        <mesh position={[0, -0.15, 0]} material={assets.coat} {...shadow}>
          <capsuleGeometry args={[0.049, 0.2, 8, 18]} />
        </mesh>
        <group name={`j:elbow${s}`} position={[0, -0.3, 0]}>
          <mesh position={[0, -0.13, 0]} material={assets.coat} {...shadow}>
            <capsuleGeometry args={[0.042, 0.18, 8, 18]} />
          </mesh>
          <group name={`j:wrist${s}`} position={[0, -0.27, 0]}>
            <mesh position={[0, -0.09, 0]} scale={[0.72, 1, 0.55]} material={assets.skin} {...shadow}>
              <sphereGeometry args={[0.045, 16, 12]} />
            </mesh>
            <mesh
              position={[-0.03 * side, -0.08, 0.01]}
              rotation={[0, 0, 0.5 * side]}
              material={assets.skin}
            >
              <capsuleGeometry args={[0.009, 0.028, 6, 10]} />
            </mesh>
          </group>
        </group>
      </group>
    );
  };

  return (
    <group ref={root} data-avatar-backend="stand-in">
      <group name="j:hips" position={[0, 0.95, 0]}>
        <RoundedBox
          args={[0.3, 0.17, 0.2]}
          radius={0.06}
          smoothness={3}
          position={[0, -0.02, 0]}
          material={assets.cloth}
          {...shadow}
        />
        {leg(1)}
        {leg(-1)}

        {/* Long coat skirt — open at the front, sways while walking, drapes when seated */}
        <mesh
          position={[0, -0.02 - SKIRT_HEIGHT / 2, 0]}
          scale={[1, 1, 0.8]}
          material={assets.skirt}
          castShadow={castShadow}
        >
          <cylinderGeometry args={[0.165, 0.27, SKIRT_HEIGHT, 28, 10, true, 0.3, Math.PI * 2 - 0.6]} />
        </mesh>

        <group name="j:spine" position={[0, 0.08, 0]}>
          <mesh position={[0, 0.1, 0]} scale={[1, 1, 0.75]} material={assets.cloth} {...shadow}>
            <capsuleGeometry args={[0.125, 0.12, 6, 16]} />
          </mesh>

          <group name="j:chest" position={[0, 0.22, 0]}>
            <group ref={torso}>
              <mesh position={[0, 0.1, 0]} scale={[1.15, 1, 0.72]} material={assets.coat} {...shadow}>
                <capsuleGeometry args={[0.15, 0.16, 8, 20]} />
              </mesh>
              {/* Lapels framing the black shirt */}
              <mesh position={[0, 0.13, 0.1]} scale={[1, 1, 0.35]} material={assets.cloth}>
                <capsuleGeometry args={[0.045, 0.14, 4, 10]} />
              </mesh>
              {[1, -1].map((side) => (
                <mesh
                  key={side}
                  position={[0.045 * side, 0.12, 0.105]}
                  rotation={[0.05, 0, 0.24 * side]}
                  material={assets.coat}
                >
                  <boxGeometry args={[0.032, 0.19, 0.01]} />
                </mesh>
              ))}
              {[1, -1].map((side) => (
                <mesh
                  key={`pad${side}`}
                  position={[0.17 * side, 0.2, 0]}
                  scale={[0.72, 0.55, 0.7]}
                  material={assets.coat}
                  {...shadow}
                >
                  <sphereGeometry args={[0.075, 16, 12]} />
                </mesh>
              ))}
            </group>

            {arm(1)}
            {arm(-1)}

            <group name="j:neck" position={[0, 0.3, 0]}>
              <mesh position={[0, 0.04, 0]} material={assets.skin} {...shadow}>
                <cylinderGeometry args={[0.046, 0.05, 0.1, 14]} />
              </mesh>
              <group name="j:head" position={[0, 0.06, 0]}>
                <group position={[0, 0, 0.01]}>
                  <mesh position={[0, 0.08, 0]} scale={[0.092, 0.112, 0.1]} material={assets.skin} {...shadow}>
                    <sphereGeometry args={[1, 32, 24]} />
                  </mesh>
                  {/* Full beard + jaw */}
                  <mesh
                    position={[0, -0.035, 0.048]}
                    scale={[0.085, 0.054, 0.072]}
                    geometry={assets.beardGeo}
                    material={assets.beard}
                    {...shadow}
                  />
                  <mesh position={[0, 0.038, 0.106]} scale={[0.82, 1.15, 0.9]} material={assets.skin}>
                    <sphereGeometry args={[0.022, 16, 12]} />
                  </mesh>
                  {[-1, 1].map((side) => (
                    <mesh
                      key={`moustache${side}`}
                      position={[0.015 * side, 0.006, 0.111]}
                      rotation={[0, 0, -0.18 * side]}
                      scale={[1, 0.65, 0.55]}
                      material={assets.beard}
                    >
                      <sphereGeometry args={[0.022, 14, 10]} />
                    </mesh>
                  ))}
                  {[-1, 1].map((side) => (
                    <mesh
                      key={`brow${side}`}
                      position={[0.033 * side, 0.094, 0.098]}
                      rotation={[0, 0, 0.08 * side]}
                      material={assets.hair}
                    >
                      <capsuleGeometry args={[0.006, 0.026, 4, 10]} />
                    </mesh>
                  ))}
                  {[1, -1].map((side) => (
                    <mesh
                      key={`ear${side}`}
                      position={[0.092 * side, 0.07, 0]}
                      scale={[0.5, 1, 0.8]}
                      material={assets.skin}
                    >
                      <sphereGeometry args={[0.022, 10, 8]} />
                    </mesh>
                  ))}
                  {/* Dark wavy hair with volume on top */}
                  <mesh
                    position={[0, 0.145, -0.012]}
                    scale={[0.101, 0.08, 0.108]}
                    geometry={assets.hairGeo}
                    material={assets.hair}
                    {...shadow}
                  />
                  <mesh
                    position={[0.018, 0.205, 0.045]}
                    rotation={[0.35, 0.2, 0.12]}
                    scale={[0.04, 0.018, 0.045]}
                    geometry={assets.hairGeo}
                    material={assets.hair}
                  />

                  {/* Sunglasses */}
                  <group ref={glasses} position={[0, 0.065, 0.112]}>
                    {[1, -1].map((side) => (
                      <group key={`lens${side}`} position={[0.032 * side, 0, 0]} rotation={[0, 0.18 * side, 0]}>
                        <mesh geometry={assets.frameGeo} material={assets.frame} position={[0, 0, -0.002]} />
                        <mesh geometry={assets.lensGeo} material={lens} position={[0, 0, 0.004]} />
                      </group>
                    ))}
                    <mesh position={[0, 0.008, 0.002]} material={assets.frame}>
                      <boxGeometry args={[0.014, 0.005, 0.004]} />
                    </mesh>
                    {[1, -1].map((side) => (
                      <mesh
                        key={`temple${side}`}
                        position={[0.064 * side, 0.008, -0.055]}
                        rotation={[0, -0.08 * side, 0]}
                        material={assets.frame}
                      >
                        <boxGeometry args={[0.004, 0.006, 0.11]} />
                      </mesh>
                    ))}
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
