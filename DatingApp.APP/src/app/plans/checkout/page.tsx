import { Suspense } from "react";
import type { Metadata } from "next";
import { RequireMember } from "@/components/auth/RequireMember";
import { BankTransferScreen } from "@/components/sections/payment/BankTransferScreen";

export const metadata: Metadata = { title: "Payment | Yugadiwi" };

export default function CheckoutPage() {
  return (
    <>
      <RequireMember />
      <Suspense>
        <BankTransferScreen />
      </Suspense>
    </>
  );
}
