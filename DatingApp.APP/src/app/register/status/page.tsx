import type { Metadata } from "next";
import { Suspense } from "react";
import { ReviewStatus } from "@/components/auth/ReviewStatus";

export const metadata: Metadata = { title: "Fix your profile | Vikasitha" };

/** Fix the fields our safety team rejected (?fix=details | photo). Other states → Dashboard. */
export default function ReviewStatusPage() {
  return (
    <Suspense fallback={null}>
      <ReviewStatus />
    </Suspense>
  );
}
