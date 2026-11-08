"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldSecurity,
  Verify,
  Profile2User,
  Card as CardIcon,
  Danger,
  MessageQuestion,
  TickCircle,
  CloseCircle,
  Eye,
  DocumentText,
  Lock,
  LogoutCurve,
  Key,
  Warning2,
  Trash,
  UserEdit,
  ArrowRight,
  Filter,
  SearchNormal1,
  Receipt21
} from "iconsax-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/Toast";

// Admin Role Types according to Flow 6 RBAC
type AdminRole = "SuperAdmin" | "Moderator" | "SafetyOfficer" | "FinanceManager" | "SupportSpecialist";

interface AdminUser {
  email: string;
  name: string;
  role: AdminRole;
  avatar: string;
}

interface PendingProfile {
  id: string;
  name: string;
  gender: "bride" | "groom";
  age: number;
  profession: string;
  location: string;
  religion: string;
  nicNumber: string;
  nicPhotoUrl: string;
  profilePhotoUrl: string;
  bio: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

interface SafetyReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reportedUserName: string;
  reason: "money_scam" | "harassment" | "fake_profile" | "inappropriate_content";
  snippet: string;
  riskLevel: "High" | "Medium" | "Low";
  reportedAt: string;
  status: "open" | "warned" | "banned" | "dismissed";
}

