"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  show: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => removeToast(id), 4000);
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => show("success", title, message), [show]);
  const error = useCallback((title: string, message?: string) => show("error", title, message), [show]);
  const info = useCallback((title: string, message?: string) => show("info", title, message), [show]);
  const warning = useCallback((title: string, message?: string) => show("warning", title, message), [show]);

  return (
    <ToastContext.Provider value={{ show, success, error, info, warning }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            className={`pointer-events-auto cursor-pointer rounded-xl p-4 shadow-lg border text-sm transition-all animate-fade-in ${
              t.type === "success"
                ? "bg-emerald-950 text-emerald-100 border-emerald-800"
                : t.type === "error"
                ? "bg-rose-950 text-rose-100 border-rose-800"
                : t.type === "warning"
                ? "bg-amber-950 text-amber-100 border-amber-800"
                : "bg-slate-900 text-slate-100 border-slate-700"
            }`}
          >
            <div className="font-bold">{t.title}</div>
            {t.message && <div className="text-xs opacity-90 mt-0.5">{t.message}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      show: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
      warning: () => {},
    };
  }
  return ctx;
}

