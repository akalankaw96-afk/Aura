"use client";

import React, { useEffect, useState } from "react";
import { DocumentText, Refresh2 } from "iconsax-react";
import { AdminShell } from "@/components/layout/AdminShell";
import { adminApi, AuditLog } from "@/services/adminApi";
import { useToast } from "@/components/ui/Toast";

export default function AuditPage() {
  const toast = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);

  const loadLogs = () => {
    adminApi.getAuditLogs().then(setLogs);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <AdminShell
      title="Security Audit & Governance Trail"
      subtitle="Immutable cryptographic log of administrative actions, staff approvals, and account penalties."
    >
      <div className="flex flex-col gap-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">
            Total Logged Events: <strong>{logs.length}</strong>
          </span>
          <button
            type="button"
            onClick={() => {
              loadLogs();
              toast.info("Audit Log Refreshed");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <Refresh2 size={14} color="currentColor" /> Refresh Trail
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase text-[11px]">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Staff / Role</th>
                <th className="px-5 py-3">Event Action</th>
                <th className="px-5 py-3">Details</th>
                <th className="px-5 py-3">Host IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3 text-slate-400 font-mono whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-5 py-3 font-semibold text-slate-900 whitespace-nowrap">
                    {log.staffName} <span className="text-slate-400 font-normal">({log.role})</span>
                  </td>
                  <td className="px-5 py-3 font-mono font-bold text-purple-600 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{log.details}</td>
                  <td className="px-5 py-3 text-slate-400 font-mono whitespace-nowrap">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

