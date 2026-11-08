"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowDown2, SearchNormal1, TextalignLeft, TickCircle } from "iconsax-react";
import { cn } from "@/lib/cn";
import { Field, controlShell } from "./Field";

/**
 * Figma: Input (Type = Select, State = Default / Focus / Open / Error / Disabled) [15:1111 / 133:34238]
 *      + Dropdown Menu (Search = On / Off, State = Default / Filtered / Empty) [133:33402]
 *      + Dropdown Option (State = Default / Hover / Selected) [133:33314]
 *      + Sort Dropdown [86:19427]
 *
 * A custom listbox (not the browser's native <select>), matching Figma 1:1.
 * Search field appears automatically when the list has more than 4 options (override with `searchable`).
 * Keyboard: ↑ ↓ move · Enter selects · Esc closes · Home / End · type to filter.
 */

export type SelectOption = string | { value: string; label: string };

const norm = (o: SelectOption) => (typeof o === "string" ? { value: o, label: o } : o);

/* ──────────────────────────────────────────────────────────────────────────
   1. DropdownOption (Figma: Dropdown Option [133:33314])
   ────────────────────────────────────────────────────────────────────────── */
export interface DropdownOptionProps {
  label: string;
  value?: string;
  state?: "Default" | "Hover" | "Selected";
  selected?: boolean;
  active?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  className?: string;
  id?: string;
  role?: string;
  "aria-selected"?: boolean;
  "data-index"?: number;
}

