"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, flashToast, useToast } from "@/components/ui";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/cn";
import { emptyDraft, loadDraft, saveDraft, type RegistrationDraft } from "@/lib/registrationDraft";
import { getReviewStatus, submitForReview, MISSING_LABELS, type ProfileStatusInfo } from "@/lib/media";
import { ApiError, apiService } from "@/services/api";
import { isIllustration } from "@/content/avatars";
import { AuthShell } from "./AuthShell";
import { IdentityStep, PhotosStep, ProfileStep, profileToDraft, saveProfileDraft } from "./RegisterFlow";

type Step = "details" | "photos" | "identity";
const STEPS: { id: Step; label: string }[] = [
  { id: "details", label: "Profile details" },
  { id: "photos", label: "Photos" },
  { id: "identity", label: "ID & selfie" },
];

/** Flagged field (from the moderator) → the step where the member can fix it. */
const FIELD_STEP: Record<string, Step> = { photo: "photos", documents: "identity", selfie: "identity" };
const FIELD_LABEL: Record<string, string> = {
  photo: "Main photo",
  name: "Name",
  dob: "Date of birth",
  gender: "Gender",
  about: "About you",
  profession: "Profession",
  education: "Education",
  religion: "Religion",
  location: "Location",
  documents: "ID document",
  selfie: "Selfie",
  other: "Other",
};

/**
 * /profile/complete — a signed-in member finishes a Draft profile, or fixes what our safety team flagged,
 * and submits it for review (S02-T10). Everything is read from and saved to the API.
 *   ?step=details | photos | identity   (default: the first step with something missing)
 */
export function CompleteProfileFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const [draft, setDraft] = useState<RegistrationDraft>(emptyDraft);
  const [status, setStatus] = useState<ProfileStatusInfo | null>(null);
  const [step, setStep] = useState<Step | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [info, profile] = await Promise.all([getReviewStatus().catch(() => null), apiService.getMyProfile()]);
      if (cancelled) return;
      if (info && ["Submitted", "Resubmitted", "Approved", "Suspended"].includes(info.status)) {
        flashToast("info", info.status === "Approved" ? "Your profile is live" : "Nothing to do right now",
          info.status === "Approved" ? "Edit your about text and photos from the dashboard." : "We’re reviewing your profile and will let you know by SMS.");
        router.replace("/dashboard");
        return;
      }
      // the server's copy wins — the browser draft may be from another device or missing
      let session: { phoneNumber?: string; email?: string } = {};
      try {
        session = JSON.parse(localStorage.getItem("aura_session") || "{}");
      } catch {}
      const d = profile ? saveDraft({ ...profileToDraft(profile, session) }) : loadDraft();
      setDraft(d);
      setStatus(info);

      const asked = params.get("step") as Step | null;
      const missing = info?.missing ?? [];
      const first: Step =
        asked && STEPS.some((s) => s.id === asked)
          ? asked
          : !profile || missing.includes("profile") || missing.includes("dateOfBirth")
          ? "details"
          : missing.includes("photo")
          ? "photos"
          : "identity";
      setStep(first);
    })();
    return () => {
      cancelled = true;
    };
  }, [params, router]);

  const update = (patch: Partial<RegistrationDraft>) => setDraft(saveDraft(patch));
  const go = (s: Step) => {
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async (d: RegistrationDraft): Promise<boolean> => {
    try {
      await saveProfileDraft(d);
      return true;
    } catch (err) {
      toast.error("Couldn’t save your profile", err instanceof Error ? err.message : "Please try again.");
      return false;
    }
  };

  const submit = async () => {
    try {
      await submitForReview();
    } catch (err) {
      const missing = err instanceof ApiError ? (err.extras as { missing?: string[] }).missing : undefined;
      toast.error(
        "Couldn’t submit your profile",
        missing?.length ? `Still needed: ${missing.map((m) => MISSING_LABELS[m] ?? m).join(", ")}.` : err instanceof Error ? err.message : "Please try again."
      );
      return;
    }
    await apiService.refreshSession();
    flashToast("success", status?.status === "ChangesRequested" ? "Changes submitted" : "Profile submitted", "We’ll review it and let you know by SMS.");
    router.push("/dashboard");
  };

  if (!step) return null;
  const flags = status?.status === "ChangesRequested" ? status.flags : [];

  return (
    <AuthShell action="avatar">
      {/* progress: three steps, any can be opened */}
      <nav aria-label="Complete your profile" className="w-full max-w-[680px] rounded-xl border border-line bg-surface-card p-2 shadow-sm">
        <ol className="grid grid-cols-3 gap-1">
          {STEPS.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => go(s.id)}
                aria-current={step === s.id ? "step" : undefined}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-label-md transition-colors",
                  step === s.id ? "bg-brand-gradient text-ink-on-brand shadow-sm" : "text-ink-secondary hover:bg-brand-subtle"
                )}
              >
                <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-label-sm", step === s.id ? "bg-white/25" : "bg-surface-muted")}>{i + 1}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <Card key={step} className="w-full max-w-[680px] animate-fade-up p-5 sm:p-8">
        {flags.length > 0 && (
          <Alert type="error" title={`Our safety team asked for ${flags.length} change${flags.length === 1 ? "" : "s"}`} className="mb-5">
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {flags.map((f) => (
                <li key={f.field}>
                  <button type="button" className="font-semibold underline" onClick={() => go(FIELD_STEP[f.field] ?? "details")}>
                    {FIELD_LABEL[f.field] ?? f.field}
                  </button>
                  : {f.reason}
                </li>
              ))}
            </ul>
          </Alert>
        )}

        {step === "details" && (
          <ProfileStep
            draft={draft}
            update={update}
            onBack={() => router.push("/dashboard")}
            onNext={async () => {
              if (await save(loadDraft())) go("photos");
            }}
          />
        )}
        {step === "photos" && (
          <PhotosStep
            draft={draft}
            update={update}
            onBack={() => go("details")}
            onFinish={async () => {
              if (isIllustration(draft.photo) && !(await save(loadDraft()))) return;
              go("identity");
            }}
          />
        )}
        {step === "identity" && <IdentityStep onBack={() => go("photos")} onFinish={submit} />}
      </Card>
    </AuthShell>
  );
}
