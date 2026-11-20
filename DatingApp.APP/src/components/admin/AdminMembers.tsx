"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CloseCircle, Eye, Key, More, Refresh2, SearchNormal1, Slash, TickCircle, UserMinus } from "iconsax-react";
import { cn } from "@/lib/cn";
import { Badge, Button, ConfirmDialog, Pagination, Textarea, useToast } from "@/components/ui";
import {
  getMembers,
  resetMemberPassword,
  setMemberStatus,
  STATUS_META,
  type AdminMember,
  type MemberAction,
  type MemberStatus,
} from "@/lib/adminApi";
import { AdminPageHeader, DemoBanner, useAdmin } from "./AdminShell";
import { MemberCell, PlanChip } from "./AdminDashboard";

/**
 * /admin/members — every member: search (name, mobile, email, profile code), status filter,
 * paged table. Row actions: view / review profile, activate, deactivate, block / unblock,
 * reset password (member sets a new one with an SMS code — staff never type passwords).
 * Block / deactivate ask for a reason (stored in the audit log).
 */
const FILTERS: { id: MemberStatus | "All"; label: string }[] = [
  { id: "All", label: "All" },
  { id: "Active", label: "Active" },
  { id: "PendingReview", label: "Pending review" },
  { id: "Incomplete", label: "Half registered" },
  { id: "Deactivated", label: "Deactivated" },
  { id: "Blocked", label: "Blocked" },
];
const PAGE_SIZE = 10;

type Pending = { member: AdminMember; action: MemberAction | "reset" } | null;

