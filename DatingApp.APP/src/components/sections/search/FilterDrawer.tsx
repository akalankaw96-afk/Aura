"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

/**
 * Filters on phones and tablets — a drawer from the left on the shared Modal (S05-T07, was a hand-made overlay).
 * Modal gives Esc, focus trap / restore and the scroll lock; it closes itself if the window grows to desktop width,
 * where the sidebar is shown instead.
 */
export function FilterDrawer({
  open,
  onClose,
  resultCount,
  children,
}: Readonly<{ open: boolean; onClose: () => void; resultCount: number; children: React.ReactNode }>) {
  useEffect(() => {
    if (!open) return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onChange = () => desktop.matches && onClose();
    onChange();
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, [open, onClose]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      placement="left"
      ariaLabel="Filters"
      className="w-[min(340px,92vw)] max-w-none bg-page"
      bodyClassName="flex-1 p-3 pt-14 [&>aside]:shrink-0"
    >
      {children}
      <Button variant="primary" className="sticky bottom-0 mt-3 shrink-0 rounded-full shadow-lg" onClick={onClose}>
        Show {resultCount} proposals
      </Button>
    </Modal>
  );
}
