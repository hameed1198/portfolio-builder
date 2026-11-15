"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 350, damping: 28 });
  const ringY = useSpring(y, { stiffness: 350, damping: 28 });

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const wide = window.matchMedia("(min-width: 769px)").matches;
    setEnabled(finePointer && wide);
    if (!(finePointer && wide)) return;

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };

    const hide = () => setVisible(false);

    const over = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const interactive = target.closest(
        "a, button, [data-magnetic], .magnetic-target, input, textarea"
      );
      setHovering(Boolean(interactive));
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    window.addEventListener("mouseleave", hide);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mouseleave", hide);
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <>
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[10001] mix-blend-difference"
        style={{
          x,
          y,
          translateX: "-50%",
          translateY: "-50%",
          opacity: visible ? 1 : 0,
        }}
      >
        <div
          className={`rounded-full bg-primary transition-all duration-200 ${
            hovering ? "h-3 w-3" : "h-2 w-2"
          }`}
          style={{ boxShadow: "0 0 16px rgba(0,255,136,0.9)" }}
        />
      </motion.div>
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[10001]"
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
          opacity: visible ? 1 : 0,
        }}
      >
        <div
          className={`rounded-full border border-primary/50 transition-all duration-300 ${
            hovering ? "h-14 w-14 border-primary/80" : "h-9 w-9"
          }`}
          style={{ boxShadow: hovering ? "0 0 24px rgba(0,255,136,0.35)" : "none" }}
        />
      </motion.div>
    </>
  );
}