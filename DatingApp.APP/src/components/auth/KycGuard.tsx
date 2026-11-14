"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { flashToast } from "@/components/ui/Toast";
import { readKyc } from "@/lib/verification";

/**
 * Member pages that need an approved profile (Friends, Messages):
 * while the profile is under review (or changes were requested) the member is sent
 * back to the locked Dashboard, which explains what's pending.
 */
export function KycGuard() {
  const router = useRouter();
  useEffect(() => {
    if (readKyc() !== "live") {
      flashToast("info", "Available after approval", "We’re still reviewing your profile. This unlocks once you’re approved.");
      router.replace("/dashboard");
    }
  }, [router]);
  return null;
}
