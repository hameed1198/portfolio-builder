import type { SoundCue } from "./introConfig";

const SOUND_PREF_KEY = "hameed-intro-sound";

type Listener = () => void;

/**
 * Optional intro sound layer. Muted by default; audio files are only fetched
 * after the visitor unmutes (that click is also the gesture browsers require
 * before an AudioContext may play). Missing files are skipped silently.
 */
export class IntroSoundManager {
  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;
  private buffers = new Map<SoundCue, AudioBuffer | null>();
  private loading: Promise<void> | null = null;
  private sources = new Set<AudioBufferSourceNode>();
  private listeners = new Set<Listener>();
  private currentCue: SoundCue | undefined;
  private unlockHandler: (() => void) | null = null;
  private muted = true;

  constructor(private readonly files: Record<SoundCue, string>) {
    let wantsSound = false;
    try {
      wantsSound = window.sessionStorage.getItem(SOUND_PREF_KEY) === "on";
    } catch {
      // ignore
    }
    if (wantsSound) {
      // Autoplay policy: wait for the first gesture before actually unmuting.
      this.unlockHandler = () => {
        this.removeUnlock();
        void this.setMuted(false);
      };
      window.addEventListener("pointerdown", this.unlockHandler, { once: true });
      window.addEventListener("keydown", this.unlockHandler, { once: true });
    }
  }

  isMuted = () => this.muted;

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  async setMuted(muted: boolean) {
    this.removeUnlock();
    this.muted = muted;
    try {
      window.sessionStorage.setItem(SOUND_PREF_KEY, muted ? "off" : "on");
    } catch {
      // ignore
    }
    this.listeners.forEach((l) => l());

    if (muted) {
      this.rampTo(0, 0.15);
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx) return;
    await ctx.resume().catch(() => undefined);
    this.rampTo(0.8, 0.2);
    await this.load();
    if (this.currentCue) this.play(this.currentCue);
  }

  /** Called on every scene change; plays only if unmuted and the file exists. */
  cue(cue: SoundCue | undefined) {
    if (!cue) return;
    this.currentCue = cue;
    if (this.muted || !this.ctx) return;
    this.play(cue);
  }

  fadeOut(seconds: number) {
    this.rampTo(0, seconds);
  }

  dispose() {
    this.removeUnlock();
    this.sources.forEach((s) => {
      try {
        s.stop();
      } catch {
        // already stopped
      }
    });
    this.sources.clear();
    void this.ctx?.close().catch(() => undefined);
    this.ctx = null;
    this.listeners.clear();
  }

  private play(cue: SoundCue) {
    const ctx = this.ctx;
    const buffer = this.buffers.get(cue);
    if (!ctx || !this.gain || !buffer) return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.gain);
    src.onended = () => this.sources.delete(src);
    src.start();
    this.sources.add(src);
  }

  private ensureContext() {
    if (this.ctx) return this.ctx;
    const AudioCtor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;
    this.ctx = new AudioCtor();
    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0;
    this.gain.connect(this.ctx.destination);
    return this.ctx;
  }

  private load() {
    const ctx = this.ctx;
    if (!ctx) return Promise.resolve();
    if (!this.loading) {
      this.loading = Promise.all(
        (Object.entries(this.files) as [SoundCue, string][]).map(async ([cue, url]) => {
          try {
            const res = await fetch(url);
            if (!res.ok || (res.headers.get("content-type") ?? "").includes("text/html")) throw new Error();
            this.buffers.set(cue, await ctx.decodeAudioData(await res.arrayBuffer()));
          } catch {
            this.buffers.set(cue, null);
          }
        })
      ).then(() => undefined);
    }
    return this.loading;
  }

  private rampTo(value: number, seconds: number) {
    if (!this.ctx || !this.gain) return;
    this.gain.gain.setTargetAtTime(value, this.ctx.currentTime, Math.max(0.01, seconds / 3));
  }

  private removeUnlock() {
    if (!this.unlockHandler) return;
    window.removeEventListener("pointerdown", this.unlockHandler);
    window.removeEventListener("keydown", this.unlockHandler);
    this.unlockHandler = null;
  }
}
