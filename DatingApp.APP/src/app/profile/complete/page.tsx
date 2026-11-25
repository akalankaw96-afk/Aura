import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireMember } from "@/components/auth/RequireMember";
import { CompleteProfileFlow } from "@/components/auth/CompleteProfileFlow";

export const metadata: Metadata = { title: "Complete your profile | Yugadiwi" };

/** Finish a draft profile or fix flagged fields, then submit for review (S02-T10). */
export default function CompleteProfilePage() {
  return (
    <>
      <RequireMember />
      <Suspense fallback={null}>
        <CompleteProfileFlow />
      </Suspense>
    </>
  );
}
