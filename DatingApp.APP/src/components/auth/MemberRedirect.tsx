"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { hasSession } from "@/lib/session";

/**
 * Signed-in members never land on the public pages (Home, Log in, Create account):
 * they are sent straight to their Dashboard. Mount on those pages.
 */
export function MemberRedirect({ to = "/dashboard" }: { to?: string }) {
  const router = useRouter();
  useEffect(() => {
    if (hasSession()) router.replace(to);
  }, [router, to]);
  return null;
}
