"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Call, DocumentText, Gallery, Profile2User, ShieldTick, Sms, TickCircle, Trash, UserTick } from "iconsax-react";
import { cn } from "@/lib/cn";
import { Alert, Badge, Button, Card, Checkbox, Input, SegmentedTabs, Textarea, useToast } from "@/components/ui";
import type { BadgeTone } from "@/components/ui/Badge";
import { useApiImage, type PhotoDto, type KycDocumentDto } from "@/lib/media";
import {
  FLAGGABLE_FIELDS,
  approvePhoto,
  approveProfile,
  changeRole,
  documentUrl,
  findUserByPhone,
  getPendingPhotos,
  getProfileReview,
  getQueue,
  getStaff,
  openDocument,
  reinstateProfile,
  rejectPhoto,
  requestChanges,
  suspendProfile,
  type PendingPhoto,
  type ProfileReview,
  type QueueItem,
  type StaffUser,
  getReports,
  resolveReport,
  type ReportItem,
} from "@/lib/staff";
import { resolvePhoto } from "@/content/avatars";
import { getPlanLimits, updatePlanLimits, type PlanLimit } from "@/lib/matching";

type Tab = "queue" | "photos" | "reports" | "staff" | "limits";

const when = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

const statusTone = (s: string): BadgeTone =>
  s === "Approved" ? "success" : s === "ChangesRequested" || s === "Rejected" || s === "Suspended" ? "error" : s === "Resubmitted" ? "info" : "warning";

const DOC_LABEL: Record<string, string> = { NicFront: "NIC — front", NicBack: "NIC — back", Passport: "Passport", Selfie: "Selfie" };

/**
 * Staff back office (S02-T11) at /admin — Admin and Moderator.
 *  Review queue → open a profile → photos, ID documents, details → Approve · Request changes · Suspend
 *  New photos   → photos added by approved members
 *  Staff        → Admin only: make a member a Moderator (or back)
 */
