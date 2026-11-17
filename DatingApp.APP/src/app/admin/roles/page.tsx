"use client";

import { AdminRoles } from "@/components/admin/AdminRoles";
import { useAdmin } from "@/components/admin/AdminShell";

/** Admin only — moderators see a short note (the API refuses these calls for them anyway). */
export default function Page() {
  const { isAdmin } = useAdmin();
  if (!isAdmin) return <p className="text-body-md text-ink-secondary">Only admins can manage roles and staff.</p>;
  return <AdminRoles />;
}
