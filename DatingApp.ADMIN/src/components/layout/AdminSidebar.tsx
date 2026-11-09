"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Category,
  Verify,
  Danger,
  Card as CardIcon,
  MessageQuestion,
  DocumentText,
  ShieldSecurity,
  LogoutCurve,
} from "iconsax-react";
import { adminApi } from "@/services/adminApi";
import { cn } from "@/lib/cn";

export function AdminSidebar() {
  const pathname = usePathname();
  const staff = adminApi.getCurrentStaff();

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: Category },
    { label: "Moderation Queue", href: "/moderation", icon: Verify, badge: "3" },
    { label: "Safety & Watchlist", href: "/safety", icon: Danger, badge: "3" },
    { label: "Finance & Slips", href: "/finance", icon: CardIcon, badge: "2" },
    { label: "Helpdesk Tickets", href: "/support", icon: MessageQuestion, badge: "2" },
    { label: "Audit & Governance", href: "/audit", icon: DocumentText },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
          <div className="h-9 w-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-sm">
            <ShieldSecurity size={20} color="currentColor" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 tracking-tight leading-none text-base">AURA ADMIN</span>
            <span className="text-[11px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">Control Center</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">
            Department Queues
          </span>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group",
                  isActive
                    ? "bg-purple-50 text-purple-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={20}
                    color="currentColor"
                    className={cn(
                      "transition-colors",
                      isActive ? "text-purple-600" : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-bold",
                      isActive ? "bg-purple-200 text-purple-900" : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Staff User Card */}
      <div className="p-4 border-t border-slate-100 flex flex-col gap-3">
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl">
          <div className="h-9 w-9 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-sm border border-purple-200">
            {staff?.name?.[0] || "A"}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-bold text-slate-900 truncate">{staff?.name || "Staff Admin"}</span>
            <span className="text-xs text-purple-600 font-semibold truncate">{staff?.role || "SuperAdmin"}</span>
          </div>
        </div>

        <Link
          href="/login"
          onClick={() => adminApi.setCurrentStaff(null)}
          className="flex items-center justify-center gap-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors"
        >
          <LogoutCurve size={16} color="currentColor" />
          <span>Sign Out Session</span>
        </Link>
      </div>
    </aside>
  );
}

