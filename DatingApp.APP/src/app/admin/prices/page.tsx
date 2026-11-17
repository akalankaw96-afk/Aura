"use client";

import { PricesEditor } from "@/components/sections/admin/StaffConsole";
import { AdminPageHeader, useAdmin } from "@/components/admin/AdminShell";

/** /admin/prices — plan and boost prices (S04-T01). Admin only; the API checks too. */
export default function Page() {
  const { isAdmin } = useAdmin();
  if (!isAdmin) return <p className="text-body-md text-ink-secondary">Only admins can change prices.</p>;
  return (
    <>
      <AdminPageHeader title="Prices" subtitle="What members pay for Gold, Platinum and boosts. Changes show on the Plans page at once." />
      <PricesEditor />
    </>
  );
}
