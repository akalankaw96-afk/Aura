"use client";

import React from "react";
import { ShieldSecurity } from "iconsax-react";
import { adminApi } from "@/services/adminApi";

export function AdminHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const staff = adminApi.getCurrentStaff();

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-bold text-slate-900 leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          2FA Active Session
        </span>

        <div className="h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-2">
          <ShieldSecurity size={18} color="currentColor" className="text-purple-600" />
          <span className="text-xs font-semibold text-slate-700">
            {staff?.role || "SuperAdmin"} Mode
          </span>
        </div>
      </div>
    </header>
  );
}

