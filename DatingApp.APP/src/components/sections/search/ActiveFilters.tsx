"use client";

import React from "react";
import { CloseCircle, TextalignLeft } from "iconsax-react";
import { Flag } from "@/components/ui/Flag";
import { RemovableFilterChip } from "@/components/ui/RemovableFilterChip";
import type { SavedSearch } from "@/lib/matching";
import { HEIGHT_MAX, HEIGHT_MIN, MORE_SECTIONS, fmtHeight, type MoreKey } from "@/content/search";
import { AGE_MAX, AGE_MIN, type SearchFilters } from "./FiltersSidebar";
import { COUNTRY_LABEL } from "./searchQuery";

export interface FilterChipItem {
  key: string;
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  remove: () => void;
}

/** One removable chip per active filter (Looking for is always there). */
export function buildFilterChips(filters: SearchFilters, setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>): FilterChipItem[] {
  const chips: FilterChipItem[] = [];
  const set = (patch: Partial<SearchFilters>) => setFilters((f) => ({ ...f, ...patch }));
  chips.push({ key: "for", label: "Looking for", value: filters.lookingFor === "bride" ? "Bride" : "Groom", remove: () => set({ lookingFor: filters.lookingFor === "bride" ? "groom" : "bride" }) });
  if (filters.age[0] !== AGE_MIN || filters.age[1] !== AGE_MAX)
    chips.push({ key: "age", label: "Age", value: `${filters.age[0]}–${filters.age[1]}`, remove: () => set({ age: [AGE_MIN, AGE_MAX] }) });
  if (filters.height[0] !== HEIGHT_MIN || filters.height[1] !== HEIGHT_MAX)
    chips.push({ key: "height", label: "Height", value: `${fmtHeight(filters.height[0])}–${fmtHeight(filters.height[1])}`, remove: () => set({ height: [HEIGHT_MIN, HEIGHT_MAX] }) });
  filters.religions.forEach((r) => chips.push({ key: `rel-${r}`, label: "Religion", value: r, remove: () => set({ religions: filters.religions.filter((x) => x !== r) }) }));
  filters.countries.forEach((c) =>
    chips.push({ key: `c-${c}`, label: "Country", icon: <Flag country={c} className="h-4 w-4" />, value: COUNTRY_LABEL[c], remove: () => set({ countries: filters.countries.filter((x) => x !== c) }) }),
  );
  if (filters.district) chips.push({ key: "district", label: "District", value: filters.district, remove: () => set({ district: "" }) });
  filters.professions.forEach((p) => chips.push({ key: `p-${p}`, label: "Profession", value: p, remove: () => set({ professions: filters.professions.filter((x) => x !== p) }) }));
  (Object.keys(filters.more) as MoreKey[]).forEach((k) =>
    (filters.more[k] ?? []).forEach((v) =>
      chips.push({
        key: `${k}-${v}`,
        label: MORE_SECTIONS[k].title.replace(/ \(.*\)/, ""),
        value: v,
        remove: () => set({ more: { ...filters.more, [k]: (filters.more[k] ?? []).filter((x) => x !== v) } }),
      }),
    ),
  );
  if (filters.verifiedOnly) chips.push({ key: "verified", label: "", value: "Verified only", remove: () => set({ verifiedOnly: false }) });
  if (filters.withPhoto) chips.push({ key: "photo", label: "", value: "With photo", remove: () => set({ withPhoto: false }) });
  return chips;
}

/** "Active filters" bar (S05-T07: moved out of the Search page). */
export function ActiveFilters({ chips, onClearAll }: Readonly<{ chips: FilterChipItem[]; onClearAll: () => void }>) {
  return (
    <div className="enter flex flex-wrap items-center gap-2 rounded-[16px] border border-line bg-surface-card px-4 py-3 shadow-xs">
      <span className="mr-1 flex items-center gap-1.5 text-label-md text-ink-secondary">
        <TextalignLeft size={16} color="currentColor" /> Active filters ({chips.length})
      </span>
      {chips.map((c, i) => (
        <RemovableFilterChip
          key={c.key}
          label={c.label || undefined}
          value={c.value}
          icon={c.icon}
          onRemove={c.remove}
          className="animate-pop-in"
          style={{ animationDelay: `${Math.min(i, 10) * 25}ms`, animationFillMode: "backwards" }}
        />
      ))}
      {chips.length > 1 && (
        <button type="button" onClick={onClearAll} className="text-label-md text-brand underline-offset-2 hover:underline">
          Clear all
        </button>
      )}
    </div>
  );
}

/** Saved searches row — click to run, × to delete. */
export function SavedSearchesRow({
  searches,
  onRun,
  onRemove,
}: Readonly<{ searches: SavedSearch[]; onRun: (s: SavedSearch) => void; onRemove: (s: SavedSearch) => void }>) {
  if (searches.length === 0) return null;
  return (
    <div className="enter flex flex-wrap items-center gap-2">
      <span className="mr-1 text-label-md text-ink-secondary">Saved searches</span>
      {searches.map((s) => (
        <span key={s.id} className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-card pl-3 pr-1 text-label-md text-ink shadow-xs">
          <button type="button" onClick={() => onRun(s)} className="py-1.5 hover:text-brand-text">
            {s.name}
          </button>
          <button
            type="button"
            aria-label={`Delete saved search ${s.name}`}
            onClick={() => onRemove(s)}
            className="rounded-full p-1 text-ink-tertiary hover:bg-surface-subtle hover:text-error-fg"
          >
            <CloseCircle size={16} color="currentColor" />
          </button>
        </span>
      ))}
    </div>
  );
}
