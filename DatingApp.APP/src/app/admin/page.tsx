import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RequireMember } from "@/components/auth/RequireMember";
import { AdminScreen } from "@/components/sections/admin/AdminScreen";

export const metadata: Metadata = { title: "Staff area | Vikasitha" };

/**
 * Staff back office (S02-T11): review queue, profile review with photos + ID documents, decisions,
 * new-photo queue and (Admin) staff roles. Admin / Moderator only — the API enforces it on every call.
 */
export default function AdminPage() {
  return (
    <div className="flex min-h-screen flex-col bg-page-gradient">
      <RequireMember role={["Admin", "Moderator"]} />
      <Navbar variant="member" />
      <main className="container-page flex-1 py-8">
        <AdminScreen />
      </main>
      <Footer />
    </div>
  );
}
