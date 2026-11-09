"use client";

import React from "react";
import { DemoTips } from "@/components/auth/DemoTips";
import { useToast } from "@/components/ui/Toast";
import { useAccess } from "@/lib/verification";
import { FREE_LIMITS, resetUsage } from "@/lib/usage";

/**
 * Dashboard demo switcher (no API): jump between the four member states.
 *  1. KYC pending           — dashboard locked, "under review"
 *  2. KYC rejected          — changes needed, fix & resubmit
 *  3. KYC approved · Free   — usage limits + upgrade prompts
 *  4. KYC approved · Gold   — everything unlocked
 */
export function DashboardDemo() {
  const toast = useToast();
  const { status, plan, setStatus, setPlan } = useAccess();
  const paid = plan !== "free";

  const go = (kyc: "pending" | "changes" | "live", gold: boolean, title: string, text: string) => {
    setPlan(gold ? "gold" : "free");
    setStatus(kyc);
    resetUsage();
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.info(title, text);
  };

  return (
    <DemoTips
      tips={[
        { label: "KYC status", value: status === "live" ? "approved" : status === "changes" ? "rejected" : status },
        { label: "Plan", value: paid ? plan : "free" },
        { label: "Free limits", value: `${FREE_LIMITS.messages} msg · ${FREE_LIMITS.searches} search · ${FREE_LIMITS.interests} int.` },
      ]}
      actions={[
        { label: "1 · KYC pending", active: status === "pending" || status === "resubmitted", onClick: () => go("pending", false, "KYC pending", "Profile under review — features are locked.") },
        { label: "2 · KYC rejected", active: status === "changes", onClick: () => go("changes", false, "KYC rejected", "3 fields need changes — tap Edit & resubmit.") },
        { label: "3 · Approved · Free", active: status === "live" && !paid, onClick: () => go("live", false, "Approved · Free plan", "Limited messages, searches and interests.") },
        { label: "4 · Approved · Pro", active: status === "live" && paid, onClick: () => go("live", true, "Approved · Gold", "Every feature is unlocked.") },
        { label: "Reset usage", onClick: () => { resetUsage(); toast.success("Usage reset", "This month’s free allowance is back to full."); } },
      ]}
    />
  );
}
