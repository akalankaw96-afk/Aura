"use client";

import React, { useEffect, useId, useRef } from "react";
import { CloseCircle } from "iconsax-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

/**
 * Shared dialog (S05-T03, TD-02). Built on the native `<dialog>` opened with `showModal()`, so the browser keeps
 * focus inside, makes the page behind inert and puts it on top of everything. On top of that:
 *  • Esc / backdrop click / close button → `onClose` (turn off with `dismissible={false}` while something must finish)
 *  • the page behind stops scrolling (nested dialogs are counted)
 *  • first focus: the element with `data-autofocus`, else the browser's first focusable element
 *  • focus goes back to the element that opened it
 *  • `aria-labelledby` / `aria-describedby` wired to `title` / `description` (or your own ids)
 *  • phones: a sheet from the bottom; tablet and up: centred card — or `placement="left"` for a side drawer (menus)
 * Render it always and toggle `open` — it renders nothing while closed.
 */
export type ModalSize = "sm" | "md" | "lg" | "xl";

const SIZES: Record<ModalSize, string> = {
  sm: "sm:max-w-[440px]",
  md: "sm:max-w-[520px]",
  lg: "sm:max-w-[640px]",
  xl: "sm:max-w-[880px]",
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Heading shown in the default header (with a close button). Leave out to draw your own header. */
  title?: React.ReactNode;
  /** Short text under the title (read out after the title by screen readers). */
  description?: React.ReactNode;
  /** Id of your own heading when you don't pass `title`. */
  labelledBy?: string;
  /** Id of your own description when you don't pass `description`. */
  describedBy?: string;
  /** Accessible name when there is no visible heading at all. */
  ariaLabel?: string;
  size?: ModalSize;
  /** center (default): sheet on phones, card from `sm` · left: full-height drawer from the left (280px wide). */
  placement?: "center" | "left";
  /** false = Esc and backdrop click do nothing and the close button is hidden (e.g. while paying). */
  dismissible?: boolean;
  /** false = only Esc and the close button close it. */
  closeOnBackdrop?: boolean;
  /** Hide the default close button (your own header has one). */
  hideClose?: boolean;
  /** Change it to replay the open animation (e.g. on each step of a flow). */
  animationKey?: React.Key;
  /** Classes for the card. */
  className?: string;
  /** Classes for the scrollable body under the default header. */
  bodyClassName?: string;
  children?: React.ReactNode;
}

let openCount = 0;
let savedOverflow = "";

function lockScroll() {
  if (openCount === 0) {
    savedOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
  }
  openCount += 1;
}

function unlockScroll() {
  openCount = Math.max(0, openCount - 1);
  if (openCount === 0) document.documentElement.style.overflow = savedOverflow;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  labelledBy,
  describedBy,
  ariaLabel,
  size = "md",
  placement = "center",
  dismissible = true,
  closeOnBackdrop = true,
  hideClose = false,
  animationKey,
  className,
  bodyClassName,
  children,
}: Readonly<ModalProps>) {
  const ref = useRef<HTMLDialogElement>(null);
  const autoId = useId();
  const titleId = title ? `${autoId}-title` : labelledBy;
  const descId = description ? `${autoId}-desc` : describedBy;
  // latest onClose without re-running the open effect
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const d = ref.current;
    if (!open || !d) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!d.open) d.showModal();
    // React's autoFocus runs before showModal() and gets overridden — use data-autofocus instead
    d.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    lockScroll();
    return () => {
      if (d.open) d.close();
      unlockScroll();
      // back to where the member was (if it is still on the page)
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  const requestClose = () => {
    if (dismissible) closeRef.current();
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descId}
      aria-label={titleId ? undefined : ariaLabel}
      aria-modal="true"
      onCancel={(e) => {
        e.preventDefault(); // we close through state, not the browser
        requestClose();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-black/45 backdrop:backdrop-blur-md"
    >
      <div className={cn("relative flex h-full", placement === "left" ? "justify-start" : "items-end justify-center sm:items-center sm:p-4")}>
        {/* backdrop click — a plain element, so it can never take focus */}
        <div aria-hidden="true" className="absolute inset-0" onClick={() => closeOnBackdrop && requestClose()} />
        <div
          key={animationKey}
          className={cn(
            placement === "left"
              ? "drawer-in relative flex h-full w-[280px] max-w-[85vw] flex-col overflow-hidden bg-surface-card shadow-xl"
              : cn("relative flex max-h-full w-full animate-dialog-in flex-col overflow-hidden rounded-t-[28px] bg-surface-card shadow-xl sm:rounded-[28px]", SIZES[size]),
            className,
          )}
        >
          {title ? (
            <>
              <div className="flex items-start gap-3 px-5 pb-2 pt-5 sm:px-6 sm:pt-6">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <h2 id={titleId} className="text-h5 text-ink">
                    {title}
                  </h2>
                  {description && (
                    <p id={descId} className="text-body-sm text-ink-secondary">
                      {description}
                    </p>
                  )}
                </div>
                {dismissible && !hideClose && <CloseButton onClick={requestClose} />}
              </div>
              <div className={cn("flex flex-col gap-4 overflow-y-auto px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-2 sm:px-6 sm:pb-6", bodyClassName)}>
                {children}
              </div>
            </>
          ) : (
            <div className={cn("relative flex min-h-0 flex-col overflow-y-auto", bodyClassName)}>
              {dismissible && !hideClose && (
                <div className="absolute right-3 top-3 z-10">
                  <CloseButton onClick={requestClose} />
                </div>
              )}
              {description && (
                <p id={descId} className="sr-only">
                  {description}
                </p>
              )}
              {children}
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}

function CloseButton({ onClick }: Readonly<{ onClick: () => void }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-tertiary transition-colors hover:bg-surface-subtle hover:text-ink focus-visible:outline-none focus-visible:shadow-ring-brand"
    >
      <CloseCircle size={24} color="currentColor" />
    </button>
  );
}

/* ───────────── Confirm ───────────── */

export interface ConfirmDialogProps {
  open: boolean;
  title: React.ReactNode;
  /** What will happen. */
  description?: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** danger = red confirm button (block, delete, reject). */
  tone?: "primary" | "danger";
  /** Shows a spinner on the confirm button and stops closing while the action runs. */
  busy?: boolean;
  /** Disable the confirm button (e.g. a required reason is empty). */
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Extra content between the text and the buttons (e.g. a reason field). */
  children?: React.ReactNode;
}

/** "Are you sure?" dialog built on `Modal`: title, text, optional extra field, Cancel + Confirm. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "primary",
  busy = false,
  confirmDisabled = false,
  onConfirm,
  onCancel,
  children,
}: Readonly<ConfirmDialogProps>) {
  return (
    <Modal open={open} onClose={onCancel} title={title} description={description} size="sm" dismissible={!busy}>
      {children}
      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
        <Button variant="outline" size="md" onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </Button>
        <Button variant={tone === "danger" ? "danger" : "primary"} size="md" onClick={onConfirm} loading={busy} disabled={confirmDisabled}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
