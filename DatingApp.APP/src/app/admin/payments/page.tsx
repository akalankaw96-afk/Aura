"use client";

import { AdminPayments } from "@/components/admin/AdminPayments";
import { AdminPageHeader } from "@/components/admin/AdminShell";

/** /admin/payments — bank-transfer receipts (S04-T04): open the receipt, approve (starts the plan) or reject with a reason. */
export default function Page() {
  return (
    <>
      <AdminPageHeader title="Payments" subtitle="Bank-transfer receipts, oldest first. Check each one against the bank statement before approving." />
      <AdminPayments />
    </>
  );
}
