"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight2 } from "iconsax-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeartPattern } from "@/components/ui/Decor";
import type { ResultsView } from "@/components/ui/ViewToggle";
import { useToast } from "@/components/ui/Toast";
import { requireMember, useSignedIn } from "@/lib/session";
import { favouriteProfile, useSentInterests } from "@/lib/connections";
import { canUse, handleLimitError, refreshUsage, useUsage } from "@/lib/usage";
import { sendInterest as sendInterestApi } from "@/lib/profiles";
import type { FeaturedProfile } from "@/content/home";
import { ProfileView } from "@/components/sections/search/ProfileView";
import { FiltersSidebar, defaultFilters } from "@/components/sections/search/FiltersSidebar";
import { COUNTRY_LABEL, PAGE_SIZE, filtersFromParams, hasClientOnlyFilters } from "@/components/sections/search/searchQuery";
import { useSearchResults } from "@/components/sections/search/useSearchResults";
import { useSavedSearches } from "@/components/sections/search/useSavedSearches";
import { useProfileDetail } from "@/components/sections/search/useProfileDetail";
import { ActiveFilters, SavedSearchesRow, buildFilterChips } from "@/components/sections/search/ActiveFilters";
import { ResultsHeader } from "@/components/sections/search/ResultsHeader";
import { EmptyResults, ResultsBody } from "@/components/sections/search/ResultsBody";
import { FilterDrawer } from "@/components/sections/search/FilterDrawer";

/**
 * Search proposals — Figma "🔍 Search Results" (87:15052):
 * "Search — Desktop 1440" (grid) and "(List view)". Breadcrumb band, then
 * Filters sidebar (296) + Results (952): header (title, count, view toggle, sort),
 * Active filters, Promoted profiles (grid view), results, pagination row.
 * Query params: ?for=bride|groom, ?min/max (age), ?category, ?id (opens a profile), ?view=list, ?from=home|dashboard.
 * Logic: `useSearchResults`, `useSavedSearches`, `useProfileDetail`; pieces in `components/sections/search` (S05-T07).
 */
