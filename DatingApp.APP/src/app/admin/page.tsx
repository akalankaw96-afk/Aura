import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Staff area | Vikasitha" };

/**
 * Staff back office (KYC review, photo moderation, reports, payments, members).
 * The old page was a mock that accepted any password and showed sample members (BUG-010), so it was removed.
 * The real back office is built on role-protected admin APIs (#84–103) in Sprints 02–04.
 */
export default function AdminPage() {
  return (
    <div className="flex min-h-screen flex-col bg-page-gradient">
      <Navbar />
      <main className="container-page flex flex-1 items-center justify-center py-16">
        <Card className="flex max-w-[520px] flex-col gap-3 p-8 text-center">
          <h1 className="text-h4 text-ink">Staff area isn’t available yet</h1>
          <p className="text-body-md text-ink-secondary">
            The staff back office for profile reviews, reports and payments is being built and will require a staff
            account.
          </p>
          <Link href="/" className="text-label-md text-brand underline">
            Back to home
          </Link>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
