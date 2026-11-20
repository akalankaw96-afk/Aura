"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { flashToast } from "@/components/ui/Toast";
import { hasStoredSession } from "@/lib/http";
import { readSessionData } from "@/lib/storage";

/**
 * Member-only pages (S01-T08): guests are sent to /login?next=<this page> and come back after logging in.
 * With `role`, only members with that role stay (e.g. the staff area) — the API enforces the same rule
 * with its Admin / Staff policies, so this is about not showing a page that would only fail.
 */
export function RequireMember({ role }: { role?: string | string[] }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const check = () => {
      if (!hasStoredSession()) {
        const here = pathname + window.location.search;
        router.replace(`/login?next=${encodeURIComponent(here)}`);
        return;
      }
      if (!role) return;
      const allowed = Array.isArray(role) ? role : [role];
      // unreadable session → treated as no role
      const current = readSessionData<{ role?: string }>()?.role ?? "";
      if (!allowed.includes(current)) {
        flashToast("info", "Staff only", "This area needs a staff account.");
        router.replace("/dashboard");
      }
    };
    check();
    // logging out in another tab (or the session ending) leaves the page too
    window.addEventListener("aura_auth_change", check);
    window.addEventListener("storage", check);
    return () => {
      window.removeEventListener("aura_auth_change", check);
      window.removeEventListener("storage", check);
    };
  }, [pathname, role, router]);

  return null;
}
