"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CloseSquare } from "iconsax-react";
import { cn } from "@/lib/cn";
import { StatusIcon, type StatusType } from "./StatusIcon";

/**
 * Figma: Toast (Type = Success / Error / Warning / Info)
 * Shown top-centre (agreed in the design review). The accent line at the top
 * fills left → right over 4s (pauses on hover); when it is full the toast
 * slides out and closes.
 * Usage: const toast = useToast(); toast.success("Title", "Message")
 */
export interface ToastItem {
  id: number;
  type: StatusType;
  title: string;
  message?: string;
}

const accent: Record<StatusType, string> = {
  success: "bg-success-fg",
  error: "bg-error-fg",
  warning: "bg-warning-fg",
  info: "bg-info-fg",
};
const iconBg: Record<StatusType, string> = {
  success: "bg-success-bg",
  error: "bg-error-bg",
  warning: "bg-warning-bg",
  info: "bg-info-bg",
};

export const TOAST_DURATION = 4000;

export function ToastCard({
  item,
  onClose,
  static: isStatic,
  duration = TOAST_DURATION,
  paused,
  onProgressEnd,
}: {
  item: Omit<ToastItem, "id">;
  onClose?: () => void;
  static?: boolean;
  /** ms for the progress line to fill (live toasts only) */
  duration?: number;
  paused?: boolean;
  onProgressEnd?: () => void;
}) {
  return (
    <div
      role={item.type === "error" ? "alert" : "status"}
      className={cn(
        "relative flex w-[380px] max-w-[calc(100vw-32px)] items-start gap-3 overflow-hidden rounded-lg border border-line bg-surface-card p-3.5 shadow-xl",
        !isStatic && "pointer-events-auto"
      )}
    >
      {isStatic ? (
        <span className={cn("absolute left-0 top-0 h-[3px] w-1/4 rounded-br-full", accent[item.type])} />
      ) : (
        <>
          {/* track */}
          <span aria-hidden className={cn("absolute inset-x-0 top-0 h-[3px] opacity-15", accent[item.type])} />
          {/* progress — fills left → right, then the toast closes */}
          <span
            aria-hidden
            onAnimationEnd={onProgressEnd}
            className={cn("toast-progress absolute left-0 top-0 h-[3px] w-full rounded-r-full", accent[item.type])}
            style={{ ["--toast-duration" as string]: `${duration}ms`, animationPlayState: paused ? "paused" : "running" } as React.CSSProperties}
          />
        </>
      )}
      <span className={cn("toast-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-full", iconBg[item.type])}>
        <StatusIcon type={item.type} size={20} />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-label-lg font-bold text-ink">{item.title}</p>
        {item.message && <p className="mt-1 text-body-sm text-ink-secondary">{item.message}</p>}
      </div>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Dismiss" className="text-ink-tertiary hover:text-ink">
          <CloseSquare size={20} color="currentColor" />
        </button>
      )}
    </div>
  );
}

type ToastApi = {
  show: (type: StatusType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => setItems((s) => s.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (type: StatusType, title: string, message?: string) => {
      const id = ++idRef.current;
      // newest on top, max 2 visible
      setItems((s) => [{ id, type, title, message }, ...s].slice(0, 2));
    },
    []
  );

  const api: ToastApi = {
    show,
    success: (t, m) => show("success", t, m),
    error: (t, m) => show("error", t, m),
    warning: (t, m) => show("warning", t, m),
    info: (t, m) => show("info", t, m),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed left-1/2 top-5 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
        {items.map((t) => (
          <LiveToast key={t.id} item={t} onDone={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** One on-screen toast: enter → progress fills (pauses on hover) → exit → removed. */
function LiveToast({ item, onDone }: { item: ToastItem; onDone: () => void }) {
  const [hover, setHover] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const close = () => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(onDone, 280);
  };
  return (
    <div
      className={leaving ? "toast-leave" : "toast-enter"}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <ToastCard item={item} paused={hover || leaving} onProgressEnd={close} onClose={close} />
    </div>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

/** Fire a toast once when a page mounts with a ?toast= flag set by the previous page. */
export function useFlashToast() {
  const toast = useToast();
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("vk_flash_toast");
      if (raw) {
        sessionStorage.removeItem("vk_flash_toast");
        const t = JSON.parse(raw) as Omit<ToastItem, "id">;
        toast.show(t.type, t.title, t.message);
      }
    } catch {
      /* storage unavailable */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Queue a toast to show on the next page (survives router.push). */
export function flashToast(type: StatusType, title: string, message?: string) {
  try {
    sessionStorage.setItem("vk_flash_toast", JSON.stringify({ type, title, message }));
  } catch {
    /* storage unavailable */
  }
}
