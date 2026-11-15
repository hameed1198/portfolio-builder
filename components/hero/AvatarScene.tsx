"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import HameedAvatar, { probeAvatarModel } from "./HameedAvatar";
import AvatarLighting from "./AvatarLighting";
import AvatarEffects from "./AvatarEffects";
import HeroWorkstation from "./HeroWorkstation";
import TechBadges from "./TechBadges";
import { NetworkParticles } from "./ParticleField";
import { createAvatarController, type AvatarController } from "./AvatarAnimations";
import { avatarConfig, FLOOR_Y, getHeroFraming, type HeroFraming } from "@/lib/avatar/avatarConfig";
import { hasWebGL, isLowPowerDevice, isMobileDevice, preferReducedMotion } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

type AvatarSceneProps = {
  sectionRef: React.RefObject<HTMLElement | null>;
  /** Render on demand only (e.g. while the cinematic intro covers the Hero). */
  paused?: boolean;
};

function CameraRig({
  framing,
  controller,
  reducedMotion,
  scrollProgress,
}: {
  framing: HeroFraming;
  controller: AvatarController;
  reducedMotion: boolean;
  scrollProgress: number;
}) {
  const cam = useRef<THREE.PerspectiveCamera>(null);
  const { position, lookAt, fov } = framing.camera;
  const look = useMemo(() => new THREE.Vector3(...lookAt), [lookAt]);
  const base = useMemo(() => new THREE.Vector3(...position), [position]);
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    if (!cam.current) return;
    const px = reducedMotion ? 0 : state.pointer.x;
    const py = reducedMotion ? 0 : state.pointer.y;
    controller.setLookTarget(px, py);

    const parallaxX = px * 0.12;
    const parallaxY = py * 0.06;
    target.set(base.x + parallaxX, base.y + parallaxY + scrollProgress * 0.1, base.z + scrollProgress * 0.8);
    cam.current.position.lerp(target, 0.05);
    look.set(lookAt[0] + parallaxX * 0.15, lookAt[1], lookAt[2] - scrollProgress * 0.4);
    cam.current.lookAt(look);
  });

  return <PerspectiveCamera ref={cam} makeDefault fov={fov} near={0.03} far={60} position={position} />;
}

function SceneContents({
  framing,
  useGlb,
  hovered,
  reducedMotion,
  scrollProgress,
  lowPower,
  mobile,
}: {
  framing: HeroFraming;
  useGlb: boolean;
  hovered: boolean;
  reducedMotion: boolean;
  scrollProgress: number;
  lowPower: boolean;
  mobile: boolean;
}) {
  // Seated, matching the last frame of the cinematic intro.
  const controller = useMemo(() => createAvatarController("sitting", { offset: 10 }), []);
  const rig = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!rig.current) return;
    rig.current.position.set(
      framing.position[0],
      framing.position[1] + THREE.MathUtils.lerp(0, -0.15, scrollProgress),
      framing.position[2] + THREE.MathUtils.lerp(0, -1.4, scrollProgress)
    );
  });

  return (
    <>
      <CameraRig
        framing={framing}
        controller={controller}
        reducedMotion={reducedMotion}
        scrollProgress={scrollProgress}
      />
      <AvatarLighting hoverBoost={hovered ? 1 : 0} origin={framing.position} shadows={!lowPower} />
      <fog attach="fog" args={["#0a0a0a", 5, 15]} />

      <gridHelper args={[18, 24, "#113322", "#0a0a0a"]} position={[0, FLOOR_Y, 0]} />
      {!lowPower ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y - 0.002, 0]} receiveShadow>
          <planeGeometry args={[18, 18]} />
          <shadowMaterial opacity={0.35} />
        </mesh>
      ) : null}

      <group ref={rig} position={framing.position} rotation={[0, framing.rotationY, 0]} scale={framing.scale}>
        <HeroWorkstation panels={lowPower ? 2 : 3} castShadow={!lowPower} />
        <HameedAvatar
          controller={controller}
          modelPath={avatarConfig.modelPath}
          useGlb={useGlb}
          castShadow={!lowPower}
        />
        <TechBadges intensity={0.75} showSecondary={!mobile} />
      </group>

      <NetworkParticles
        count={lowPower || mobile ? avatarConfig.particles.mobile : avatarConfig.particles.desktop}
        centerOffset={mobile ? [0, 0.5, -1.2] : [-0.8, 0.5, -1.2]}
        opacity={0.45}
      />

      {!lowPower ? <AvatarEffects hovered={hovered} reducedMotion={reducedMotion} /> : null}
    </>
  );
}

function FlatAvatarFallback() {
  return (
    <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] flex w-full items-end justify-center lg:w-[48%] lg:items-center lg:justify-center">
      <div
        className="relative mb-8 h-[55vh] max-h-[580px] w-[72vw] max-w-[400px] overflow-hidden rounded-[20px] border border-primary/25 lg:mb-0"
        style={{ boxShadow: "0 0 50px rgba(0,255,136,0.15), inset 0 0 30px rgba(0,255,136,0.05)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarConfig.fallbackPortrait}
          alt="Hameed Khan"
          className="h-full w-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-primary/5" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,255,136,0.06) 3px)",
          }}
        />
        <div className="absolute bottom-4 left-4 rounded-md border border-primary/30 bg-background/70 px-3 py-1.5 font-mono text-xs text-primary backdrop-blur">
          {">_"} system.online
        </div>
      </div>
    </div>
  );
}

type SceneEnv = {
  mode: "3d" | "2d";
  useGlb: boolean;
  reducedMotion: boolean;
  mobile: boolean;
  lowPower: boolean;
};

export default function AvatarScene({ sectionRef, paused = false }: AvatarSceneProps) {
  const [hovered, setHovered] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [env, setEnv] = useState<SceneEnv | null>(null);

  useEffect(() => {
    let cancelled = false;
    // The 3D avatar is used wherever WebGL exists so it matches the intro's character.
    const base: SceneEnv = {
      mode: hasWebGL() ? "3d" : "2d",
      useGlb: false,
      reducedMotion: preferReducedMotion(),
      mobile: isMobileDevice(),
      lowPower: isLowPowerDevice(),
    };
    probeAvatarModel().then((useGlb) => {
      if (!cancelled) setEnv({ ...base, useGlb });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => setScrollProgress(self.progress),
    });

    return () => st.kill();
  }, [sectionRef]);

  if (!env) {
    return <div className="absolute inset-0 -z-10 bg-background" />;
  }

  if (env.mode === "2d") {
    return <FlatAvatarFallback />;
  }

  const framing = getHeroFraming(env.mobile);

  return (
    <div
      className="absolute inset-0 z-[1]"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      data-magnetic
      style={{
        opacity: 1 - scrollProgress * 0.3,
        transform: `translateY(${scrollProgress * 35}px)`,
      }}
    >
      <Canvas
        frameloop={paused ? "demand" : "always"}
        shadows={env.lowPower ? false : "percentage"}
        dpr={[1, env.lowPower ? 1.25 : 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: framing.camera.position, fov: framing.camera.fov }}
      >
        <Suspense fallback={null}>
          <SceneContents
            framing={framing}
            useGlb={env.useGlb}
            hovered={hovered}
            reducedMotion={env.reducedMotion}
            scrollProgress={scrollProgress}
            lowPower={env.lowPower}
            mobile={env.mobile}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
