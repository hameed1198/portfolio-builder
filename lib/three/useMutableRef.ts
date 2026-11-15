import { useEffect, useRef } from "react";

/**
 * Holds memoized Three.js objects (materials, uniforms) that `useFrame`
 * mutates imperatively every frame, outside React's render.
 */
export function useMutableRef<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

/** Deterministic PRNG (mulberry32) so generated layouts are pure and stable. */
export function createRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
