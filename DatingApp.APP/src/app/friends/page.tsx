import type { Metadata } from "next";
import { RequestsScreen } from "@/components/sections/member/RequestsScreen";
import { REQUEST_TABS } from "@/content/dashboard";
import { RequireMember } from "@/components/auth/RequireMember";

export const metadata: Metadata = { title: "Friends | Yugadiwi" };

/**
 * Friends — friends (accepted interests), favourites, received and sent interests.
 * Figma: 📊 Member Dashboard → Requests — Desktop 1440 (page renamed "Friends").
 */
export default async function FriendsPage({ searchParams }: { searchParams: Promise<{ tab?: string; id?: string }> }) {
  const { tab, id } = await searchParams;
  const initialTab = REQUEST_TABS.find((item) => item.id === tab)?.id ?? "friends";
  return (
    <>
      <RequireMember />
      <RequestsScreen key={`${initialTab}:${id ?? ""}`} initialTab={initialTab} initialProfileId={id} />
    </>
  );
}
