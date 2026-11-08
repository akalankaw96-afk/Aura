"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LanguageSwitch, Logo } from "@/components/ui/Brand";
import { loadDraft } from "@/lib/demo";

/**
 * Figma: Auth Header (Action = Create account / Log in / Avatar)
 * — 🧩 Components → 03 · Navigation. Used on every Login / Registration /
 * Review / Plans screen. Change it here once; every screen updates.
 *
 *  create-account → Login + Forgot password pages ("Register")
 *  login          → Register steps (Account, Verify, Profile, Photos)
 *  avatar         → signed-in screens (Review status, Plans)
 */
export type AuthHeaderAction = "create-account" | "login" | "avatar" | "none";

export function AuthHeader({ action = "none" }: { action?: AuthHeaderAction }) {
  return (
    <header className="container-page relative z-20 flex h-16 items-center justify-between gap-3 md:h-[90px]">
      <Logo height={58} className="max-md:hidden" />
      <Logo height={40} className="md:hidden" />
      <div className="flex items-center gap-3 md:gap-4">
        <LanguageSwitch />
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

/** Figma: Avatar (Size = M, Type = Photo) — 48px. Falls back to the couple illustration. */
function MemberAvatar() {
  const [src, setSrc] = useState("/brand/couple.png");
  const [name, setName] = useState("Your profile");
  useEffect(() => {
    const d = loadDraft();
    if (d.photo) setSrc(d.photo);
    if (d.firstName) setName(d.firstName);
  }, []);
  return (
    <Link href="/register/status" aria-label={`${name} — profile`} className="shrink-0 rounded-full ring-2 ring-white transition-shadow hover:shadow-ring-brand">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-12 w-12 rounded-full bg-brand-subtle object-cover" />
    </Link>
  );
}
