"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CloseCircle, HambergerMenu, User, LogoutCurve, Crown, ShieldTick, ArrowDown2 } from "iconsax-react";
import { cn } from "@/lib/cn";
import { LanguageSwitch, Logo, ThemeToggle } from "@/components/ui/Brand";
import { NAV_LINKS } from "@/content/home";
import { apiService, type AuthSession } from "@/services/api";

/**
 * Figma: Navbar (Style = Light / Transparent) + Navbar Mobile.
 * - variant "glass": white 65 % + blur, sits on top of the hero photo
 * - variant "light": solid surface with bottom border (all other pages)
 * Height 104px desktop (16px padding + 72px logo), 64px mobile.
 */
export function Navbar({ variant = "light" }: { variant?: "light" | "glass" }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Read session on mount safely
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("aura_session");
      if (raw) {
        try {
          setSession(JSON.parse(raw));
        } catch {
          setSession(null);
        }
      }
    }
  }, [pathname]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleLogout = () => {
    apiService.logoutAllDevices();
    setSession(null);
    setUserDropdown(false);
    router.push("/");
  };

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
                className={cn("text-label-lg transition-colors", active ? "bg-brand-gradient bg-clip-text text-transparent font-bold" : "text-ink-tertiary hover:text-ink")}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitch surface={glass ? "glass" : "default"} />
          <ThemeToggle surface={glass ? "glass" : "default"} />

          {session ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdown(!userDropdown)}
                className="flex h-[43px] items-center gap-2 rounded-full border border-line bg-surface-card px-3 text-button-sm text-ink hover:border-brand-focus transition-all shadow-sm"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-gradient text-white text-xs font-bold">
                  {session.fullName ? session.fullName[0].toUpperCase() : "U"}
                </div>
                <span className="max-w-[130px] truncate font-semibold text-body-sm">
                  {session.fullName || "My Account"}
                </span>
                <ArrowDown2 size={16} color="currentColor" className={cn("transition-transform text-ink-tertiary", userDropdown && "rotate-180")} />
              </button>

              {userDropdown && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-line bg-surface-card p-2 shadow-2xl z-50 animate-fade-up">
                  <div className="px-3 py-2 border-b border-line mb-1">
                    <p className="text-body-sm font-bold text-ink truncate">{session.fullName}</p>
                    <p className="text-caption text-ink-tertiary truncate">{session.email}</p>
                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-gold-600 dark:text-gold-400 bg-gold-50 dark:bg-gold-950/40 px-2 py-0.5 rounded-full">
                      <Crown size={12} color="currentColor" /> {session.role || "Member"}
                    </span>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setUserDropdown(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-body-sm text-ink hover:bg-brand-subtle transition-colors"
                  >
                    <User size={18} color="currentColor" className="text-icon-brand" />
                    <span>My Dashboard</span>
                  </Link>

                  <Link
                    href="/search"
                    onClick={() => setUserDropdown(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-body-sm text-ink hover:bg-brand-subtle transition-colors"
                  >
                    <ShieldTick size={18} color="currentColor" className="text-icon-brand" />
                    <span>Search Proposals</span>
                  </Link>

                  <Link
                    href="/plans"
                    onClick={() => setUserDropdown(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-body-sm text-ink hover:bg-brand-subtle transition-colors"
                  >
                    <Crown size={18} color="currentColor" className="text-icon-brand" />
                    <span>Plans & Billing</span>
                  </Link>

                  <Link
                    href="/admin"
                    onClick={() => setUserDropdown(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-body-sm text-ink hover:bg-brand-subtle transition-colors"
                  >
                    <ShieldTick size={18} color="currentColor" className="text-purple-600" />
                    <span>Staff Admin Panel</span>
                  </Link>

                  <div className="my-1 border-t border-line" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-body-sm text-error-fg hover:bg-error-bg/50 transition-colors"
                  >
                    <LogoutCurve size={18} color="currentColor" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}

              <Link
                href="/dashboard"
                className="ml-2 flex h-[41px] items-center rounded-full bg-brand-gradient px-4 text-button-sm text-ink-on-brand transition-shadow hover:shadow-glow"
              >
                Dashboard
              </Link>
            </div>
          ) : (
            <>
              <Link href="/login" className="flex h-[41px] items-center rounded-full bg-brand-subtle px-4 text-button-sm text-brand-text transition-shadow hover:ring-1 hover:ring-inset hover:ring-brand">
                Log in
              </Link>
              <Link href="/register" className="flex h-[41px] items-center rounded-full bg-brand-gradient px-4 text-button-sm text-ink-on-brand transition-shadow hover:shadow-glow">
                Post a proposal free
              </Link>
            </>
          )}
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
              {session ? (
                <>
                  <Link href="/dashboard" onClick={() => setOpen(false)} className="flex h-14 items-center justify-center rounded-full bg-brand-gradient text-button-lg text-ink-on-brand">
                    My Dashboard ({session.fullName || "Account"})
                  </Link>
                  <Link href="/search" onClick={() => setOpen(false)} className="flex h-12 items-center justify-center rounded-full border border-line bg-surface-card text-button-md text-ink">
                    Browse All Proposals
                  </Link>
                  <Link href="/plans" onClick={() => setOpen(false)} className="flex h-12 items-center justify-center rounded-full border border-line bg-surface-card text-button-md text-ink">
                    Plans & Billing
                  </Link>
                  <Link href="/admin" onClick={() => setOpen(false)} className="flex h-12 items-center justify-center rounded-full border border-purple-300 bg-purple-50 text-button-md text-purple-900">
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
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="flex h-14 items-center justify-center rounded-full bg-brand-subtle text-button-lg text-brand-text">
                    Log in
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)} className="flex h-14 items-center justify-center rounded-full bg-brand-gradient text-button-lg text-ink-on-brand">
                    Post a proposal free
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
