"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown2, Calendar, Clock, MessageQuestion, ShieldTick } from "iconsax-react";
import { cn } from "@/lib/cn";
import { MemberShell } from "@/components/layout/MemberShell";
import { PRIVACY, TERMS, type LegalDoc } from "@/content/legal";

/**
 * Terms & Conditions / Privacy Policy (Figma: 📄 Info Pages).
 * Same page header as member pages (navbar, back, breadcrumb, title, subtitle). Desktop: sticky
 * "On this page" menu on the left (highlights the section in view) + numbered sections on the right.
 * Phones: the menu sits above the content.
 */
export function LegalPage({ doc }: { doc: "terms" | "privacy" }) {
  const d: LegalDoc = doc === "terms" ? TERMS : PRIVACY;
  const other = doc === "terms" ? { href: "/privacy", label: "Privacy Policy" } : { href: "/terms", label: "Terms & Conditions" };
  const [active, setActive] = useState(d.sections[0]?.id);
  // phones: the section menu is folded so the text starts near the top
  const [tocOpen, setTocOpen] = useState(false);

  // highlight the section currently in view
  useEffect(() => {
    const els = d.sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-120px 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [d.sections]);

  return (
    <MemberShell publicPage crumb={d.crumb} title={d.title} subtitle={d.subtitle}>
      <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
        {/* On this page */}
        <aside className="flex flex-col gap-4 rounded-xl border border-line bg-surface-card p-4 shadow-sm lg:sticky lg:top-28">
          <button
            type="button"
            onClick={() => setTocOpen((o) => !o)}
            aria-expanded={tocOpen}
            className="flex items-center justify-between px-2 text-overline uppercase text-brand-text lg:pointer-events-none"
          >
            On this page
            <ArrowDown2 size={16} color="currentColor" className={cn("transition-transform lg:hidden", tocOpen && "rotate-180")} />
          </button>
          <nav aria-label="On this page" className={cn(!tocOpen && "max-lg:hidden")}>
            <ol className="flex flex-col gap-0.5">
              {d.sections.map((s, i) => {
                const on = active === s.id;
                return (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      aria-current={on ? "true" : undefined}
                      onClick={() => {
                        setActive(s.id);
                        setTocOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-body-sm transition-colors",
                        on ? "bg-brand-subtle font-semibold text-brand-text" : "text-ink-secondary hover:bg-surface-subtle hover:text-ink",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                          on ? "bg-brand text-ink-on-brand" : "bg-surface-subtle text-ink-tertiary",
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0">{s.title}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
          <div className={cn("flex flex-col gap-2 border-t border-line px-2 pt-4", !tocOpen && "max-lg:hidden")}>
            <p className="text-label-md text-ink">Questions about this policy?</p>
            <Link
              href="/support"
              className="flex h-10 items-center justify-center gap-2 rounded-full border border-brand text-label-md text-brand-text transition-colors hover:bg-brand-subtle"
            >
              <MessageQuestion size={18} color="currentColor" /> Contact support
            </Link>
          </div>
        </aside>

        {/* Content */}
        <article className="flex min-w-0 flex-col gap-8 rounded-xl border border-line bg-surface-card p-5 shadow-sm sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-2 text-label-sm text-ink-tertiary">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-subtle px-3 py-1">
              <Calendar size={14} color="currentColor" /> Last updated {d.updated}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-subtle px-3 py-1">
              <Clock size={14} color="currentColor" /> {d.readMins} min read
            </span>
          </div>

          <div className="flex gap-3 rounded-[16px] bg-info-bg p-4 text-body-md text-info-fg">
            <ShieldTick size={22} color="currentColor" className="mt-0.5 shrink-0" />
            <p>{d.summary}</p>
          </div>

          {d.sections.map((s, i) => (
            <section key={s.id} id={s.id} className="flex scroll-mt-28 flex-col gap-3 border-t border-line pt-8 first-of-type:border-t-0 first-of-type:pt-0">
              <h2 className="flex items-baseline gap-3 text-h5 text-ink md:text-h4">
                <span className="text-brand-text">{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </h2>
              <Body paragraphs={s.body} />
            </section>
          ))}

          <p className="border-t border-line pt-6 text-body-sm text-ink-tertiary">
            Also read our{" "}
            <Link href={other.href} className="font-semibold text-brand-text underline-offset-4 hover:underline">
              {other.label}
            </Link>
            .
          </p>
        </article>
      </div>
    </MemberShell>
  );
}

/** Groups "• " lines into a bullet list, other lines into paragraphs. */
function Body({ paragraphs }: { paragraphs: string[] }) {
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (!list.length) return;
    out.push(
      <ul key={`ul-${out.length}`} className="flex list-disc flex-col gap-1.5 pl-5 text-body-md text-ink-secondary marker:text-brand">
        {list.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>,
    );
    list = [];
  };
  paragraphs.forEach((p) => {
    if (p.startsWith("• ")) list.push(p.slice(2));
    else {
      flush();
      out.push(
        <p key={`p-${out.length}`} className="text-body-md text-ink-secondary">
          {p}
        </p>,
      );
    }
  });
  flush();
  return <>{out}</>;
}
