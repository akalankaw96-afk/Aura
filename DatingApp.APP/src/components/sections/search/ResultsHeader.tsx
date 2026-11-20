"use client";

import React from "react";
import Link from "next/link";
import { Eye, SearchNormal1, Setting4 } from "iconsax-react";
import { cn } from "@/lib/cn";
import { SortDropdown } from "@/components/ui/SortDropdown";
import { ViewToggle, type ResultsView } from "@/components/ui/ViewToggle";
import { useUsage } from "@/lib/usage";
import { SORT_OPTIONS, type SortKey } from "@/content/search";

interface Props {
  title: string;
  from: number;
  to: number;
  total: number;
  signedIn: boolean;
  activeCount: number;
  onOpenFilters: () => void;
  view: ResultsView;
  onViewChange: (v: ResultsView) => void;
  sort: SortKey;
  onSortChange: (s: SortKey) => void;
}

/** Title, "Showing x–y of n", free-plan allowance, and the Filters (phones) / view / sort controls (S05-T07). */
export function ResultsHeader({ title, from, to, total, signedIn, activeCount, onOpenFilters, view, onViewChange, sort, onSortChange }: Readonly<Props>) {
  const { left: usageLeft, unlimited } = useUsage();
  const searchesLeft = usageLeft("searches");
  const viewsLeft = usageLeft("profileViews");

  return (
    <div className="enter flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-h3 text-ink md:text-h2">{title}</h1>
        <p className="text-body-sm text-ink-secondary">
          Showing {from}–{to} of{" "}
          <span key={total} className="inline-block animate-pop-in font-semibold text-brand-text">
            {total.toLocaleString()} proposals
          </span>
        </p>
        {/* Free plan: what's left this month — searches + profile views (countdown) */}
        {signedIn && !unlimited && Number.isFinite(searchesLeft) && Number.isFinite(viewsLeft) && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {(
              [
                [searchesLeft, "search", "searches", SearchNormal1],
                [viewsLeft, "profile view", "profile views", Eye],
              ] as const
            ).map(([n, one, many, Icon]) => (
              <span
                key={one}
                className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-sm", n === 0 ? "bg-error-bg text-error-fg" : "bg-premium-bg text-premium-fg")}
              >
                <Icon size={14} color="currentColor" />
                {n === 0 ? (
                  `No free ${many} left`
                ) : (
                  <>
                    <b key={n} className="inline-block animate-pop-in">
                      {n}
                    </b>{" "}
                    free {n === 1 ? one : many} left
                  </>
                )}
              </span>
            ))}
            <span className="text-label-sm text-ink-tertiary">this month</span>
            <Link href="/plans" className="text-label-sm font-bold text-premium-fg underline-offset-2 hover:underline">
              Upgrade
            </Link>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onOpenFilters}
          className="flex h-10 items-center gap-2 rounded-[12px] border border-line bg-surface-card px-3.5 text-label-md text-ink transition-colors hover:border-brand lg:hidden"
        >
          <Setting4 size={18} color="currentColor" /> Filters
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-label-sm text-ink-on-brand">{activeCount}</span>
          )}
        </button>
        <ViewToggle value={view} onChange={onViewChange} />
        <SortDropdown value={sort} options={SORT_OPTIONS} onChange={onSortChange} />
      </div>
    </div>
  );
}