function SearchPageContent() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const signedIn = useSignedIn();
  const { unlimited } = useUsage();
  const { save: saveInterest } = useSentInterests();
  const topRef = useRef<HTMLDivElement>(null);

  const search = useSearchResults(() => filtersFromParams(searchParams));
  const { filters, setFilters, sort, setSort, applied, results, candidatePool, extrasById, meta } = search;
  const [view, setView] = useState<ResultsView>(searchParams.get("view") === "list" ? "list" : "grid");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const detail = useProfileDetail({
    initialId: searchParams.get("id") || "",
    openedFrom: searchParams.get("from"),
    candidatePool,
    loading: search.loading,
  });
  const saved = useSavedSearches(filters, sort, (s) => {
    setFilters(s.filters);
    setSort(s.sort);
  });

  // Promoted = members with a running boost (the API flags them and lists them first — S04-T05)
  const promotedIds = useMemo(() => new Set(results.filter((p) => p.promoted).map((p) => p.id)), [results]);
  const promoted = results.filter((p) => promotedIds.has(p.id));
  const pool = view === "grid" ? results.filter((p) => !promotedIds.has(p.id)) : [...promoted, ...results.filter((p) => !promotedIds.has(p.id))];
  const size = PAGE_SIZE[view];
  const pageCount = Math.max(1, Math.ceil(pool.length / size));
  const current = pool.slice((page - 1) * size, page * size);
  const from = pool.length ? (page - 1) * size + 1 : 0;
  const to = Math.min(page * size, pool.length);

  // Back to page 1 whenever the filters, sort or view change
  useEffect(() => setPage(1), [applied, view]);

  const goToPage = (p: number) => {
    setPage(p);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const clearAll = () => setFilters(defaultFilters(filters.lookingFor));

  // POST /api/match-requests; the card shows "Interest sent" only after the API accepted it (402 → Upgrade prompt)
  const sendInterest = async (p: FeaturedProfile): Promise<boolean> => {
    if (!requireMember("send an interest")) return false;
    if (!canUse("interests")) return false;
    const r = await sendInterestApi(p);
    if (!r.ok) {
      if (!handleLimitError(r.error)) toast.error("Interest not sent", r.message);
      return false;
    }
    saveInterest({ ...favouriteProfile(p), time: "Just now", note: "You sent an interest. Waiting for a reply." });
    void refreshUsage();
    toast.success("Interest sent", `${p.id} will be notified. You can chat once they accept.`);
    return true;
  };

  const chips = buildFilterChips(filters, setFilters);
  const countryTitle =
    filters.countries.length === 1 ? COUNTRY_LABEL[filters.countries[0]] : filters.countries.length > 1 ? "selected countries" : "Sri Lanka & abroad";
  const title = `${filters.lookingFor === "bride" ? "Brides" : "Grooms"} in ${filters.district || countryTitle}`;
  // server total, unless some filters only narrow what's loaded
  const shownTotal = hasClientOnlyFilters(applied.filters) ? results.length : Math.max(meta.total, results.length);

  const sidebar = <FiltersSidebar value={filters} onChange={setFilters} onClear={clearAll} onSave={saved.save} />;

  return (
    <div className="relative isolate flex min-h-screen flex-col bg-page-gradient text-ink">
      <HeartPattern className="-z-10" />
      <Navbar variant="light" />

      {detail.viewing ? (
        <ProfileView
          results={results}
          selected={detail.viewing}
          extrasById={extrasById}
          onSelect={detail.open}
          onBack={detail.close}
          backTo={detail.backTo}
          onInterest={(p) => sendInterest(p)}
        />
      ) : (
        <>
          {/* Search band — breadcrumb */}
          <div className="container-page flex h-[68px] items-center">
            <nav aria-label="Breadcrumb" className="enter flex items-center gap-1.5 text-body-sm text-ink-tertiary">
              <Link href={signedIn ? "/dashboard" : "/"} className="transition-colors hover:text-brand-text">
                {signedIn ? "Dashboard" : "Home"}
              </Link>
              <ArrowRight2 size={14} color="currentColor" />
              <span aria-current="page" className="text-ink-secondary">
                Search proposals
              </span>
            </nav>
          </div>

          <main className="container-page flex flex-1 gap-8 pb-20">
            {/* Filters sidebar (desktop) */}
            <div className="enter hidden w-[296px] shrink-0 lg:block">{sidebar}</div>

            {/* Results */}
            <section ref={topRef} className="flex min-w-0 flex-1 scroll-mt-28 flex-col gap-6" aria-label="Results">
              <ResultsHeader
                title={title}
                from={from}
                to={to}
                total={shownTotal}
                signedIn={signedIn}
                activeCount={chips.length}
                onOpenFilters={() => setDrawerOpen(true)}
                view={view}
                onViewChange={setView}
                sort={sort}
                onSortChange={setSort}
              />

              <ActiveFilters chips={chips} onClearAll={clearAll} />

              {signedIn && <SavedSearchesRow searches={saved.savedSearches} onRun={saved.run} onRemove={(s) => void saved.remove(s)} />}

              {search.loadError ? (
                <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-line bg-surface-card p-8 text-center">
                  <p className="text-h6 text-ink">Profiles couldn’t load</p>
                  <p className="text-body-md text-ink-secondary">{search.loadError}</p>
                </div>
              ) : search.loading ? (
                <p className="py-12 text-center text-body-md text-ink-tertiary">Loading profiles…</p>
              ) : candidatePool.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface-card p-8 text-center">
                  <p className="text-h6 text-ink">No proposals found</p>
                  <p className="text-body-md text-ink-secondary">No approved profiles match yet. Try a wider search, or check back soon as new members join.</p>
                </div>
              ) : results.length === 0 ? (
                <EmptyResults onClear={clearAll} />
              ) : (
                <ResultsBody
                  view={view}
                  listKey={`${view}-${page}-${sort}-${results.length}`}
                  page={page}
                  pageCount={pageCount}
                  onPageChange={goToPage}
                  current={current}
                  promoted={promoted}
                  promotedIds={promotedIds}
                  extrasById={extrasById}
                  from={from}
                  to={to}
                  poolSize={pool.length}
                  hasMore={meta.page < meta.totalPages}
                  loadingMore={search.loadingMore}
                  onLoadMore={() => void search.loadMore()}
                  promoteHref={signedIn && !unlimited ? "/plans" : signedIn ? "/dashboard?promote=1" : "/register"}
                  onView={detail.open}
                  onInterest={sendInterest}
                />
              )}
            </section>
          </main>
        </>
      )}

      <Footer />

      {/* Phones / tablets: filters in a drawer */}
      <FilterDrawer open={drawerOpen} onClose={closeDrawer} resultCount={results.length}>
        {sidebar}
      </FilterDrawer>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-page-gradient">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
