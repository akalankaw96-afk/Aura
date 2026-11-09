"use client";

import React from "react";
import { Heart, ShieldTick, Verify } from "iconsax-react";
import { cn } from "@/lib/cn";
import { HeartPattern, LoveScene } from "@/components/ui/Decor";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AuthHeader, type AuthHeaderAction } from "./AuthHeader";

/**
 * Page frame shared by every Login / Registration screen
 * (Figma: Auth Header + Body + Love Scene).
 */
export interface AuthShellProps {
  /** Which Auth Header variant to show (Figma: Auth Header · Action) */
  action?: AuthHeaderAction;
  showTrust?: boolean;
  wide?: boolean; // for Plans page
  embedded?: boolean; // inside a modal: no header/background
  /** "member": signed-in page (Plans) — same Member Navbar + Footer as every member page */
  frame?: "auth" | "member";
  children: React.ReactNode;
}

export function AuthShell({ action = "none", showTrust, wide, embedded, frame = "auth", children }: AuthShellProps) {
  if (embedded) return <div className="flex flex-col items-center gap-6 bg-brand-soft p-4 sm:p-6">{children}</div>;

  if (frame === "member") {
    return (
      <div className="relative isolate flex min-h-screen flex-col bg-page-gradient">
        <HeartPattern className="-z-10" />
        <Navbar variant="member" />
        <main className={cn("relative z-10 mx-auto flex w-full flex-1 flex-col items-center gap-8 px-4 pb-16 pt-6 lg:pt-8", wide ? "max-w-[1136px]" : "max-w-[712px]")}>
          {children}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-brand-soft">
      <HeartPattern />
      <AuthHeader action={action} />

      <main className={cn("relative z-10 mx-auto flex w-full flex-1 flex-col items-center gap-8 px-4 pb-12 pt-6", wide ? "max-w-[1136px]" : "max-w-[712px]")}>
        {children}
        {showTrust && <TrustRow />}
      </main>

      <LoveScene className="relative z-0" />
    </div>
  );
}

/** Figma: the three trust badges under the login card. */
export function TrustRow() {
  const items = [
    { Icon: Verify, label: "Verified profiles", cls: "bg-success-bg text-success-fg" },
    { Icon: ShieldTick, label: "Private by default", cls: "bg-info-bg text-info-fg" },
    { Icon: Heart, label: "Made in Sri Lanka", cls: "bg-brand-subtle text-brand" },
  ];
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {items.map(({ Icon, label, cls }) => (
        <span key={label} className={cn("inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-body-xs font-semibold", cls)}>
          <Icon size={14} color="currentColor" />
          {label}
        </span>
      ))}
    </div>
  );
}
