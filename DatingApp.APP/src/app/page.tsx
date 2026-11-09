import { Footer } from "@/components/layout/Footer";
import { HeartPattern } from "@/components/ui/Decor";
import { Hero } from "@/components/sections/home/Hero";
import { HowItWorks } from "@/components/sections/home/HowItWorks";
import { FeaturedProfiles } from "@/components/sections/home/FeaturedProfiles";
import { SuccessStories } from "@/components/sections/home/SuccessStories";
import { CategoryWall } from "@/components/sections/home/CategoryWall";
import { Pricing } from "@/components/sections/home/Pricing";
import { Faq } from "@/components/sections/home/Faq";
import { SignUp } from "@/components/sections/home/SignUp";
import { MemberRedirect } from "@/components/auth/MemberRedirect";

/**
 * Home — Figma "🏠 Home Page" → "Home — Desktop 1442" (+ "Home — Mobile 390").
 * Section order matches the Figma frame top → bottom. One continuous page
 * background (Gradient/Page Background + Pattern/Heart Lines), not per-section.
 */
export default function HomePage() {
  return (
    <div className="relative isolate bg-page-gradient">
      {/* signed-in members go straight to their Dashboard */}
      <MemberRedirect />
      <HeartPattern className="-z-10" />
      <Hero />
      <main>
        <HowItWorks />
        <FeaturedProfiles />
        <SuccessStories />
        <CategoryWall />
        <Pricing />
        <Faq />
        <SignUp />
      </main>
      <Footer />
    </div>
  );
}
