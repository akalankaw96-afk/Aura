"use client";

/**
 * Admin back office — members, statistics, roles and staff accounts.
 *
 * Planned endpoints (docs/API_GUIDELINES.md → "Planned: admin back office"). They are NOT on the server yet:
 * in development builds a missing endpoint (404 / server not running) falls back to clearly labelled
 * demo data so the screens can be reviewed; in production the page shows "needs API".
 * Review queue, photos and moderator roles use the real endpoints in lib/staff.ts.
 */
import { apiRequest } from "@/lib/http";

const DEV = process.env.NODE_ENV !== "production";

export type MemberStatus = "Active" | "PendingReview" | "Incomplete" | "Deactivated" | "Blocked";
export type MemberAction = "activate" | "deactivate" | "block" | "unblock";

export interface AdminStats {
  totalMembers: number;
  activeMembers: number; // logged in within 30 days
  pendingReviews: number;
  kycUpdates: number;
  incompleteRegistrations: number; // signed up, profile not submitted
  newThisWeek: number;
  blocked: number;
  paidMembers: number;
}

export interface AdminMember {
  userId: string;
  profileId?: string | null;
  code?: string | null;
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  gender?: "Male" | "Female" | null;
  plan: "Free" | "Gold" | "Platinum";
  status: MemberStatus;
  joinedAt: string;
  lastActiveAt?: string | null;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type Permission =
  | "dashboard.view"
  | "reviews.view"
  | "reviews.decide"
  | "photos.moderate"
  | "documents.view"
  | "members.view"
  | "members.status"
  | "members.resetPassword"
  | "payments.verify"
  | "reports.handle"
  | "staff.manage";

export const PERMISSION_GROUPS: { title: string; items: { id: Permission; label: string; hint: string }[] }[] = [
  { title: "Overview", items: [{ id: "dashboard.view", label: "View dashboard", hint: "Counts and recent activity" }] },
  {
    title: "Profile reviews",
    items: [
      { id: "reviews.view", label: "See review queue", hint: "New and resubmitted profiles" },
      { id: "reviews.decide", label: "Approve or request changes", hint: "Also suspend / reinstate" },
      { id: "photos.moderate", label: "Moderate photos", hint: "Approve or reject new photos" },
      { id: "documents.view", label: "Open ID documents", hint: "Every view is logged" },
    ],
  },
  {
    title: "Members",
    items: [
      { id: "members.view", label: "See member list", hint: "Name, mobile, email, status" },
      { id: "members.status", label: "Activate, deactivate, block", hint: "With a reason, logged" },
      { id: "members.resetPassword", label: "Reset passwords", hint: "Member sets a new one with an SMS code" },
    ],
  },
  {
    title: "Business",
    items: [
      { id: "payments.verify", label: "Verify bank transfers", hint: "Approve receipts, activate plans" },
      { id: "reports.handle", label: "Handle reports", hint: "Reports and blocks from members" },
    ],
  },
  { title: "Administration", items: [{ id: "staff.manage", label: "Manage staff and roles", hint: "Create accounts, change roles" }] },
];
export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.id));

export interface AdminRole {
  id: string;
  name: string;
  description?: string;
  builtIn: boolean; // Admin / Moderator can't be deleted
  permissions: Permission[];
  staffCount: number;
}

export interface StaffAccount {
  userId: string;
  fullName: string;
  username: string;
  email?: string | null;
  roleId: string;
  roleName: string;
  status: "Active" | "Deactivated";
  lastLoginAt?: string | null;
  mustChangePassword?: boolean;
}

export type Result<T> = { data: T; demo: boolean };

/* ───────────── transport with dev demo fallback ───────────── */

export class NeedsApi extends Error {
  constructor() {
    super("This part of the staff area needs the server update (planned endpoints in docs/API_GUIDELINES.md).");
  }
}

async function call<T>(path: string, init: { method?: string; json?: unknown } | undefined, demo: () => T): Promise<Result<T>> {
  let res: Response;
  try {
    res = await apiRequest(path, { method: init?.method ?? "GET", json: init?.json, cache: "no-store" });
  } catch (e) {
    if (DEV) return { data: demo(), demo: true };
    throw e;
  }
  if (res.status === 404 || res.status === 405 || res.status === 501) {
    if (DEV) return { data: demo(), demo: true };
    throw new NeedsApi();
  }
  if (!res.ok) {
    const p: { title?: string } = await res.json().catch(() => ({}));
    throw new Error(p.title || "Something went wrong. Please try again.");
  }
  if (res.status === 204) return { data: undefined as T, demo: false };
  return { data: (await res.json()) as T, demo: false };
}

