import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeartPattern } from "@/components/ui/Decor";
import { BestMatches, DashboardHero, Inbox, SearchCard, StatsRow } from "@/components/sections/dashboard";
import { VerificationPanel } from "@/components/sections/dashboard/VerificationPanel";
import { FeatureGate } from "@/components/sections/dashboard/FeatureGate";
import { PlanUsageCard } from "@/components/sections/dashboard/PlanUsageCard";
import { ProPlanCard } from "@/components/sections/dashboard/ProPlanCard";
import { DashboardDemo } from "@/components/sections/dashboard/DashboardDemo";

export const metadata: Metadata = { title: "Dashboard | Aura Matrimony" };

/**
 * Member Dashboard — Figma "📊 Member Dashboard" → "Dashboard — Desktop 1440".
 * Figma: "Dashboard — Version B (tabs)". Top (padding 32/80/48, gap 24): Hero, Stats,
 * Requests & friends + Messages (tabbed cards), Search card. Then the full-width
 * Best matches band and Footer. /dashboard?empty=1 shows the new-member empty states.
 * Data is mock (src/content/dashboard.ts).
 */
export default function DashboardPage() {
  return (
    <div className="relative isolate bg-page-gradient">
      <HeartPattern className="-z-10" />
      <Navbar variant="member" />
      <main>
        <div className="container-page flex flex-col gap-6 pb-12 pt-6 lg:pt-8">
          {/* new members: profile review status (pending / changes needed) — hidden once live */}
          <VerificationPanel />
          <DashboardHero />
          {/* approved Free members: allowance + what Gold unlocks (hidden for paid members) */}
          <PlanUsageCard />
          {/* approved Gold / Platinum members: plan, expiry date and included features */}
          <ProPlanCard />
          {/* profile insights are a paid feature */}
          <FeatureGate requires="paid" title="See who viewed & shortlisted you" text="Profile insights are included with Gold and Platinum.">
            <StatsRow />
          </FeatureGate>
          {/* locked (blurred + lock card) until the profile is approved */}
          <FeatureGate title="Requests & messages unlock after approval">
            <Inbox />
          </FeatureGate>
          <FeatureGate title="Search unlocks after approval">
            <SearchCard />
          </FeatureGate>
        </div>
        <FeatureGate title="Your matches are almost ready" text="Once you’re approved you can view profiles and send interests.">
          <BestMatches />
        </FeatureGate>
      </main>
      <Footer />
      {/* demo only: switch KYC pending / rejected / approved Free / approved Pro */}
      <DashboardDemo />
    </div>
  );
}
