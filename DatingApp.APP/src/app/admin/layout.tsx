import type { Metadata } from "next";
import { RequireMember } from "@/components/auth/RequireMember";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Staff area | Yugadiwi", robots: { index: false, follow: false } };

/**
 * Staff back office (/admin/*): own shell (sidebar + slim top bar), no marketing navbar / footer.
 * Admin / Moderator only — RequireMember redirects others, and the API checks every call again.
 */
export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <RequireMember role={["Admin", "Moderator"]} />
      <AdminShell>{children}</AdminShell>
    </>
  );
}
