"use client";

import React from "react";
import { Edit2, Gallery, GalleryAdd, Star1, Trash } from "iconsax-react";
import { cn } from "@/lib/cn";
import { Badge } from "./Badge";
import { isIllustration } from "@/content/avatars";

/**
 * Figma: Register 05 · Photos → Photo slot (shared with Dashboard → Edit profile).
 * Filled: photo + status badge + round glass actions (change / make main / remove).
 * Empty: dashed brand-subtle tile ("Add your main photo" on the main slot).
 */
export interface PhotoSlotProps {
  src: string | null;
  main?: boolean;
  rejected?: boolean;
  /** new photo waiting for moderation */
  inReview?: boolean;
  label?: string;
  onPick: () => void;
  onRemove?: () => void;
  onMakeMain?: () => void;
  className?: string;
}

const action =
  "flex h-8 w-8 items-center justify-center rounded-full bg-surface-glass-strong shadow-sm transition-colors hover:bg-surface-card";

export function PhotoSlot({ src, main, rejected, inReview, label = "Add photo", onPick, onRemove, onMakeMain, className }: PhotoSlotProps) {
  if (src) {
    const illustration = isIllustration(src);
    return (
      <div className={cn("group relative overflow-hidden rounded-lg bg-surface-muted", rejected && "ring-2 ring-error-fg ring-offset-2 ring-offset-surface-card", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={main ? "Main photo" : "Photo"} className="h-full w-full object-cover" />
        <span className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1">
          {main &&
            (rejected ? (
              <Badge tone="error">Rejected</Badge>
            ) : (
              <Badge tone={illustration ? "info" : "success"}>{illustration ? "Illustration" : "Main photo"}</Badge>
            ))}
          {inReview && <Badge tone="warning">In review</Badge>}
        </span>
        <div className="absolute bottom-2.5 left-2.5 flex gap-2">
          <button type="button" onClick={onPick} aria-label="Change photo" title="Change photo" className={cn(action, "text-brand")}>
            <Edit2 size={16} color="currentColor" />
          </button>
          {onMakeMain && !main && (
            <button type="button" onClick={onMakeMain} aria-label="Make main photo" title="Make main photo" className={cn(action, "text-premium-fg")}>
              <Star1 size={16} color="currentColor" />
            </button>
          )}
          {onRemove && (
            <button type="button" onClick={onRemove} aria-label="Remove photo" title="Remove photo" className={cn(action, "text-error-fg")}>
              <Trash size={16} color="currentColor" />
            </button>
          )}
        </div>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-dashed border-brand-focus bg-brand-subtle px-2 text-center text-brand transition-colors hover:border-brand hover:bg-surface-card",
        main ? "text-body-sm font-semibold" : "text-label-sm",
        className,
      )}
    >
      {main ? <Gallery size={28} color="currentColor" /> : <GalleryAdd size={22} color="currentColor" />}
      {main ? "Add your main photo" : label}
      {main && <span className="text-body-xs font-normal text-ink-tertiary">JPG or PNG, up to 5 MB</span>}
    </button>
  );
}
