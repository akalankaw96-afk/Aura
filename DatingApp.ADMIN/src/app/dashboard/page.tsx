"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Verify,
  Danger,
  Card as CardIcon,
  MessageQuestion,
  Profile2User,
  MoneyRecive,
  ArrowRight,
  DocumentText,
  TickCircle,
} from "iconsax-react";
import { AdminShell } from "@/components/layout/AdminShell";
import { adminApi, AdminStats, AuditLog } from "@/services/adminApi";

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    pendingModerationCount: 3,
    safetyFlagsCount: 3,
    unverifiedSlipsCount: 2,
    openTicketsCount: 2,
    totalUsersCount: 1240,
    totalRevenueLkr: 485000,
  });
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    adminApi.getStats().then(setStats);
    adminApi.getAuditLogs().then((logs) => setRecentLogs(logs.slice(0, 5)));
  }, []);

  return (
    <AdminShell title="Operations Dashboard" subtitle="Platform health, moderation queues, and active workloads">
      <div className="flex flex-col gap-8 max-w-7xl">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/moderation"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all flex flex-col gap-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Moderation</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Verify size={18} color="currentColor" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-extrabold text-slate-900">{stats.pendingModerationCount}</span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Review NICs <ArrowRight size={12} color="currentColor" />
              </span>
            </div>
            <span className="text-[11px] text-slate-500">Candidate identity & photo checks</span>
          </Link>

          <Link
            href="/safety"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all flex flex-col gap-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Safety Flags</span>
              <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Danger size={18} color="currentColor" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-extrabold text-slate-900">{stats.safetyFlagsCount}</span>
              <span className="text-xs font-semibold text-rose-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Investigate <ArrowRight size={12} color="currentColor" />
              </span>
            </div>
            <span className="text-[11px] text-slate-500">Anti-Scam & Harassment triggers</span>
          </Link>

          <Link
            href="/finance"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all flex flex-col gap-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deposit Slips</span>
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <CardIcon size={18} color="currentColor" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-extrabold text-slate-900">{stats.unverifiedSlipsCount}</span>
              <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Verify <ArrowRight size={12} color="currentColor" />
              </span>
            </div>
            <span className="text-[11px] text-slate-500">LankaQR & Offline Bank deposits</span>
          </Link>

          <Link
            href="/support"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all flex flex-col gap-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Support Inquiries</span>
              <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <MessageQuestion size={18} color="currentColor" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-extrabold text-slate-900">{stats.openTicketsCount}</span>
              <span className="text-xs font-semibold text-purple-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Respond <ArrowRight size={12} color="currentColor" />
              </span>
            </div>
            <span className="text-[11px] text-slate-500">Member tickets under 2h SLA</span>
          </Link>
        </div>

        {/* Secondary KPI Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider text-purple-200 font-bold">Total Platform Revenue</span>
              <span className="text-3xl font-black">LKR {stats.totalRevenueLkr.toLocaleString()}</span>
              <span className="text-xs text-purple-300">Subscriptions & Premium upgrades</span>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center text-purple-200">
              <MoneyRecive size={32} color="currentColor" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Active Registered Users</span>
              <span className="text-3xl font-black text-slate-900">{stats.totalUsersCount.toLocaleString()}</span>
              <span className="text-xs text-emerald-600 font-semibold">+18 new profiles today</span>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
              <Profile2User size={32} color="currentColor" />
            </div>
          </div>
        </div>

        {/* Recent Governance & Audit Log */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DocumentText size={20} color="currentColor" className="text-purple-600" />
              <h2 className="font-bold text-slate-900 text-sm">Recent Audit Trail & Governance Log</h2>
            </div>
            <Link href="/audit" className="text-xs font-bold text-purple-600 hover:text-purple-800">
              View All Logs →
            </Link>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 uppercase text-[11px]">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Staff / Role</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 text-slate-400 font-mono">{log.timestamp}</td>
                  <td className="px-5 py-3 font-semibold text-slate-800">
                    {log.staffName} <span className="text-slate-400 font-normal">({log.role})</span>
                  </td>
                  <td className="px-5 py-3 font-mono font-bold text-purple-600">{log.action}</td>
                  <td className="px-5 py-3 text-slate-600">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

