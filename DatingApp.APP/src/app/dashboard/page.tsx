import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeartPattern } from "@/components/ui/Decor";
import { BestMatches, DashboardHero, Inbox, SearchCard, StatsRow } from "@/components/sections/dashboard";

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
          <DashboardHero />
          <StatsRow />
          <Inbox />
          <SearchCard />
        </div>
        <BestMatches />
      </main>
      <Footer />
    </div>
  );
}
