"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { requireMember, useSignedIn } from "@/lib/session";
import { deleteSavedSearch, getSavedSearches, saveSearch as saveSearchApi, type SavedSearch } from "@/lib/matching";
import type { SortKey } from "@/content/search";
import type { SearchFilters } from "./FiltersSidebar";
import { fromQuery, hasClientOnlyFilters, savedSearchName, toQuery, type AppliedSearch } from "./searchQuery";

/** Saved searches (S03-T06) — kept on the server, up to 10; running one is a normal search (S05-T07: own hook). */
export function useSavedSearches(filters: SearchFilters, sort: SortKey, apply: (s: AppliedSearch) => void) {
  const toast = useToast();
  const signedIn = useSignedIn();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  useEffect(() => {
    if (!signedIn) {
      setSavedSearches([]);
      return;
    }
    getSavedSearches().then(setSavedSearches).catch(() => setSavedSearches([]));
  }, [signedIn]);

  const save = async () => {
    if (!requireMember("save searches")) return;
    const name = savedSearchName(filters, savedSearches.map((s) => s.name));
    try {
      const created = await saveSearchApi(name, toQuery(filters, sort));
      setSavedSearches((list) => [created, ...list]);
      toast.success(
        "Search saved",
        hasClientOnlyFilters(filters) ? `“${name}” keeps gender, age, religion, profession, district and horoscope.` : `Find “${name}” above your results anytime.`,
      );
    } catch (err) {
      toast.error("Search not saved", err instanceof Error ? err.message : "Please try again.");
    }
  };

  const run = (s: SavedSearch) => apply(fromQuery(s.filters));

  const remove = async (s: SavedSearch) => {
    setSavedSearches((list) => list.filter((x) => x.id !== s.id));
    try {
      await deleteSavedSearch(s.id);
    } catch {
      setSavedSearches((list) => [s, ...list]);
    }
  };

  return { savedSearches, save, run, remove };
}
