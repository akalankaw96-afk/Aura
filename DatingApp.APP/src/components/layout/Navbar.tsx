"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowDown2, CloseCircle, Logout, Notification, Setting2, TextalignJustifycenter, User } from "iconsax-react";
import { cn } from "@/lib/cn";
import { LanguageSwitch, Logo, ThemeToggle } from "@/components/ui/Brand";
import { NAV_LINKS } from "@/content/home";
import { MEMBER, MEMBER_LINKS } from "@/content/dashboard";

/**
 * Figma: Navbar (Style = Light / Style3 / Transparent) + Navbar Mobile.
 * - "light"    (Light): white → rose gradient, bottom border — used on Home (desktop + mobile)
 * - "minimal"  (Style3): same as Light
 * - "glass"    (Transparent): white 65 % + blur, for use on top of a photo
 * One primary CTA (Figma: Button Primary S): "Create/ Login" on Light, "Register/ Login" on Style3 / Transparent.
 * - "member"   (Member): signed-in — Dashboard links, notifications bell, account menu.
 * Height 104px desktop (16px padding + 72px logo), 64px mobile.
 */
export type NavbarVariant = "light" | "glass" | "minimal" | "member";

/** Label per Figma variant. Goes to Log in, which links on to Register. */
const CTA: Record<NavbarVariant, { label: string; href: string }> = {
  light: { label: "Create/ Login", href: "/login" },
  minimal: { label: "Register/ Login", href: "/login" },
  glass: { label: "Register/ Login", href: "/login" },
  member: { label: "Log out", href: "/" },
};

export function Navbar({ variant = "light" }: { variant?: NavbarVariant }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const glass = variant === "glass";
  const member = variant === "member";
  const cta = CTA[variant];
  const links = member ? MEMBER_LINKS : NAV_LINKS;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b",
        glass
          ? "border-line-glass bg-[rgb(255_255_255/0.65)] backdrop-blur-[16px] dark:bg-[rgb(14_16_19/0.65)]"
          : "border-line bg-[linear-gradient(90deg,var(--color-surface-card),var(--rose-100))] dark:bg-[linear-gradient(90deg,var(--color-surface-card),var(--color-bg-brand-subtle))]"
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-[104px]">
        <Logo height={72} className="hidden lg:inline-flex" />
        <Logo height={44} className="lg:hidden" />

        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
          {links.map((l) => {
            const active = l.href === "/" || l.href === "/dashboard" ? pathname === l.href : !l.href.includes("#") && pathname.startsWith(l.href);
            return (
              <Link
                key={l.label}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-label-lg transition-colors",
                  glass ? (active ? "bg-brand-gradient bg-clip-text text-transparent" : "text-ink-tertiary hover:text-ink") : active ? "text-brand-text" : "text-ink-secondary hover:text-ink"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitch surface={glass ? "glass" : "default"} />
          {member ? (
            <>
              <NotificationButton />
              <AccountMenu />
            </>
          ) : (
            <>
              <ThemeToggle surface={glass ? "glass" : "default"} />
              <Link href={cta.href} className="flex h-[41px] items-center whitespace-nowrap rounded-full bg-brand-gradient px-4 text-button-sm text-ink-on-brand transition-shadow hover:shadow-glow">
                {cta.label}
              </Link>
            </>
          )}
        </div>

        {/* Figma: Navbar Mobile */}
        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitch surface={glass ? "glass" : "default"} />
          {member && <NotificationButton />}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-md",
              glass ? "border border-line-glass bg-surface-glass text-ink-on-brand backdrop-blur-[8px]" : "bg-brand-gradient text-ink-on-brand"
            )}
          >
            {open ? <CloseCircle size={22} color="currentColor" /> : <TextalignJustifycenter size={22} color="currentColor" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-40 animate-fade-up overflow-y-auto bg-surface-card lg:hidden">
          <nav aria-label="Mobile" className="container-page flex flex-col gap-1 py-6">
            {links.map((l) => (
              <Link key={l.label} href={l.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-label-lg text-ink hover:bg-brand-subtle">
                {l.label}
              </Link>
            ))}
            <div className="mt-4 flex items-center justify-between rounded-md bg-surface-subtle px-3 py-2">
              <span className="text-label-md text-ink-secondary">Theme</span>
              <ThemeToggle />
            </div>
            <Link
              href={cta.href}
              onClick={() => setOpen(false)}
              className={cn(
                "mt-4 flex h-14 items-center justify-center rounded-full text-button-lg",
                member ? "bg-brand-subtle text-brand-text ring-1 ring-inset ring-brand" : "bg-brand-gradient text-ink-on-brand"
              )}
            >
              {cta.label}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

/** Figma: Navbar (Style = Member) → Notifications — 40px round, brand-subtle, unread dot */
function NotificationButton() {
  return (
    <Link href="/dashboard#requests" aria-label="Notifications, 3 new" className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-icon-brand transition-transform hover:scale-105">
      <Notification size={20} color="currentColor" />
      <span aria-hidden className="absolute right-[5px] top-[6px] h-2.5 w-2.5 rounded-full border-2 border-surface-card bg-brand" />
    </Link>
  );
}

/** Figma: Navbar (Style = Member) → Account — avatar 36 + first name + chevron; opens a small menu */
function AccountMenu() {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const items = [
    { label: "My profile", href: "/register", Icon: User },
    { label: "Settings", href: "/dashboard", Icon: Setting2 },
    { label: "Log out", href: "/", Icon: Logout },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-line bg-surface-card py-1 pl-1 pr-3 text-label-md text-ink transition-shadow hover:shadow-md"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MEMBER.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
        {MEMBER.firstName}
        <ArrowDown2 size={16} color="currentColor" className={cn("text-icon-brand transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul role="menu" className="absolute right-0 top-[calc(100%+8px)] z-40 w-48 animate-pop-in overflow-hidden rounded-md border border-line bg-surface-card py-1 shadow-lg">
          {items.map(({ label, href, Icon }) => (
            <li key={label} role="none">
              <Link role="menuitem" href={href} onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-body-sm text-ink hover:bg-brand-subtle">
                <Icon size={18} color="currentColor" className="text-icon-brand" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
