"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowDown2,
  Category2,
  CloseSquare,
  Gallery,
  Global,
  HambergerMenu,
  Logout,
  People,
  ProfileTick,
  SecurityUser,
} from "iconsax-react";
import { cn } from "@/lib/cn";
import { LanguageSwitch, Logo, ThemeToggle } from "@/components/ui/Brand";
import { useAuthSession } from "@/lib/session";
import { apiService } from "@/services/api";
import { getQueue } from "@/lib/staff";

/**
 * Staff back office shell (/admin/*): left sidebar menu + slim top bar (logo, language, light/dark,
 * profile). No marketing navbar or footer. Phones/tablets: the sidebar becomes a drawer.
 * Admin-only items (Roles & staff) are hidden from moderators; the API checks every call again.
 */
type Ctx = { isAdmin: boolean; queueCount: number | null; refreshCounts: () => void };
const AdminCtx = createContext<Ctx>({ isAdmin: false, queueCount: null, refreshCounts: () => {} });
export const useAdmin = () => useContext(AdminCtx);

const NAV = [
  { href: "/admin", label: "Dashboard", Icon: Category2, admin: false },
  { href: "/admin/reviews", label: "Profile reviews", Icon: ProfileTick, admin: false, count: true },
  { href: "/admin/photos", label: "New photos", Icon: Gallery, admin: false },
  { href: "/admin/users", label: "Members", Icon: People, admin: false },
  { href: "/admin/roles", label: "Roles & staff", Icon: SecurityUser, admin: true },
];

export function AdminShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const { session, loading } = useAuthSession();
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [queueCount, setQueueCount] = useState<number | null>(null);
  const role = session?.role;
  const isAdmin = role === "Admin";

  const refreshCounts = useCallback(() => {
    getQueue()
      .then((q) => setQueueCount(q.length))
      .catch(() => setQueueCount(null));
  }, []);
  useEffect(() => {
    if (role === "Admin" || role === "Moderator") refreshCounts();
  }, [role, refreshCounts]);
  useEffect(() => setDrawer(false), [pathname]);
  const ctx = useMemo(() => ({ isAdmin, queueCount, refreshCounts }), [isAdmin, queueCount, refreshCounts]);

  if (loading || (role !== "Admin" && role !== "Moderator")) return null;

  const items = NAV.filter((n) => !n.admin || isAdmin);
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const sidebar = (
    <nav aria-label="Staff menu" className="flex h-full flex-col gap-1 p-4">
      <p className="px-3 pb-2 pt-1 text-overline uppercase text-ink-tertiary">Manage</p>
      {items.map(({ href, label, Icon, count }) => {
        const on = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-md px-3 py-2.5 text-label-lg transition-colors",
              on ? "bg-brand-gradient text-ink-on-brand shadow-sm" : "text-ink-secondary hover:bg-brand-subtle hover:text-ink",
            )}
          >
            <Icon size={20} color="currentColor" variant={on ? "Bold" : "Linear"} className={on ? "" : "text-icon-brand"} />
            <span className="flex-1">{label}</span>
            {count && queueCount ? (
              <span className={cn("min-w-6 rounded-full px-1.5 text-center text-label-sm", on ? "bg-white/25 text-white" : "bg-brand text-ink-on-brand")}>
                {queueCount}
              </span>
            ) : null}
          </Link>
        );
      })}
      <div className="mt-auto flex flex-col gap-1 border-t border-line pt-4">
        <Link href="/" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-label-md text-ink-secondary hover:bg-surface-subtle hover:text-ink">
          <Global size={18} color="currentColor" /> View website
        </Link>
      </div>
    </nav>
  );

  return (
    <AdminCtx.Provider value={ctx}>
      <div className="min-h-screen bg-surface-subtle">
        {/* top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-line bg-surface-card/90 px-4 backdrop-blur lg:px-6">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Open staff menu"
            className="flex h-10 w-10 items-center justify-center rounded-md text-ink hover:bg-surface-subtle lg:hidden"
          >
            <HambergerMenu size={22} color="currentColor" />
          </button>
          <Link href="/admin" className="flex items-center gap-3" aria-label="Staff dashboard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo.png" alt="Vikasitha" style={{ height: 40, width: (40 * 122) / 72 }} />
            <span className="hidden h-6 items-center rounded-full bg-brand-subtle px-2.5 text-label-sm text-brand-text sm:inline-flex">Staff area</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitch />
            <ThemeToggle />
            <ProfileMenu name={session?.fullName || "Staff"} role={role ?? ""} />
          </div>
        </header>

        <div className="flex">
          {/* desktop sidebar */}
          <div className="hidden w-[260px] shrink-0 border-r border-line bg-surface-card lg:block">
            <aside className="sticky top-16 h-[calc(100dvh-4rem)]">{sidebar}</aside>
          </div>

          {/* phone / tablet drawer */}
          {drawer && <StaffDrawer onClose={() => setDrawer(false)}>{sidebar}</StaffDrawer>}

          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AdminCtx.Provider>
  );
}

