"use client";

import React, { useState } from "react";
import { Heart, Profile2User, Star1, TextalignLeft, Verify } from "iconsax-react";
import { cn } from "@/lib/cn";
import { Chip } from "@/components/ui/Chip";
import { Toggle } from "@/components/ui/Toggle";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { FilterSection } from "@/components/ui/FilterSection";
import { Checkbox } from "@/components/ui/Checkbox";
import { Select } from "@/components/ui/Select";
import { Flag, type CountryCode } from "@/components/ui/Flag";
import { Button } from "@/components/ui/Button";
import {
  COUNTRY_OPTIONS,
  DISTRICT_OPTIONS,
  HEIGHT_MAX,
  HEIGHT_MIN,
  MORE_COUNTRIES,
  MORE_SECTIONS,
  PROFESSION_OPTIONS,
  RELIGION_OPTIONS,
  fmtHeight,
  type MoreKey,
} from "@/content/search";

export interface SearchFilters {
  lookingFor: "bride" | "groom";
  verifiedOnly: boolean;
  withPhoto: boolean;
  age: [number, number];
  height: [number, number];
  religions: string[];
  countries: CountryCode[];
  district: string;
  professions: string[];
  more: Partial<Record<MoreKey, string[]>>;
}

export const AGE_MIN = 18;
export const AGE_MAX = 60;

export const defaultFilters = (lookingFor: "bride" | "groom" = "bride"): SearchFilters => ({
  lookingFor,
  verifiedOnly: false,
  withPhoto: false,
  age: [AGE_MIN, AGE_MAX],
  height: [HEIGHT_MIN, HEIGHT_MAX],
  religions: [],
  countries: [],
  district: "",
  professions: [],
  more: {},
});

const toggleIn = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

/**
 * Figma: Search → Filters sidebar (296 wide · padding 20 · radius 24 · white).
 * Header, I'm looking for (Bride / Groom chips), Verified / With photo toggles,
 * Age + Height range sliders, then Filter Sections (Religion, Country of residence,
 * District, Profession open; the rest folded) and "Save this search".
 */
