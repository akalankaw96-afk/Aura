"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight2, Crown1, DocumentText, People, ProfileAdd, ProfileTick, Refresh2, Slash, UserTick, Warning2 } from "iconsax-react";
import { cn } from "@/lib/cn";
import { Badge, Button } from "@/components/ui";
import { getQueue, type QueueItem } from "@/lib/staff";
import { getAdminStats, getMembers, STATUS_META, type AdminMember, type AdminStats } from "@/lib/adminApi";
import { AdminPageHeader, DemoBanner } from "./AdminShell";
import { Thumb } from "./ReviewQueue";

/**
 * /admin — overview: KPI cards, two review tables (new profiles · KYC updates = resubmitted),
 * recently registered members. Review tables use the real moderation queue.
 */
const ago = (iso?: string | null) => {
  if (!iso) return "—";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${Math.max(1, m)} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d} d ago` : new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [recent, setRecent] = useState<AdminMember[] | null>(null);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    const [s, q, r] = await Promise.allSettled([getAdminStats(), getQueue(), getMembers({ page: 1, pageSize: 6 })]);
    if (s.status === "fulfilled") {
      setStats(s.value.data);
      setDemo((d) => d || s.value.demo);
    }
    if (q.status === "fulfilled") setQueue(q.value);
    else setQueue([]);
    if (r.status === "fulfilled") setRecent(r.value.data.items);
    if (s.status === "rejected") setError(s.reason instanceof Error ? s.reason.message : "Couldn’t load the numbers.");
  };
  useEffect(() => {
    void load();
  }, []);

  const fresh = queue?.filter((x) => x.status === "Submitted") ?? null;
  const kyc = queue?.filter((x) => x.status === "Resubmitted") ?? null;
  // the live queue is the source of truth for review counts
  const pending = fresh?.length ?? stats?.pendingReviews;
  const kycCount = kyc?.length ?? stats?.kycUpdates;

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        subtitle={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()} leftIcon={<Refresh2 size={16} color="currentColor" />}>
            Refresh
          </Button>
        }
      />
      <DemoBanner show={demo} />
      {error && <p className="mb-4 text-body-sm text-error-fg">{error}</p>}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <Kpi label="Total members" value={stats?.totalMembers} Icon={People} tone="brand" note={stats ? `+${stats.newThisWeek} this week` : undefined} />
        <Kpi label="Active members" value={stats?.activeMembers} Icon={UserTick} tone="success" note="Active in the last 30 days" />
        <Kpi label="Waiting for review" value={pending} Icon={ProfileTick} tone="warning" note={kycCount ? `+${kycCount} KYC updates` : "New profiles"} href="/admin/reviews" urgent={!!pending} />
        <Kpi label="Half registered" value={stats?.incompleteRegistrations} Icon={ProfileAdd} tone="info" note="Signed up, profile not sent" href="/admin/users?status=Incomplete" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 md:mt-4 md:gap-4 xl:grid-cols-4">
        <MiniStat label="Paid members" value={stats?.paidMembers} Icon={Crown1} />
        <MiniStat label="New this week" value={stats?.newThisWeek} Icon={ProfileAdd} />
        <MiniStat label="KYC updates" value={kycCount} Icon={DocumentText} />
        <MiniStat label="Blocked" value={stats?.blocked} Icon={Slash} />
      </div>

      {/* review tables */}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ReviewTable title="New profiles to review" hint="First submission, oldest first" items={fresh} tab="new" />
        <ReviewTable title="KYC update requests" hint="Members who fixed flagged fields and resubmitted" items={kyc} tab="updates" />
      </div>

      {/* recently registered */}
      <section className="mt-6 overflow-hidden rounded-xl border border-line bg-surface-card shadow-xs">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-h6 text-ink">Recently registered</h2>
            <p className="text-body-xs text-ink-tertiary">Newest sign-ups, any status</p>
          </div>
          <Link href="/admin/users" className="inline-flex items-center gap-1 text-label-md text-brand-text hover:underline">
            All members <ArrowRight2 size={14} color="currentColor" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm sm:min-w-[640px]">
            <thead className="bg-surface-subtle text-label-sm text-ink-tertiary">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Member</th>
                <th className="hidden px-3 py-2.5 font-semibold sm:table-cell">Mobile</th>
                <th className="hidden px-3 py-2.5 font-semibold md:table-cell">Plan</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-5 py-2.5 text-right font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recent === null &&
                Array.from({ length: 4 }, (_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-5 py-3">
                      <div className="h-5 animate-pulse rounded bg-surface-muted" />
                    </td>
                  </tr>
                ))}
              {recent?.map((m) => (
                <tr key={m.userId} className="hover:bg-surface-subtle">
                  <td className="px-5 py-3">
                    <MemberCell m={m} />
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-3 text-ink-secondary sm:table-cell">{m.phoneNumber}</td>
                  <td className="hidden px-3 py-3 md:table-cell">
                    <PlanChip plan={m.plan} />
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={STATUS_META[m.status].tone} icon={false}>
                      {STATUS_META[m.status].label}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right text-ink-tertiary">{ago(m.joinedAt)}</td>
                </tr>
              ))}
              {recent?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-ink-tertiary">
                    No members yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

const TONE: Record<string, string> = {
  brand: "bg-brand-subtle text-brand",
  success: "bg-success-bg text-success-fg",
  warning: "bg-warning-bg text-warning-fg",
  info: "bg-info-bg text-info-fg",
};

function Kpi({ label, value, Icon, tone, note, href, urgent }: Readonly<{ label: string; value?: number; Icon: typeof People; tone: keyof typeof TONE; note?: string; href?: string; urgent?: boolean }>) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-md", TONE[tone])}>
          <Icon size={20} color="currentColor" />
        </span>
        {urgent && (
          <span className="inline-flex items-center gap-1 rounded-full bg-warning-bg px-2 py-0.5 text-caption font-semibold text-warning-fg">
            <Warning2 size={12} color="currentColor" /> Needs action
          </span>
        )}
      </div>
      <p className="mt-3 text-label-md text-ink-secondary">{label}</p>
      <p className="text-h2 leading-tight text-ink">{value ?? <span className="inline-block h-8 w-14 animate-pulse rounded bg-surface-muted align-middle" />}</p>
      {note && <p className="mt-1 text-body-xs text-ink-tertiary">{note}</p>}
    </>
  );
  const cls = "flex flex-col rounded-xl border border-line bg-surface-card p-4 shadow-xs md:p-5";
  return href ? (
    <Link href={href} className={cn(cls, "transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function MiniStat({ label, value, Icon }: Readonly<{ label: string; value?: number; Icon: typeof People }>) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-card px-4 py-3">
      <Icon size={18} color="currentColor" className="shrink-0 text-icon-brand" />
      <span className="flex-1 text-body-sm text-ink-secondary">{label}</span>
      <span className="text-label-lg text-ink">{value ?? "–"}</span>
    </div>
  );
}

function ReviewTable({ title, hint, items, tab }: Readonly<{ title: string; hint: string; items: QueueItem[] | null; tab: "new" | "updates" }>) {
  const rows = items?.slice(0, 5);
  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface-card shadow-xs">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="flex items-center gap-2 text-h6 text-ink">
            {title}
            {!!items?.length && <span className="rounded-full bg-brand px-2 text-label-sm text-ink-on-brand">{items.length}</span>}
          </h2>
          <p className="text-body-xs text-ink-tertiary">{hint}</p>
        </div>
        <Link href={`/admin/reviews?tab=${tab}`} className="inline-flex shrink-0 items-center gap-1 text-label-md text-brand-text hover:underline">
          View all <ArrowRight2 size={14} color="currentColor" />
        </Link>
      </div>
      {items === null && (
        <div className="flex flex-col gap-2 p-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-surface-muted" />
          ))}
        </div>
      )}
      {items !== null && !rows?.length && (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 px-5 py-10 text-center">
          <ProfileTick size={28} color="currentColor" className="text-success-fg" />
          <p className="text-label-md text-ink">All caught up</p>
          <p className="text-body-xs text-ink-tertiary">Nothing waiting here.</p>
        </div>
      )}
      {!!rows?.length && (
        <ul className="divide-y divide-line">
          {rows.map((p) => (
            <li key={p.profileId} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-subtle">
              <Thumb src={p.mainPhotoRef} className="h-10 w-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-label-md text-ink">{p.fullName}</p>
                <p className="text-body-xs text-ink-tertiary">
                  {p.code} · {p.gender === "female" ? "Bride" : "Groom"} · {p.age} · {ago(p.submittedAt)}
                  {photoNote(p.pendingPhotos)}
                </p>
              </div>
              <Link href={`/admin/reviews?open=${encodeURIComponent(p.profileId)}`} className="shrink-0 rounded-full bg-brand-subtle px-3 py-1.5 text-label-sm text-brand-text hover:bg-brand hover:text-ink-on-brand">
                Review
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function photoNote(n?: number) {
  if (!n) return "";
  return ` · ${n} new photo${n > 1 ? "s" : ""}`;
}

export function MemberCell({ m }: Readonly<{ m: AdminMember }>) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-label-md", m.gender === "Female" ? "bg-brand-subtle text-brand" : "bg-info-bg text-info-fg")}>
        {m.fullName.trim()[0]?.toUpperCase()}
      </span>
      <div className="min-w-0">
        <p className="truncate text-label-md text-ink">{m.fullName}</p>
        <p className="text-caption text-ink-tertiary">{m.code ?? "No profile yet"}</p>
      </div>
    </div>
  );
}

export function PlanChip({ plan }: Readonly<{ plan: AdminMember["plan"] }>) {
  return (
    <span className={cn("inline-flex h-6 items-center gap-1 rounded-full px-2 text-label-sm", plan === "Free" ? "bg-surface-subtle text-ink-secondary" : "bg-premium-bg text-premium-fg")}>
      {plan !== "Free" && <Crown1 size={12} color="currentColor" />}
      {plan}
    </span>
  );
}
