"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Element3, Lock1, Messages2, Profile2User, SearchNormal1 } from "iconsax-react";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/context/LanguageContext";
import { useSignedIn } from "@/lib/session";
import { MESSAGES, REQUESTS } from "@/content/dashboard";
import { useKyc } from "@/lib/verification";

/** Public / auth pages never show the member tab bar */
const HIDDEN_ON = [/^\/$/, /^\/login/, /^\/register/, /^\/forgot-password/, /^\/admin/, /^\/components/];

/**
 * Mobile Tab Bar — app-style navigation for signed-in members on phones/tablets (< lg).
 * Floats 12px above the bottom edge (respects the iPhone home indicator):
 * frosted white pill, radius 24, Shadow/XL. Four tabs — Dashboard · Search · Friends · Messages —
 * icon + label. The active tab sits on a Gradient/Brand pad that slides between tabs;
 * its icon switches to the Bold style. Requests / Messages show unread count badges.
 */
export function MobileTabBar() {
  const pathname = usePathname() || "/";
  const signedIn = useSignedIn();
  const { t } = useLanguage();
  const { locked } = useKyc();
  const navRef = useRef<HTMLDivElement>(null);
  const [pad, setPad] = useState<{ left: number; width: number } | null>(null);

  const unreadMessages = MESSAGES.reduce((n, m) => n + m.unread, 0);
  const tabs = [
    { href: "/dashboard", label: t.nav.dashboard, Icon: Element3, badge: 0 },
    { href: "/search", label: t.nav.search, Icon: SearchNormal1, badge: 0 },
    { href: "/friends", label: t.nav.requests, Icon: Profile2User, badge: REQUESTS.length, needsApproval: true },
    { href: "/messages", label: t.nav.messages, Icon: Messages2, badge: unreadMessages, needsApproval: true },
  ];
  const activeIndex = tabs.findIndex((tab) => pathname.startsWith(tab.href));
  const hidden = !signedIn || HIDDEN_ON.some((r) => r.test(pathname));

  // measure the active tab so the brand pad can slide to it
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav || activeIndex < 0) return setPad(null);
    const measure = () => {
      const el = nav.querySelectorAll<HTMLElement>("[data-tab]")[activeIndex];
      if (el) setPad({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeIndex, hidden, t]);

  if (hidden) return null;

  return (
    <>
      {/* spacer (footer colour — every member page ends with the Footer) so content can scroll clear of the bar */}
      <div aria-hidden className="h-[calc(96px+env(safe-area-inset-bottom))] bg-gray-900 lg:hidden" />

      <nav
        aria-label="Member"
        className="tabbar-in fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))] z-40 mx-auto max-w-[460px] lg:hidden"
      >
        <div
          ref={navRef}
          className="relative flex h-[68px] items-stretch rounded-[24px] border border-line bg-[rgb(255_255_255/0.86)] p-1.5 shadow-xl backdrop-blur-[18px] dark:bg-[rgb(26_29_33/0.86)]"
        >
          {/* sliding active pad */}
          {pad && (
            <span
              aria-hidden
              className="absolute top-1.5 h-[calc(100%-12px)] rounded-[18px] bg-brand-subtle transition-[left,width] duration-500 [transition-timing-function:cubic-bezier(0.34,1.4,0.64,1)]"
              style={{ left: pad.left, width: pad.width }}
            />
          )}

          {tabs.map(({ href, label, Icon, badge, needsApproval }, i) => {
            const active = i === activeIndex;
            const lockedTab = locked && !!needsApproval;
            return (
              <Link
                key={href}
                href={href}
                data-tab
                aria-current={active ? "page" : undefined}
                className="group relative flex flex-1 flex-col items-center justify-center gap-1 rounded-[18px] transition-transform duration-150 active:scale-90"
              >
                <span
                  className={cn(
                    "relative flex h-8 w-11 items-center justify-center rounded-full transition-all duration-300",
                    active ? "bg-brand-gradient text-ink-on-brand shadow-glow" : "text-ink-tertiary group-hover:text-ink"
                  )}
                >
                  <Icon
                    size={20}
                    color="currentColor"
                    variant={active ? "Bold" : "Linear"}
                    className={cn(active && "tabbar-icon-pop")}
                    key={active ? "on" : "off"}
                  />
                  {lockedTab ? (
                    <span className="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-surface-card bg-gray-500 text-white">
                      <Lock1 size={10} color="currentColor" variant="Bold" />
                    </span>
                  ) : badge > 0 && (
                    <span
                      className={cn(
                        "absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 px-1 text-[10px] font-bold leading-none",
                        active ? "border-white bg-white text-brand" : "border-surface-card bg-brand text-ink-on-brand"
                      )}
                    >
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "max-w-full truncate px-1 text-[11px] leading-none transition-colors",
                    active ? "font-bold text-brand-text" : "font-semibold text-ink-tertiary"
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
