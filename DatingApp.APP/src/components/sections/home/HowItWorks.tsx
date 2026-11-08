import React from "react";
import { Lovely, SearchNormal1, UserAdd, Verify } from "iconsax-react";
import { cn } from "@/lib/cn";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoveSticker } from "@/components/ui/Decor";
import { HOW_IT_WORKS } from "@/content/home";

/**
 * Figma: How It Works Notes (1440 × 842) — four pinned notes on a board
 * with dashed connectors and love stickers. Positions / rotations are the
 * exact Figma values (Board 1280 × 498). Below lg the notes stack.
 */
const ICONS = { "user-add": UserAdd, verify: Verify, search: SearchNormal1, lovely: Lovely } as const;

// Figma: Board children (x, y, rotation) — Note 01…04
const NOTE_POS = [
  { x: 40, y: 60, rot: -5 },
  { x: 350, y: 210, rot: 4 },
  { x: 660, y: 50, rot: -3 },
  { x: 970, y: 200, rot: 5 },
];
const STICKERS = [
  { v: "sticker", x: 250, y: 30, s: 64, rot: 14 },
  { v: "outline", x: 600, y: 420, s: 58, rot: -12 },
  { v: "double", x: 1180, y: 120, s: 64, rot: 8 },
  { v: "sparkle", x: 10, y: 380, s: 58, rot: -10 },
  { v: "filled", x: 880, y: 20, s: 61, rot: 18 },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-28 py-16 lg:py-24">
      <div className="container-page flex flex-col gap-12">
        <SectionHeader eyebrow={HOW_IT_WORKS.eyebrow} title={HOW_IT_WORKS.title} description={HOW_IT_WORKS.description} />

        {/* Desktop board: exact Figma coordinates inside a 1280 × 498 canvas */}
        <div className="relative mx-auto hidden h-[498px] w-[1280px] max-w-full lg:block">
          <svg aria-hidden className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 1280 498" fill="none">
            <path d="M290 240 C 320 260, 350 280, 372 300" stroke="var(--rose-300)" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
            <path d="M600 330 C 620 280, 640 220, 690 170" stroke="var(--rose-300)" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
            <path d="M912 210 C 940 240, 960 270, 992 296" stroke="var(--rose-300)" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
          </svg>
          {HOW_IT_WORKS.steps.map((s, i) => (
            <Note key={s.n} step={s} className="absolute" style={{ left: NOTE_POS[i].x, top: NOTE_POS[i].y, transform: `rotate(${NOTE_POS[i].rot}deg)` }} />
          ))}
          {STICKERS.map((st, i) => (
            <LoveSticker key={i} variant={st.v} size={st.s} rotate={st.rot} className="absolute" style={{ left: st.x, top: st.y }} />
          ))}
        </div>

        {/* Tablet / mobile: stacked notes, alternating tilt (Figma: Home — Mobile 390) */}
        <ol className="mx-auto flex w-full max-w-[340px] flex-col gap-10 lg:hidden">
          {HOW_IT_WORKS.steps.map((s, i) => (
            <li key={s.n} className={cn(i % 2 ? "self-end" : "self-start")}>
              <Note step={s} style={{ transform: `rotate(${i % 2 ? 3 : -3}deg)` }} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

type Step = (typeof HOW_IT_WORKS.steps)[number];

/** Figma: Note — 270 × 264, white card, radius xl, pin + tinted panel. */
function Note({ step, className, style }: { step: Step; className?: string; style?: React.CSSProperties }) {
  const Icon = ICONS[step.icon];
  const rose = step.tone === "rose";
  return (
    <div className={cn("w-[270px]", className)} style={style}>
      <div className="relative rounded-xl border border-line bg-surface-card px-3 pb-3 pt-9 shadow-lg">
        {/* Pin */}
        <span aria-hidden className="absolute left-1/2 top-[-8px] h-[40px] w-9 -translate-x-1/2">
          <span className="absolute left-3 top-[30px] h-2 w-[18px] rounded-full bg-rose-950 opacity-25 blur-[2px]" />
          <span
            className="absolute left-[3px] top-0 h-[30px] w-[30px] rounded-full shadow-sm"
            style={{
              background: rose
                ? "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9) 0%, var(--rose-600) 35%, var(--rose-800) 100%)"
                : "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9) 0%, var(--gold-500) 35%, var(--gold-700) 100%)",
            }}
          />
        </span>
        <div className={cn("flex flex-col gap-2.5 rounded-md p-5", rose ? "bg-[linear-gradient(180deg,var(--rose-100),var(--rose-50))]" : "bg-[linear-gradient(180deg,var(--gold-100),var(--gold-50))]")}>
          <div className="flex items-start justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-gradient text-ink-on-brand">
              <Icon size={22} color="currentColor" />
            </span>
            <span className={cn("text-[48px] font-bold leading-[1.2]", rose ? "text-brand" : "text-gold-700")}>{step.n}</span>
          </div>
          {/* note panels are always light (paper), so text uses fixed primitives */}
          <h3 className="text-h5 text-gray-900">{step.title}</h3>
          <p className="text-body-sm text-gray-600">{step.text}</p>
          <span className="w-fit rounded-full bg-white px-2.5 py-1 text-label-sm text-rose-700">{step.pill}</span>
        </div>
      </div>
    </div>
  );
}
