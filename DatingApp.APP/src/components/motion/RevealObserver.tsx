"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Scroll reveal for the whole site. Mount once (root layout).
 *  - `.reveal`, `.reveal-zoom` → animate in when 15 % visible
 *  - `.reveal-stagger` → each direct child animates in, 90 ms apart
 * Sets `data-in` (an attribute React never touches, so re-renders keep it).
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.setAttribute("data-in", "");
          io.unobserve(e.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    const scan = () => {
      document.querySelectorAll<HTMLElement>(".reveal-stagger").forEach((group) => {
        Array.from(group.children).forEach((child, i) => {
          const el = child as HTMLElement;
          if (el.hasAttribute("data-reveal")) return;
          el.setAttribute("data-reveal", "");
          el.style.setProperty("--reveal-delay", `${Math.min(i, 8) * 90}ms`);
        });
      });
      document.querySelectorAll(".reveal:not([data-in]), .reveal-zoom:not([data-in]), [data-reveal]:not([data-in])").forEach((el) => io.observe(el));
    };

    scan();
    // pick up content that mounts later (filters, tabs, client navigation)
    let raf = 0;
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(scan);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
