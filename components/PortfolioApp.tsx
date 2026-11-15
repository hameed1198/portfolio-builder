"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Preloader from "@/components/preloader/Preloader";
import CustomCursor from "@/components/ui/CustomCursor";
import ScrollProgress from "@/components/ui/ScrollProgress";
import Navbar from "@/components/ui/Navbar";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import HeroSection from "@/components/hero/HeroSection";
import AboutSection from "@/components/about/AboutSection";
import ExperienceSection from "@/components/experience/ExperienceSection";
import SkillsSection from "@/components/skills/SkillsSection";
import ProjectsSection from "@/components/projects/ProjectsSection";
import CertsSection from "@/components/certifications/CertsSection";
import ContactSection from "@/components/contact/ContactSection";
import Footer from "@/components/footer/Footer";
import type { IdentityReveal } from "@/components/hero/HeroIdentity";
import type { IntroCompleteInfo } from "@/components/intro/CinematicIntro";
import { markIntroPlayed, resolveIntroLaunch, type IntroLaunch } from "@/lib/intro/introFlags";
import { hasWebGL } from "@/lib/utils";

// Only fetched when the intro actually plays.
const CinematicIntro = dynamic(() => import("@/components/intro/CinematicIntro"), { ssr: false });

type Phase = "preload" | "intro" | "site";

export default function PortfolioApp() {
  const [launch, setLaunch] = useState<IntroLaunch | null>(null);
  const [phase, setPhase] = useState<Phase>("preload");
  const [preloaderGone, setPreloaderGone] = useState(false);
  const [introReady, setIntroReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [heroText, setHeroText] = useState<"pending" | "decode" | "instant">("pending");
  const [heroLive, setHeroLive] = useState(false);

  useEffect(() => {
    const resolved = resolveIntroLaunch();
    // Resolved once on the client: URL flags and sessionStorage aren't available during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLaunch(hasWebGL() ? resolved : { ...resolved, play: false });
  }, []);

  const playIntro = launch?.play ?? false;

  const handlePreloaderReveal = useCallback(() => {
    if (playIntro) setPhase("intro");
  }, [playIntro]);

  const handlePreloaderComplete = useCallback(() => {
    setPreloaderGone(true);
    if (!playIntro) {
      setHeroLive(true);
      setPhase("site");
    }
  }, [playIntro]);

  const handleIntroComplete = useCallback(({ reachedIdentity }: IntroCompleteInfo) => {
    markIntroPlayed();
    setHeroText(reachedIdentity ? "instant" : "decode");
    setHeroLive(true);
    setPhase("site");
  }, []);

  const heroReveal: IdentityReveal =
    heroText === "instant" ? "instant" : phase === "site" ? "decode" : "hold";

  return (
    <div className="film-grain scanlines relative min-h-screen bg-background text-foreground">
      {!preloaderGone ? (
        <Preloader
          variant={!launch ? "pending" : playIntro ? "boot" : "classic"}
          assetProgress={loadProgress}
          assetsReady={introReady}
          onReveal={handlePreloaderReveal}
          onComplete={handlePreloaderComplete}
        />
      ) : null}

      {launch && playIntro && phase !== "site" ? (
        <CinematicIntro
          launch={launch}
          active={phase === "intro"}
          onProgress={setLoadProgress}
          onReady={() => setIntroReady(true)}
          onIdentity={() => setHeroText("instant")}
          onHandoff={() => setHeroLive(true)}
          onComplete={handleIntroComplete}
        />
      ) : null}

      <CustomCursor />
      {phase === "site" ? <ScrollProgress /> : null}

      {phase !== "preload" ? (
        <SmoothScrollProvider paused={phase !== "site"}>
          {phase === "site" ? <Navbar /> : null}
          <main>
            <HeroSection reveal={heroReveal} live={heroLive} />
            <AboutSection />
            <ExperienceSection />
            <SkillsSection />
            <ProjectsSection />
            <CertsSection />
            <ContactSection />
          </main>
          <Footer />
        </SmoothScrollProvider>
      ) : (
        <div className="min-h-screen" aria-hidden />
      )}
    </div>
  );
}
