import React from "react";

/**
 * Classic share symbol (three connected dots, "<" shape) — iconsax has no such icon.
 * Same API and line style as iconsax (24 grid, 1.5 stroke, round caps) so it sits next to them.
 */
export function ShareIcon({ size = 24, color = "currentColor", className }: Readonly<{ size?: number | string; color?: string; className?: string }>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <circle cx="18" cy="5" r="2.75" />
      <circle cx="6" cy="12" r="2.75" />
      <circle cx="18" cy="19" r="2.75" />
      <path d="M8.4 13.4l7.2 4.2M15.6 6.4L8.4 10.6" />
    </svg>
  );
}
