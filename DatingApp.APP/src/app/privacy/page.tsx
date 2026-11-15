import type { Metadata } from "next";
import { LegalPage } from "@/components/sections/legal/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy | Vikasitha" };

export default function Page() {
  return <LegalPage doc="privacy" />;
}