export function StaffConsole({ isAdmin }: { isAdmin: boolean }) {
  const [tab, setTab] = useState<Tab>("queue");
  const [openId, setOpenId] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [error, setError] = useState<string>();
  const [openReports, setOpenReports] = useState<number | undefined>();
  useEffect(() => {
    getReports("open").then((r) => setOpenReports(r.length)).catch(() => undefined);
  }, []);

  const loadQueue = useCallback(async () => {
    try {
      setQueue(await getQueue());
      setError(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn’t load the queue.");
    }
  }, []);
  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const tabs = useMemo(
    () => [
      { id: "queue" as Tab, label: "Review queue", count: queue?.length },
      { id: "photos" as Tab, label: "New photos" },
      { id: "reports" as Tab, label: "Reports", count: openReports },
      ...(isAdmin ? [{ id: "staff" as Tab, label: "Staff" }, { id: "limits" as Tab, label: "Plan limits" }] : []),
    ],
    [queue, isAdmin, openReports]
  );

  if (openId) {
    return (
      <ReviewScreen
        profileId={openId}
        onClose={(changed) => {
          setOpenId(null);
          if (changed) void loadQueue();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h3 text-ink">Staff area</h1>
          <p className="text-body-md text-ink-secondary">Review new members, their photos and ID documents.</p>
        </div>
        <SegmentedTabs label="Staff sections" tabs={tabs} value={tab} onChange={setTab} />
      </div>

      {error && <Alert type="error" title="Something went wrong">{error}</Alert>}

      {tab === "queue" && <QueueList items={queue} onOpen={setOpenId} onRefresh={loadQueue} />}
      {tab === "photos" && <PendingPhotos />}
      {tab === "reports" && <ReportsQueue onOpenProfile={setOpenId} onCount={setOpenReports} />}
      {tab === "staff" && isAdmin && <StaffManager />}
      {tab === "limits" && isAdmin && <PlanLimitsEditor />}
    </div>
  );
}

/* ───────────── Queue ───────────── */

export function QueueList({ items, onOpen, onRefresh }: { items: QueueItem[] | null; onOpen: (id: string) => void; onRefresh: () => void }) {
  if (!items) return <p className="text-body-md text-ink-secondary">Loading…</p>;
  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 p-10 text-center">
        <TickCircle size={40} color="currentColor" className="text-success-fg" />
        <h2 className="text-h5 text-ink">All caught up</h2>
        <p className="text-body-sm text-ink-secondary">No profiles are waiting for review.</p>
        <Button variant="outline" size="sm" onClick={onRefresh}>Refresh</Button>
      </Card>
    );
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <li key={p.profileId}>
          <button
            type="button"
            onClick={() => onOpen(p.profileId)}
            className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface-card p-3 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:shadow-ring-brand"
          >
            <Thumb src={p.mainPhotoRef} className="h-16 w-16 rounded-lg" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-label-lg text-ink">{p.fullName}</span>
              <span className="block text-body-sm text-ink-secondary">
                {p.code} · {p.gender === "female" ? "Bride" : "Groom"} · {p.age}
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge tone={statusTone(p.status)}>{p.status === "Resubmitted" ? "Resubmitted" : "New"}</Badge>
                <span className="text-caption text-ink-tertiary">{when(p.submittedAt)}</span>
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ───────────── One profile ───────────── */

export function ReviewScreen({ profileId, onClose }: { profileId: string; onClose: (changed: boolean) => void }) {
  const toast = useToast();
  const [data, setData] = useState<ProfileReview | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"none" | "changes" | "suspend">("none");
  const [note, setNote] = useState("");
  const [flags, setFlags] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      setData(await getProfileReview(profileId));
    } catch (err) {
      toast.error("Couldn’t open the profile", err instanceof Error ? err.message : "Please try again.");
      onClose(false);
    }
    // toast / onClose change identity on every render — load only when the profile changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);
  useEffect(() => {
    void load();
  }, [load]);

  const act = async (fn: () => Promise<void>, done: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(done);
      onClose(true);
    } catch (err) {
      toast.error("That didn’t work", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <p className="text-body-md text-ink-secondary">Loading…</p>;
  const p = data.profile;
  const waiting = data.status === "Submitted" || data.status === "Resubmitted";
  const chosen = Object.entries(flags).filter(([, reason]) => reason !== undefined);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={16} color="currentColor" />} onClick={() => onClose(false)}>
          Back to queue
        </Button>
        <h1 className="text-h4 text-ink">{p.name}</h1>
        <Badge tone={statusTone(data.status)}>{data.status}</Badge>
        <span className="text-body-sm text-ink-tertiary">{p.code} · submitted {when(data.submittedAt)}</span>
      </div>

      {data.openFlags.length > 0 && (
        <Alert type="warning" title="Changes asked for earlier">
          {data.openFlags.map((f) => `${f.field}: ${f.reason}`).join(" · ")}
        </Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-5">
          {/* Photos */}
          <Card className="p-5">
            <h2 className="mb-3 flex items-center gap-2 text-h6 text-ink"><Gallery size={20} color="currentColor" /> Photos</h2>
            {data.photos.length === 0 ? (
              <p className="text-body-sm text-ink-secondary">{p.photoUrl?.startsWith("avatar:") || p.photoUrl?.startsWith("data:") ? "Uses an illustrated avatar." : "No photos."}</p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {data.photos.map((ph) => (
                  <PhotoTile key={ph.id} photo={ph} onChanged={load} />
                ))}
              </ul>
            )}
          </Card>

          {/* Documents */}
          <Card className="p-5">
            <h2 className="mb-1 flex items-center gap-2 text-h6 text-ink"><ShieldTick size={20} color="currentColor" /> Identity documents</h2>
            <p className="mb-3 text-caption text-ink-tertiary">Private. Every time you open a document it is recorded.</p>
            {data.documents.length === 0 ? (
              <p className="text-body-sm text-ink-secondary">No documents uploaded.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {data.documents.map((d) => (
                  <DocumentTile key={d.id} doc={d} />
                ))}
              </ul>
            )}
          </Card>

          {/* Details */}
          <Card className="p-5">
            <h2 className="mb-3 flex items-center gap-2 text-h6 text-ink"><Profile2User size={20} color="currentColor" /> Details</h2>
            <dl className="grid gap-x-6 gap-y-2 text-body-sm sm:grid-cols-2">
              {[
                ["Gender", p.gender === "female" ? "Female" : "Male"],
                ["Date of birth", data.dateOfBirth ? `${data.dateOfBirth} (${p.age})` : `Not given (age ${p.age})`],
                ["Height", p.height],
                ["Religion", p.religion],
                ["Ethnicity", p.community],
                ["Caste", p.details?.caste],
                ["Civil status", p.details?.civilStatus],
                ["Profession", [p.profession, p.professionCategory].filter(Boolean).join(" · ")],
                ["Education", p.education],
                ["Lives in", [p.location, p.country].filter(Boolean).join(", ")],
                ["Profile created by", p.details?.createdBy],
                ["Shown as", p.details?.displayName],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-line py-1.5">
                  <dt className="text-ink-tertiary">{k}</dt>
                  <dd className="text-right font-semibold text-ink">{v || "—"}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4">
              <p className="text-label-md text-ink">About</p>
              <p className="whitespace-pre-wrap text-body-sm text-ink-secondary">{p.bio || "—"}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-body-sm text-ink-secondary">
              <span className="flex items-center gap-1.5"><Call size={16} color="currentColor" /> {data.phoneNumber || "—"}</span>
              <span className="flex items-center gap-1.5"><Sms size={16} color="currentColor" /> {data.email || "No email"}</span>
            </div>
          </Card>
        </div>

        {/* Decision */}
        <div className="flex flex-col gap-5">
          <Card className="flex flex-col gap-3 p-5 lg:sticky lg:top-24">
            <h2 className="text-h6 text-ink">Decision</h2>
            {data.status === "Suspended" ? (
              <>
                <Textarea label="Note" hint="Optional" value={note} onChange={setNote} rows={2} maxLength={500} />
                <Button disabled={busy} loading={busy} onClick={() => act(() => reinstateProfile(profileId, note), "Profile reinstated")}>Reinstate</Button>
              </>
            ) : !waiting ? (
              <p className="text-body-sm text-ink-secondary">This profile isn’t waiting for review ({data.status}).</p>
            ) : mode === "none" ? (
              <>
                <Textarea label="Note for the record" hint="Optional" value={note} onChange={setNote} rows={2} maxLength={500} />
                <Button leftIcon={<UserTick size={18} color="currentColor" />} disabled={busy} loading={busy} onClick={() => act(() => approveProfile(profileId, note), "Profile approved — the member gets an SMS")}>
                  Approve profile
                </Button>
                <Button variant="outline" disabled={busy} onClick={() => setMode("changes")}>Request changes</Button>
                <button type="button" className="text-left text-body-sm font-semibold text-error-fg hover:underline" onClick={() => setMode("suspend")}>
                  Suspend this profile
                </button>
              </>
            ) : mode === "changes" ? (
              <>
                <p className="text-body-sm text-ink-secondary">Tick what needs changing and say why. The member sees each reason.</p>
                <ul className="flex flex-col gap-2">
                  {FLAGGABLE_FIELDS.map(({ field, label }) => {
                    const on = field in flags;
                    return (
                      <li key={field} className="flex flex-col gap-1.5">
                        <Checkbox
                          checked={on}
                          onChange={(v) =>
                            setFlags((f) => {
                              const next = { ...f };
                              if (v) next[field] = "";
                              else delete next[field];
                              return next;
                            })
                          }
                        >
                          <span className="font-semibold text-ink">{label}</span>
                        </Checkbox>
                        {on && (
                          <Input
                            aria-label={`Reason for ${label}`}
                            placeholder="Reason, e.g. face not clearly visible"
                            value={flags[field]}
                            maxLength={300}
                            onChange={(e) => setFlags((f) => ({ ...f, [field]: e.target.value }))}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
                <Button
                  disabled={busy || chosen.length === 0 || chosen.some(([, r]) => !r.trim())}
                  loading={busy}
                  onClick={() => act(() => requestChanges(profileId, chosen.map(([field, reason]) => ({ field, reason: reason.trim() })), note), "Sent back to the member")}
                >
                  Send {chosen.length || ""} change{chosen.length === 1 ? "" : "s"}
                </Button>
                <Button variant="outline" onClick={() => setMode("none")}>Cancel</Button>
              </>
            ) : (
              <>
                <Alert type="error" title="Suspend this profile?">The member can’t use Vikasitha until a staff member reinstates them.</Alert>
                <Textarea label="Reason" value={note} onChange={setNote} rows={3} maxLength={500} />
                <Button disabled={busy || !note.trim()} loading={busy} onClick={() => act(() => suspendProfile(profileId, note.trim()), "Profile suspended")}>
                  Suspend
                </Button>
                <Button variant="outline" onClick={() => setMode("none")}>Cancel</Button>
              </>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-h6 text-ink">History</h2>
            {data.history.length === 0 ? (
              <p className="text-body-sm text-ink-secondary">No staff actions yet.</p>
            ) : (
              <ol className="flex flex-col gap-2 text-body-sm">
                {data.history.map((h, i) => (
                  <li key={i} className="border-b border-line pb-2">
                    <span className="font-semibold text-ink">{h.action}</span> · {h.moderatorName} · <span className="text-ink-tertiary">{when(h.createdAt)}</span>
                    {h.note && <p className="text-ink-secondary">{h.note}</p>}
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export function Thumb({ src, className }: { src?: string | null; className?: string }) {
  const shown = useApiImage(src ?? null);
  return (
    <span className={cn("block shrink-0 overflow-hidden bg-surface-muted", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {shown && <img src={shown} alt="" className="h-full w-full object-cover" />}
    </span>
  );
}

function PhotoTile({ photo, onChanged }: { photo: PhotoDto; onChanged: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>, msg: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      onChanged();
    } catch (err) {
      toast.error("That didn’t work", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const reject = () => {
    const reason = window.prompt("Why isn’t this photo approved? (the member sees this)", "Face not clearly visible");
    if (reason?.trim()) void run(() => rejectPhoto(photo.id, reason.trim()), "Photo rejected");
  };
  return (
    <li className="flex flex-col gap-2">
      <div className="relative">
        <Thumb src={photo.ref} className="aspect-[4/5] w-full rounded-lg" />
        <span className="absolute left-2 top-2 flex flex-col gap-1">
          {photo.isMain && <Badge tone="brand">Main</Badge>}
          <Badge tone={statusTone(photo.status)}>{photo.status}</Badge>
        </span>
      </div>
      {photo.rejectReason && <p className="text-caption text-error-fg">{photo.rejectReason}</p>}
      <div className="flex gap-2">
        {photo.status !== "Approved" && (
          <Button size="sm" variant="outline" className="flex-1" disabled={busy} onClick={() => run(() => approvePhoto(photo.id), "Photo approved")}>
            Approve
          </Button>
        )}
        {photo.status !== "Rejected" && (
          <Button size="sm" variant="outline" className="flex-1" disabled={busy} onClick={reject} leftIcon={<Trash size={14} color="currentColor" />}>
            Reject
          </Button>
        )}
      </div>
    </li>
  );
}

function DocumentTile({ doc }: { doc: KycDocumentDto }) {
  const toast = useToast();
  const [show, setShow] = useState(false);
  const isImage = doc.contentType.startsWith("image/");
  const preview = useApiImage(show && isImage ? documentUrl(doc.id) : null);
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-line p-3">
      <div className="flex items-center gap-2">
        <DocumentText size={20} color="currentColor" className="text-icon-brand" />
        <span className="flex-1 text-label-md text-ink">{DOC_LABEL[doc.type] ?? doc.type}</span>
        <span className="text-caption text-ink-tertiary">{(doc.sizeBytes / 1024).toFixed(0)} KB</span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {preview && <img src={preview} alt={DOC_LABEL[doc.type] ?? doc.type} className="max-h-64 w-full rounded-md object-contain bg-surface-muted" />}
      <div className="flex gap-2">
        {isImage && !show && (
          <Button size="sm" variant="outline" onClick={() => setShow(true)}>Show here</Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => openDocument(doc.id).catch((err) => toast.error("Couldn’t open", err instanceof Error ? err.message : "Please try again."))}
        >
          Open in new tab
        </Button>
      </div>
    </li>
  );
}

/* ───────────── New photos from approved members ───────────── */

export function PendingPhotos() {
  const toast = useToast();
  const [items, setItems] = useState<PendingPhoto[] | null>(null);
  const load = useCallback(() => {
    getPendingPhotos().then(setItems).catch((err) => toast.error("Couldn’t load photos", err instanceof Error ? err.message : ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(load, [load]);

  if (!items) return <p className="text-body-md text-ink-secondary">Loading…</p>;
  if (items.length === 0) return <Card className="p-8 text-center text-body-md text-ink-secondary">No new photos to review.</Card>;
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((p) => (
        <li key={p.photoId} className="flex flex-col gap-1">
          <PhotoTile
            photo={{ id: p.photoId, ref: p.ref, sortOrder: 0, isMain: false, status: "Pending", createdAt: p.createdAt }}
            onChanged={load}
          />
          <span className="text-caption text-ink-tertiary">{p.fullName} · {p.profileCode}</span>
        </li>
      ))}
    </ul>
  );
}

/* ───────────── Staff (Admin only) ───────────── */

export function StaffManager() {
  const toast = useToast();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [phone, setPhone] = useState("");
  const [found, setFound] = useState<StaffUser | null>(null);
  const load = useCallback(() => {
    getStaff().then(setStaff).catch(() => undefined);
  }, []);
  useEffect(load, [load]);

  const find = async () => {
    try {
      setFound(await findUserByPhone(phone.trim()));
    } catch (err) {
      setFound(null);
      toast.error("Not found", err instanceof Error ? err.message : "");
    }
  };
  const setRole = async (u: StaffUser, role: "Member" | "Moderator") => {
    try {
      await changeRole(u.userId, role);
      toast.success(role === "Moderator" ? `${u.fullName} is now a moderator` : `${u.fullName} is a member again`, "Their sessions were ended so the change applies now.");
      setFound(null);
      setPhone("");
      load();
    } catch (err) {
      toast.error("That didn’t work", err instanceof Error ? err.message : "");
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="p-5">
        <h2 className="mb-3 text-h6 text-ink">Staff</h2>
        <ul className="flex flex-col gap-2">
          {staff.map((u) => (
            <li key={u.userId} className="flex items-center gap-3 border-b border-line pb-2">
              <span className="min-w-0 flex-1">
                <span className="block text-label-md text-ink">{u.fullName}</span>
                <span className="block text-caption text-ink-tertiary">{u.phoneNumber}</span>
              </span>
              <Badge tone={u.role === "Admin" ? "premium" : "info"}>{u.role}</Badge>
              {u.role === "Moderator" && (
                <Button size="sm" variant="outline" onClick={() => setRole(u, "Member")}>Remove</Button>
              )}
            </li>
          ))}
        </ul>
      </Card>
      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-h6 text-ink">Add a moderator</h2>
        <p className="text-body-sm text-ink-secondary">The person must already have a Vikasitha account.</p>
        <div className="flex gap-2">
          <Input aria-label="Mobile number" placeholder="+94 77 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} containerClassName="flex-1" />
          <Button onClick={find} disabled={!phone.trim()}>Find</Button>
        </div>
        {found && (
          <div className="flex items-center gap-3 rounded-lg bg-surface-subtle p-3">
            <span className="min-w-0 flex-1">
              <span className="block text-label-md text-ink">{found.fullName}</span>
              <span className="block text-caption text-ink-tertiary">{found.phoneNumber} · {found.role}</span>
            </span>
            {found.role === "Member" && <Button size="sm" onClick={() => setRole(found, "Moderator")}>Make moderator</Button>}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Plan limits (Admin) — S03-T02: monthly allowances per plan           */
/* ------------------------------------------------------------------ */

const LIMIT_PLANS: PlanLimit["planId"][] = ["free", "gold", "platinum"];
const LIMIT_FEATURES: { id: PlanLimit["feature"]; label: string; hint: string }[] = [
  { id: "Search", label: "Searches", hint: "Filtered searches (plain browsing is free)" },
  { id: "ProfileView", label: "Profile views", hint: "Different profiles opened in full" },
  { id: "Interest", label: "Interests", hint: "Interests sent" },
  { id: "NewChat", label: "New chats", hint: "Conversations started (replies are free)" },
];
const limitKey = (plan: string, feature: string) => `${plan}:${feature}`;

/** Edit the monthly limits. Empty = unlimited. Changes apply to every member straight away. */
function PlanLimitsEditor() {
  const toast = useToast();
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const load = useCallback(() => {
    getPlanLimits()
      .then((rows) => {
        const v = Object.fromEntries(rows.map((r) => [limitKey(r.planId, r.feature), r.monthlyLimit === null ? "" : String(r.monthlyLimit)]));
        setValues(v);
        setSaved(v);
      })
      .catch((err) => toast.error("Couldn’t load the limits", err instanceof Error ? err.message : ""));
    // toast isn't a stable reference — load once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(load, [load]);

  if (!values) return <p className="py-8 text-center text-body-sm text-ink-tertiary">Loading limits…</p>;

  const invalid = Object.values(values).some((v) => v.trim() !== "" && !/^\d{1,6}$/.test(v.trim()));
  const changed = Object.keys(values).filter((k) => values[k].trim() !== (saved[k] ?? "").trim());

  const save = async () => {
    if (invalid || changed.length === 0) return;
    setSaving(true);
    try {
      const rows = await updatePlanLimits(
        changed.map((k) => {
          const [planId, feature] = k.split(":") as [PlanLimit["planId"], PlanLimit["feature"]];
          const raw = values[k].trim();
          return { planId, feature, monthlyLimit: raw === "" ? null : Number(raw) };
        }),
      );
      const v = Object.fromEntries(rows.map((r) => [limitKey(r.planId, r.feature), r.monthlyLimit === null ? "" : String(r.monthlyLimit)]));
      setValues(v);
      setSaved(v);
      toast.success("Limits saved", "Members see the new numbers straight away.");
    } catch (err) {
      toast.error("Limits not saved", err instanceof Error ? err.message : "");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div>
        <h2 className="text-h6 text-ink">Monthly plan limits</h2>
        <p className="text-body-sm text-ink-secondary">How many of each a member can use per calendar month. Leave a box empty for unlimited. Counts reset on the 1st.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-separate border-spacing-y-2 text-left">
          <thead>
            <tr className="text-label-sm text-ink-tertiary">
              <th className="font-semibold">Feature</th>
              {LIMIT_PLANS.map((p) => (
                <th key={p} className="font-semibold capitalize">{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LIMIT_FEATURES.map((f) => (
              <tr key={f.id}>
                <td className="pr-3 align-top">
                  <span className="block text-label-md text-ink">{f.label}</span>
                  <span className="block text-caption text-ink-tertiary">{f.hint}</span>
                </td>
                {LIMIT_PLANS.map((p) => {
                  const k = limitKey(p, f.id);
                  const v = values[k] ?? "";
                  const bad = v.trim() !== "" && !/^\d{1,6}$/.test(v.trim());
                  return (
                    <td key={p} className="pr-3 align-top">
                      <Input
                        aria-label={`${f.label} per month on ${p}`}
                        inputMode="numeric"
                        placeholder="Unlimited"
                        value={v}
                        onChange={(e) => setValues((all) => ({ ...(all ?? {}), [k]: e.target.value }))}
                        error={bad ? "0–100000, or empty" : undefined}
                        containerClassName="w-[130px]"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {changed.length > 0 && <span className="text-body-sm text-ink-tertiary">{changed.length} change{changed.length === 1 ? "" : "s"} not saved</span>}
        <Button variant="outline" disabled={changed.length === 0 || saving} onClick={() => setValues(saved)}>Undo</Button>
        <Button disabled={invalid || changed.length === 0 || saving} onClick={save}>{saving ? "Saving…" : "Save limits"}</Button>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Reports (S03-T08) — members reporting members                        */
/* ------------------------------------------------------------------ */

const REASON_LABEL: Record<ReportItem["reason"], string> = {
  Scam: "Asked for money / scam",
  Inappropriate: "Rude or inappropriate",
  FakeProfile: "Fake or misleading profile",
  Other: "Other",
};

/** Open reports (oldest first) with Dismiss · Handled · Suspend member; Closed shows past decisions. */
function ReportsQueue({ onOpenProfile, onCount }: { onOpenProfile: (profileId: string) => void; onCount: (n: number) => void }) {
  const toast = useToast();
  const [box, setBox] = useState<"open" | "closed">("open");
  const [items, setItems] = useState<ReportItem[] | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (which: "open" | "closed") => {
    setItems(null);
    try {
      const list = await getReports(which);
      setItems(list);
      if (which === "open") onCount(list.length);
    } catch (err) {
      setItems([]);
      toast.error("Couldn’t load reports", err instanceof Error ? err.message : "");
    }
    // toast / onCount aren't stable references
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    void load(box);
  }, [box, load]);

  const decide = async (r: ReportItem, action: "dismiss" | "action" | "suspend") => {
    const note = (notes[r.id] ?? "").trim();
    if (action === "suspend" && !note) {
      toast.error("Add a reason", "Write why the member is suspended. It is kept in their history.");
      return;
    }
    setBusyId(r.id);
    try {
      await resolveReport(r.id, action, note);
      toast.success(
        action === "dismiss" ? "Report dismissed" : action === "action" ? "Report marked as handled" : `${r.reportedName} is suspended`,
        action === "suspend" && r.openReportsOnProfile > 1 ? `All ${r.openReportsOnProfile} open reports about them are closed.` : "The reporter was told it was reviewed.",
      );
      await load("open");
    } catch (err) {
      toast.error("That didn’t work", err instanceof Error ? err.message : "");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {(["open", "closed"] as const).map((b) => (
          <Button key={b} size="sm" variant={box === b ? "primary" : "outline"} onClick={() => setBox(b)}>
            {b === "open" ? "Open" : "Closed"}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => void load(box)}>Refresh</Button>
      </div>

      {!items && <p className="text-body-md text-ink-secondary">Loading…</p>}
      {items && items.length === 0 && (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <ShieldTick size={40} color="currentColor" className="text-success-fg" />
          <h2 className="text-h5 text-ink">{box === "open" ? "No open reports" : "No closed reports yet"}</h2>
          <p className="text-body-sm text-ink-secondary">{box === "open" ? "Members’ reports appear here, oldest first." : "Decisions you make on reports are listed here."}</p>
        </Card>
      )}

      {items && items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {items.map((r) => (
            <li key={r.id}>
              <Card className="flex flex-col gap-4 p-4 sm:p-5">
                <div className="flex flex-wrap items-start gap-3">
                  <Thumb src={r.reportedPhotoUrl.startsWith("avatar:") ? resolvePhoto(r.reportedPhotoUrl) : r.reportedPhotoUrl} className="h-14 w-14 rounded-lg" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-label-lg text-ink">
                      {r.reportedName} <span className="text-body-sm text-ink-tertiary">· {r.reportedCode}</span>
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge tone="error">{REASON_LABEL[r.reason]}</Badge>
                      <Badge tone={statusTone(r.reportedStatus)}>{r.reportedStatus}</Badge>
                      {r.openReportsOnProfile > 1 && <Badge tone="warning">{r.openReportsOnProfile} open reports</Badge>}
                      {r.conversationId && <Badge tone="info">From a chat</Badge>}
                    </span>
                  </span>
                  <Button size="sm" variant="outline" onClick={() => onOpenProfile(r.reportedProfileId)}>Open profile</Button>
                </div>

                <div className="flex flex-col gap-1 rounded-lg bg-surface-subtle p-3">
                  <p className="text-caption text-ink-tertiary">Reported by {r.reporterName} · {when(r.createdAt)}</p>
                  <p className="text-body-sm text-ink">{r.details ? `“${r.details}”` : "No details given."}</p>
                </div>

                {r.status === "Open" ? (
                  <div className="flex flex-col gap-3">
                    <Textarea
                      label="Note"
                      hint="Required to suspend · kept with the report"
                      value={notes[r.id] ?? ""}
                      onChange={(v) => setNotes((n) => ({ ...n, [r.id]: v }))}
                      rows={2}
                      maxLength={1000}
                      placeholder="What you checked and decided"
                    />
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="outline" disabled={busyId === r.id} onClick={() => void decide(r, "dismiss")}>Dismiss</Button>
                      <Button size="sm" variant="outline" disabled={busyId === r.id} onClick={() => void decide(r, "action")}>Handled</Button>
                      <Button size="sm" variant="danger" disabled={busyId === r.id || r.reportedStatus === "Suspended"} onClick={() => void decide(r, "suspend")}>
                        Suspend member
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-body-sm text-ink-secondary">
                    <Badge tone={r.status === "Dismissed" ? "neutral" : "success"}>{r.status === "Dismissed" ? "Dismissed" : "Handled"}</Badge>{" "}
                    by {r.reviewedByName ?? "staff"} · {when(r.reviewedAt)}
                    {r.staffNote ? ` — ${r.staffNote}` : ""}
                  </p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
