"use client";

import React from "react";
import { Heart, ShieldTick, Verify } from "iconsax-react";
import { cn } from "@/lib/cn";
import { HeartPattern, LoveScene } from "@/components/ui/Decor";
import { LanguageSwitch, Logo } from "@/components/ui/Brand";

/**
 * Page frame shared by every Login / Registration screen (Figma: Header,
 * Body, Love Scene). `right` fills the right side of the header.
 */
export interface AuthShellProps {
  right?: React.ReactNode;
  showTrust?: boolean;
  wide?: boolean; // for Plans page
  embedded?: boolean; // inside a modal: no header/background
  children: React.ReactNode;
}

export function AuthShell({ right, showTrust, wide, embedded, children }: AuthShellProps) {
  if (embedded) return <div className="flex flex-col items-center gap-6 bg-brand-soft p-4 sm:p-6">{children}</div>;

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-brand-soft">
      <HeartPattern />
      <header className="container-page relative z-20 flex h-16 items-center justify-between gap-3 md:h-[90px]">
        <Logo height={58} className="max-md:hidden" />
        <Logo height={40} className="md:hidden" />
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitch />
          {right}
        </div>
      </header>

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
