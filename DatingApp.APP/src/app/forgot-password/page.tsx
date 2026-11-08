import type { Metadata } from "next";
import { ForgotPasswordScreen } from "@/components/auth/ForgotPasswordScreen";

export const metadata: Metadata = { title: "Reset password | Vikasitha" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordScreen />;
}
