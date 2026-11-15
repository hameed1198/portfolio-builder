"use client";

import { useState } from "react";
import TechBadges from "@/components/hero/TechBadges";
import type { HeroFraming } from "@/lib/avatar/avatarConfig";
import { introStore } from "@/lib/intro/introStore";
import { isMobileDevice } from "@/lib/utils";

/** Frame 09 — the shared Hero badges (same intensity and set as the Hero), revealed by the timeline. */
export default function IntroTechBadges({ framing }: { framing: HeroFraming }) {
  const [mobile] = useState(isMobileDevice);
  return (
    <group position={framing.position} rotation={[0, framing.rotationY, 0]} scale={framing.scale}>
      <TechBadges getReveal={() => introStore.runtime.env.badges} intensity={0.75} showSecondary={!mobile} />
    </group>
  );
}
