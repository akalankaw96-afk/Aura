"use client";

import React, { useEffect, useState } from "react";
import { TickCircle, MessageQuestion } from "iconsax-react";
import { AdminShell } from "@/components/layout/AdminShell";
import { adminApi, SupportTicket } from "@/services/adminApi";
import { useToast } from "@/components/ui/Toast";

export default function SupportPage() {
  const toast = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    adminApi.getSupportTickets().then(setTickets);
  }, []);

  const handleResolve = async (ticket: SupportTicket) => {
    const ok = await adminApi.resolveTicket(ticket.id);
    if (ok) {
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, status: "resolved" } : t)));
      toast.success("Ticket Resolved", `Marked ${ticket.id} as resolved.`);
    }
  };

  return (
    <AdminShell
      title="Member Helpdesk & Inquiries"
      subtitle="Resolve account, horoscope, and subscription support tickets within 2-hour SLA."
    >
      <div className="flex flex-col gap-4 max-w-7xl">
        {tickets.map((t) => (
          <div
            key={t.id}
            className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
              t.status === "resolved" ? "border-emerald-200 bg-emerald-50/10 opacity-70" : "border-slate-200"
            }`}
          >
            <div className="flex flex-col gap-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-400">{t.id}</span>
                <span className="rounded-full bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 font-bold uppercase">
                  {t.category}
                </span>
                <span
                  className={`rounded-full text-[10px] px-2 py-0.5 font-bold uppercase ${
                    t.priority === "High" ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {t.priority} Priority
                </span>
                <h3 className="font-bold text-slate-900 text-sm">{t.subject}</h3>
              </div>

              <p className="text-xs text-slate-600">{t.message}</p>
              <p className="text-[11px] text-slate-400">
                From <strong>{t.userName}</strong> ({t.userEmail}) · {t.createdAt}
              </p>
            </div>

            {t.status === "open" ? (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleResolve(t)}
                  className="flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 px-5 shadow-sm transition-colors"
                >
                  <TickCircle size={16} color="currentColor" /> Mark Resolved
                </button>
              </div>
            ) : (
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                ✓ Resolved
              </span>
            )}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

