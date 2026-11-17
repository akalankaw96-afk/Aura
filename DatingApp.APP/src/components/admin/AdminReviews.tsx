"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Refresh2 } from "iconsax-react";
import { Alert, Button, SegmentedTabs } from "@/components/ui";
import { getQueue, type QueueItem } from "@/lib/staff";
import { PendingPhotos, QueueList, ReviewScreen } from "@/components/sections/admin/StaffConsole";
import { AdminPageHeader, useAdmin } from "./AdminShell";

/**
 * /admin/reviews — the moderation queue (real API) split into New profiles and KYC updates
 * (resubmitted after "changes needed"). ?open=<profileId> opens the review screen directly.
 */
type Tab = "all" | "new" | "updates";

export function AdminReviews() {
  const params = useSearchParams();
  const router = useRouter();
  const { refreshCounts } = useAdmin();
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [error, setError] = useState<string>();
  const tab = (params.get("tab") as Tab) || "all";
  const openId = params.get("open");

  const load = useCallback(async () => {
    try {
      setQueue(await getQueue());
      setError(undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn’t load the queue.");
      setQueue([]);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const go = (next: { tab?: Tab; open?: string | null }) => {
    const p = new URLSearchParams(params.toString());
    if (next.tab) p.set("tab", next.tab);
    if (next.open === null) p.delete("open");
    else if (next.open) p.set("open", next.open);
    router.push(`/admin/reviews?${p}`);
  };

  if (openId) {
    return (
      <ReviewScreen
        profileId={openId}
        onClose={(changed) => {
          go({ open: null });
          if (changed) {
            void load();
            refreshCounts();
          }
        }}
      />
    );
  }

  const fresh = queue?.filter((q) => q.status === "Submitted") ?? null;
  const updates = queue?.filter((q) => q.status === "Resubmitted") ?? null;
  const byTab = { new: fresh, updates, all: queue };
  const shown = byTab[tab];

  return (
    <>
      <AdminPageHeader
        title="Profile reviews"
        subtitle="Check details, photos and ID documents, then approve or ask for changes."
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()} leftIcon={<Refresh2 size={16} color="currentColor" />}>
            Refresh
          </Button>
        }
      />
      <div className="mb-5">
        <SegmentedTabs
          label="Review queue"
          value={tab}
          onChange={(t) => go({ tab: t })}
          tabs={[
            { id: "all" as Tab, label: "All", count: queue?.length },
            { id: "new" as Tab, label: "New profiles", count: fresh?.length },
            { id: "updates" as Tab, label: "KYC updates", count: updates?.length },
          ]}
        />
      </div>
      {error && (
        <Alert type="error" title="Something went wrong" className="mb-4">
          {error}
        </Alert>
      )}
      <QueueList items={shown} onOpen={(id) => go({ open: id })} onRefresh={() => void load()} />
    </>
  );
}

export function AdminPhotos() {
  return (
    <>
      <AdminPageHeader title="New photos" subtitle="Photos added after a profile was approved. Approve them or reject with a reason." />
      <PendingPhotos />
    </>
  );
}
