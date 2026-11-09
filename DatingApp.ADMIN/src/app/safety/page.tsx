"use client";

import React, { useEffect, useState } from "react";
import { Danger, Warning2, Trash } from "iconsax-react";
import { AdminShell } from "@/components/layout/AdminShell";
import { adminApi, SafetyReport } from "@/services/adminApi";
import { useToast } from "@/components/ui/Toast";

export default function SafetyPage() {
  const toast = useToast();
  const [reports, setReports] = useState<SafetyReport[]>([]);

  useEffect(() => {
    adminApi.getSafetyReports().then(setReports);
  }, []);

  const handleDismiss = async (rep: SafetyReport) => {
    const ok = await adminApi.dismissReport(rep.id);
    if (ok) {
      setReports((prev) => prev.map((r) => (r.id === rep.id ? { ...r, status: "dismissed" } : r)));
      toast.info("Report Dismissed", "Marked as non-violating.");
    }
  };

  const handleWarn = async (rep: SafetyReport) => {
    const ok = await adminApi.warnUser(rep.id);
    if (ok) {
      setReports((prev) => prev.map((r) => (r.id === rep.id ? { ...r, status: "warned" } : r)));
      toast.warning("Warning Issued", `Official safety conduct notice sent to ${rep.reportedUserName}.`);
    }
  };

  const handleBan = async (rep: SafetyReport) => {
    const ok = await adminApi.banUser(rep.id);
    if (ok) {
      setReports((prev) => prev.map((r) => (r.id === rep.id ? { ...r, status: "banned" } : r)));
      toast.error("User Banned", `${rep.reportedUserName} has been permanently deactivated.`);
    }
  };

  return (
    <AdminShell
      title="Anti-Scam & Safety Watchlist"
      subtitle="Investigate high-risk chat messages, unauthorized solicitation, and platform harassment."
    >
      <div className="flex flex-col gap-4 max-w-7xl">
        {reports.map((rep) => (
          <div
            key={rep.id}
            className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
              rep.status === "banned" ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
            }`}
          >
            <div className="flex flex-col gap-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-400">{rep.id}</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full text-[11px] px-2.5 py-0.5 font-bold ${
                    rep.riskLevel === "High"
                      ? "bg-rose-100 text-rose-800"
                      : rep.riskLevel === "Medium"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <Danger size={12} color="currentColor" /> {rep.riskLevel} Risk
                </span>
                <span className="text-sm font-bold text-slate-900">Reported: {rep.reportedUserName}</span>
                <span className="text-xs text-slate-400">by {rep.reporterId}</span>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs font-mono text-slate-800">
                {rep.snippet}
              </div>

              <p className="text-xs text-slate-500">
                Violation Trigger: <strong className="capitalize text-slate-700">{rep.reason.replace("_", " ")}</strong> · {rep.reportedAt}
              </p>
            </div>

            {rep.status === "open" ? (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDismiss(rep)}
                  className="flex h-10 items-center gap-1 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => handleWarn(rep)}
                  className="flex h-10 items-center gap-1 rounded-xl bg-amber-500 text-xs font-bold text-white hover:bg-amber-600 px-4 shadow-sm transition-colors"
                >
                  <Warning2 size={16} color="currentColor" /> Warn User
                </button>
                <button
                  type="button"
                  onClick={() => handleBan(rep)}
                  className="flex h-10 items-center gap-1 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 px-4 shadow-sm transition-colors"
                >
                  <Trash size={16} color="currentColor" /> Permanent Ban
                </button>
              </div>
            ) : (
              <span className="font-bold text-xs text-slate-400 uppercase tracking-wider">
                Status: {rep.status}
              </span>
            )}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