/** Phone / tablet menu: native modal <dialog> (focus trap, Esc to close) sliding in from the left. */
function StaffDrawer({ onClose, children }: Readonly<{ onClose: () => void; children: React.ReactNode }>) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label="Staff menu"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-black/45 lg:hidden"
    >
      <button type="button" tabIndex={-1} aria-hidden="true" className="absolute inset-0 cursor-default" onClick={onClose} />
      <aside className="absolute inset-y-0 left-0 flex w-[280px] animate-fade-up flex-col bg-surface-card shadow-xl">
        <div className="flex h-16 items-center justify-between border-b border-line px-4">
          <Logo height={36} />
          <button type="button" onClick={onClose} aria-label="Close menu" className="rounded-md p-1 text-ink-tertiary hover:text-ink">
            <CloseSquare size={24} color="currentColor" />
          </button>
        </div>
        {children}
      </aside>
    </dialog>
  );
}

function ProfileMenu({ name, role }: Readonly<{ name: string; role: string }>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
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
  const initial = name.trim()[0]?.toUpperCase() || "S";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-10 items-center gap-2 rounded-full border border-line bg-surface-card pl-1 pr-2.5 hover:border-line-strong"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-label-md text-ink-on-brand">{initial}</span>
        <span className="hidden text-left sm:block">
          <span className="block max-w-[140px] truncate text-label-md leading-tight text-ink">{name}</span>
          <span className="block text-caption leading-tight text-ink-tertiary">{role}</span>
        </span>
        <ArrowDown2 size={16} color="currentColor" className={cn("text-ink-tertiary transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-lg border border-line bg-surface-card py-1 shadow-lg">
          <div className="border-b border-line px-3 py-2">
            <p className="truncate text-label-md text-ink">{name}</p>
            <p className="text-caption text-ink-tertiary">Signed in as {role}</p>
          </div>
          <Link role="menuitem" href="/dashboard" className="flex items-center gap-2.5 px-3 py-2 text-body-sm text-ink hover:bg-brand-subtle">
            <Global size={18} color="currentColor" className="text-icon-brand" /> Member view
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              apiService.logoutAllDevices();
              window.location.assign("/login");
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-body-sm text-error-fg hover:bg-error-bg"
          >
            <Logout size={18} color="currentColor" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

/** Page title row used by every admin page. */
export function AdminPageHeader({ title, subtitle, actions }: Readonly<{ title: string; subtitle?: string; actions?: React.ReactNode }>) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-h3 text-ink">{title}</h1>
        {subtitle && <p className="text-body-md text-ink-secondary">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Small banner shown when a page runs on dev demo data. */
export function DemoBanner({ show }: Readonly<{ show: boolean }>) {
  if (!show) return null;
  return (
    <output className="mb-5 flex items-start gap-2 rounded-md border border-warning-line bg-warning-bg px-4 py-3 text-body-sm text-warning-fg">
      <b className="font-semibold">Demo data.</b> The server doesn’t have this endpoint yet, so you’re seeing sample data (development only). Nothing you do here changes real accounts.
    </output>
  );
}
