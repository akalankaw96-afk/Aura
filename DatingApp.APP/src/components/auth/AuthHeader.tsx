"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown2 } from "iconsax-react";
import { LanguageSwitch, Logo, ThemeToggle } from "@/components/ui/Brand";
import { loadDraft } from "@/lib/demo";

/**
 * Figma: Auth Header (Action = Create account / Log in / Avatar)
 * — 🧩 Components → 03 · Navigation. Used on every Login / Registration /
 * Review / Plans screen. Change it here once; every screen updates.
 *
 *  create-account → Login + Forgot password pages ("Register")
 *  login          → Register steps (Account, Verify, Profile, Photos)
 *  avatar         → signed-in screens (Review status, Plans)
 * Right side (Figma): EN · Theme toggle · Register / Login / Account pill.
 */
export type AuthHeaderAction = "create-account" | "login" | "avatar" | "none";

export function AuthHeader({ action = "none" }: { action?: AuthHeaderAction }) {
  return (
    <header className="container-page relative z-20 flex h-16 items-center justify-between gap-3 md:h-[90px]">
      <Logo height={58} className="max-md:hidden" />
      <Logo height={40} className="md:hidden" />
      <div className="flex items-center gap-3 md:gap-4">
        <LanguageSwitch />
        <ThemeToggle />
        {/* Figma: Button Primary S — "Register" on Log in pages, "Login" on Register pages */}
        {action === "create-account" && <HeaderButton href="/register">Register</HeaderButton>}
        {action === "login" && <HeaderButton href="/login">Login</HeaderButton>}
        {action === "avatar" && <MemberAvatar />}
      </div>
    </header>
  );
}

/** Figma: Button (Style = Primary, Size = S) */
function HeaderButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex h-[41px] items-center whitespace-nowrap rounded-full bg-brand-gradient px-4 text-button-sm text-ink-on-brand transition-shadow hover:shadow-glow">
      {children}
    </Link>
  );
}

/** Figma: Account pill — avatar 36px + first name + chevron (same as the member Navbar). Falls back to the couple illustration. */
function MemberAvatar() {
  const [src, setSrc] = useState("/brand/couple.png");
  const [name, setName] = useState("Your profile");
  useEffect(() => {
    const d = loadDraft();
    if (d.photo) setSrc(d.photo);
    if (d.firstName) setName(d.firstName);
  }, []);
  return (
    <Link
      href="/register/status"
      aria-label={`${name} — profile`}
      className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface-card py-1 pl-1 pr-3 text-label-md text-ink transition-shadow hover:shadow-md"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-9 w-9 rounded-full bg-brand-subtle object-cover" />
      <span className="max-w-[110px] truncate max-sm:hidden">{name}</span>
      <ArrowDown2 size={16} color="currentColor" className="text-icon-brand max-sm:hidden" />
    </Link>
  );
}
