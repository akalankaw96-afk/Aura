import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeartPattern } from "@/components/ui/Decor";

/**
 * Signed-in page frame — Figma: Requests / Messages — Desktop 1440.
 * Member navbar, page gradient + heart lines, Body padding 32/80/96 with gap 24,
 * page header (breadcrumb, H2, subtitle, optional right slot), then the footer.
 */
export function MemberShell({
  title,
  subtitle,
  crumb,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  crumb: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative isolate bg-page-gradient">
      <HeartPattern className="-z-10" />
      <Navbar variant="member" />
      <main className="container-page flex flex-col gap-6 pb-16 pt-6 lg:pb-24 lg:pt-8">
        <div className="enter flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-1">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-body-sm text-ink-tertiary">
              <Link href="/dashboard" className="hover:text-brand-text">
                Dashboard
              </Link>
              <span aria-hidden>/</span>
              <span aria-current="page" className="font-semibold text-brand-text">
                {crumb}
              </span>
            </nav>
            <h1 className="text-h3 text-ink md:text-h2">{title}</h1>
            {subtitle && <p className="text-body-md text-ink-secondary">{subtitle}</p>}
          </div>
          {right}
        </div>
        {children}
      </main>
      <Footer />
    </div>
  );
}
