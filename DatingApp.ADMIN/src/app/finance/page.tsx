"use client";

import React, { useEffect, useState } from "react";
import { Receipt21, TickCircle } from "iconsax-react";
import { AdminShell } from "@/components/layout/AdminShell";
import { adminApi, FinanceSlip } from "@/services/adminApi";
import { useToast } from "@/components/ui/Toast";

export default function FinancePage() {
  const toast = useToast();
  const [slips, setSlips] = useState<FinanceSlip[]>([]);

  useEffect(() => {
    adminApi.getFinanceSlips().then(setSlips);
  }, []);

  const handleApprove = async (slip: FinanceSlip) => {
    const ok = await adminApi.approveSlip(slip.id);
    if (ok) {
      setSlips((prev) => prev.map((s) => (s.id === slip.id ? { ...s, status: "approved" } : s)));
      toast.success(
        "Payment Approved",
        `${slip.userName}'s ${slip.planId.toUpperCase()} subscription is now active!`
      );
    }
  };

  const handleReject = async (slip: FinanceSlip) => {
    const reason = "Amount on slip does not match package cost.";
    const ok = await adminApi.rejectSlip(slip.id, reason);
    if (ok) {
      setSlips((prev) => prev.map((s) => (s.id === slip.id ? { ...s, status: "rejected" } : s)));
      toast.error("Slip Declined", `${slip.userName} prompted to upload valid bank receipt.`);
    }
  };

  return (
    <AdminShell
      title="Finance & Offline Deposit Slips"
      subtitle="Review LankaQR and bank transfer deposit receipts to activate member subscriptions."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl">
        {slips.map((slip) => (
          <div
            key={slip.id}
            className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col justify-between gap-4 transition-all ${
              slip.status === "approved"
                ? "border-emerald-300 bg-emerald-50/20"
                : slip.status === "rejected"
                ? "border-rose-300 opacity-60"
                : "border-slate-200"
            }`}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-mono font-bold text-slate-400">{slip.id}</span>
                  <h3 className="font-bold text-slate-900 text-base">{slip.userName}</h3>
                  <p className="text-xs font-bold text-purple-600 capitalize">
                    {slip.planId} Package · {slip.durationMonths} Months
                  </p>
                </div>
                <span className="text-lg font-black text-slate-900">
                  LKR {slip.amountLkr.toLocaleString()}
                </span>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 text-xs flex flex-col gap-1 text-slate-600">
                <p><strong>Bank:</strong> {slip.bankName}</p>
                <p><strong>Reference:</strong> <span className="font-mono font-bold text-slate-900">{slip.referenceNumber}</span></p>
                <p><strong>Submitted:</strong> {slip.submittedAt}</p>
              </div>

              {/* Simulated Deposit Slip Receipt */}
              <div className="rounded-xl border border-slate-200 p-3 bg-white text-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Receipt21 size={24} color="currentColor" className="text-blue-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">DEPOSIT_SLIP_{slip.referenceNumber}.JPG</p>
                    <p className="text-[10px] text-slate-400">Cash Deposit Machine Stamp Verified</p>
                  </div>
                </div>
                <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 font-bold">
                  VERIFIED
                </span>
              </div>
            </div>

            {slip.status === "pending" ? (
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleReject(slip)}
                  className="flex-1 flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  Decline Slip
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(slip)}
                  className="flex-1 flex h-10 items-center justify-center gap-1.5 rounded-xl bg-purple-600 text-xs font-bold text-white hover:bg-purple-700 shadow-sm transition-colors"
                >
                  <TickCircle size={16} color="currentColor" /> Approve & Upgrade
                </button>
              </div>
            ) : (
              <div className="text-center text-xs font-semibold text-slate-400 pt-2 border-t border-slate-100">
                Status: {slip.status.toUpperCase()}
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

