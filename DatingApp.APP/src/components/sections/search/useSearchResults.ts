"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { hasSession, useSignedIn } from "@/lib/session";
import { allSearchLimitsExhausted, handleLimitError, refreshUsage } from "@/lib/usage";
import { searchProfiles } from "@/lib/matching";
import { HEIGHT_MAX, HEIGHT_MIN, matchesProfession, parseHeight, profileExtras, type SortKey } from "@/content/search";
import type { Profile } from "@/types";
import type { SearchFilters } from "./FiltersSidebar";
import { SERVER_PAGE, toProposal, toQuery, type AppliedSearch, type CandidateProposal } from "./searchQuery";

const KNOWN_RELIGIONS = ["buddhist", "catholic", "christian", "hindu", "muslim"];

/**
 * Search results (S05-T07: moved out of `app/search/page.tsx`).
 * Results come from GET /api/profiles/search (S03-T01). A member's filtered first page uses one of the month's
 * searches on the server (plain browsing is free). The sidebar edits `filters`; results follow `applied`, which
 * updates 0.7 s after the last change. At the limit (402) the controls go back to the last search that worked and
 * the Upgrade prompt opens.
 */
export function useSearchResults(initialFilters: () => SearchFilters) {
  const toast = useToast();
  const signedIn = useSignedIn();
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [sort, setSort] = useState<SortKey>("newest");
  const [applied, setApplied] = useState<AppliedSearch>({ filters, sort });
  const lastGoodRef = useRef<AppliedSearch | null>(null);
  const skipFetchRef = useRef(false);
  const [liveDbProfiles, setLiveDbProfiles] = useState<Profile[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // First API page of the applied search
  useEffect(() => {
    if (skipFetchRef.current) {
      skipFetchRef.current = false;
      return;
    }
    let isMounted = true;
    setLoading(true);
    searchProfiles({ ...toQuery(applied.filters, applied.sort), page: 1, pageSize: SERVER_PAGE })
      .then((r) => {
        if (!isMounted) return;
        setLiveDbProfiles(r.items);
        setMeta({ total: r.total, page: r.page, totalPages: r.totalPages });
        setLoadError(null);
        lastGoodRef.current = applied;
        if (hasSession()) void refreshUsage();
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        if (handleLimitError(err)) {
          const prev = lastGoodRef.current;
          if (prev) {
            skipFetchRef.current = true;
            setFilters(prev.filters);
            setSort(prev.sort);
            setApplied(prev);
          }
          return;
        }
        setLoadError(err instanceof Error ? err.message : "We couldn’t load profiles.");
      })
      .finally(() => isMounted && setLoading(false));
    return () => {
      isMounted = false;
    };
  }, [applied, signedIn]);

  // Apply the sidebar 0.7 s after the last change
  useEffect(() => {
    if (applied.filters === filters && applied.sort === sort) return;
    const t = window.setTimeout(() => {
      if (hasSession() && allSearchLimitsExhausted()) {
        // browsing used up → keep the last results
        setFilters(applied.filters);
        setSort(applied.sort);
        return;
      }
      setApplied({ filters, sort });
    }, 700);
    return () => window.clearTimeout(t);
    // only the sidebar starts this; `applied` changing on its own must not re-apply the old filters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort]);

  // Next API page of the same search — free
  const loadMore = async () => {
    if (loadingMore || meta.page >= meta.totalPages) return;
    setLoadingMore(true);
    try {
      const r = await searchProfiles({ ...toQuery(applied.filters, applied.sort), page: meta.page + 1, pageSize: SERVER_PAGE });
      setLiveDbProfiles((list) => [...list, ...r.items.filter((p) => !list.some((x) => x.id === p.id))]);
      setMeta({ total: r.total, page: r.page, totalPages: r.totalPages });
    } catch (err) {
      if (!handleLimitError(err)) toast.error("Couldn’t load more", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setLoadingMore(false);
    }
  };

  // Approved members from the database — the only source; empty when nobody matches.
  const candidatePool: CandidateProposal[] = useMemo(() => liveDbProfiles.map(toProposal), [liveDbProfiles]);

  // List-card details from each member's real profile
  const extrasById = useMemo(
    () =>
      Object.fromEntries(
        candidatePool.map((p) => [
          p.id,
          profileExtras({
            location: p.location,
            education: p.education,
            community: p.community,
            district: p.district,
            civil: p.details?.civilStatus,
            postedBy: p.details?.createdBy,
            photo: p.photo,
          }),
        ]),
      ),
    [candidatePool],
  );

  // Filtered + sorted results (the server already applied its filters; the rest narrow the loaded list)
  const results = useMemo(() => {
    const f = applied.filters;
    const list = candidatePool.filter((p) => {
      if (p.gender !== f.lookingFor) return false;
      if (p.age < f.age[0] || p.age > f.age[1]) return false;
      const h = parseHeight(p.height);
      if (h !== null && (f.height[0] > HEIGHT_MIN || f.height[1] < HEIGHT_MAX) && (h < f.height[0] || h > f.height[1])) return false;
      if (f.withPhoto && !p.photo) return false;
      if (f.religions.length) {
        const rel = p.religion.toLowerCase();
        const ok = f.religions.some((r) =>
          r === "Other" ? !KNOWN_RELIGIONS.some((k) => rel.includes(k)) : rel.includes(r.toLowerCase()) || (r === "Muslim" && rel.includes("islam")),
        );
        if (!ok) return false;
      }
      if (f.countries.length && !f.countries.includes(p.country)) return false;
      const x = extrasById[p.id];
      if (f.district && x.district !== f.district) return false;
      if (f.professions.length && !f.professions.some((pr) => matchesProfession(p.profession, pr))) return false;
      const more = f.more;
      if (more.ethnicity?.length && !more.ethnicity.includes(x.ethnicity)) return false;
      if (more.civil?.length && !more.civil.includes(x.civil)) return false;
      if (more.education?.length && !more.education.includes(x.education)) return false;
      if (more.postedBy?.length && !more.postedBy.includes(x.postedBy)) return false;
      if (more.horoscope?.length && !p.horoscope) return false;
      return true;
    });
    const sorted = [...list];
    if (applied.sort === "best") sorted.sort((a, b) => (extrasById[b.id].match ?? 0) - (extrasById[a.id].match ?? 0));
    if (applied.sort === "age-asc") sorted.sort((a, b) => a.age - b.age);
    if (applied.sort === "age-desc") sorted.sort((a, b) => b.age - a.age);
    return sorted;
  }, [candidatePool, applied, extrasById]);

  return {
    filters,
    setFilters,
    sort,
    setSort,
    applied,
    meta,
    loading,
    loadError,
    loadingMore,
    loadMore,
    candidatePool,
    extrasById,
    results,
  };
}
