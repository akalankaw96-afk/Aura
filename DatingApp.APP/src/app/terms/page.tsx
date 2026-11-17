import type { Metadata } from "next";
import { LegalPage } from "@/components/sections/legal/LegalPage";

export const metadata: Metadata = { title: "Terms & Conditions | Vikasitha" };

export default function Page() {
  return <LegalPage doc="terms" />;
}
