import type { Metadata } from "next";
import { RequestsScreen } from "@/components/sections/member/RequestsScreen";

export const metadata: Metadata = { title: "Interest requests | Vikasitha" };

/** Figma: 📊 Member Dashboard → Requests — Desktop 1440 */
export default function RequestsPage() {
  return <RequestsScreen />;
}
