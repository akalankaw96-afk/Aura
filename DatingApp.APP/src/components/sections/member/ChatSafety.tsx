"use client";

import React, { useEffect, useRef, useState } from "react";
import { Ban, Bell, BellOff, CircleCheck, Flag, Phone, ShieldX, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { useLanguage } from "@/context/LanguageContext";

/* ------------------------------------------------------------------ */
/* Figma: Action Menu — chat header ⋯ menu                             */
/* ------------------------------------------------------------------ */
export function ChatActionMenu({
  muted,
  onViewProfile,
  onToggleMute,
  onBlock,
  onReport,
  compactItems = [],
  trigger,
}: {
  muted: boolean;
  /** extra items shown only on small screens (header buttons that don't fit on phones) */
  compactItems?: { key: string; label: string; onClick: () => void }[];
  onViewProfile?: () => void;
  onToggleMute: () => void;
  onBlock: () => void;
  onReport: () => void;
  trigger: (props: { open: boolean; toggle: () => void }) => React.ReactNode;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = (icon: React.ReactNode, label: string, onClick: () => void, danger?: boolean, i = 0) => (
    <button
      key={label}
      type="button"
      role="menuitem"
      onClick={() => {
        setOpen(false);
        onClick();
      }}
      style={{ animation: `fade-up 260ms ease-out ${i * 40}ms backwards` }}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-label-md transition-colors",
        danger ? "text-error-fg hover:bg-error-bg" : "text-ink hover:bg-surface-subtle"
      )}
    >
      <span className={cn("shrink-0", danger ? "text-error-fg" : "text-icon-brand")}>{icon}</span>
      {label}
    </button>
  );

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-30 w-[220px] origin-top-right animate-pop-in rounded-lg border border-line bg-surface-card p-1.5 shadow-xl"
        >
          {compactItems.length > 0 && (
            <div className="md:hidden">
              {compactItems.map((c, i) => item(c.key === "profile" ? <UserRound size={18} /> : <Phone size={18} />, c.label, c.onClick, false, i))}
              <div className="my-1 h-px bg-line" />
            </div>
          )}
          {onViewProfile && item(<UserRound size={18} />, t.messages.viewProfile, onViewProfile, false, 0)}
          {item(
            muted ? <Bell size={18} /> : <BellOff size={18} />,
            muted ? t.messages.unmuteNotifications : t.messages.muteNotifications,
            onToggleMute,
            false,
            1
          )}
          <div className="my-1 h-px bg-line" />
          {item(<Ban size={18} />, t.messages.block, onBlock, true, 2)}
          {item(<Flag size={18} />, t.messages.report, onReport, true, 3)}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Figma: Block Confirm Dialog                                         */
/* ------------------------------------------------------------------ */
export function BlockConfirmDialog({
  name,
  open,
  onCancel,
  onConfirm,
}: {
  name: string;
  open: boolean;
  onCancel: () => void;
  onConfirm: (opts: { reason: string; report: boolean }) => void;
}) {
  const { t } = useLanguage();
  const [reason, setReason] = useState("");
  const [report, setReport] = useState(false);
  const [closing, setClosing] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    setReason("");
    setReport(false);
    setClosing(false);
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(onCancel);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  function close(after: () => void) {
    setClosing(true);
    window.setTimeout(after, 180);
  }

  const points = [t.messages.blockPoint1, t.messages.blockPoint2, t.messages.blockPoint3];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        aria-hidden
        onClick={() => close(onCancel)}
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200",
          closing ? "opacity-0" : "animate-fade-in"
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="block-dialog-title"
        className={cn(
          "relative w-full max-w-[440px] rounded-xl bg-surface-card p-6 shadow-xl transition-all duration-200",
          closing ? "scale-95 opacity-0" : "animate-dialog-in"
        )}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-error-bg text-error-fg">
            <Ban size={22} />
          </span>
          <h2 id="block-dialog-title" className="text-h5 text-ink">
            {t.messages.blockTitle(name)}
          </h2>
        </div>

        <ul className="mt-5 flex flex-col gap-2">
          {points.map((p, i) => (
            <li
              key={p}
              className="flex items-center gap-2 text-body-sm text-ink-secondary"
              style={{ animation: `fade-up 300ms ease-out ${120 + i * 60}ms backwards` }}
            >
              <CircleCheck size={16} className="shrink-0 text-error-fg" />
              {p}
            </li>
          ))}
        </ul>

        <div className="mt-5">
          <Select
            label={t.messages.reasonLabel}
            placeholder={t.messages.reasonPlaceholder}
            options={t.messages.reasons}
            value={reason}
            onChange={setReason}
            searchable={false}
          />
        </div>

        <Checkbox checked={report} onChange={setReport} className="mt-4">
          <span className="text-body-sm text-ink-secondary">{t.messages.alsoReport}</span>
        </Checkbox>

        <div className="mt-6 flex justify-end gap-3">
          <Button ref={cancelRef} variant="outline" onClick={() => close(onCancel)}>
            {t.messages.cancel}
          </Button>
          <Button variant="danger" onClick={() => close(() => onConfirm({ reason, report }))}>
            {t.messages.block}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Figma: Blocked Row (State = Default / Selected)                     */
/* ------------------------------------------------------------------ */
export function BlockedRow({
  name,
  photo,
  meta,
  selected,
  index = 0,
  leaving,
  onSelect,
  onUnblock,
}: {
  name: string;
  photo: string;
  meta: string;
  selected?: boolean;
  index?: number;
  leaving?: boolean;
  onSelect: () => void;
  onUnblock: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div
      className={cn("grid transition-[grid-template-rows,opacity] duration-300", leaving ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr]")}
      style={{ animation: `fade-up 450ms cubic-bezier(0.22,1,0.36,1) ${index * 60}ms backwards` }}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          role="button"
          tabIndex={0}
          onClick={onSelect}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect()}
          className={cn(
            "mb-1 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all duration-200",
            selected ? "border-line-strong bg-surface-subtle" : "border-transparent hover:bg-surface-subtle"
          )}
        >
          <div className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="" className="h-12 w-12 rounded-full bg-brand-subtle object-cover grayscale-[60%]" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-surface-card bg-error-fg text-white">
              <Ban size={10} strokeWidth={3} />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-label-lg text-ink">{name}</p>
            <p className="truncate text-body-sm text-ink-secondary">{meta}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onUnblock();
            }}
          >
            {t.messages.unblock}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Figma: Blocked Notice — shown over the faded thread                 */
/* ------------------------------------------------------------------ */
export function BlockedNotice({ name, onReport, onUnblock }: { name: string; onReport: () => void; onUnblock: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="mx-auto flex w-full max-w-[440px] animate-dialog-in flex-col items-center gap-3 rounded-xl border border-line bg-surface-card p-6 text-center shadow-lg">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-error-bg text-error-fg">
        <ShieldX size={24} />
      </span>
      <h3 className="text-h6 text-ink">{t.messages.youBlocked(name)}</h3>
      <p className="text-body-sm text-ink-secondary">{t.messages.youBlockedBody}</p>
      <div className="mt-1 flex gap-3">
        <Button size="sm" variant="outline" className="rounded-full" onClick={onReport}>
          {t.messages.report}
        </Button>
        <Button size="sm" variant="primary" className="rounded-full" onClick={onUnblock}>
          {t.messages.unblock}
        </Button>
      </div>
    </div>
  );
}

/** Figma: Composer — Blocked (read-only) */
export function BlockedComposer() {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-[54px] animate-fade-in items-center justify-center border-t border-line px-4 py-4 text-center text-body-sm text-ink-secondary">
      {t.messages.cantReply}
    </div>
  );
}

/** Empty state for the Blocked filter */
export function BlockedEmpty() {
  const { t } = useLanguage();
  return (
    <div className="flex animate-fade-up flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-subtle text-icon-muted">
        <Ban size={22} />
      </span>
      <p className="text-label-lg text-ink">{t.messages.noBlockedTitle}</p>
      <p className="text-body-sm text-ink-secondary">{t.messages.noBlockedBody}</p>
    </div>
  );
}