export function AdminMembers() {
  const params = useSearchParams();
  const toast = useToast();
  const [status, setStatus] = useState<MemberStatus | "All">((params.get("status") as MemberStatus) || "All");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminMember[] | null>(null);
  const [total, setTotal] = useState(0);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);

  const load = useCallback(async () => {
    setRows(null);
    try {
      const r = await getMembers({ search: query, status, page, pageSize: PAGE_SIZE });
      setRows(r.data.items);
      setTotal(r.data.total);
      setDemo(r.demo);
      setError(null);
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : "We couldn’t load members.");
    }
  }, [query, status, page]);
  useEffect(() => {
    void load();
  }, [load]);

  // search as you type (debounced)
  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      setQuery(search.trim());
    }, 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <AdminPageHeader
        title="Members"
        subtitle="Search, filter and manage every member account."
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()} leftIcon={<Refresh2 size={16} color="currentColor" />}>
            Refresh
          </Button>
        }
      />
      <DemoBanner show={demo} />

      <section className="overflow-hidden rounded-xl border border-line bg-surface-card shadow-xs">
        {/* toolbar */}
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-md border border-line bg-surface-card px-3 focus-within:border-brand-focus focus-within:shadow-ring-brand lg:max-w-[360px]">
            <SearchNormal1 size={18} color="currentColor" className="shrink-0 text-ink-tertiary" />
            <span className="sr-only">Search members</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, mobile, email or MP code"
              className="min-w-0 flex-1 bg-transparent text-body-md text-ink outline-none placeholder:text-ink-placeholder"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="text-ink-tertiary hover:text-ink">
                <CloseCircle size={18} color="currentColor" />
              </button>
            )}
          </label>
          <div role="tablist" aria-label="Filter by status" className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={status === f.id}
                onClick={() => {
                  setStatus(f.id);
                  setPage(1);
                }}
                className={cn(
                  "h-9 shrink-0 whitespace-nowrap rounded-full px-3.5 text-label-sm transition-colors",
                  status === f.id ? "bg-brand-gradient text-ink-on-brand" : "bg-surface-subtle text-ink-secondary hover:bg-brand-subtle hover:text-ink",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="text-label-sm text-ink-tertiary lg:ml-auto">{rows ? `${total} member${total === 1 ? "" : "s"}` : "Loading…"}</p>
        </div>

        {error && <p className="px-5 py-3 text-body-sm text-error-fg">{error}</p>}

        {/* phone: card list */}
        <ul className="divide-y divide-line md:hidden">
          {rows === null &&
            Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="px-4 py-4">
                <div className="h-10 animate-pulse rounded bg-surface-muted" />
              </li>
            ))}
          {rows?.map((m) => (
            <li key={m.userId} className="flex items-start gap-3 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <MemberCell m={m} />
                <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-12">
                  <Badge tone={STATUS_META[m.status].tone} icon={false}>
                    {STATUS_META[m.status].label}
                  </Badge>
                  <PlanChip plan={m.plan} />
                </div>
                <p className="mt-1.5 truncate pl-12 text-body-xs text-ink-secondary">
                  {m.phoneNumber}
                  {m.email ? ` · ${m.email}` : ""}
                </p>
              </div>
              <RowActions member={m} onPick={(action) => setPending({ member: m, action })} />
            </li>
          ))}
          {rows?.length === 0 && !error && (
            <li className="px-5 py-12 text-center">
              <p className="text-label-lg text-ink">No members found</p>
              <p className="text-body-sm text-ink-tertiary">Try another name, number or status.</p>
            </li>
          )}
        </ul>

        {/* tablet and up: table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[820px] text-left text-body-sm">
            <thead className="bg-surface-subtle text-label-sm text-ink-tertiary">
              <tr>
                <th className="px-5 py-3 font-semibold">Member</th>
                <th className="px-3 py-3 font-semibold">Mobile</th>
                <th className="px-3 py-3 font-semibold">Email</th>
                <th className="px-3 py-3 font-semibold">Plan</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Joined</th>
                <th className="px-5 py-3 text-right font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows === null &&
                Array.from({ length: 6 }, (_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-3.5">
                      <div className="h-6 animate-pulse rounded bg-surface-muted" />
                    </td>
                  </tr>
                ))}
              {rows?.map((m) => (
                <tr key={m.userId} className="hover:bg-surface-subtle">
                  <td className="px-5 py-3">
                    <MemberCell m={m} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-ink-secondary">{m.phoneNumber}</td>
                  <td className="max-w-[220px] truncate px-3 py-3 text-ink-secondary">{m.email ?? <span className="text-ink-tertiary">—</span>}</td>
                  <td className="px-3 py-3">
                    <PlanChip plan={m.plan} />
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={STATUS_META[m.status].tone} icon={false}>
                      {STATUS_META[m.status].label}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-ink-tertiary">
                    {new Date(m.joinedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <RowActions member={m} onPick={(action) => setPending({ member: m, action })} />
                  </td>
                </tr>
              ))}
              {rows?.length === 0 && !error && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <p className="text-label-lg text-ink">No members found</p>
                    <p className="text-body-sm text-ink-tertiary">Try another name, number or status.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-5">
          <p className="hidden text-body-xs text-ink-tertiary sm:block">
            Page {page} of {pageCount}
          </p>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </div>
      </section>

      {pending && (
        <ConfirmAction
          pending={pending}
          onClose={() => setPending(null)}
          onDone={(msg) => {
            setPending(null);
            toast.success(msg);
            void load();
          }}
        />
      )}
    </>
  );
}

/* ───────────── row actions menu ───────────── */

function RowActions({ member, onPick }: Readonly<{ member: AdminMember; onPick: (a: MemberAction | "reset") => void }>) {
  const [open, setOpen] = useState(false);
  // block / deactivate / password reset are Admin-only on the API (S04-T07)
  const { isAdmin } = useAdmin();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const s = member.status;
  const item = (label: string, Icon: typeof Eye, onClick: () => void, danger = false) => (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        setOpen(false);
        onClick();
      }}
      className={cn("flex w-full items-center gap-2.5 px-3 py-2 text-left text-body-sm", danger ? "text-error-fg hover:bg-error-bg" : "text-ink hover:bg-brand-subtle")}
    >
      <Icon size={16} color="currentColor" className={danger ? "" : "text-icon-brand"} /> {label}
    </button>
  );

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${member.fullName}`}
        className={cn("flex h-9 w-9 items-center justify-center rounded-full text-ink-secondary ring-1 ring-inset ring-line hover:bg-brand-subtle hover:text-brand", open && "bg-brand-subtle text-brand")}
      >
        <More size={18} color="currentColor" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-11 z-30 w-52 overflow-hidden rounded-lg border border-line bg-surface-card py-1 text-left shadow-lg">
          {member.profileId && (
            <Link
              role="menuitem"
              href={`/admin/reviews?open=${encodeURIComponent(member.profileId)}`}
              className="flex items-center gap-2.5 px-3 py-2 text-body-sm text-ink hover:bg-brand-subtle"
            >
              <Eye size={16} color="currentColor" className="text-icon-brand" /> {s === "PendingReview" ? "Review profile" : "View profile"}
            </Link>
          )}
          {isAdmin && (s === "Deactivated" || s === "Blocked") && item(s === "Blocked" ? "Unblock" : "Activate", TickCircle, () => onPick(s === "Blocked" ? "unblock" : "activate"))}
          {isAdmin && s !== "Deactivated" && s !== "Blocked" && item("Deactivate", UserMinus, () => onPick("deactivate"))}
          {isAdmin && item("Reset password", Key, () => onPick("reset"))}
          {isAdmin && s !== "Blocked" && <div className="my-1 border-t border-line" />}
          {isAdmin && s !== "Blocked" && item("Block member", Slash, () => onPick("block"), true)}
        </div>
      )}
    </div>
  );
}

/* ───────────── confirm modal ───────────── */

const ACTION_COPY: Record<MemberAction | "reset", { title: string; text: string; button: string; done: string; reason: boolean; danger: boolean }> = {
  activate: { title: "Activate this account?", text: "The member can log in again and their profile shows in search.", button: "Activate", done: "Account activated", reason: false, danger: false },
  deactivate: { title: "Deactivate this account?", text: "The member is logged out and hidden from search until you activate them again.", button: "Deactivate", done: "Account deactivated", reason: true, danger: true },
  block: { title: "Block this member?", text: "For rule breaking: they’re logged out, hidden everywhere and can’t sign up again with this number.", button: "Block member", done: "Member blocked", reason: true, danger: true },
  unblock: { title: "Unblock this member?", text: "They can log in again. Their profile shows in search once it’s approved.", button: "Unblock", done: "Member unblocked", reason: false, danger: false },
  reset: { title: "Reset this member’s password?", text: "They’ll be logged out and must set a new password with an SMS code at their next login. You never see or type their password.", button: "Reset password", done: "Password reset, member notified by SMS", reason: false, danger: false },
};

function ConfirmAction({ pending, onClose, onDone }: Readonly<{ pending: NonNullable<Pending>; onClose: () => void; onDone: (msg: string) => void }>) {
  const [reason, setReason] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const c = ACTION_COPY[pending.action];

  const submit = async () => {
    setTried(true);
    if (c.reason && reason.trim().length < 5) return;
    setBusy(true);
    setError(null);
    try {
      if (pending.action === "reset") await resetMemberPassword(pending.member.userId);
      else await setMemberStatus(pending.member.userId, pending.action, reason.trim() || undefined);
      onDone(c.done);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // shared ConfirmDialog (S05-T05): Esc / backdrop / Cancel close it, except while the change is being saved
  return (
    <ConfirmDialog
      open
      title={c.title}
      description={c.text}
      confirmLabel={c.button}
      tone={c.danger ? "danger" : "primary"}
      busy={busy}
      onConfirm={() => void submit()}
      onCancel={onClose}
    >
      <div className="flex items-center gap-3 rounded-lg bg-surface-subtle p-3">
        <MemberCell m={pending.member} />
        <span className="ml-auto">
          <Badge tone={STATUS_META[pending.member.status].tone} icon={false}>
            {STATUS_META[pending.member.status].label}
          </Badge>
        </span>
      </div>
      {c.reason && (
        <Textarea
          label="Reason"
          hint="Saved in the audit log"
          rows={3}
          maxLength={300}
          value={reason}
          onChange={setReason}
          placeholder={pending.action === "block" ? "For example: asked members for money" : "For example: member asked to pause their account"}
          error={tried && reason.trim().length < 5 ? "Write a short reason (5+ characters)" : undefined}
        />
      )}
      {error && <p className="text-body-sm text-error-fg">{error}</p>}
    </ConfirmDialog>
  );
}