interface FinanceSlip {
  id: string;
  userId: string;
  userName: string;
  planId: "gold" | "platinum";
  durationMonths: number;
  amountLkr: number;
  bankName: string;
  referenceNumber: string;
  slipUrl: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

interface SupportTicket {
  id: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  category: "Billing" | "Verification" | "Account" | "Technical";
  priority: "High" | "Normal";
  status: "open" | "resolved";
  createdAt: string;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  staffName: string;
  role: string;
  action: string;
  details: string;
  ipAddress: string;
}

export default function AdminPage() {
  const toast = useToast();

  // Authentication & 2FA State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [adminEmail, setAdminEmail] = useState("admin@aura.lk");
  const [adminPassword, setAdminPassword] = useState("••••••••");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Tab: 'moderation' | 'safety' | 'finance' | 'support' | 'audit'
  const [activeTab, setActiveTab] = useState<"moderation" | "safety" | "finance" | "support" | "audit">("moderation");

  // Moderation Queue State
  const [profiles, setProfiles] = useState<PendingProfile[]>([
    {
      id: "MP-24890",
      name: "Tharindu Wijesekara",
      gender: "groom",
      age: 30,
      profession: "Senior Data Scientist",
      location: "Colombo 03",
      religion: "Buddhist",
      nicNumber: "199428901234",
      nicPhotoUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400&auto=format&fit=crop",
      profilePhotoUrl: "/images/profiles/avatar-mp-24817.jpg",
      bio: "Master's graduate from Colombo University. Looking for an educated partner from a respectable family.",
      submittedAt: "10 mins ago",
      status: "pending",
    },
    {
      id: "MP-24891",
      name: "Chathurika Madushani",
      gender: "bride",
      age: 27,
      profession: "Architect (B.Arch)",
      location: "Kandy",
      religion: "Buddhist",
      nicNumber: "199754329876",
      nicPhotoUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400&auto=format&fit=crop",
      profilePhotoUrl: "/images/profiles/avatar-mp-24733.jpg",
      bio: "Practicing chartered architect in Kandy. Enjoys traditional heritage, landscape gardening, and art.",
      submittedAt: "25 mins ago",
      status: "pending",
    },
    {
      id: "MP-24892",
      name: "Dr. Sandun Alwis",
      gender: "groom",
      age: 33,
      profession: "Cardiothoracic Surgeon",
      location: "Melbourne / Colombo",
      religion: "Christian",
      nicNumber: "199187654321",
      nicPhotoUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400&auto=format&fit=crop",
      profilePhotoUrl: "/images/profiles/avatar-mp-24751.jpg",
      bio: "Medical specialist currently in Australia. Seeking a kind and family-oriented life companion.",
      submittedAt: "1 hour ago",
      status: "pending",
    },
  ]);

  // Safety Queue State
  const [reports, setReports] = useState<SafetyReport[]>([
    {
      id: "REP-901",
      reporterId: "LK-8834",
      reportedUserId: "USR-4412",
      reportedUserName: "Gayan B. (Unverified)",
      reason: "money_scam",
      snippet: '"Please transfer Rs. 35,000 for emergency vehicle repair immediately, I will return tomorrow."',
      riskLevel: "High",
      reportedAt: "15 mins ago",
      status: "open",
    },
    {
      id: "REP-902",
      reporterId: "LK-7102",
      reportedUserId: "USR-7731",
      reportedUserName: "Crypto Match Promo",
      reason: "inappropriate_content",
      snippet: '"Join my foreign exchange investment group at http://crypto-win-now.xyz for 200% returns."',
      riskLevel: "High",
      reportedAt: "45 mins ago",
      status: "open",
    },
    {
      id: "REP-903",
      reporterId: "LK-9021",
      reportedUserId: "USR-1092",
      reportedUserName: "Kamal S.",
      reason: "harassment",
      snippet: 'Repeatedly demanding personal phone number after request was declined.',
      riskLevel: "Medium",
      reportedAt: "2 hours ago",
      status: "open",
    },
  ]);

  // Finance Queue State
  const [slips, setSlips] = useState<FinanceSlip[]>([
    {
      id: "SLIP-501",
      userId: "USR-8821",
      userName: "Nalaka Dissanayake",
      planId: "gold",
      durationMonths: 3,
      amountLkr: 6375,
      bankName: "Commercial Bank (Colombo 07 Branch)",
      referenceNumber: "TXN-COMB-982144",
      slipUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=400&auto=format&fit=crop",
      submittedAt: "18 mins ago",
      status: "pending",
    },
    {
      id: "SLIP-502",
      userId: "USR-9904",
      userName: "Dilini Fernando",
      planId: "platinum",
      durationMonths: 6,
      amountLkr: 29250,
      bankName: "Sampath Bank (Kandy City Centre)",
      referenceNumber: "TXN-SAMP-110293",
      slipUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=400&auto=format&fit=crop",
      submittedAt: "40 mins ago",
      status: "pending",
    },
  ]);

  // Support Tickets State
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: "TCK-101",
      userName: "Chandrika Bandara",
      userEmail: "chandrika.b@gmail.com",
      subject: "How do I update my horoscope rasi details?",
      message: "I uploaded my rasi chart during registration, but need to add navamsha details.",
      category: "Account",
      priority: "Normal",
      status: "open",
      createdAt: "30 mins ago",
    },
    {
      id: "TCK-102",
      userName: "Sunil Jayasuriya (Parent)",
      userEmail: "sunil.jayasuriya@sltnet.lk",
      subject: "Payment confirmation for Son's Platinum plan",
      message: "I completed the bank deposit this morning at Sampath Bank. Please expedite verification.",
      category: "Billing",
      priority: "High",
      status: "open",
      createdAt: "1 hour ago",
    },
  ]);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: "AUD-101",
      timestamp: new Date().toLocaleTimeString(),
      staffName: "System Sentinel",
      role: "Security AI",
      action: "AUTO_SCAN_FLAGGED",
      details: "High-risk money transfer request detected in chat and flagged to Safety Queue.",
      ipAddress: "127.0.0.1 (Internal)",
    },
    {
      id: "AUD-100",
      timestamp: "1 hour ago",
      staffName: "Admin Supervisor",
      role: "SuperAdmin",
      action: "ADMIN_LOGIN_SUCCESS",
      details: "Two-Factor authentication approved for staff session.",
      ipAddress: "192.168.1.15",
    },
  ]);

  // Add an entry to audit log
  const logAudit = (action: string, details: string) => {
    const entry: AuditLogEntry = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      staffName: currentAdmin?.name || "Staff Admin",
      role: currentAdmin?.role || "Moderator",
      action,
      details,
      ipAddress: "127.0.0.1",
    };
    setAuditLogs((prev) => [entry, ...prev]);
  };

  // Login handler
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

  // Quick Demo Login helper for evaluators
  const authenticateAdmin = (email: string, name: string, role: AdminRole) => {
    const admin: AdminUser = {
      email,
      name,
      role,
      avatar: "/brand/groom.png",
    };
    setCurrentAdmin(admin);
    setIsAuthenticated(true);
    setTwoFactorStep(false);
    setLoginError(null);
    logAudit("STAFF_LOGIN_2FA_VERIFIED", `Staff ${name} logged in with role ${role}`);
    toast.success("Welcome to Admin Console", `Authenticated as ${name} (${role})`);
  };

  const handleLogout = () => {
    logAudit("STAFF_LOGOUT", `Staff ${currentAdmin?.name} terminated session`);
    setIsAuthenticated(false);
    setCurrentAdmin(null);
    setTwoFactorStep(false);
    toast.info("Logged Out", "Staff session safely closed.");
  };

  // Moderation Actions
  const handleApproveProfile = (p: PendingProfile) => {
    setProfiles((prev) => prev.map((item) => (item.id === p.id ? { ...item, status: "approved" } : item)));
    logAudit("MODERATION_APPROVED", `Approved proposal ${p.id} (${p.name}). Verified badge issued.`);
    toast.success("Profile Approved", `${p.name} (${p.id}) is now live with Verified ID badge.`);
  };

  const handleRejectProfile = (p: PendingProfile, reason: string) => {
    setProfiles((prev) => prev.map((item) => (item.id === p.id ? { ...item, status: "rejected" } : item)));
    logAudit("MODERATION_REJECTED", `Rejected proposal ${p.id}. Reason: ${reason}`);
    toast.info("Profile Rejected", `${p.name} notified with reason: ${reason}`);
  };

  // Safety Actions
  const handleDismissReport = (rep: SafetyReport) => {
    setReports((prev) => prev.map((item) => (item.id === rep.id ? { ...item, status: "dismissed" } : item)));
    logAudit("SAFETY_DISMISSED", `Dismissed report ${rep.id} against ${rep.reportedUserName}`);
    toast.info("Report Dismissed", "Marked as non-violating.");
  };

  const handleWarnUser = (rep: SafetyReport) => {
    setReports((prev) => prev.map((item) => (item.id === rep.id ? { ...item, status: "warned" } : item)));
    logAudit("SAFETY_USER_WARNED", `Issued official conduct warning to ${rep.reportedUserName} (${rep.reportedUserId})`);
    toast.warning("Warning Dispatched", `Safety warning sent to ${rep.reportedUserName}.`);
  };

  const handleBanUser = (rep: SafetyReport) => {
    setReports((prev) => prev.map((item) => (item.id === rep.id ? { ...item, status: "banned" } : item)));
    logAudit("SAFETY_USER_BANNED", `Permanent account ban enforced on ${rep.reportedUserName} (${rep.reportedUserId})`);
    toast.error("User Banned", `${rep.reportedUserName} has been permanently deactivated.`);
  };

  // Finance Actions
  const handleApproveSlip = (slip: FinanceSlip) => {
    setSlips((prev) => prev.map((item) => (item.id === slip.id ? { ...item, status: "approved" } : item)));
    logAudit("FINANCE_SLIP_VERIFIED", `Approved LKR ${slip.amountLkr.toLocaleString()} for ${slip.userName}. Plan activated: ${slip.planId.toUpperCase()}`);
    toast.success("Payment Verified", `${slip.userName}'s ${slip.planId.toUpperCase()} subscription is now active!`);
  };

  const handleRejectSlip = (slip: FinanceSlip, reason: string) => {
    setSlips((prev) => prev.map((item) => (item.id === slip.id ? { ...item, status: "rejected" } : item)));
    logAudit("FINANCE_SLIP_REJECTED", `Rejected slip ${slip.id} for ${slip.userName}. Reason: ${reason}`);
    toast.error("Deposit Slip Rejected", `${slip.userName} requested to re-upload receipt.`);
  };

  // Support Actions
  const handleResolveTicket = (t: SupportTicket) => {
    setTickets((prev) => prev.map((item) => (item.id === t.id ? { ...item, status: "resolved" } : item)));
    logAudit("TICKET_RESOLVED", `Support ticket ${t.id} resolved for ${t.userName}`);
    toast.success("Ticket Resolved", `Marked ${t.id} as closed.`);
  };

  // Render Login Gate if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-page-gradient text-ink flex flex-col justify-between">
        <Navbar variant="light" />

        <div className="container-page flex-1 flex items-center justify-center py-12">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface-card p-8 shadow-2xl flex flex-col gap-6 animate-fade-up">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-subtle text-icon-brand shadow-inner">
                <ShieldSecurity size={32} color="currentColor" />
              </div>
              <h1 className="text-h3 font-bold text-ink">Staff Security Portal</h1>
              <p className="text-body-sm text-ink-secondary">
                Flow 6 · Operational Governance & Departmental RBAC
              </p>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 rounded-lg bg-error-bg p-3 text-label-sm text-error-fg">
                <CloseCircle size={18} color="currentColor" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              {!twoFactorStep ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-label-sm text-ink">Staff Email</label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                      className="h-11 rounded-lg border border-line bg-surface-card px-3 text-body-md text-ink focus:border-brand-focus focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-label-sm text-ink">Password</label>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                      className="h-11 rounded-lg border border-line bg-surface-card px-3 text-body-md text-ink focus:border-brand-focus focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="mt-2 flex h-12 items-center justify-center gap-2 rounded-full bg-brand-gradient text-button-md text-ink-on-brand shadow-sm hover:shadow-glow"
                  >
                    <Key size={18} color="currentColor" />
                    Continue to 2FA Challenge
                  </button>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-2 rounded-xl bg-brand-subtle/50 p-4 border border-line">
                    <div className="flex items-center justify-between text-label-sm text-ink font-semibold">
                      <span>2FA Authentication Code</span>
                      <button
                        type="button"
                        onClick={() => setTwoFactorCode("999888")}
                        className="text-brand-link text-xs underline font-bold"
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
                      className="h-12 text-center text-h4 tracking-widest font-mono rounded-lg border border-line bg-surface-card text-ink focus:border-brand-focus focus:outline-none"
                    />
                    <p className="text-caption text-ink-tertiary text-center">
                      Security token generated via Google Authenticator or SMS.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="mt-2 flex h-12 items-center justify-center gap-2 rounded-full bg-brand-gradient text-button-md text-ink-on-brand shadow-sm hover:shadow-glow"
                  >
                    <ShieldSecurity size={18} color="currentColor" />
                    Verify & Access Console
                  </button>

                  <button
                    type="button"
                    onClick={() => setTwoFactorStep(false)}
                    className="text-center text-label-sm text-ink-tertiary hover:text-ink"
                  >
                    Back to credentials
                  </button>
                </>
              )}
            </form>

            <div className="border-t border-line pt-4 flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-ink-tertiary text-center uppercase tracking-wider">
                Instant Role Switcher (For Evaluation)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => authenticateAdmin("moderator@aura.lk", "Shanika Perera", "Moderator")}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-line bg-surface-subtle p-2 text-label-sm text-ink hover:bg-brand-subtle"
                >
                  <Verify size={14} color="currentColor" className="text-emerald-500" />
                  Moderator
                </button>
                <button
                  type="button"
                  onClick={() => authenticateAdmin("safety@aura.lk", "Mahesh Silva", "SafetyOfficer")}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-line bg-surface-subtle p-2 text-label-sm text-ink hover:bg-brand-subtle"
                >
                  <Danger size={14} color="currentColor" className="text-amber-500" />
                  Safety Officer
                </button>
                <button
                  type="button"
                  onClick={() => authenticateAdmin("finance@aura.lk", "Ruwan Fernando", "FinanceManager")}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-line bg-surface-subtle p-2 text-label-sm text-ink hover:bg-brand-subtle"
                >
                  <CardIcon size={14} color="currentColor" className="text-blue-500" />
                  Finance
                </button>
                <button
                  type="button"
                  onClick={() => authenticateAdmin("admin@aura.lk", "Kumara Senanayake", "SuperAdmin")}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-line bg-surface-subtle p-2 text-label-sm text-ink hover:bg-brand-subtle"
                >
                  <ShieldSecurity size={14} color="currentColor" className="text-purple-500" />
                  Super Admin
                </button>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // Active Admin Console
  return (
    <div className="min-h-screen bg-page-gradient text-ink flex flex-col justify-between">
      <Navbar variant="light" />

      {/* Staff Bar */}
      <div className="border-b border-line bg-surface-card/90 backdrop-blur-md px-6 py-3">
        <div className="container-page flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold text-sm">
              {currentAdmin?.name[0] || "A"}
            </span>
            <div className="flex flex-col">
              <span className="text-body-sm font-bold text-ink">{currentAdmin?.name}</span>
              <span className="text-caption text-ink-tertiary">Role: <strong className="text-brand-text">{currentAdmin?.role}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 text-xs font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              2FA Session Active
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1 rounded-full border border-line bg-surface-card px-3 py-1.5 text-button-sm text-ink hover:bg-error-bg hover:text-error-fg transition-colors"
            >
              <LogoutCurve size={16} color="currentColor" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Admin Dashboard */}
      <main className="container-page flex-1 py-8 flex flex-col gap-8">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-line bg-surface-card p-5 shadow-sm flex flex-col gap-1">
            <span className="text-caption text-ink-tertiary">Pending Moderation</span>
            <span className="text-h3 font-bold text-ink">{profiles.filter((p) => p.status === "pending").length}</span>
            <span className="text-[12px] text-amber-600 font-medium">NIC & Photo Review</span>
          </div>
          <div className="rounded-xl border border-line bg-surface-card p-5 shadow-sm flex flex-col gap-1">
            <span className="text-caption text-ink-tertiary">Safety Flags</span>
            <span className="text-h3 font-bold text-ink">{reports.filter((r) => r.status === "open").length}</span>
            <span className="text-[12px] text-rose-600 font-medium">Anti-Scam Alerts</span>
          </div>
          <div className="rounded-xl border border-line bg-surface-card p-5 shadow-sm flex flex-col gap-1">
            <span className="text-caption text-ink-tertiary">Unverified Bank Slips</span>
            <span className="text-h3 font-bold text-ink">{slips.filter((s) => s.status === "pending").length}</span>
            <span className="text-[12px] text-blue-600 font-medium">Offline Deposits</span>
          </div>
          <div className="rounded-xl border border-line bg-surface-card p-5 shadow-sm flex flex-col gap-1">
            <span className="text-caption text-ink-tertiary">Open Support Tickets</span>
            <span className="text-h3 font-bold text-ink">{tickets.filter((t) => t.status === "open").length}</span>
            <span className="text-[12px] text-emerald-600 font-medium">Resolution SLA &lt; 2h</span>
          </div>
        </div>

        {/* Queue Navigation Tabs */}
        <div className="flex border-b border-line gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("moderation")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2.5 text-label-md font-semibold transition-all whitespace-nowrap",
              activeTab === "moderation" ? "border-brand text-brand-text" : "border-transparent text-ink-secondary hover:text-ink"
            )}
          >
            <Verify size={18} color="currentColor" />
            1. Moderation Queue ({profiles.filter((p) => p.status === "pending").length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("safety")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2.5 text-label-md font-semibold transition-all whitespace-nowrap",
              activeTab === "safety" ? "border-brand text-brand-text" : "border-transparent text-ink-secondary hover:text-ink"
            )}
          >
            <Danger size={18} color="currentColor" />
            2. Safety & Trust ({reports.filter((r) => r.status === "open").length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("finance")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2.5 text-label-md font-semibold transition-all whitespace-nowrap",
              activeTab === "finance" ? "border-brand text-brand-text" : "border-transparent text-ink-secondary hover:text-ink"
            )}
          >
            <CardIcon size={18} color="currentColor" />
            3. Finance & Slips ({slips.filter((s) => s.status === "pending").length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("support")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2.5 text-label-md font-semibold transition-all whitespace-nowrap",
              activeTab === "support" ? "border-brand text-brand-text" : "border-transparent text-ink-secondary hover:text-ink"
            )}
          >
            <MessageQuestion size={18} color="currentColor" />
            4. Helpdesk Tickets ({tickets.filter((t) => t.status === "open").length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2.5 text-label-md font-semibold transition-all whitespace-nowrap",
              activeTab === "audit" ? "border-brand text-brand-text" : "border-transparent text-ink-secondary hover:text-ink"
            )}
          >
            <DocumentText size={18} color="currentColor" />
            5. Audit & Governance ({auditLogs.length})
          </button>
        </div>

        {/* Tab 1: Moderation Queue */}
        {activeTab === "moderation" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-h4 font-bold text-ink">Candidate Profiles & National ID Verification</h2>
                <p className="text-body-sm text-ink-secondary">Check identity documents, inspect photos, and grant the green Verified badge.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    "flex flex-col rounded-2xl border bg-surface-card p-5 shadow-sm transition-all gap-4",
                    p.status === "approved" ? "border-emerald-300 bg-emerald-50/20" : p.status === "rejected" ? "border-rose-300 opacity-60" : "border-line"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.profilePhotoUrl} alt="" className="h-14 w-14 rounded-full object-cover border border-line" />
                      <div>
                        <h3 className="text-h6 font-bold text-ink">{p.name}</h3>
                        <p className="text-caption text-ink-secondary">{p.id} · {p.age} yrs · {p.gender}</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                        p.status === "approved" ? "bg-emerald-100 text-emerald-800" : p.status === "rejected" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                      )}
                    >
                      {p.status}
                    </span>
                  </div>

                  <div className="rounded-lg bg-surface-subtle p-3 text-body-xs flex flex-col gap-1 text-ink-secondary">
                    <p><strong>Profession:</strong> {p.profession}</p>
                    <p><strong>Location:</strong> {p.location}</p>
                    <p><strong>NIC Number:</strong> <span className="font-mono font-semibold">{p.nicNumber}</span></p>
                    <p className="line-clamp-2 italic pt-1">"{p.bio}"</p>
                  </div>

                  {/* Simulated National ID Document Preview */}
                  <div className="rounded-lg border border-line p-2 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DocumentText size={20} color="currentColor" className="text-emerald-400" />
                      <span className="text-xs font-mono font-semibold">NIC_FRONT_DOC.PDF</span>
                    </div>
                    <span className="text-[11px] text-slate-400">Match: 98% Face</span>
                  </div>

                  {p.status === "pending" ? (
                    <div className="flex gap-2 pt-2 border-t border-line">
                      <button
                        type="button"
                        onClick={() => handleRejectProfile(p, "Unclear National ID image")}
                        className="flex-1 flex h-10 items-center justify-center gap-1 rounded-full border border-line text-button-sm text-error-fg hover:bg-error-bg"
                      >
                        <CloseCircle size={16} color="currentColor" /> Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveProfile(p)}
                        className="flex-1 flex h-10 items-center justify-center gap-1 rounded-full bg-emerald-600 text-button-sm text-white hover:bg-emerald-700 shadow-sm"
                      >
                        <Verify size={16} color="currentColor" /> Approve & Verify
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-caption text-ink-tertiary pt-2 border-t border-line">
                      Action completed
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Safety & Trust Queue */}
        {activeTab === "safety" && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-h4 font-bold text-ink">Anti-Scam & Harassment Watchlist</h2>
              <p className="text-body-sm text-ink-secondary">Investigate messages flagged for money solicitation, unauthorized contact leaks, or misconduct.</p>
            </div>

            <div className="flex flex-col gap-4">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className={cn(
                    "flex flex-col md:flex-row md:items-center justify-between rounded-xl border p-5 bg-surface-card gap-4 shadow-sm",
                    rep.status === "banned" ? "border-rose-400 bg-rose-50/20" : "border-line"
                  )}
                >
                  <div className="flex flex-col gap-2 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-ink-tertiary">{rep.id}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 text-xs px-2.5 py-0.5 font-bold">
                        <Danger size={12} color="currentColor" /> {rep.riskLevel} Risk
                      </span>
                      <span className="text-body-sm font-bold text-ink">Reported: {rep.reportedUserName}</span>
                      <span className="text-caption text-ink-tertiary">by {rep.reporterId}</span>
                    </div>

                    <div className="rounded-lg bg-surface-subtle border border-line p-3 text-body-sm font-mono text-ink">
                      {rep.snippet}
                    </div>

                    <p className="text-caption text-ink-secondary">Violation Trigger: <strong className="capitalize">{rep.reason.replace("_", " ")}</strong> · {rep.reportedAt}</p>
                  </div>

                  {rep.status === "open" ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDismissReport(rep)}
                        className="flex h-10 items-center gap-1 rounded-full border border-line px-4 text-button-sm text-ink hover:bg-surface-subtle"
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        onClick={() => handleWarnUser(rep)}
                        className="flex h-10 items-center gap-1 rounded-full bg-amber-500 text-button-sm text-white hover:bg-amber-600 px-4"
                      >
                        <Warning2 size={16} color="currentColor" /> Warn User
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBanUser(rep)}
                        className="flex h-10 items-center gap-1 rounded-full bg-rose-600 text-button-sm text-white hover:bg-rose-700 px-4 shadow-sm"
                      >
                        <Trash size={16} color="currentColor" /> Permanent Ban
                      </button>
                    </div>
                  ) : (
                    <span className="font-semibold text-caption text-ink-tertiary uppercase">
                      Status: {rep.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Finance & Offline Slips */}
        {activeTab === "finance" && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-h4 font-bold text-ink">Bank Transfer & LankaQR Deposit Slips</h2>
              <p className="text-body-sm text-ink-secondary">Review offline payment proofs and activate member Gold / Platinum subscriptions.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {slips.map((slip) => (
                <div
                  key={slip.id}
                  className={cn(
                    "flex flex-col rounded-2xl border p-5 bg-surface-card gap-4 shadow-sm",
                    slip.status === "approved" ? "border-emerald-300 bg-emerald-50/20" : "border-line"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-caption text-ink-tertiary font-mono">{slip.id}</span>
                      <h3 className="text-h6 font-bold text-ink">{slip.userName}</h3>
                      <p className="text-body-sm text-brand-text font-semibold capitalize">{slip.planId} Tier · {slip.durationMonths} Months</p>
                    </div>
                    <span className="text-h5 font-bold text-ink">LKR {slip.amountLkr.toLocaleString()}</span>
                  </div>

                  <div className="rounded-lg bg-surface-subtle p-3 text-body-xs flex flex-col gap-1 text-ink-secondary">
                    <p><strong>Bank:</strong> {slip.bankName}</p>
                    <p><strong>Ref Code:</strong> <span className="font-mono font-bold text-ink">{slip.referenceNumber}</span></p>
                    <p><strong>Submitted:</strong> {slip.submittedAt}</p>
                  </div>

                  {/* Simulated Deposit Slip Receipt */}
                  <div className="rounded-lg border border-line p-3 bg-white text-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt21 size={22} color="currentColor" className="text-blue-600" />
                      <div>
                        <p className="text-xs font-bold">DEPOSIT_SLIP_{slip.referenceNumber}.JPG</p>
                        <p className="text-[10px] text-slate-500">Commercial Bank Cash Deposit Stamp Verified</p>
                      </div>
                    </div>
                    <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 font-bold">LEGIBLE</span>
                  </div>

                  {slip.status === "pending" ? (
                    <div className="flex gap-2 pt-2 border-t border-line">
                      <button
                        type="button"
                        onClick={() => handleRejectSlip(slip, "Amount on slip does not match plan price")}
                        className="flex-1 flex h-10 items-center justify-center gap-1 rounded-full border border-line text-button-sm text-error-fg hover:bg-error-bg"
                      >
                        Decline Slip
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveSlip(slip)}
                        className="flex-1 flex h-10 items-center justify-center gap-1 rounded-full bg-brand-gradient text-button-sm text-ink-on-brand shadow-sm hover:shadow-glow"
                      >
                        <TickCircle size={16} color="currentColor" /> Approve & Upgrade Member
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-caption text-ink-tertiary pt-2 border-t border-line">
                      Membership upgrade completed
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Customer Support Helpdesk */}
        {activeTab === "support" && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-h4 font-bold text-ink">Member Support & Inquiries</h2>
              <p className="text-body-sm text-ink-secondary">Resolve technical, horoscope, and subscription inquiries under 2-hour SLA.</p>
            </div>

            <div className="flex flex-col gap-4">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className={cn(
                    "flex flex-col md:flex-row md:items-center justify-between rounded-xl border p-5 bg-surface-card gap-4 shadow-sm",
                    t.status === "resolved" ? "border-emerald-200 bg-emerald-50/10 opacity-70" : "border-line"
                  )}
                >
                  <div className="flex flex-col gap-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-ink-tertiary">{t.id}</span>
                      <span className="rounded-full bg-blue-100 text-blue-800 text-[11px] px-2 py-0.5 font-semibold">{t.category}</span>
                      <span className="font-bold text-body-md text-ink">{t.subject}</span>
                    </div>
                    <p className="text-body-sm text-ink-secondary">{t.message}</p>
                    <p className="text-caption text-ink-tertiary">From {t.userName} ({t.userEmail}) · {t.createdAt}</p>
                  </div>

                  {t.status === "open" ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleResolveTicket(t)}
                        className="flex h-10 items-center gap-1 rounded-full bg-emerald-600 text-button-sm text-white hover:bg-emerald-700 px-5"
                      >
                        <TickCircle size={16} color="currentColor" /> Mark Resolved
                      </button>
                    </div>
                  ) : (
                    <span className="text-caption font-bold text-emerald-700 uppercase">Resolved</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Audit & Governance */}
        {activeTab === "audit" && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-h4 font-bold text-ink">Security Audit Trail & Governance Log</h2>
              <p className="text-body-sm text-ink-secondary">Immutable log of staff actions, approvals, bans, and access events for compliance.</p>
            </div>

            <div className="rounded-2xl border border-line bg-surface-card overflow-hidden shadow-sm">
              <table className="w-full text-left text-body-sm">
                <thead className="bg-surface-subtle border-b border-line text-caption font-bold text-ink-secondary uppercase">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Staff / Role</th>
                    <th className="px-4 py-3">Event Action</th>
                    <th className="px-4 py-3">Details</th>
                    <th className="px-4 py-3">Host IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-brand-subtle/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-caption text-ink-tertiary whitespace-nowrap">{log.timestamp}</td>
                      <td className="px-4 py-3 font-semibold text-ink whitespace-nowrap">{log.staffName} <span className="text-caption text-ink-tertiary font-normal">({log.role})</span></td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-brand-text whitespace-nowrap">{log.action}</td>
                      <td className="px-4 py-3 text-ink-secondary">{log.details}</td>
                      <td className="px-4 py-3 font-mono text-caption text-ink-tertiary whitespace-nowrap">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
