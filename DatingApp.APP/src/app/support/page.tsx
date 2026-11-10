import type { Metadata } from "next";
import { SupportScreen } from "@/components/sections/support/SupportScreen";
import { SUPPORT } from "@/content/support";

export const metadata: Metadata = {
  title: "Contact support | Vikasitha",
  description: SUPPORT.subtitle,
};

export default function SupportPage() {
  return <SupportScreen />;
}
