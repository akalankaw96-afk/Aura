"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowDown2,
  CloseCircle,
  Crown,
  Lock1,
  Logout,
  LogoutCurve,
  Setting2,
  ShieldTick,
  TextalignJustifycenter,
  User,
} from "iconsax-react";
import { cn } from "@/lib/cn";
import { ButtonLink } from "@/components/ui/Button";
import { LanguageSwitch, Logo, ThemeToggle } from "@/components/ui/Brand";
import { useLanguage } from "@/context/LanguageContext";
import { MEMBER, MESSAGES, REQUESTS } from "@/content/dashboard";
import { useKyc } from "@/lib/verification";
import { apiService, type AuthSession } from "@/services/api";

/**
 * Figma: Navbar (Style = Light / Style3 / Transparent) + Navbar Mobile.
 * - "light"    (Light): white → rose gradient, bottom border — used on Home (desktop + mobile)
 * - "minimal"  (Style3): same as Light
 * - "glass"    (Transparent): white 65 % + blur, for use on top of a photo
 * - "member"   (Member): signed-in — Dashboard links, notifications bell, account menu.
 * Height 104px desktop (16px padding + 72px logo), 64px mobile.
 */
export type NavbarVariant = "light" | "glass" | "minimal" | "member";

export function Navbar({ variant = "light" }: { variant?: NavbarVariant }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const updateSession = () => {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("aura_session");
        if (raw) {
          try {
            setSession(JSON.parse(raw));
          } catch {
            setSession(null);
          }
        } else {
          setSession(null);
        }
      }
    };

    updateSession();
    window.addEventListener("aura_auth_change", updateSession);
    window.addEventListener("storage", updateSession);
    return () => {
      window.removeEventListener("aura_auth_change", updateSession);
      window.removeEventListener("storage", updateSession);
    };
  }, [pathname]);

  // Hide on scroll down, show again on scroll up (always shown near the top)
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - last;
        setScrolled(y > 8);
        if (y < 120) setHidden(false);
        else if (delta > 6) setHidden(true);
        else if (delta < -6) setHidden(false);
        if (Math.abs(delta) > 6) last = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  // a page change always brings the bar back
  useEffect(() => setHidden(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleLogout = () => {
    apiService.logoutAllDevices();
    setSession(null);
    router.push("/");
  };

  const glass = variant === "glass";
  const isMember = variant === "member" || !!session;

  // unread counts shown next to Requests / Messages (same source as the mobile tab bar)
  const { locked: kycLocked } = useKyc();
  const requestCount = REQUESTS.length;
  const messageCount = MESSAGES.reduce((n, m) => n + m.unread, 0);

  const links: { label: string; href: string; count?: number }[] = isMember
    ? [
        // Figma: Navbar (Style = Member) → Dashboard · Search · Requests · Messages · Plans
        { label: t.nav.dashboard, href: "/dashboard" },
        { label: t.nav.search, href: "/search" },
        { label: t.nav.requests, href: "/requests", count: requestCount },
        { label: t.nav.messages, href: "/messages", count: messageCount },
        { label: t.nav.plans, href: "/plans" },
      ]
    : [
        { label: t.nav.home, href: "/" },
        { label: t.nav.brides, href: "/search?for=bride" },
        { label: t.nav.grooms, href: "/search?for=groom" },
        { label: t.nav.howItWorks, href: "/#how-it-works" },
        { label: t.nav.pricing, href: "/#pricing" },
      ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        hidden && !open && "-translate-y-full",
        scrolled && !hidden && "shadow-md",
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
            const active =
              l.href === "/" || l.href === "/dashboard"
                ? pathname === l.href
                : !l.href.includes("#") && pathname.startsWith(l.href);
            return (
              <Link
                key={l.label}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group inline-flex items-center gap-1.5 text-label-lg transition-colors",
                  glass
                    ? active
                      ? "bg-brand-gradient bg-clip-text text-transparent font-bold"
                      : "text-ink-tertiary hover:text-ink"
                    : active
                    ? "text-brand-text font-bold"
                    : "text-ink-secondary hover:text-ink"
                )}
              >
                {l.label}
                {!!l.count && <NavCount count={l.count} locked={kycLocked} />}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitch surface={glass ? "glass" : "default"} />
          {/* Figma: Navbar (Style = Member) → EN · Theme toggle · Account (no notifications bell) */}
          <ThemeToggle surface={glass ? "glass" : "default"} />

          {isMember ? (
            <AccountMenu session={session} onLogout={handleLogout} />
          ) : (
            // guests: Create New (Secondary) + Login (Primary) — Figma Button S
            <div className="flex items-center gap-2">
              <ButtonLink href="/register" variant={glass ? "white" : "secondary"} size="sm" className="whitespace-nowrap">
                {t.nav.createAccount}
              </ButtonLink>
              <ButtonLink href="/login" size="sm" className="whitespace-nowrap">
                {t.nav.login}
              </ButtonLink>
            </div>
          )}
        </div>

        {/* Figma: Navbar Mobile */}
        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitch surface={glass ? "glass" : "default"} />
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-md",
              glass
                ? "border border-line-glass bg-surface-glass text-ink-on-brand backdrop-blur-[8px]"
                : "bg-brand-gradient text-ink-on-brand"
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
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-md px-3 py-3 text-label-lg text-ink hover:bg-brand-subtle"
              >
                {l.label}
                {!!l.count && <NavCount count={l.count} locked={kycLocked} />}
              </Link>
            ))}
            <div className="mt-4 flex items-center justify-between rounded-md bg-surface-subtle px-3 py-2">
              <span className="text-label-md text-ink-secondary">Theme</span>
              <ThemeToggle />
            </div>

            {isMember ? (
              <div className="mt-4 grid gap-2">
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex h-12 items-center justify-center rounded-full border border-purple-300 bg-purple-50 text-button-md text-purple-900"
                >
                  Staff Admin Panel
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                  className="flex h-12 items-center justify-center rounded-full bg-error-bg text-button-md text-error-fg"
                >
                  {t.nav.logout}
                </button>
              </div>
            ) : (
              <div className="mt-4 grid gap-3">
                <ButtonLink href="/login" fullWidth onClick={() => setOpen(false)}>
                  {t.nav.login}
                </ButtonLink>
                <ButtonLink href="/register" variant="secondary" fullWidth onClick={() => setOpen(false)}>
                  {t.nav.createAccount}
                </ButtonLink>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

/** Unread count chip next to a nav link — brand pill, pops in when the number changes */
function NavCount({ count, locked }: { count: number; locked?: boolean }) {
  // profile under review → these pages are locked: show a lock instead of the count
  if (locked)
    return (
      <span aria-label="Locked until approval" className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-surface-muted text-ink-tertiary">
        <Lock1 size={11} color="currentColor" variant="Bold" />
      </span>
    );
  return (
    <span
      key={count}
      aria-label={`${count} new`}
      className="inline-flex h-5 min-w-5 animate-pop-in items-center justify-center rounded-full bg-brand-gradient px-1.5 text-[11px] font-bold leading-none text-ink-on-brand shadow-xs transition-transform group-hover:scale-110"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/** Figma: Navbar (Style = Member) → Account — avatar + first name + chevron; opens dropdown */
function AccountMenu({ session, onLogout }: { session: AuthSession | null; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const { t, lang } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const fullName = session?.fullName || "Member";
  // Figma: Account pill shows the first name only
  const displayName = fullName.trim().split(" ")[0] || "Member";
  const photo = session?.photoUrl;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-line bg-surface-card py-1 pl-1 pr-3 text-label-md text-ink transition-shadow hover:shadow-md"
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={displayName} className="h-9 w-9 rounded-full object-cover border border-line" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-white font-bold text-xs">
            {displayName[0] || "M"}
          </div>
        )}
        <span className="max-w-[120px] truncate">{displayName}</span>
        <ArrowDown2 size={16} color="currentColor" className={cn("text-icon-brand transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <ul
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 animate-pop-in overflow-hidden rounded-xl border border-line bg-surface-card py-2 shadow-2xl"
        >
          <div className="px-3 py-1.5 border-b border-line mb-1">
            <p className="text-body-sm font-bold text-ink truncate">{fullName}</p>
            <p className="text-caption text-ink-tertiary truncate">{session?.email || "member@auramatrimony.lk"}</p>
          </div>

          <li role="none">
            <Link role="menuitem" href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-body-sm text-ink hover:bg-brand-subtle">
              <User size={18} color="currentColor" className="text-icon-brand" />
              <span>{lang === "si" ? "මගේ පාලක පුවරුව" : "My Dashboard"}</span>
            </Link>
          </li>
          <li role="none">
            <Link role="menuitem" href="/search" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-body-sm text-ink hover:bg-brand-subtle">
              <ShieldTick size={18} color="currentColor" className="text-icon-brand" />
              <span>{lang === "si" ? "යෝජනා සොයන්න" : "Search Proposals"}</span>
            </Link>
          </li>
          <li role="none">
            <Link role="menuitem" href="/plans" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-body-sm text-ink hover:bg-brand-subtle">
              <Crown size={18} color="currentColor" className="text-icon-brand" />
              <span>{lang === "si" ? "මිල සැලසුම්" : "Plans & Billing"}</span>
            </Link>
          </li>
          <li role="none">
            <Link role="menuitem" href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-body-sm text-purple-700 hover:bg-purple-50">
              <ShieldTick size={18} color="currentColor" className="text-purple-600" />
              <span>Staff Admin Portal</span>
            </Link>
          </li>

          <div className="my-1 border-t border-line" />

          <li role="none">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-body-sm text-error-fg hover:bg-error-bg/50"
            >
              <Logout size={18} color="currentColor" />
              <span>{t.nav.logout}</span>
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
