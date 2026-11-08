import type { Metadata } from "next";
import { RegisterFlow } from "@/components/auth/RegisterFlow";

export const metadata: Metadata = { title: "Create your free account | Vikasitha" };

export default function RegisterPage() {
  return <RegisterFlow />;
}
