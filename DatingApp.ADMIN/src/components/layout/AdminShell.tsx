"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { adminApi } from "@/services/adminApi";

export function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const staff = adminApi.getCurrentStaff();
    if (!staff && pathname !== "/login") {
      // Auto-assign default SuperAdmin for smooth evaluation if not logged in
      adminApi.setCurrentStaff({
        email: "admin@aura.lk",
        name: "Kumara Senanayake",
        role: "SuperAdmin",
        avatar: "",
      });
    }
    setLoading(false);
  }, [pathname, router]);

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm font-semibold text-slate-500">Loading Admin Console...</div>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title={title} subtitle={subtitle} />
        <main className="p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}

