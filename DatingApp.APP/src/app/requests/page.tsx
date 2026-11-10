import type { Metadata } from "next";
import { RequestsScreen } from "@/components/sections/member/RequestsScreen";
import { REQUEST_TABS } from "@/content/dashboard";

export const metadata: Metadata = { title: "Interest requests | Vikasitha" };

/** Figma: 📊 Member Dashboard → Requests — Desktop 1440 */
export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ tab?: string; id?: string }> }) {
  const { tab, id } = await searchParams;
  const initialTab = REQUEST_TABS.find((item) => item.id === tab)?.id ?? "friends";
  return <RequestsScreen key={`${initialTab}:${id ?? ""}`} initialTab={initialTab} initialProfileId={id} />;
}
