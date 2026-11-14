"use client";

import { Crown1, MessageText1 } from "iconsax-react";
import { Button, Card, LoveSticker } from "@/components/ui";
import { openFeedback } from "@/lib/feedback";

/** Support page: opens the feedback popup (rating, feedback, success story). Paid members only. */
export function ShareFeedbackCard() {
  return (
    <Card className="relative flex flex-col gap-5 overflow-hidden p-5 shadow-sm sm:p-6 md:flex-row md:items-center">
      <span className="relative shrink-0 self-start md:self-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/couple.png" alt="" width={72} height={72} className="h-[72px] w-[72px] rounded-full border-4 border-surface-card object-cover shadow-md" />
        <LoveSticker variant="double" size={30} rotate={12} className="absolute -right-3 -top-2" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h2 className="flex flex-wrap items-center gap-2 text-h5 text-ink">
          Share feedback
          <span className="inline-flex h-[22px] items-center gap-1 rounded-full bg-premium-bg px-2 text-label-sm text-premium-fg">
            <Crown1 size={14} color="currentColor" /> Gold and Platinum
          </span>
        </h2>
        <p className="text-body-sm text-ink-secondary">Rate Vikasitha, tell us what to improve, or share your success story with other families.</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button variant="outline" size="md" onClick={() => openFeedback("story")}>
          Share your story
        </Button>
        <Button size="md" onClick={() => openFeedback()} leftIcon={<MessageText1 size={18} color="currentColor" />}>
          Share feedback
        </Button>
      </div>
    </Card>
  );
}
