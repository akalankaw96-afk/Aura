import type { Metadata } from "next";
import { LegalPage } from "@/components/sections/legal/LegalPage";

export const metadata: Metadata = { title: "About us | Vikasitha" };

export default function Page() {
  return <LegalPage doc="about" />;
}
