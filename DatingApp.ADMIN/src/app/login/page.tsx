"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldSecurity, Key, CloseCircle, Verify, Danger, Card as CardIcon } from "iconsax-react";
import { adminApi, AdminRole } from "@/services/adminApi";
import { useToast } from "@/components/ui/Toast";

export default function AdminLoginPage() {
  const router = useRouter();
  const toast = useToast();

  const [adminEmail, setAdminEmail] = useState("admin@aura.lk");
  const [adminPassword, setAdminPassword] = useState("••••••••");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorStep) {
      if (adminEmail && adminPassword) {
        setTwoFactorStep(true);
        setLoginError(null);
        toast.info("2FA Code Required", "Enter code 999888 or click Auto-fill to authenticate.");
      } else {
        setLoginError("Please enter valid staff credentials.");
      }
    } else {
      if (twoFactorCode === "999888" || twoFactorCode === "482913" || twoFactorCode.length >= 6) {
        authenticateAdmin("admin@aura.lk", "Kumara Senanayake", "SuperAdmin");
      } else {
        setLoginError("Invalid 2FA code. Please use demo code 999888.");
      }
    }
  };

  const authenticateAdmin = (email: string, name: string, role: AdminRole) => {
    adminApi.setCurrentStaff({
      email,
      name,
      role,
      avatar: "",
    });
    toast.success("Welcome to Admin Console", `Authenticated as ${name} (${role})`);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-14 w-14 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
            <ShieldSecurity size={32} color="currentColor" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Staff Security Portal</h1>
          <p className="text-xs text-slate-400">Flow 6 · Operational Governance & Departmental RBAC</p>
        </div>

        {loginError && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-950/70 border border-rose-800 p-3 text-xs text-rose-300">
            <CloseCircle size={16} color="currentColor" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
          {!twoFactorStep ? (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">Staff Email</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  className="h-11 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  className="h-11 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="mt-2 flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-600 font-bold text-sm text-white hover:bg-purple-700 shadow-md shadow-purple-600/20 transition-all"
              >
                <Key size={18} color="currentColor" />
                Continue to 2FA Challenge
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-2 rounded-xl bg-purple-950/40 p-4 border border-purple-800/60">
                <div className="flex items-center justify-between text-xs font-semibold text-purple-200">
                  <span>2FA Authentication Code</span>
                  <button
                    type="button"
                    onClick={() => setTwoFactorCode("999888")}
                    className="text-purple-400 underline font-bold"
                  >
                    Auto-fill (999888)
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="h-12 text-center text-xl tracking-widest font-mono rounded-lg border border-purple-700 bg-slate-900 text-white focus:border-purple-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 text-center">
                  Security token generated via Google Authenticator or SMS.
                </p>
              </div>

              <button
                type="submit"
                className="mt-2 flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-600 font-bold text-sm text-white hover:bg-purple-700 shadow-md shadow-purple-600/20 transition-all"
              >
                <ShieldSecurity size={18} color="currentColor" />
                Verify & Access Console
              </button>

              <button
                type="button"
                onClick={() => setTwoFactorStep(false)}
                className="text-center text-xs text-slate-400 hover:text-white"
              >
                Back to credentials
              </button>
            </>
          )}
        </form>

        <div className="border-t border-slate-700 pt-4 flex flex-col gap-2">
          <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">
            Instant Role Switcher (For Evaluation)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => authenticateAdmin("moderator@aura.lk", "Shanika Perera", "Moderator")}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
            >
              <Verify size={14} color="currentColor" className="text-emerald-400" />
              Moderator
            </button>
            <button
              type="button"
              onClick={() => authenticateAdmin("safety@aura.lk", "Mahesh Silva", "SafetyOfficer")}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
            >
              <Danger size={14} color="currentColor" className="text-amber-400" />
              Safety Officer
            </button>
            <button
              type="button"
              onClick={() => authenticateAdmin("finance@aura.lk", "Ruwan Fernando", "FinanceManager")}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
            >
              <CardIcon size={14} color="currentColor" className="text-blue-400" />
              Finance
            </button>
            <button
              type="button"
              onClick={() => authenticateAdmin("admin@aura.lk", "Kumara Senanayake", "SuperAdmin")}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
            >
              <ShieldSecurity size={14} color="currentColor" className="text-purple-400" />
              Super Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

