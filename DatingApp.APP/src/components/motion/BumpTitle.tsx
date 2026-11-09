import React from "react";
import { cn } from "@/lib/cn";

/**
 * Title "zoom & bump" — the same beat as the page-loader heart:
 * each word zooms in from small + blurred, overshoots, dips, then settles.
 *  - trigger="reveal" (default): plays when the title scrolls into view (RevealObserver)
 *  - trigger="load": plays as soon as the page loader finishes (hero)
 * Plain strings are split into words; any other children animate as one block.
 * Respects prefers-reduced-motion (globals.css).
 */
export function BumpTitle({
  as: Tag = "h2",
  children,
  className,
  trigger = "reveal",
  delay = 0,
  stagger = 70,
}: {
  as?: "h1" | "h2" | "h3" | "p" | "span";
  children: React.ReactNode;
  className?: string;
  trigger?: "reveal" | "load";
  /** ms before the first word */
  delay?: number;
  /** ms between words */
  stagger?: number;
}) {
  let i = 0;
  const word = (content: React.ReactNode, key: React.Key) => (
    <span
      key={key}
      className="bump-word"
      style={{ ["--bump-delay" as string]: `${delay + i++ * stagger}ms` } as React.CSSProperties}
    >
      {content}
    </span>
  );

  const parts: React.ReactNode[] = [];
  React.Children.forEach(children, (child, ci) => {
    if (typeof child === "string" || typeof child === "number") {
      String(child)
        .split(/(\s+)/)
        .forEach((w, wi) => {
          if (!w) return;
          parts.push(/^\s+$/.test(w) ? " " : word(w, `${ci}-${wi}`));
        });
    } else if (child != null && child !== false) {
      parts.push(word(child, `${ci}`));
    }
  });

  return (
    <Tag className={cn(trigger === "load" ? "bump-title-load" : "bump-title", className)}>
      {parts}
    </Tag>
  );
}
