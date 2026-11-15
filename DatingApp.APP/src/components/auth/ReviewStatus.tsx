"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Old "fix rejected fields" address (/register/status?fix=details | photo). Fixing now happens on
 * /profile/complete with the reasons from the server (S02-T10); this keeps old links and SMS links working.
 */
export function ReviewStatus() {
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    router.replace(params.get("fix") === "photo" ? "/profile/complete?step=photos" : "/profile/complete?step=details");
  }, [params, router]);
  return null;
}
