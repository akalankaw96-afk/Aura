"use client";

import { useRouter } from "next/navigation";
import { ReportsQueue } from "@/components/sections/admin/StaffConsole";
import { AdminPageHeader } from "@/components/admin/AdminShell";

/** /admin/reports — members' reports (S03-T08): dismiss, handled, suspend. "Open profile" goes to the review screen. */
export default function Page() {
  const router = useRouter();
  return (
    <>
      <AdminPageHeader title="Reports" subtitle="Members reporting members, oldest first. The reporter is told it was reviewed, never the decision." />
      <ReportsQueue onOpenProfile={(id) => router.push(`/admin/reviews?open=${encodeURIComponent(id)}`)} onCount={() => undefined} />
    </>
  );
}
