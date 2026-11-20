"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ShieldTick } from "iconsax-react";
import { Badge, Button, Card, Textarea, useToast } from "@/components/ui";
import { getReports, resolveReport, type ReportItem } from "@/lib/staff";
import { resolvePhoto } from "@/content/avatars";
import { when, statusTone } from "./staffHelpers";
import { Thumb } from "./ReviewQueue";

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
export function ReportsQueue({ onOpenProfile, onCount }: { onOpenProfile: (profileId: string) => void; onCount: (n: number) => void }) {
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
