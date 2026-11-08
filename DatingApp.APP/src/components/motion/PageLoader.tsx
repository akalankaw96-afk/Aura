"use client";

import React, { useEffect, useState } from "react";
import { Heart } from "iconsax-react";

/**
 * First-visit page loader — logo, beating heart and a shimmer bar.
 * Rendered on the server so it covers the page before anything paints, then
 * fades out once the window has loaded (min 600 ms so it never just flickers).
 * When it leaves it adds `is-loaded` to <html>, which starts the `.enter`
 * hero animations (globals.css → Motion).
 */
const MIN_MS = 600;

export function PageLoader() {
  const [phase, setPhase] = useState<"show" | "leave" | "gone">("show");

  useEffect(() => {
    const start = performance.now();
    let t1 = 0;
    let t2 = 0;
    const done = () => {
      const wait = Math.max(0, MIN_MS - (performance.now() - start));
      t1 = window.setTimeout(() => {
        document.documentElement.classList.add("is-loaded");
        setPhase("leave");
        t2 = window.setTimeout(() => setPhase("gone"), 500);
      }, wait);
    };
    if (document.readyState === "complete") done();
    else window.addEventListener("load", done, { once: true });
    // never block the page for long, even if an image hangs
    const safety = window.setTimeout(done, 2500);
    return () => {
      window.removeEventListener("load", done);
      [t1, t2, safety].forEach(window.clearTimeout);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-page-gradient transition-[opacity,visibility] duration-500 ${
        phase === "leave" ? "invisible opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo.png" alt="Vikasitha" style={{ height: 72, width: 122 }} />
        <div className="relative flex h-14 w-14 items-center justify-center">
          <span aria-hidden className="loader-ring absolute inset-0 rounded-full bg-brand-subtle" />
          <span className="loader-beat relative flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient text-ink-on-brand shadow-lg">
            <Heart size={24} color="currentColor" variant="Bold" />
          </span>
        </div>
        <div aria-hidden className="h-1 w-32 overflow-hidden rounded-full bg-surface-muted">
          <div className="loader-bar h-full w-1/2 rounded-full bg-brand-gradient" />
        </div>
      </div>
    </div>
  );
}
