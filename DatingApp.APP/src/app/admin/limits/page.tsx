"use client";

import { PlanLimitsEditor } from "@/components/sections/admin/StaffConsole";
import { AdminPageHeader, useAdmin } from "@/components/admin/AdminShell";

/** /admin/limits — monthly allowances per plan (S03-T02). Admin only; the API checks too. */
export default function Page() {
  const { isAdmin } = useAdmin();
  if (!isAdmin) return <p className="text-body-md text-ink-secondary">Only admins can change plan limits.</p>;
  return (
    <>
      <AdminPageHeader title="Plan limits" subtitle="Searches, profile views, interests and new chats per month for each plan." />
      <PlanLimitsEditor />
    </>
  );
}
