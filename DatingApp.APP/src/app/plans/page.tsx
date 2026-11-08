import type { Metadata } from "next";
import { PlansScreen } from "@/components/auth/PlansScreen";

export const metadata: Metadata = { title: "Plans | Vikasitha" };

export default function PlansPage() {
  return <PlansScreen />;
}
