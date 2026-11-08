import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge must know our custom Figma text styles (text-h3, text-body-sm…)
 * — otherwise it confuses them with text colours and drops one of them.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-2xl", "display-xl", "display-lg",
            "h1", "h2", "h3", "h4", "h5", "h6",
            "body-xl", "body-lg", "body-md", "body-sm", "body-xs",
            "label-lg", "label-md", "label-sm",
            "caption", "overline",
            "button-lg", "button-md", "button-sm",
            "link-md", "link-sm",
          ],
        },
      ],
      shadow: [{ shadow: ["xs", "sm", "md", "lg", "xl", "glow", "ring-brand", "ring-error", "none"] }],
    },
  },
});

/** Merge Tailwind classes safely (later classes win). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
