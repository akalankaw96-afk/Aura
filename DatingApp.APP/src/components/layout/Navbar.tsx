"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CloseCircle, HambergerMenu } from "iconsax-react";
import { cn } from "@/lib/cn";
import { LanguageSwitch, Logo, ThemeToggle } from "@/components/ui/Brand";
import { NAV_LINKS } from "@/content/home";

/**
 * Figma: Navbar (Style = Light / Transparent) + Navbar Mobile.
 * - variant "glass": white 65 % + blur, sits on top of the hero photo
 * - variant "light": solid surface with bottom border (all other pages)
 * Height 104px desktop (16px padding + 72px logo), 64px mobile.
 */
export function Navbar({ variant = "light" }: { variant?: "light" | "glass" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const glass = variant === "glass";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b",
        glass ? "border-line-glass bg-[rgb(255_255_255/0.65)] backdrop-blur-[16px] dark:bg-[rgb(14_16_19/0.65)]" : "border-line bg-surface-card"
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-[104px]">
        <Logo height={72} className="hidden lg:inline-flex" />
        <Logo height={44} className="lg:hidden" />

        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.label}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn("text-label-lg transition-colors", active ? "bg-brand-gradient bg-clip-text text-transparent" : "text-ink-tertiary hover:text-ink")}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitch surface={glass ? "glass" : "default"} />
          <ThemeToggle surface={glass ? "glass" : "default"} />
          <Link href="/login" className="flex h-[41px] items-center rounded-full bg-brand-subtle px-4 text-button-sm text-brand-text transition-shadow hover:ring-1 hover:ring-inset hover:ring-brand">
            Log in
          </Link>
          <Link href="/register" className="flex h-[41px] items-center rounded-full bg-brand-gradient px-4 text-button-sm text-ink-on-brand transition-shadow hover:shadow-glow">
            Post a proposal free
          </Link>
        </div>

        {/* Figma: Navbar Mobile */}
        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitch />
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="flex h-[41px] w-[41px] items-center justify-center rounded-md border border-line-strong bg-surface-card text-ink"
          >
            {open ? <CloseCircle size={22} color="currentColor" /> : <HambergerMenu size={22} color="currentColor" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-40 animate-fade-up overflow-y-auto bg-surface-card lg:hidden">
          <nav aria-label="Mobile" className="container-page flex flex-col gap-1 py-6">
            {NAV_LINKS.map((l) => (
              <Link key={l.label} href={l.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-label-lg text-ink hover:bg-brand-subtle">
                {l.label}
              </Link>
            ))}
            <div className="mt-4 flex items-center justify-between rounded-md bg-surface-subtle px-3 py-2">
              <span className="text-label-md text-ink-secondary">Theme</span>
              <ThemeToggle />
            </div>
            <div className="mt-4 grid gap-3">
              <Link href="/login" onClick={() => setOpen(false)} className="flex h-14 items-center justify-center rounded-full bg-brand-subtle text-button-lg text-brand-text">
                Log in
              </Link>
              <Link href="/register" onClick={() => setOpen(false)} className="flex h-14 items-center justify-center rounded-full bg-brand-gradient text-button-lg text-ink-on-brand">
                Post a proposal free
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
