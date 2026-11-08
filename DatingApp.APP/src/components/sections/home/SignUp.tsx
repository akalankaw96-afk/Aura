"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight2, Heart, TickCircle } from "iconsax-react";
import { Input } from "@/components/ui/Input";
import { flashToast } from "@/components/ui/Toast";
import { saveDraft } from "@/lib/demo";
import { SIGN_UP } from "@/content/home";

/**
 * Figma: 08 Sign up — CTA band (1280 × 749, padding 80, radius 2xl,
 * Gradient/Brand) with the Heart pattern decor, copy on the left and the
 * Sign-up Form (560 × 589, padding 40, gap 24, radius xl) on the right.
 */

// Figma: Heart pattern children — [x, y, size, opacity, rotation] in a 1280 × 749 band
const HEARTS: [number, number, number, number, number][] = [
  [60, 90, 56, 0.22, -18], [230, 40, 28, 0.18, 12], [470, 110, 22, 0.14, -8], [590, 30, 40, 0.12, 20],
  [40, 330, 26, 0.16, 10], [150, 560, 64, 0.2, -14], [380, 640, 30, 0.14, 16], [560, 520, 20, 0.12, -20],
  [1180, 60, 48, 0.2, 18], [1060, 170, 24, 0.14, -10], [1200, 330, 30, 0.16, -6], [1130, 620, 58, 0.2, 14],
  [930, 690, 26, 0.14, -16], [760, 60, 18, 0.1, 8], [700, 690, 40, 0.12, -10], [320, 250, 16, 0.1, 0],
];
const DOTS: [number, number][] = [[300, 170], [520, 300], [1000, 90], [880, 560], [200, 450], [650, 600], [1240, 480], [420, 40]];

export function SignUp() {
  const router = useRouter();
  const [f, setF] = useState({ first: "", last: "", email: "", mobile: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof f, string>>>({});

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF((s) => ({ ...s, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: typeof errors = {};
    if (!f.first.trim()) er.first = "Enter your first name";
    if (!f.last.trim()) er.last = "Enter your last name";
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) er.email = "Enter a valid email address";
    const digits = f.mobile.replace(/\D/g, "").replace(/^94/, "").replace(/^0/, "");
    if (!/^7\d{8}$/.test(digits)) er.mobile = "Enter a valid Sri Lankan mobile number";
    setErrors(er);
    if (Object.keys(er).length) return;
    saveDraft({ firstName: f.first.trim(), lastName: f.last.trim(), fullName: `${f.first.trim()} ${f.last.trim()}`, email: f.email.trim(), mobile: digits });
    flashToast("success", "Great start!", "Create a password to finish your free account.");
    router.push("/register");
  };

  return (
    <section id="sign-up" className="scroll-mt-28 py-16 lg:py-24">
      <div className="container-page">
        <div className="reveal-zoom relative isolate grid items-center gap-10 overflow-hidden rounded-2xl bg-brand-gradient p-6 sm:p-10 lg:grid-cols-[1fr_560px] lg:gap-0 lg:p-20">
          {/* decor */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <span className="absolute -left-40 -top-[200px] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.22),rgba(255,255,255,0)_70%)]" />
            <span className="absolute left-[64%] top-[51%] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.14),rgba(255,255,255,0)_70%)]" />
            {HEARTS.map(([x, y, s, o, r], i) => (
              <Heart key={i} size={s} color="currentColor" className="absolute text-white" style={{ left: `${(x / 1280) * 100}%`, top: `${(y / 749) * 100}%`, opacity: o, transform: `rotate(${r}deg)` }} />
            ))}
            {DOTS.map(([x, y], i) => (
              <span key={i} className="absolute h-1.5 w-1.5 rounded-full bg-white opacity-25" style={{ left: `${(x / 1280) * 100}%`, top: `${(y / 749) * 100}%` }} />
            ))}
          </div>

          <div className="flex max-w-[520px] flex-col gap-5 text-ink-on-brand">
            <p className="text-overline uppercase">{SIGN_UP.eyebrow}</p>
            <h2 className="text-h2 lg:text-display-lg">{SIGN_UP.title}</h2>
            <p className="text-body-md lg:text-body-lg">{SIGN_UP.body}</p>
            <ul className="reveal-stagger flex flex-col gap-5">
              {SIGN_UP.benefits.map((b) => (
                <li key={b} className="flex items-center gap-2 text-body-md font-semibold">
                  <TickCircle size={20} color="currentColor" /> {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Figma: Sign-up Form */}
          <form onSubmit={submit} noValidate className="flex flex-col gap-6 rounded-xl border border-line bg-surface-card p-6 text-ink shadow-xl sm:p-10">
            <div className="flex flex-col gap-2">
              <h3 className="text-h3">{SIGN_UP.form.title}</h3>
              <p className="text-body-md text-ink-secondary">{SIGN_UP.form.subtitle}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="First name" placeholder="e.g. Nethmi" value={f.first} onChange={set("first")} error={errors.first} autoComplete="given-name" />
              <Input label="Last name" placeholder="e.g. Perera" value={f.last} onChange={set("last")} error={errors.last} autoComplete="family-name" />
            </div>
            <Input label="Email" type="email" placeholder="you@example.com" value={f.email} onChange={set("email")} error={errors.email} autoComplete="email" />
            <Input label="Mobile number" type="tel" inputMode="tel" placeholder="+94 7X XXX XXXX" value={f.mobile} onChange={set("mobile")} error={errors.mobile} autoComplete="tel" />
            <button type="submit" className="flex h-14 items-center justify-center gap-3 rounded-full bg-brand-gradient px-8 text-button-lg text-ink-on-brand transition-shadow hover:shadow-glow">
              {SIGN_UP.form.cta} <ArrowRight2 size={24} color="currentColor" />
            </button>
            <p className="text-center text-caption text-ink-tertiary">{SIGN_UP.form.legal}</p>
          </form>
        </div>
      </div>
    </section>
  );
}
