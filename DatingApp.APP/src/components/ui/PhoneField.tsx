"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowDown2, Mobile, SearchNormal1, TickCircle } from "iconsax-react";
import { cn } from "@/lib/cn";
import { Field, controlShell } from "./Field";
import { Flag, type CountryCode } from "./Flag";

/**
 * Figma: Phone Field (State = Default / Focus / Error)
 *      + Country Picker (State = Default / Searching / Empty)
 *      + Country Option (State = Default / Hover / Selected)
 *
 * The country button (flag + dial code) opens a searchable picker: search by
 * country name or dial code. Sri Lanka is first. Valid Sri Lankan mobiles show a tick.
 * Keyboard: ↑ ↓ move · Enter selects · Esc closes.
 */
export interface Country {
  iso: CountryCode;
  name: string;
  dial: string;
}

export const COUNTRIES: Country[] = [
  { iso: "lk", name: "Sri Lanka", dial: "+94" },
  { iso: "au", name: "Australia", dial: "+61" },
  { iso: "gb", name: "United Kingdom", dial: "+44" },
  { iso: "ca", name: "Canada", dial: "+1" },
  { iso: "us", name: "USA", dial: "+1" },
  { iso: "qa", name: "Qatar", dial: "+974" },
  { iso: "ae", name: "UAE", dial: "+971" },
  { iso: "it", name: "Italy", dial: "+39" },
  { iso: "nz", name: "New Zealand", dial: "+64" },
];
/** @deprecated use COUNTRIES */
export const COUNTRY_CODES = COUNTRIES;

/** 9 digits starting with 7, e.g. 77 123 4567 */
export const isValidSriLankanMobile = (digits: string) => /^7\d{8}$/.test(digits);

/** Formats "771234567" as "77 123 4567" */
export const formatMobile = (digits: string) =>
  digits.replace(/^(\d{0,2})(\d{0,3})(\d{0,4}).*/, (_, a, b, c) => [a, b, c].filter(Boolean).join(" "));

export interface PhoneFieldProps {
  label?: string;
  value: string; // digits only
  onChange: (digits: string) => void;
  /** ISO country (controlled). Leave it out to let the field manage the country itself. */
  country?: CountryCode;
  onCountryChange?: (country: Country) => void;
  helper?: React.ReactNode;
  error?: React.ReactNode;
  disabled?: boolean;
  autoFocus?: boolean;
  /** half-width layouts: hides the phone icon and uses a smaller number font so all digits fit */
  compact?: boolean;
}

export function PhoneField({ label = "Mobile number", value, onChange, country, onCountryChange, helper, error, disabled, autoFocus, compact }: PhoneFieldProps) {
  const id = useId();
  const [internal, setInternal] = useState<CountryCode>("lk");
  const iso = country ?? internal;
  const current = COUNTRIES.find((c) => c.iso === iso) ?? COUNTRIES[0];
  const valid = iso === "lk" ? isValidSriLankanMobile(value) : value.length >= 7;

  const pick = (c: Country) => {
    setInternal(c.iso);
    onCountryChange?.(c);
  };

  return (
    <Field label={label} htmlFor={id} helper={helper} error={error}>
      <div className="flex gap-2">
        <CountryPicker current={current} onPick={pick} disabled={disabled} />
        <div className={controlShell({ error: !!error, disabled })}>
          {!compact && <Mobile size={20} color="currentColor" className="shrink-0 text-ink-tertiary" />}
          <input
            id={id}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            autoFocus={autoFocus}
            disabled={disabled}
            aria-invalid={!!error}
            placeholder={iso === "lk" ? "7X XXX XXXX" : "Phone number"}
            value={iso === "lk" ? formatMobile(value) : value}
            onChange={(e) => onChange(e.target.value.replace(/\D/g, "").replace(/^0/, "").slice(0, iso === "lk" ? 9 : 12))}
            className={cn("h-full w-full min-w-0 bg-transparent text-ink outline-none", compact ? "text-body-md" : "text-body-lg")}
          />
          {valid && !error && <TickCircle size={20} color="currentColor" className="shrink-0 text-success-fg" />}
        </div>
      </div>
    </Field>
  );
}

/* ── Country Picker ─────────────────────────────────────────────────── */

export function CountryPicker({ current, onPick, disabled }: { current: Country; onPick: (c: Country) => void; disabled?: boolean }) {
  const uid = useId();
  const listId = `${uid}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, "");
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.dial.replace("+", "").startsWith(q) || c.iso === q);
  }, [query]);

  const openMenu = () => {
    if (disabled) return;
    setQuery("");
    setActive(Math.max(0, COUNTRIES.findIndex((c) => c.iso === current.iso)));
    setOpen(true);
  };
  const close = (focus = true) => {
    setOpen(false);
    if (focus) btnRef.current?.focus();
  };
  const choose = (c: Country) => {
    onPick(c);
    close();
  };

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);
  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    if (open) listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) choose(filtered[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") close(false);
  };

  const activeId = filtered[active] ? `${uid}-${filtered[active].iso}` : undefined;

  return (
    <div ref={rootRef} className="relative shrink-0" onKeyDown={onKey}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        aria-label={`Country code: ${current.name} ${current.dial}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close() : openMenu())}
        className={cn(controlShell({ disabled }), "w-[112px] cursor-pointer gap-2 px-3 outline-none", open && "border-brand-focus shadow-ring-brand")}
      >
        <Flag country={current.iso} />
        <span className="text-label-lg text-ink">{current.dial}</span>
        <ArrowDown2 size={14} color="currentColor" className={cn("ml-auto text-ink-tertiary transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 flex w-[320px] max-w-[calc(100vw-32px)] animate-fade-up flex-col gap-1 rounded-md border border-line bg-surface-card p-2 shadow-lg">
          <div className="flex h-10 items-center gap-2 rounded-sm border border-line bg-surface-subtle px-3 focus-within:border-brand-focus">
            <SearchNormal1 size={18} color="currentColor" className="shrink-0 text-icon-muted" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country or code"
              aria-label="Search country or code"
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-activedescendant={activeId}
              aria-autocomplete="list"
              className="h-full w-full min-w-0 bg-transparent text-body-md text-ink outline-none"
            />
          </div>
          <div className="h-px bg-line" />
          <ul ref={listRef} id={listId} role="listbox" aria-label="Countries" className="flex max-h-[264px] flex-col gap-0.5 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-body-sm text-ink-tertiary">No country matches “{query}”</li>
            ) : (
              filtered.map((c, i) => {
                const sel = c.iso === current.iso;
                return (
                  <li
                    key={c.iso}
                    id={`${uid}-${c.iso}`}
                    data-index={i}
                    role="option"
                    aria-selected={sel}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(c)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2.5 text-body-md",
                      sel ? "bg-brand-subtle font-semibold text-brand-text" : i === active ? "bg-surface-subtle text-ink" : "text-ink"
                    )}
                  >
                    <Flag country={c.iso} />
                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                    <span className={cn("text-body-sm", sel ? "text-brand-text" : "text-ink-tertiary")}>{c.dial}</span>
                    {sel && <TickCircle size={20} color="currentColor" className="shrink-0 text-icon-brand" />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export const CountryCodeSelect = CountryPicker;