/* ───────────── demo data (dev only) ───────────── */

const FIRST = ["Nethmi", "Kasun", "Dilani", "Sahan", "Hiruni", "Tharindu", "Ishara", "Ruwan", "Sachini", "Chamara", "Anjali", "Pradeep", "Kavindi", "Nuwan", "Madhavi", "Isuru", "Dulmini", "Lahiru", "Piumi", "Gayan"];
const LAST = ["Perera", "Silva", "Fernando", "Jayasinghe", "Bandara", "Wickramasinghe", "Rathnayake", "Gunawardena", "Senanayake", "Herath"];
const STATUSES: MemberStatus[] = ["Active", "Active", "Active", "Active", "PendingReview", "Incomplete", "Active", "Deactivated", "Active", "Blocked", "Incomplete", "PendingReview"];
const demoMembers: AdminMember[] = Array.from({ length: 64 }, (_, i) => {
  const first = FIRST[i % FIRST.length];
  const last = LAST[(i * 7) % LAST.length];
  const day = 86_400_000;
  const status = STATUSES[i % STATUSES.length];
  return {
    userId: `demo-${i + 1}`,
    profileId: status === "Incomplete" ? null : `p-${i + 1}`,
    code: status === "Incomplete" ? null : `MP-${24100 + i * 7}`,
    fullName: `${first} ${last}`,
    phoneNumber: `+94 7${(i * 3) % 8} ${String(1000000 + i * 7919).slice(0, 3)} ${String(1000 + i * 37).slice(-4)}`,
    email: i % 4 === 3 ? null : `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
    gender: i % 2 ? "Male" : "Female",
    plan: i % 9 === 0 ? "Platinum" : i % 4 === 0 ? "Gold" : "Free",
    status,
    joinedAt: new Date(Date.now() - (i * 1.7 + 0.3) * day).toISOString(),
    lastActiveAt: status === "Active" ? new Date(Date.now() - ((i * 5) % 40) * 3_600_000).toISOString() : null,
  };
});

let demoRoles: AdminRole[] = [
  { id: "admin", name: "Admin", description: "Full access, including staff and roles", builtIn: true, permissions: [...ALL_PERMISSIONS], staffCount: 1 },
  {
    id: "moderator",
    name: "Moderator",
    description: "Reviews profiles, photos and ID documents",
    builtIn: true,
    permissions: ["dashboard.view", "reviews.view", "reviews.decide", "photos.moderate", "documents.view", "members.view"],
    staffCount: 2,
  },
  { id: "support", name: "Support agent", description: "Helps members with their accounts", builtIn: false, permissions: ["dashboard.view", "members.view", "members.resetPassword", "reports.handle"], staffCount: 1 },
];
let demoStaff: StaffAccount[] = [
  { userId: "s1", fullName: "Aura Admin", username: "admin", email: "admin@example.com", roleId: "admin", roleName: "Admin", status: "Active", lastLoginAt: new Date().toISOString() },
  { userId: "s2", fullName: "Shehani Moderator", username: "shehani", roleId: "moderator", roleName: "Moderator", status: "Active", lastLoginAt: new Date(Date.now() - 3 * 3_600_000).toISOString() },
  { userId: "s3", fullName: "Dinuka Moderator", username: "dinuka", roleId: "moderator", roleName: "Moderator", status: "Deactivated", lastLoginAt: null },
  { userId: "s4", fullName: "Malsha Support", username: "malsha", roleId: "support", roleName: "Support agent", status: "Active", lastLoginAt: new Date(Date.now() - 26 * 3_600_000).toISOString(), mustChangePassword: true },
];

const demoStats = (): AdminStats => {
  const c = (s: MemberStatus) => demoMembers.filter((m) => m.status === s).length;
  return {
    totalMembers: demoMembers.length,
    activeMembers: c("Active"),
    pendingReviews: c("PendingReview"),
    kycUpdates: 3,
    incompleteRegistrations: c("Incomplete"),
    newThisWeek: demoMembers.filter((m) => Date.now() - new Date(m.joinedAt).getTime() < 7 * 86_400_000).length,
    blocked: c("Blocked"),
    paidMembers: demoMembers.filter((m) => m.plan !== "Free").length,
  };
};

/* ───────────── API ───────────── */

export const getAdminStats = () => call<AdminStats>("/admin/stats", undefined, demoStats);

export function getMembers(q: { search?: string; status?: MemberStatus | "All"; page?: number; pageSize?: number; sort?: "newest" }) {
  const page = q.page ?? 1;
  const pageSize = q.pageSize ?? 10;
  const params = new URLSearchParams();
  if (q.search) params.set("search", q.search);
  if (q.status && q.status !== "All") params.set("status", q.status);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  return call<Paged<AdminMember>>(`/admin/members?${params}`, undefined, () => {
    const s = (q.search ?? "").trim().toLowerCase();
    const list = demoMembers
      .filter((m) => !q.status || q.status === "All" || m.status === q.status)
      .filter((m) => !s || [m.fullName, m.phoneNumber.replace(/\s/g, ""), m.email ?? "", m.code ?? ""].some((v) => v.toLowerCase().includes(s.replace(/\s/g, ""))))
      .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
    return { items: list.slice((page - 1) * pageSize, page * pageSize), total: list.length, page, pageSize };
  });
}

export function setMemberStatus(userId: string, action: MemberAction, reason?: string) {
  return call<void>(`/admin/members/${encodeURIComponent(userId)}/status`, { method: "POST", json: { action, reason } }, () => {
    const m = demoMembers.find((x) => x.userId === userId);
    if (m) m.status = action === "block" ? "Blocked" : action === "deactivate" ? "Deactivated" : "Active";
  });
}

export const resetMemberPassword = (userId: string) =>
  call<void>(`/admin/members/${encodeURIComponent(userId)}/reset-password`, { method: "POST", json: {} }, () => undefined);

export const getRoles = () => call<AdminRole[]>("/admin/roles", undefined, () => demoRoles.map((r) => ({ ...r, staffCount: demoStaff.filter((s) => s.roleId === r.id).length })));

export function saveRole(role: { id?: string; name: string; description?: string; permissions: Permission[] }) {
  const path = role.id ? `/admin/roles/${encodeURIComponent(role.id)}` : "/admin/roles";
  return call<AdminRole>(path, { method: role.id ? "PUT" : "POST", json: role }, () => {
    if (role.id) {
      demoRoles = demoRoles.map((r) => (r.id === role.id ? { ...r, ...role, builtIn: r.builtIn } : r));
      return demoRoles.find((r) => r.id === role.id)!;
    }
    const created: AdminRole = { id: `role-${Date.now()}`, builtIn: false, staffCount: 0, ...role };
    demoRoles = [...demoRoles, created];
    return created;
  });
}

export const deleteRole = (id: string) =>
  call<void>(`/admin/roles/${encodeURIComponent(id)}`, { method: "DELETE" }, () => {
    demoRoles = demoRoles.filter((r) => r.id !== id);
  });

export const getStaffAccounts = () => call<StaffAccount[]>("/admin/staff-accounts", undefined, () => [...demoStaff]);

export function createStaffAccount(a: { fullName: string; username: string; email?: string; password: string; roleId: string }) {
  return call<StaffAccount>("/admin/staff-accounts", { method: "POST", json: a }, () => {
    const role = demoRoles.find((r) => r.id === a.roleId);
    const s: StaffAccount = { userId: `s-${Date.now()}`, fullName: a.fullName, username: a.username, email: a.email, roleId: a.roleId, roleName: role?.name ?? "", status: "Active", lastLoginAt: null, mustChangePassword: true };
    demoStaff = [...demoStaff, s];
    return s;
  });
}

export function updateStaffAccount(userId: string, patch: { roleId?: string; status?: "Active" | "Deactivated" }) {
  return call<void>(`/admin/staff-accounts/${encodeURIComponent(userId)}`, { method: "PATCH", json: patch }, () => {
    demoStaff = demoStaff.map((s) =>
      s.userId === userId ? { ...s, ...patch, roleName: patch.roleId ? demoRoles.find((r) => r.id === patch.roleId)?.name ?? s.roleName : s.roleName } : s,
    );
  });
}

export const resetStaffPassword = (userId: string) =>
  call<{ temporaryPassword: string }>(`/admin/staff-accounts/${encodeURIComponent(userId)}/reset-password`, { method: "POST", json: {} }, () => ({
    temporaryPassword: makeTempPassword(),
  }));

/** Strong temporary password (staff must change it at first login). */
export function makeTempPassword() {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789", "!@#$%*?"];
  const all = sets.join("");
  const rnd = (n: number) => {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % n;
  };
  const chars = sets.map((s) => s[rnd(s.length)]);
  while (chars.length < 12) chars.push(all[rnd(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export const STATUS_META: Record<MemberStatus, { label: string; tone: "success" | "warning" | "neutral" | "error" | "info" }> = {
  Active: { label: "Active", tone: "success" },
  PendingReview: { label: "Pending review", tone: "warning" },
  Incomplete: { label: "Half registered", tone: "info" },
  Deactivated: { label: "Deactivated", tone: "neutral" },
  Blocked: { label: "Blocked", tone: "error" },
};

