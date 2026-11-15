"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { NetworkParticles } from "@/components/hero/ParticleField";
import HeroWorkstation from "@/components/hero/HeroWorkstation";
import { FLOOR_Y, type HeroFraming } from "@/lib/avatar/avatarConfig";
import type { IntroStaging, QualitySettings } from "@/lib/intro/introConfig";
import { introStore } from "@/lib/intro/introStore";
import { getGlyphAtlas, MATRIX_GLSL } from "@/lib/three/matrixGlyphs";
import { createHoloPanelTexture, createRadialTexture } from "@/lib/three/holoCanvas";
import { createRng, useMutableRef } from "@/lib/three/useMutableRef";

const env = () => introStore.runtime.env;

/* ------------------------------------------------------------------ */
/* Matrix rain — one instanced strip geometry, one shader                */
/* ------------------------------------------------------------------ */

function MatrixRainField({ count }: { count: number }) {
  const { geometry, material } = useMemo(() => {
    const strip = new THREE.PlaneGeometry(0.14, 5, 1, 1);
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.index = strip.index;
    geometry.setAttribute("position", strip.getAttribute("position"));
    geometry.setAttribute("uv", strip.getAttribute("uv"));
    const offsets = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const speeds = new Float32Array(count);
    const rand = createRng(count);
    for (let i = 0; i < count; i++) {
      let x = 0;
      let z = 0;
      // Keep a clear corridor for the character and camera path.
      do {
        x = (rand() - 0.5) * 20;
        z = 3 - rand() * 19;
      } while (Math.abs(x + 0.4) < 1.7 && z > -7);
      offsets[i * 3] = x;
      offsets[i * 3 + 1] = FLOOR_Y + 2.3 + (rand() - 0.5) * 1.6;
      offsets[i * 3 + 2] = z;
      seeds[i] = rand();
      speeds[i] = 0.6 + rand() * 0.9;
    }
    geometry.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offsets, 3));
    geometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 1));
    geometry.setAttribute("aSpeed", new THREE.InstancedBufferAttribute(speeds, 1));
    geometry.instanceCount = count;
    strip.dispose();

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 1 },
        uGlyphs: { value: getGlyphAtlas() },
      },
      vertexShader: /* glsl */ `
        attribute vec3 aOffset;
        attribute float aSeed;
        attribute float aSpeed;
        varying vec2 vUv;
        varying float vSeed;
        varying float vSpeed;
        varying float vDepth;
        void main() {
          vUv = uv;
          vSeed = aSeed;
          vSpeed = aSpeed;
          vec4 mv = modelViewMatrix * vec4(position + aOffset, 1.0);
          vDepth = -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uOpacity;
        uniform sampler2D uGlyphs;
        varying vec2 vUv;
        varying float vSeed;
        varying float vSpeed;
        varying float vDepth;
        ${MATRIX_GLSL}
        void main() {
          vec2 code = matrixRain(vec2(vUv.x + floor(vSeed * 997.0), vUv.y), vec2(1.0, 36.0), uTime * vSpeed, uGlyphs);
          float fade = smoothstep(28.0, 8.0, vDepth) * smoothstep(0.4, 1.8, vDepth);
          vec3 col = vec3(0.0, 0.85, 0.45) * code.x + vec3(0.75, 1.0, 0.88) * code.y;
          gl_FragColor = vec4(col * uOpacity * fade, 1.0);
        }
      `,
    });
    return { geometry, material };
  }, [count]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  const materialRef = useMutableRef(material);
  useFrame(() => {
    const u = materialRef.current.uniforms;
    u.uTime.value = introStore.runtime.time;
    u.uOpacity.value = env().rain;
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}

/* ------------------------------------------------------------------ */

function DustField({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    const rand = createRng(count + 101);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rand() - 0.5) * 14;
      arr[i * 3 + 1] = FLOOR_Y + rand() * 4.5;
      arr[i * 3 + 2] = 3 - rand() * 14;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    const pts = ref.current;
    if (!pts) return;
    const k = env().dust;
    pts.visible = k > 0.01;
    (pts.material as THREE.PointsMaterial).opacity = 0.55 * k;
    pts.rotation.y = state.clock.elapsedTime * 0.01;
    pts.position.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.022}
        color="#00ff88"
        transparent
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */

function GridFloor({ receiveShadow }: { receiveShadow: boolean }) {
  const grid = useRef<THREE.GridHelper>(null);
  useFrame(() => {
    if (!grid.current) return;
    const mat = grid.current.material as THREE.LineBasicMaterial;
    mat.transparent = true;
    mat.opacity = 0.5 * env().grid;
    grid.current.visible = env().grid > 0.01;
  });
  return (
    <group>
      <gridHelper ref={grid} args={[40, 64, "#00ff88", "#0b3a22"]} position={[0, FLOOR_Y + 0.002, -4]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, -4]} receiveShadow={receiveShadow}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#030805" roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */

function GlobeHologram({ staging, particles }: { staging: IntroStaging; particles: number }) {
  const group = useRef<THREE.Group>(null);
  const scan = useRef<THREE.Mesh>(null);
  const r = staging.globe.radius;

  const { land, materials } = useMemo(() => {
    const pts: number[] = [];
    const v = new THREE.Vector3();
    const rand = createRng(2600);
    for (let i = 0; i < 2600; i++) {
      const z = rand() * 2 - 1;
      const theta = rand() * Math.PI * 2;
      const ring = Math.sqrt(1 - z * z);
      v.set(Math.cos(theta) * ring, z, Math.sin(theta) * ring);
      const n =
        Math.sin(v.x * 3.1 + 1.3) * Math.cos(v.y * 2.7) +
        Math.sin(v.z * 4.3 + v.x * 1.7) * 0.6 +
        Math.cos(v.y * 5.1 - v.z * 2.2) * 0.3;
      if (n > 0.35) {
        v.multiplyScalar(r * 1.005);
        pts.push(v.x, v.y, v.z);
      }
    }
    const materials = {
      wire: new THREE.MeshBasicMaterial({ color: "#00ff88", wireframe: true, transparent: true, depthWrite: false }),
      ring: new THREE.MeshBasicMaterial({
        color: "#00ffcc",
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
      land: new THREE.PointsMaterial({
        color: "#00ff88",
        size: 0.018,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
      core: new THREE.MeshBasicMaterial({ color: "#00ff88", transparent: true, depthWrite: false }),
    };
    return { land: new Float32Array(pts), materials };
  }, [r]);

  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials]);

  const materialsRef = useMutableRef(materials);
  useFrame((state, dt) => {
    const k = env().globe;
    const g = group.current;
    if (!g) return;
    g.visible = k > 0.01;
    if (!g.visible) return;
    g.scale.setScalar(0.7 + 0.3 * k);
    g.rotation.y += dt * 0.18;
    const m = materialsRef.current;
    m.wire.opacity = 0.14 * k;
    m.ring.opacity = 0.5 * k;
    m.land.opacity = 0.9 * k;
    m.core.opacity = 0.05 * k;
    if (scan.current) scan.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * r * 0.9;
  });

  return (
    <group ref={group} position={staging.globe.position}>
      <mesh material={materials.wire}>
        <icosahedronGeometry args={[r, 3]} />
      </mesh>
      <mesh material={materials.core}>
        <sphereGeometry args={[r * 0.98, 32, 24]} />
      </mesh>
      <points material={materials.land}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[land, 3]} />
        </bufferGeometry>
      </points>
      {[-0.6, -0.3, 0, 0.3, 0.6].map((lat) => (
        <mesh
          key={lat}
          position={[0, Math.sin(lat) * r, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          material={materials.ring}
        >
          <ringGeometry args={[Math.cos(lat) * r - 0.003, Math.cos(lat) * r + 0.003, 96]} />
        </mesh>
      ))}
      <mesh ref={scan} rotation={[Math.PI / 2, 0, 0]} material={materials.ring}>
        <ringGeometry args={[r * 0.7, r * 1.04, 96]} />
      </mesh>
      <mesh rotation={[1.2, 0.3, 0]} material={materials.ring}>
        <torusGeometry args={[r * 1.35, 0.004, 6, 128]} />
      </mesh>
      <NetworkParticles
        count={particles}
        centerOffset={[0, 0, 0]}
        shape="sphere"
        radius={r * 1.12}
        opacity={0.9}
        getOpacity={() => env().globe}
      />
    </group>
  );
}

/* ------------------------------------------------------------------ */

function Portal({ staging }: { staging: IntroStaging }) {
  const { width: w, height: h, position } = staging.portal;
  const group = useRef<THREE.Group>(null);
  const sparks = useRef<THREE.Points>(null);

  const assets = useMemo(() => {
    const surface = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uGlyphs: { value: getGlyphAtlas() } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uOpacity;
        uniform sampler2D uGlyphs;
        varying vec2 vUv;
        ${MATRIX_GLSL}
        void main() {
          vec2 p = vUv - 0.5;
          float edge = max(abs(p.x) * 2.0, abs(p.y) * 2.0);
          float glow = smoothstep(0.55, 1.0, edge) * 0.9 + 0.12;
          float ripple = sin(length(p) * 30.0 - uTime * 3.0) * 0.5 + 0.5;
          vec2 code = matrixRain(vUv, vec2(14.0, 22.0), uTime * 1.4, uGlyphs);
          vec3 col = vec3(0.0, 1.0, 0.55) * (glow + ripple * 0.06) + vec3(0.2, 1.0, 0.7) * (code.x * 0.35 + code.y * 0.6);
          gl_FragColor = vec4(col * uOpacity, 1.0);
        }
      `,
    });
    const edge = new THREE.MeshBasicMaterial({ color: "#00ff88", toneMapped: false, transparent: true });
    const fog = new THREE.MeshBasicMaterial({
      map: createRadialTexture("rgba(0,255,136,0.55)"),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const spark = new THREE.PointsMaterial({
      color: "#7dffc4",
      size: 0.03,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const sparkPositions = new Float32Array(220 * 3);
    const rand = createRng(220);
    for (let i = 0; i < 220; i++) {
      sparkPositions[i * 3] = (rand() - 0.5) * w * 1.3;
      sparkPositions[i * 3 + 1] = rand() * h;
      sparkPositions[i * 3 + 2] = (rand() - 0.5) * 0.8;
    }
    return { surface, edge, fog, spark, sparkPositions };
  }, [w, h]);

  useEffect(
    () => () => {
      assets.surface.dispose();
      assets.edge.dispose();
      assets.fog.map?.dispose();
      assets.fog.dispose();
      assets.spark.dispose();
    },
    [assets]
  );

  const assetsRef = useMutableRef(assets);
  useFrame((state, dt) => {
    const k = env().portal;
    if (!group.current) return;
    group.current.visible = k > 0.01;
    if (!group.current.visible) return;
    const flicker = 0.92 + Math.sin(state.clock.elapsedTime * 13) * 0.04;
    const a = assetsRef.current;
    a.surface.uniforms.uTime.value = introStore.runtime.time;
    a.surface.uniforms.uOpacity.value = k * flicker;
    a.edge.opacity = Math.min(1, k * 1.2);
    a.fog.opacity = 0.32 * k;
    a.spark.opacity = 0.8 * k;
    const pts = sparks.current;
    if (pts) {
      const arr = pts.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] += dt * (0.2 + (i % 7) * 0.05);
        if (arr[i + 1] > h) arr[i + 1] = 0;
      }
      pts.geometry.attributes.position.needsUpdate = true;
    }
  });

  const t = 0.07;
  return (
    <group ref={group} position={position}>
      <mesh position={[0, h / 2, 0]} material={assets.surface}>
        <planeGeometry args={[w, h]} />
      </mesh>
      {/* Emissive frame */}
      <mesh position={[0, h, 0]} material={assets.edge}>
        <boxGeometry args={[w + t * 2, t, 0.12]} />
      </mesh>
      <mesh position={[0, t / 2, 0]} material={assets.edge}>
        <boxGeometry args={[w + t * 2, t, 0.12]} />
      </mesh>
      {[1, -1].map((side) => (
        <mesh key={side} position={[(w / 2 + t / 2) * side, h / 2, 0]} material={assets.edge}>
          <boxGeometry args={[t, h, 0.12]} />
        </mesh>
      ))}
      {/* Fake volumetric fog */}
      {[0.2, -0.3, -0.9].map((z, i) => (
        <mesh key={z} position={[0, h * 0.5, z]} material={assets.fog} scale={1 + i * 0.4}>
          <planeGeometry args={[w * 2.6, h * 1.4]} />
        </mesh>
      ))}
      <mesh position={[0, 0.01, 1.2]} rotation={[-Math.PI / 2, 0, 0]} material={assets.fog}>
        <planeGeometry args={[w * 3, 3.2]} />
      </mesh>
      <points ref={sparks} material={assets.spark}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[assets.sparkPositions, 3]} />
        </bufferGeometry>
      </points>
    </group>
  );
}

/* ------------------------------------------------------------------ */

function DigitalCity({ count }: { count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          varying float vH;
          varying float vSeed;
          varying float vDepth;
          void main() {
            vUv = uv;
            vH = length(instanceMatrix[1].xyz);
            vSeed = fract(instanceMatrix[3].x * 0.137 + instanceMatrix[3].z * 0.291);
            vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
            vDepth = -mv.z;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform float uOpacity;
          varying vec2 vUv;
          varying float vH;
          varying float vSeed;
          varying float vDepth;
          float h2(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
          void main() {
            vec2 e = abs(vUv * 2.0 - 1.0);
            float edge = step(0.94, max(e.x, e.y));
            vec2 cell = vec2(vUv.x * 4.0, vUv.y * vH * 2.2);
            vec2 f = fract(cell);
            float on = step(0.62, h2(floor(cell) + vSeed * 31.0 + floor(uTime * 0.5 + vSeed * 8.0) * 0.01));
            float win = step(0.3, f.x) * step(f.x, 0.7) * step(0.35, f.y) * step(f.y, 0.65) * on;
            float fade = smoothstep(44.0, 14.0, vDepth);
            vec3 col = vec3(0.008, 0.024, 0.016) + vec3(0.0, 1.0, 0.53) * (edge * 0.55 + win * 0.3);
            gl_FragColor = vec4(col * uOpacity * fade, 1.0);
          }
        `,
      }),
    []
  );

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let i = 0; i < count; i++) {
      const w = 1 + Math.random() * 2.2;
      const hgt = 1.5 + Math.random() * 8;
      const d = 1 + Math.random() * 2.2;
      const x = (Math.random() - 0.5) * 48;
      const z = -16 - Math.random() * 18;
      m.compose(new THREE.Vector3(x, FLOOR_Y + hgt / 2, z), q, new THREE.Vector3(w, hgt, d));
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [count]);

  useEffect(() => () => material.dispose(), [material]);

  const materialRef = useMutableRef(material);
  useFrame(() => {
    const k = env().city;
    if (ref.current) ref.current.visible = k > 0.01;
    const u = materialRef.current.uniforms;
    u.uOpacity.value = k;
    u.uTime.value = introStore.runtime.time;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} material={material} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  );
}

/* ------------------------------------------------------------------ */

const ENV_PANELS: { pos: [number, number, number]; rotY: number; title: string; lines: string[] }[] = [
  {
    pos: [-2.4, 0.5, -3.6],
    rotY: 0.55,
    title: "sys.monitor",
    lines: ["cpu   ████████░░ 82%", "mem   ██████░░░░ 61%", "net   ██████████ OK", "auth  hameed ✓"],
  },
  {
    pos: [2.3, 0.9, -4.4],
    rotY: -0.5,
    title: "portal.link",
    lines: ["handshake ... ok", "route: /portfolio", "latency 4ms", "> enter()"],
  },
  {
    pos: [-2.9, 1.5, -6.8],
    rotY: 0.4,
    title: "stack.py",
    lines: ["import boto3, fastapi", "def deploy(stack):", "  return aws.ship(stack)"],
  },
  {
    pos: [2.8, 0.1, -7.2],
    rotY: -0.35,
    title: "genai.rag",
    lines: ["embed(docs) -> vectors", "retrieve(k=5)", "llm.generate(ctx)"],
  },
];

function HoloPanels({ count }: { count: number }) {
  const group = useRef<THREE.Group>(null);
  const materials = useMemo(
    () =>
      ENV_PANELS.slice(0, count).map(
        (p) =>
          new THREE.MeshBasicMaterial({
            map: createHoloPanelTexture(p.title, p.lines),
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
          })
      ),
    [count]
  );

  useEffect(
    () => () =>
      materials.forEach((m) => {
        m.map?.dispose();
        m.dispose();
      }),
    [materials]
  );

  const materialsRef = useMutableRef(materials);
  useFrame((state) => {
    const k = Math.max(env().panels, env().portal * 0.5);
    if (!group.current) return;
    group.current.visible = k > 0.01;
    const t = state.clock.elapsedTime;
    materialsRef.current.forEach((m, i) => {
      m.opacity = k * (0.55 + Math.sin(t * 1.7 + i * 2) * 0.06);
    });
    group.current.children.forEach((c, i) => {
      c.position.y = ENV_PANELS[i].pos[1] + Math.sin(t * 0.5 + i) * 0.05;
    });
  });

  return (
    <group ref={group}>
      {materials.map((m, i) => (
        <mesh key={i} position={ENV_PANELS[i].pos} rotation={[0, ENV_PANELS[i].rotY, 0]} material={m}>
          <planeGeometry args={[1.2, 0.75]} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */

type IntroEnvironmentProps = {
  quality: QualitySettings;
  staging: IntroStaging;
  framing: HeroFraming;
};

export default function IntroEnvironment({ quality, staging, framing }: IntroEnvironmentProps) {
  return (
    <>
      <MatrixRainField count={quality.rain} />
      <DustField count={quality.dust} />
      <GridFloor receiveShadow={quality.shadows} />
      <GlobeHologram staging={staging} particles={quality.globeParticles} />
      <Portal staging={staging} />
      <DigitalCity count={quality.city} />
      <HoloPanels count={quality.panels} />
      <group position={framing.position} rotation={[0, framing.rotationY, 0]} scale={framing.scale}>
        <HeroWorkstation
          getFade={() => env().chair}
          panels={Math.min(3, quality.panels)}
          castShadow={quality.shadows}
        />
      </group>
    </>
  );
}
