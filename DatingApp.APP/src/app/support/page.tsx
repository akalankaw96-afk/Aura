import type { Metadata } from "next";
import { SupportScreen } from "@/components/sections/support/SupportScreen";
import { SUPPORT } from "@/content/support";

export const metadata: Metadata = {
  title: "Contact support | Yugadiwi",
  description: "Questions about your account, verification or payments? Contact the Yugadiwi support team.",
};

export default function SupportPage() {
  // read here (server): SUPPORT_WHATSAPP_NUMBER / SUPPORT_HOTLINE_NUMBER aren't available in the browser
  return <SupportScreen channels={SUPPORT.channels} />;
}
