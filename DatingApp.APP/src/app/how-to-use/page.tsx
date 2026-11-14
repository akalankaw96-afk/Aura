import type { Metadata } from "next";
import { HowToUseScreen } from "@/components/sections/howto/HowToUseScreen";

export const metadata: Metadata = {
  title: "How to use | Vikasitha",
  description: "Every step on Vikasitha: create an account, get verified, find a match, send interest, chat and share contact details.",
};

export default function HowToUsePage() {
  return <HowToUseScreen />;
}
