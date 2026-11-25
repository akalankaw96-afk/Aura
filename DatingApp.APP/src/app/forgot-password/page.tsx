import type { Metadata } from "next";
import { ForgotPasswordScreen } from "@/components/auth/ForgotPasswordScreen";

export const metadata: Metadata = { title: "Reset password | Yugadiwi" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordScreen />;
}
