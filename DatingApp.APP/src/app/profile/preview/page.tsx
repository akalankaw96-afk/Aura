import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeartPattern } from "@/components/ui/Decor";
import { RequireMember } from "@/components/auth/RequireMember";
import { ProfilePreviewScreen } from "@/components/profile/ProfilePreviewScreen";

export const metadata: Metadata = { title: "Preview my profile | Yugadiwi", robots: { index: false, follow: false } };

/** "Preview my profile" (dashboard): your own profile as other members see it, with Exit preview. */
export default function ProfilePreviewPage() {
  return (
    <div className="relative isolate flex min-h-screen flex-col bg-page-gradient">
      <RequireMember />
      <HeartPattern className="-z-10" />
      <Navbar variant="member" />
      <ProfilePreviewScreen />
      <Footer />
    </div>
  );
}
