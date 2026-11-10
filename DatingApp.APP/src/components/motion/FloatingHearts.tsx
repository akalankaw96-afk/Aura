"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Heart } from "iconsax-react";
import { useBackgroundAnimation } from "@/lib/backgroundAnimation";

// Keep most of the motion near the page edges.
const LANES = [5, 94, 13, 86, 21, 77, 9, 91, 26, 73, 17, 83];
const between = (min: number, max: number) => min + Math.random() * (max - min);

function createHearts() {
  return LANES.map((lane, index) => {
    const angle = between(-28, 28);
    const duration = between(9, 16);
    return {
      index,
      filled: index % 4 === 0,
      style: {
        left: `${lane + between(-2, 2)}%`,
        "--heart-size": `${Math.round(between(12, 30))}px`,
        "--heart-time": `${duration.toFixed(1)}s`,
        "--heart-delay": `-${between(0, duration).toFixed(1)}s`,
        "--heart-drift": `${Math.round(between(-34, 34))}px`,
        "--heart-angle": `${Math.round(angle)}deg`,
        "--heart-end-angle": `${Math.round(angle + between(-30, 30))}deg`,
      } as CSSProperties,
    };
  });
}

/** A looping decoration shared by all pages. */
export function FloatingHearts() {
  const { enabled } = useBackgroundAnimation();
  const [hearts, setHearts] = useState<ReturnType<typeof createHearts>>([]);
  useEffect(() => {
    setHearts(createHearts());
  }, []);

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className="floating-hearts pointer-events-none fixed inset-0 z-10 overflow-hidden text-icon-brand">
      {hearts.map(({ index, style, filled }) => (
        <span key={index} className="floating-heart" style={style}>
          <Heart size={24} color="currentColor" variant={filled ? "Bold" : "Linear"} className="floating-heart-icon" />
        </span>
      ))}
    </div>
  );
}
