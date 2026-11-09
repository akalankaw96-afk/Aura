"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Gallery, MessageText1 } from "iconsax-react";
import { Card, Stepper, useToast } from "@/components/ui";
import { flashToast } from "@/components/ui/Toast";
import { containsContactDetails, loadDraft, saveDraft, type RegistrationDraft } from "@/lib/demo";
import { readKyc, setKyc } from "@/lib/verification";
import { AuthShell } from "./AuthShell";
import { PhotosStep, ProfileStep } from "./RegisterFlow";

/**
 * Fix rejected fields (/register/status?fix=details | photo)
 *  details → Figma 06d · Edit profile — the full profile form, flagged fields highlighted
 *  photo   → Figma 06e · Edit photos — main photo marked "Rejected"
 * Reached from the Dashboard's "changes needed" panel. Every other review state
 * lives on the Dashboard, so any other status redirects there.
 * When every flagged field is fixed → status "resubmitted" → back to the Dashboard.
 */
export const FLAGGED = [
  { key: "photo", label: "Main photo", reason: "Face not clearly visible — upload a clear photo", Icon: Gallery, fix: "photo" },
  { key: "about", label: "About you", reason: "Contains a phone number — please remove it", Icon: MessageText1, fix: "details" },
  { key: "dob", label: "Date of birth", reason: "Doesn’t match your ID — check and update", Icon: Calendar, fix: "details" },
] as const;

const ORIGINAL_KEY = "vk-fix-original";
interface Original {
  dob: string;
  about: string;
  photo: string | null;
}

const reason = (k: (typeof FLAGGED)[number]["key"]) => FLAGGED.find((f) => f.key === k)!.reason;

export function ReviewStatus() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const [draft, setDraft] = useState<RegistrationDraft | null>(null);
  const [original, setOriginal] = useState<Original | null>(null);
  const view = params.get("fix") === "photo" ? "photo" : "details";
  const reviewedOn = useMemo(() => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }), []);

  useEffect(() => {
    if (readKyc() !== "changes") {
      router.replace("/dashboard");
      return;
    }
    // the values our safety team rejected — kept so we know when a field was actually changed
    let o: Original | null = null;
    try {
      o = JSON.parse(sessionStorage.getItem(ORIGINAL_KEY) || "null");
    } catch {}
    let d = loadDraft();
    if (!o) {
      // demo: make sure the rejected values look like the review reasons
      d = saveDraft({
        dob: d.dob || "1994-05-12",
        about: containsContactDetails(d.about) ? d.about : `${d.about || "I’m a doctor working in Kandy, close to my family."} Call me on 077 123 4567.`,
      });
      o = { dob: d.dob, about: d.about, photo: d.photo };
      try {
        sessionStorage.setItem(ORIGINAL_KEY, JSON.stringify(o));
      } catch {}
    }
    setOriginal(o);
    setDraft(d);
  }, [router]);

  if (!draft || !original) return null;

  const update = (p: Partial<RegistrationDraft>) => setDraft(saveDraft(p));
  const detailsFixed = draft.dob !== original.dob && draft.about !== original.about && !containsContactDetails(draft.about);
  const photoFixed = !!draft.photo && draft.photo !== original.photo;

  const resubmit = () => {
    try {
      sessionStorage.removeItem(ORIGINAL_KEY);
    } catch {}
    setKyc("resubmitted");
    flashToast("success", "Changes submitted", "We’ll review them and SMS you once you’re approved.");
    router.push("/dashboard");
  };

  const next = (from: "details" | "photo") => {
    if (from === "details" && !photoFixed) {
      toast.info("One more thing", "Your details are fixed — now replace your main photo.");
      router.push("/register/status?fix=photo");
      return;
    }
    if (from === "photo" && !detailsFixed) {
      toast.info("One more thing", "Your photo is updated — now fix the highlighted details.");
      router.push("/register/status?fix=details");
      return;
    }
    resubmit();
  };

  return (
    <AuthShell action="avatar">
      <Stepper step={5} className="max-w-[680px]" />
      <Card key={view} className="w-full max-w-[680px] animate-fade-up p-5 sm:p-8">
        {view === "photo" ? (
          <PhotosStep
            draft={draft}
            update={update}
            onBack={() => router.push("/dashboard")}
            onFinish={() => next("photo")}
            review={{ reason: reason("photo"), original: original.photo, reviewedOn }}
          />
        ) : (
          <ProfileStep
            draft={draft}
            update={update}
            onBack={() => router.push("/dashboard")}
            onNext={() => next("details")}
            review={{ reasons: { dob: reason("dob"), about: reason("about") }, original: { dob: original.dob, about: original.about }, reviewedOn }}
          />
        )}
      </Card>
    </AuthShell>
  );
}
