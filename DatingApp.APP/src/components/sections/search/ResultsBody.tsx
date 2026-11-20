"use client";

import React from "react";
import Link from "next/link";
import { Crown1, SearchNormal1 } from "iconsax-react";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import type { ResultsView } from "@/components/ui/ViewToggle";
import { ProfileCard } from "@/components/cards/ProfileCard";
import { ProfileCardList } from "@/components/cards/ProfileCardList";
import type { FeaturedProfile } from "@/content/home";
import type { profileExtras } from "@/content/search";
import type { CandidateProposal } from "./searchQuery";

type Extras = ReturnType<typeof profileExtras>;

interface Props {
  view: ResultsView;
  /** changes when the cards should replay their entrance (view, page, sort, result count) */
  listKey: string;
  page: number;
  pageCount: number;
  onPageChange: (p: number) => void;
  /** profiles on this page */
  current: CandidateProposal[];
  promoted: CandidateProposal[];
  promotedIds: Set<string>;
  extrasById: Record<string, Extras>;
  from: number;
  to: number;
  poolSize: number;
  /** another API page exists */
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  /** where "Promote your profile" goes */
  promoteHref: string;
  onView: (p: FeaturedProfile) => void;
  onInterest: (p: FeaturedProfile) => Promise<boolean>;
}

/** Promoted row (grid, page 1), the grid / list of cards and the pagination row (S05-T07). */
export function ResultsBody(props: Readonly<Props>) {
  const { view, listKey, page, current, promoted, promotedIds, extrasById, onView } = props;

  return (
    <>
      {/* Promoted profiles — grid view, first page */}
      {view === "grid" && page === 1 && promoted.length > 0 && (
        <div className="reveal flex flex-col gap-4 rounded-[24px] border border-premium-line bg-premium-bg p-5">
          <div className="flex items-center gap-2">
            <Crown1 size={20} color="currentColor" className="text-premium-fg" />
            <h2 className="flex-1 text-h6 text-premium-fg">Promoted profiles</h2>
            <Link href={props.promoteHref} className="group text-label-md text-premium-fg">
              Promote your profile <span className="inline-block transition-transform group-hover:translate-x-0.5">›</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {promoted.map((p, i) => (
              <ProfileCard
                key={p.id}
                profile={p}
                promoted
                onView={onView}
                // light sweep is staggered card to card
                style={{ animation: `fade-up 500ms cubic-bezier(0.22,1,0.36,1) ${i * 80}ms backwards`, ["--promo-delay" as string]: `${i * 0.35}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {view === "grid" ? (
        <div key={listKey} className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {current.map((p, i) => (
            <ProfileCard key={p.id} profile={p} onView={onView} style={{ animation: `fade-up 500ms cubic-bezier(0.22,1,0.36,1) ${Math.min(i, 8) * 60}ms backwards` }} />
          ))}
        </div>
      ) : (
        <div key={listKey} className="flex flex-col gap-4">
          {current.map((p, i) => (
            <ProfileCardList
              key={p.id}
              profile={p}
              extras={extrasById[p.id]}
              bio={p.bio}
              promoted={promotedIds.has(p.id)}
              onView={onView}
              onInterest={props.onInterest}
              style={{ animation: `fade-up 500ms cubic-bezier(0.22,1,0.36,1) ${i * 70}ms backwards` }}
            />
          ))}
        </div>
      )}

      {/* Pagination row */}
      <div className="flex flex-col items-center justify-between gap-4 pt-4 sm:flex-row">
        <p className="text-body-sm text-ink-secondary">
          Showing {props.from}–{props.to} of {props.poolSize.toLocaleString()}
        </p>
        <div className="flex flex-col items-center gap-3">
          <Pagination page={page} pageCount={props.pageCount} onChange={props.onPageChange} />
          {props.hasMore && (
            <Button variant="outline" size="sm" className="rounded-full" disabled={props.loadingMore} onClick={props.onLoadMore}>
              {props.loadingMore ? "Loading…" : "Load more proposals"}
            </Button>
          )}
        </div>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          Back to top
        </Button>
      </div>
    </>
  );
}

/** The loaded profiles exist, but none pass the filters. */
export function EmptyResults({ onClear }: Readonly<{ onClear: () => void }>) {
  return (
    <div className="flex animate-fade-up flex-col items-center gap-3 rounded-[24px] border border-line bg-surface-card px-6 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-subtle text-icon-brand">
        <SearchNormal1 size={30} color="currentColor" />
      </span>
      <h2 className="text-h5 text-ink">No proposals match these filters</h2>
      <p className="max-w-md text-body-md text-ink-secondary">Try a wider age range, another district, or remove a filter or two.</p>
      <Button variant="primary" className="mt-2 rounded-full" onClick={onClear}>
        Clear all filters
      </Button>
    </div>
  );
}
