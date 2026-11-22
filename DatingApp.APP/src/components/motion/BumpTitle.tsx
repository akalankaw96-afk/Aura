import React from "react";
import { cn } from "@/lib/cn";

/**
 * Home hero title only — a smooth word-by-word rise: each word fades up a little from a soft blur and settles
 * (long ease-out, no overshoot). Other titles are plain headings (the old "zoom & bump" was removed everywhere).
 *  - trigger="load" (hero): plays as soon as the page loader finishes
 *  - trigger="reveal": plays when the title scrolls into view (RevealObserver)
 * Plain strings are split into words; any other children animate as one block.
 * A "\n" in a string (or a <br />) starts a new line — use it to control where a title breaks.
 * Respects prefers-reduced-motion (globals.css).
 */
export function BumpTitle({
  as: Tag = "h2",
  children,
  className,
  trigger = "reveal",
  delay = 0,
  stagger = 80,
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
          if (/^\s+$/.test(w)) parts.push(w.includes("\n") ? <br key={`${ci}-${wi}`} /> : " ");
          else parts.push(word(w, `${ci}-${wi}`));
        });
    } else if (React.isValidElement(child) && child.type === "br") {
      parts.push(child);
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
