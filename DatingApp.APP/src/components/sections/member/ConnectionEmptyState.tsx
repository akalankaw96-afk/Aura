import type { ReactNode } from "react";
import { CoupleAvatar } from "@/components/ui/Brand";
import { LoveSticker } from "@/components/ui/Decor";
import { cn } from "@/lib/cn";

/** Uses the existing Figma couple avatar and love stickers for connection empty states. */
export function ConnectionEmptyState({ title, body, action, compact = false }: {
  title: string;
  body: string;
  action: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn(
      "flex animate-fade-up flex-col items-center gap-5 px-4 text-center",
      compact ? "py-8" : "py-12 sm:py-16",
    )}>
      <div className="relative rounded-full bg-brand-subtle p-4" aria-hidden="true">
        <CoupleAvatar size={compact ? 96 : 144} className="shadow-sm" />
        <LoveSticker variant="outline" size={28} rotate={-12} className="absolute left-0 top-2" />
        <LoveSticker variant="sparkle" size={32} rotate={12} className="absolute -right-2 bottom-2" />
      </div>
      <div className="flex max-w-sm flex-col gap-2">
        <h2 className={cn(compact ? "text-h6" : "text-h4", "text-ink")}>{title}</h2>
        <p className="text-body-sm text-ink-secondary">{body}</p>
      </div>
      {action}
    </div>
  );
}
