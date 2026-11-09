import type { Metadata } from "next";
import { RegisterFlow } from "@/components/auth/RegisterFlow";
import { MemberRedirect } from "@/components/auth/MemberRedirect";

export const metadata: Metadata = { title: "Create your free account | Vikasitha" };

export default function RegisterPage() {
  return (
    <>
      <MemberRedirect />
      <RegisterFlow />
    </>
  );
}
