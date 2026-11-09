import type { Metadata } from "next";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { MemberRedirect } from "@/components/auth/MemberRedirect";

export const metadata: Metadata = { title: "Log in | Vikasitha" };

export default function LoginPage() {
  return (
    <>
      <MemberRedirect />
      <LoginScreen />
    </>
  );
}