export function DropdownOption({
  label,
  value,
  state,
  selected = false,
  active = false,
  onClick,
  onMouseEnter,
  className,
  id,
  role = "option",
  "aria-selected": ariaSelected,
  "data-index": dataIndex,
}: DropdownOptionProps) {
  const isSelected = state === "Selected" || selected;
  const isHover = state === "Hover" || active;

  return (
    <li
      id={id}
      role={role}
      data-index={dataIndex}
      aria-selected={ariaSelected ?? isSelected}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseDown={(e) => e.preventDefault()}
      className={cn(
        "flex h-11 min-h-[44px] w-full cursor-pointer items-center gap-2 rounded-sm px-3 py-2.5 text-body-md transition-colors",
        isSelected
          ? "bg-brand-subtle font-semibold text-brand-text"
          : isHover
          ? "bg-surface-subtle font-normal text-ink"
          : "font-normal text-ink hover:bg-surface-subtle",
        className
      )}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {isSelected && (
        <span className="flex shrink-0 text-icon-brand">
          <TickCircle size={20} color="currentColor" />
        </span>
      )}
    </li>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   2. DropdownMenu (Figma: Dropdown Menu [133:33402])
   ────────────────────────────────────────────────────────────────────────── */
export interface DropdownMenuProps {
  search?: boolean;
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  options?: SelectOption[];
  selectedValue?: string;
  onSelect?: (value: string) => void;
  emptyText?: string;
  className?: string;
  children?: React.ReactNode;
  listId?: string;
  listRef?: React.RefObject<HTMLUListElement | null>;
  searchRef?: React.RefObject<HTMLInputElement | null>;
  activeId?: string;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  label?: string;
}

export function DropdownMenu({
  search = true,
  searchPlaceholder = "Search…",
  searchQuery = "",
  onSearchChange,
  options = [],
  selectedValue,
  onSelect,
  emptyText,
  className,
  children,
  listId,
  listRef,
  searchRef,
  activeId,
  activeIndex = 0,
  onActiveIndexChange,
  label,
}: DropdownMenuProps) {
  const normalized = useMemo(() => options.map(norm), [options]);
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return q ? normalized.filter((o) => o.label.toLowerCase().includes(q)) : normalized;
  }, [normalized, searchQuery]);

  return (
    <div
      className={cn(
        "flex w-full min-w-[240px] flex-col gap-1 rounded-md border border-line bg-surface-card p-2 shadow-lg",
        className
      )}
    >
      {search && (
        <>
          <div className="flex h-10 w-full items-center gap-2 rounded-sm border border-line bg-surface-subtle px-3 transition-colors focus-within:border-brand-focus">
            <SearchNormal1 size={18} color="currentColor" className="shrink-0 text-icon-muted" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={label ? `Search ${label}` : "Search options"}
              aria-controls={listId}
              aria-activedescendant={activeId}
              role="combobox"
              aria-expanded
              aria-autocomplete="list"
              className="h-full w-full min-w-0 bg-transparent text-body-md text-ink placeholder:text-ink-disabled outline-none"
            />
          </div>
          <div className="h-px w-full bg-line my-0.5" />
        </>
      )}

      {children ?? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={search ? undefined : activeId}
          className="flex max-h-[264px] flex-col gap-0.5 overflow-y-auto outline-none"
        >
          {filtered.length === 0 ? (
            <li className="flex flex-col items-center py-4 text-center">
              <span className="text-body-sm text-ink-tertiary">
                {emptyText ?? `No results for “${searchQuery}”`}
              </span>
            </li>
          ) : (
            filtered.map((opt, i) => (
              <DropdownOption
                key={opt.value}
                id={activeId && i === activeIndex ? activeId : undefined}
                data-index={i}
                label={opt.label}
                value={opt.value}
                selected={opt.value === selectedValue}
                active={i === activeIndex}
                onMouseEnter={() => onActiveIndexChange?.(i)}
                onClick={() => onSelect?.(opt.value)}
              />
            ))
          )}
        </ul>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   3. Select (Figma: Input Type=Select + Dropdown Menu)
   ────────────────────────────────────────────────────────────────────────── */
export interface SelectProps {
  label?: string;
  hint?: string;
  helper?: React.ReactNode;
  error?: React.ReactNode;
  icon?: React.ReactNode;
  placeholder?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  containerClassName?: string;
  "aria-label"?: string;
}

export function Select({
  label,
  hint,
  helper,
  error,
  icon,
  placeholder = "Select",
  options,
  value,
  onChange,
  searchable,
  searchPlaceholder = "Search…",
  disabled,
  id,
  name,
  containerClassName,
  "aria-label": ariaLabel,
}: SelectProps) {
  const auto = useId();
  const triggerId = id ?? `${auto}-trigger`;
  const listId = `${auto}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const all = useMemo(() => options.map(norm), [options]);
  const withSearch = searchable ?? all.length > 4;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [dropUp, setDropUp] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? all.filter((o) => o.label.toLowerCase().includes(q)) : all;
  }, [all, query]);

  const selected = all.find((o) => o.value === value);

  const openMenu = () => {
    if (disabled) return;
    const r = triggerRef.current?.getBoundingClientRect();
    setDropUp(!!r && window.innerHeight - r.bottom < 340 && r.top > 340);
    setQuery("");
    setActive(Math.max(0, all.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const close = (focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  };

  const choose = (v: string) => {
    onChange(v);
    close();
  };

  // Focus search / keep active option visible
  useEffect(() => {
    if (!open) return;
    if (withSearch) searchRef.current?.focus();
    else listRef.current?.focus();
  }, [open, withSearch]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  useEffect(() => setActive(0), [query]);

  // Close on outside click
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
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((a) => Math.min(a + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(filtered.length - 1);
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[active]) choose(filtered[active].value);
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        close(false);
        break;
    }
  };

  const activeId = filtered[active] ? `${auto}-opt-${filtered[active].value}` : undefined;

  return (
    <Field label={label} hint={hint} htmlFor={triggerId} helper={helper} error={error} className={containerClassName}>
      <div ref={rootRef} className="relative w-full" onKeyDown={onKey}>
        {name && <input type="hidden" name={name} value={value} />}
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-invalid={!!error}
          onClick={() => (open ? close() : openMenu())}
          className={cn(
            controlShell({ error: !!error, disabled }),
            "cursor-pointer text-left outline-none",
            open && !error && "border-brand shadow-ring-brand"
          )}
        >
          {icon && <span className="flex shrink-0 text-ink-tertiary">{icon}</span>}
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-body-md",
              selected ? "text-ink" : "text-ink-tertiary"
            )}
          >
            {selected ? selected.label : placeholder}
          </span>
          <ArrowDown2
            size={20}
            color="currentColor"
            className={cn(
              "shrink-0 text-ink-tertiary transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>

        {open && (
          <div
            className={cn(
              "absolute left-0 right-0 z-50 animate-fade-up",
              dropUp ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]"
            )}
          >
            <DropdownMenu
              search={withSearch}
              searchPlaceholder={searchPlaceholder}
              searchQuery={query}
              onSearchChange={setQuery}
              options={all}
              selectedValue={value}
              onSelect={choose}
              listId={listId}
              listRef={listRef}
              searchRef={searchRef}
              activeId={activeId}
              activeIndex={active}
              onActiveIndexChange={setActive}
              label={label ?? ariaLabel}
            />
          </div>
        )}
      </div>
    </Field>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   4. SortDropdown (Figma: Sort Dropdown [86:19427])
   ────────────────────────────────────────────────────────────────────────── */
export interface SortDropdownProps {
  value?: string;
  onChange?: (value: string) => void;
  options?: string[];
  prefix?: string;
  className?: string;
}

const DEFAULT_SORT_OPTIONS = [
  "Newest first",
  "Recently active",
  "Age (low–high)",
  "Age (high–low)",
  "Best match",
];

export function SortDropdown({
  value = "Newest first",
  onChange,
  options = DEFAULT_SORT_OPTIONS,
  prefix = "Sort by:",
  className,
}: SortDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative inline-block", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-[40px] items-center gap-1.5 rounded-md border border-line-strong bg-surface-card pl-3.5 pr-2.5 transition-all outline-none",
          "hover:border-ink-tertiary",
          open && "border-brand shadow-ring-brand"
        )}
      >
        <TextalignLeft size={16} color="currentColor" className="shrink-0 text-icon-muted" />
        <span className="text-label-md text-ink-tertiary">{prefix}</span>
        <span className="text-label-md text-ink font-semibold">{value}</span>
        <ArrowDown2
          size={16}
          color="currentColor"
          className={cn("shrink-0 text-ink-tertiary transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[200px] animate-fade-up">
          <DropdownMenu
            search={false}
            options={options}
            selectedValue={value}
            onSelect={(val) => {
              onChange?.(val);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