export function FiltersSidebar({
  value,
  onChange,
  onClear,
  onSave,
  className,
}: {
  value: SearchFilters;
  onChange: (next: SearchFilters) => void;
  onClear: () => void;
  onSave: () => void;
  className?: string;
}) {
  const [allCountries, setAllCountries] = useState(false);
  const set = <K extends keyof SearchFilters>(k: K, v: SearchFilters[K]) => onChange({ ...value, [k]: v });
  const countries = allCountries ? [...COUNTRY_OPTIONS, ...MORE_COUNTRIES] : COUNTRY_OPTIONS;

  return (
    <aside className={cn("flex flex-col gap-1 rounded-[24px] border border-line bg-surface-card p-5 shadow-sm", className)} aria-label="Filters">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3">
        <TextalignLeft size={20} color="currentColor" className="text-icon-brand" />
        <h2 className="flex-1 text-h5 text-ink">Filters</h2>
        <button type="button" onClick={onClear} className="text-label-md text-brand transition-opacity hover:opacity-70">
          Clear all
        </button>
      </div>

      {/* I'm looking for */}
      <div className="flex flex-col gap-2.5 border-t border-line pb-4 pt-3">
        <p className="text-label-lg text-ink">I’m looking for</p>
        <div className="flex gap-2">
          <Chip avatar="/brand/bride.png" selected={value.lookingFor === "bride"} onClick={() => set("lookingFor", "bride")} className="flex-1 justify-center">
            Bride
          </Chip>
          <Chip avatar="/brand/groom.png" selected={value.lookingFor === "groom"} onClick={() => set("lookingFor", "groom")} className="flex-1 justify-center">
            Groom
          </Chip>
        </div>
      </div>

      {/* Verified / With photo */}
      <div className="flex flex-col gap-2.5 border-t border-line pb-4 pt-3">
        <div className="flex items-center gap-2">
          <Verify size={18} color="currentColor" className="text-success-fg" />
          <span className="flex-1 text-label-lg text-ink">Verified profiles only</span>
          <Toggle label="Verified profiles only" checked={value.verifiedOnly} onChange={(v) => set("verifiedOnly", v)} />
        </div>
        <p className="-mt-1.5 pl-[26px] text-caption text-ink-tertiary">ID &amp; phone checked by our team</p>
        <div className="flex items-center gap-2">
          <Star1 size={18} color="currentColor" className="text-info-fg" />
          <span className="flex-1 text-label-lg text-ink">With photo only</span>
          <Toggle label="With photo only" checked={value.withPhoto} onChange={(v) => set("withPhoto", v)} />
        </div>
      </div>

      {/* Ranges */}
      <div className="flex flex-col gap-5 border-t border-line pb-4 pt-3">
        <RangeBlock
          label="Age"
          display={`${value.age[0]} – ${value.age[1]} yrs`}
          min={AGE_MIN}
          max={AGE_MAX}
          value={value.age}
          onChange={(v) => set("age", v)}
          ends={[`${AGE_MIN}`, `${AGE_MAX}`]}
        />
        <RangeBlock
          label="Height"
          display={`${fmtHeight(value.height[0])} – ${fmtHeight(value.height[1])}`}
          min={HEIGHT_MIN}
          max={HEIGHT_MAX}
          value={value.height}
          onChange={(v) => set("height", v)}
          ends={[fmtHeight(HEIGHT_MIN), fmtHeight(HEIGHT_MAX)]}
        />
      </div>

      <FilterSection title="Religion" count={value.religions.length} defaultOpen>
        <div className="flex flex-wrap gap-2">
          {RELIGION_OPTIONS.map((r) => (
            <Chip key={r} size="sm" selected={value.religions.includes(r)} onClick={() => set("religions", toggleIn(value.religions, r))} className="px-3.5">
              {r}
            </Chip>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Country of residence" count={value.countries.length} defaultOpen>
        <div className="flex flex-col gap-2">
          {countries.map((c, i) => (
            <Checkbox
              key={c.code}
              checked={value.countries.includes(c.code)}
              onChange={() => set("countries", toggleIn(value.countries, c.code))}
              className={i >= COUNTRY_OPTIONS.length ? "animate-fade-up" : undefined}
            >
              <span className="inline-flex items-center gap-2 text-ink">
                <Flag country={c.code} className="h-4 w-4" /> {c.label}
              </span>
            </Checkbox>
          ))}
          <button type="button" onClick={() => setAllCountries((v) => !v)} className="w-fit text-label-md text-brand hover:underline">
            {allCountries ? "Show fewer" : `+ ${MORE_COUNTRIES.length} more countries`}
          </button>
        </div>
      </FilterSection>

      <FilterSection title="District" count={value.district ? 1 : 0} defaultOpen>
        <Select
          aria-label="District"
          placeholder="Any district"
          icon={<Profile2User size={18} color="currentColor" />}
          options={DISTRICT_OPTIONS}
          value={value.district}
          onChange={(v) => set("district", v)}
        />
      </FilterSection>

      <FilterSection title="Profession" count={value.professions.length} defaultOpen>
        <div className="flex flex-wrap gap-2">
          {PROFESSION_OPTIONS.map((p) => (
            <Chip key={p} size="sm" selected={value.professions.includes(p)} onClick={() => set("professions", toggleIn(value.professions, p))} className="px-3.5">
              {p}
            </Chip>
          ))}
        </div>
      </FilterSection>

      {(Object.keys(MORE_SECTIONS) as MoreKey[]).map((k) => {
        const picked = value.more[k] ?? [];
        return (
          <FilterSection key={k} title={MORE_SECTIONS[k].title} count={picked.length}>
            <div className="flex flex-wrap gap-2">
              {MORE_SECTIONS[k].options.map((o) => (
                <Chip
                  key={o}
                  size="sm"
                  selected={picked.includes(o)}
                  onClick={() => set("more", { ...value.more, [k]: toggleIn(picked, o) })}
                  className="px-3.5"
                >
                  {o}
                </Chip>
              ))}
            </div>
          </FilterSection>
        );
      })}

      <div className="flex flex-col items-center gap-2 border-t border-line pt-4">
        <Button variant="primary" className="w-full rounded-full" leftIcon={<Heart size={18} color="currentColor" />} onClick={onSave}>
          Save this search
        </Button>
        <p className="text-caption text-ink-tertiary">Get alerts when new matches join</p>
      </div>
    </aside>
  );
}

function RangeBlock({
  label,
  display,
  min,
  max,
  value,
  onChange,
  ends,
}: {
  label: string;
  display: string;
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  ends: [string, string];
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-label-md text-ink">{label}</span>
        <span className="text-label-md text-brand-text tabular-nums">{display}</span>
      </div>
      <RangeSlider min={min} max={max} value={value} onChange={onChange} labels={ends} />
    </div>
  );
}
