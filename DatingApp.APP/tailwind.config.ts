import type { Config } from "tailwindcss";

/**
 * Tailwind theme = the Figma design system, nothing else.
 *
 * Every value points at a CSS variable in src/styles/tokens.css, which is a
 * 1:1 copy of the Figma variables. Light / dark mode switch automatically
 * via [data-theme="dark"] on <html>.
 *
 * Naming follows Figma:
 *   Figma color/text/secondary   → text-ink-secondary
 *   Figma color/bg/brand-subtle  → bg-brand-subtle
 *   Figma color/border/strong    → border-line-strong
 *   Figma color/status/error-fg  → text-error-fg
 *   Figma radius/md              → rounded-md
 *   Figma Shadow/SM              → shadow-sm
 *   Figma text style Heading/H3  → text-h3
 *   Figma Gradient/Brand         → bg-brand-gradient
 *
 * Tailwind's default palette is intentionally REPLACED (not extended) so only
 * design-system colours can be used.
 */
const v = (name: string) => `var(--${name})`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    screens: {
      sm: "640px",
      md: "768px", // Figma Layout · Tablet starts here
      lg: "1024px", // Figma Layout · Desktop starts here
      xl: "1280px",
      "2xl": "1440px",
    },
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: v("gray-0"),
      black: v("gray-950"),

      // ── Primitives (prefer the semantic colours below) ────────────────
      rose: { 50: v("rose-50"), 100: v("rose-100"), 200: v("rose-200"), 300: v("rose-300"), 400: v("rose-400"), 500: v("rose-500"), 600: v("rose-600"), 700: v("rose-700"), 800: v("rose-800"), 900: v("rose-900"), 950: v("rose-950") },
      gray: { 0: v("gray-0"), 50: v("gray-50"), 100: v("gray-100"), 200: v("gray-200"), 300: v("gray-300"), 400: v("gray-400"), 500: v("gray-500"), 600: v("gray-600"), 700: v("gray-700"), 800: v("gray-800"), 900: v("gray-900"), 950: v("gray-950") },
      gold: { 50: v("gold-50"), 100: v("gold-100"), 300: v("gold-300"), 500: v("gold-500"), 700: v("gold-700"), 900: v("gold-900") },

      // ── Semantic: color/bg/* and color/surface/* ──────────────────────
      page: v("color-bg-page"),
      surface: {
        subtle: v("color-bg-subtle"),
        muted: v("color-bg-muted"),
        disabled: v("color-bg-disabled"),
        inverse: v("color-bg-inverse"),
        card: v("color-surface-card"),
        raised: v("color-surface-raised"),
        glass: v("color-surface-glass"),
        "glass-strong": v("color-surface-glass-strong"),
        scrim: v("color-bg-scrim"),
      },
      brand: {
        DEFAULT: v("color-bg-brand"),
        hover: v("color-bg-brand-hover"),
        subtle: v("color-bg-brand-subtle"),
        strong: v("color-bg-brand-strong"),
        text: v("color-text-brand"),
        link: v("color-text-link"),
        border: v("color-border-brand"),
        focus: v("color-border-focus"),
        ring: v("rose-100"),
      },
      // ── Semantic: color/text/* ─────────────────────────────────────────
      ink: {
        DEFAULT: v("color-text-primary"),
        secondary: v("color-text-secondary"),
        tertiary: v("color-text-tertiary"),
        disabled: v("color-text-disabled"),
        inverse: v("color-text-inverse"),
        "on-brand": v("color-text-on-brand"),
        "on-brand-muted": v("color-text-on-brand-muted"),
      },
      // ── Semantic: color/border/* ───────────────────────────────────────
      line: {
        DEFAULT: v("color-border-default"),
        strong: v("color-border-strong"),
        error: v("color-border-error"),
        glass: v("color-border-glass"),
        "glass-subtle": v("color-border-glass-subtle"),
      },
      // ── Semantic: color/icon/* ─────────────────────────────────────────
      icon: {
        DEFAULT: v("color-icon-default"),
        muted: v("color-icon-muted"),
        brand: v("color-icon-brand"),
        "on-brand": v("color-icon-on-brand"),
      },
      // ── Semantic: color/status/* ───────────────────────────────────────
      success: { bg: v("color-status-success-bg"), fg: v("color-status-success-fg"), line: v("green-500") },
      warning: { bg: v("color-status-warning-bg"), fg: v("color-status-warning-fg"), line: v("amber-500") },
      error: { bg: v("color-status-error-bg"), fg: v("color-status-error-fg"), line: v("color-border-error"), ring: v("red-100") },
      info: { bg: v("color-status-info-bg"), fg: v("color-status-info-fg"), line: v("blue-500") },
      premium: { bg: v("color-status-premium-bg"), fg: v("color-status-premium-fg"), line: v("gold-300") },
    },
    fontFamily: {
      sans: [v("font-family-base")],
      sinhala: [v("font-family-sinhala")],
      tamil: [v("font-family-tamil")],
    },
    // Figma text styles → text-{name}. Weight is part of the style
    // (text-body-md = Body/MD/Regular; add font-semibold for Body/MD/SemiBold).
    fontSize: {
      "display-2xl": ["72px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "800" }],
      "display-xl": ["60px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "800" }],
      "display-lg": ["48px", { lineHeight: "1.2", letterSpacing: "-0.015em", fontWeight: "700" }],
      h1: ["40px", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "700" }],
      h2: ["32px", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "700" }],
      h3: ["28px", { lineHeight: "1.2", letterSpacing: "-0.005em", fontWeight: "700" }],
      h4: ["24px", { lineHeight: "1.2", fontWeight: "700" }],
      h5: ["20px", { lineHeight: "1.2", fontWeight: "700" }],
      h6: ["18px", { lineHeight: "1.2", fontWeight: "700" }],
      "body-xl": ["20px", { lineHeight: "30px" }],
      "body-lg": ["18px", { lineHeight: "28px" }],
      "body-md": ["16px", { lineHeight: "24px" }],
      "body-sm": ["14px", { lineHeight: "20px" }],
      "body-xs": ["12px", { lineHeight: "18px" }],
      "label-lg": ["16px", { lineHeight: "1.2", fontWeight: "600" }],
      "label-md": ["14px", { lineHeight: "1.2", letterSpacing: "0.005em", fontWeight: "600" }],
      "label-sm": ["12px", { lineHeight: "1.2", letterSpacing: "0.01em", fontWeight: "600" }],
      caption: ["12px", { lineHeight: "16px" }],
      overline: ["12px", { lineHeight: "1.2", letterSpacing: "0.08em", fontWeight: "700" }],
      "button-lg": ["18px", { lineHeight: "1.2", fontWeight: "700" }],
      "button-md": ["16px", { lineHeight: "1.2", fontWeight: "700" }],
      "button-sm": ["14px", { lineHeight: "1.2", fontWeight: "700" }],
      "link-md": ["16px", { lineHeight: "24px", fontWeight: "600" }],
      "link-sm": ["14px", { lineHeight: "20px", fontWeight: "600" }],
    },
    fontWeight: { normal: "400", semibold: "600", bold: "700", extrabold: "800" },
    borderRadius: {
      none: v("radius-none"),
      xs: v("radius-xs"),
      sm: v("radius-sm"),
      DEFAULT: v("radius-md"),
      md: v("radius-md"),
      lg: v("radius-lg"),
      xl: v("radius-xl"),
      "2xl": v("radius-2xl"),
      full: v("radius-full"),
    },
    boxShadow: {
      none: "none",
      xs: v("shadow-xs"),
      sm: v("shadow-sm"),
      md: v("shadow-md"),
      lg: v("shadow-lg"),
      xl: v("shadow-xl"),
      glow: v("shadow-brand-glow"),
      "ring-brand": v("focus-ring-brand"),
      "ring-error": v("focus-ring-error"),
    },
    extend: {
      spacing: {
        "page-x": v("layout-page-margin"),
        section: v("layout-section-gap"),
        gutter: v("layout-grid-gutter"),
        "card-gap": v("layout-card-gap"),
      },
      maxWidth: { container: v("layout-container-max"), screen: v("layout-screen-width") },
      backgroundImage: {
        "brand-gradient": v("gradient-brand"),
        "brand-soft": v("gradient-brand-soft"),
        "hero-overlay": v("gradient-hero-overlay"),
        story: v("gradient-story"),
        "page-gradient": v("gradient-page"),
      },
      keyframes: {
        "toast-in": { "0%": { opacity: "0", transform: "translateY(-12px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "fade-up": { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        shake: { "0%,100%": { transform: "translateX(0)" }, "20%,60%": { transform: "translateX(-6px)" }, "40%,80%": { transform: "translateX(6px)" } },
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        "story-in": { "0%": { opacity: "0", transform: "translateX(32px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
        "pop-in": { "0%": { opacity: "0", transform: "translateY(-6px) scale(0.97)" }, "100%": { opacity: "1", transform: "translateY(0) scale(1)" } },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "toast-out": { "0%": { opacity: "1", transform: "translateY(0) scale(1)" }, "100%": { opacity: "0", transform: "translateY(-12px) scale(0.97)" } },
        "toast-progress": { "0%": { transform: "scaleX(0)" }, "100%": { transform: "scaleX(1)" } },
        "dialog-in": { "0%": { opacity: "0", transform: "translateY(12px) scale(0.96)" }, "100%": { opacity: "1", transform: "translateY(0) scale(1)" } },
      },
      animation: {
        "toast-in": "toast-in 220ms ease-out",
        "fade-up": "fade-up 260ms ease-out",
        shake: "shake 320ms ease-in-out",
        marquee: "marquee 60s linear infinite",
        "story-in": "story-in 500ms cubic-bezier(0.22, 1, 0.36, 1)",
        "pop-in": "pop-in 200ms cubic-bezier(0.22, 1, 0.36, 1)",
        "fade-in": "fade-in 200ms ease-out",
        "toast-out": "toast-out 220ms ease-in",
        "toast-progress": "toast-progress 4000ms linear forwards",
        "dialog-in": "dialog-in 260ms cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
