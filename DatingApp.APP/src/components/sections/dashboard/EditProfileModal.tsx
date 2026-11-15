"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { CloseCircle, Lock1 } from "iconsax-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { ageFrom, containsContactDetails } from "@/lib/registrationDraft";
import { apiService } from "@/services/api";
import { checkFile, deletePhoto, listMyPhotos, setMainPhoto, updateAbout, uploadPhoto, type PhotoDto } from "@/lib/media";
import { readSubmittedKycDetails } from "@/lib/kycDetails";
import { COUNTRIES } from "@/components/ui/PhoneField";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { useKyc } from "@/lib/verification";
import { useAuthSession } from "@/lib/session";

/**
 * Edit profile — approved members can change ONLY their description and photos.
 * Everything else (name, birth date, religion, location, contact…) is KYC-verified
 * and locked; changes go through support.
 * About → PATCH /api/profiles/me/about. Photos → /api/photos straight away; new photos wait for a quick
 * review (staff "New photos" queue) before other members see them (S02-T10).
 */
type Tab = "about" | "photos" | "details";
const OPEN_EVENT = "vk-edit-profile";
const MAX_PHOTOS = 6;
const MAX_ABOUT = 500;

/** Opens the editor from anywhere (hero button, profile-strength todos). */
export function openEditProfile(tab: Tab | React.MouseEvent = "about") {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: typeof tab === "string" ? tab : "about" }));
}

export function EditProfileModal() {
  const toast = useToast();
  const { locked } = useKyc();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [tab, setTab] = useState<Tab>("about");
  const [savedAbout, setSavedAbout] = useState("");
  const [about, setAbout] = useState("");
  const [photos, setPhotos] = useState<PhotoDto[]>([]);
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const targetRef = useRef<PhotoDto | null>(null); // photo being replaced, null = add

  const reloadPhotos = async () => {
    try {
      setPhotos((await listMyPhotos()).filter((p) => p.status !== "Rejected" || p.isMain));
    } catch {
      /* offline — keep what we have */
    }
  };

  useEffect(() => {
    const show = (e: Event) => {
      setTried(false);
      setTab(((e as CustomEvent).detail as Tab) || "about");
      setClosing(false);
      setOpen(true);
      void apiService.getMyProfile().then((p) => {
        setSavedAbout(p?.bio ?? "");
        setAbout(p?.bio ?? "");
      });
      void reloadPhotos();
    };
    window.addEventListener(OPEN_EVENT, show);
    return () => window.removeEventListener(OPEN_EVENT, show);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open || locked || typeof document === "undefined") return null;

  function close() {
    setClosing(true);
    window.setTimeout(() => setOpen(false), 180);
  }

  const aboutError =
    about.trim().length < 50 ? `Write at least 50 characters (${about.trim().length}/50).` : containsContactDetails(about) || /(https?:\/\/|www\.)/i.test(about) ? "Phone numbers, emails and links can’t be added to your description." : "";
  const dirty = about.trim() !== savedAbout.trim();
  const sorted = [...photos].sort((a, b) => Number(b.isMain) - Number(a.isMain) || a.sortOrder - b.sortOrder);

  const run = async (fn: () => Promise<unknown>, failTitle: string) => {
    setBusy(true);
    try {
      await fn();
      await reloadPhotos();
      return true;
    } catch (err) {
      toast.error(failTitle, err instanceof Error ? err.message : "Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const replacing = targetRef.current;
    const room = replacing ? 1 : MAX_PHOTOS - photos.length;
    const list = Array.from(files).slice(0, Math.max(room, 0));
    if (!replacing && files.length > room) toast.info("Photo limit", `You can have up to ${MAX_PHOTOS} photos.`);
    let added = 0;
    await run(async () => {
      for (const f of list) {
        const problem = checkFile(f, false);
        if (problem) {
          toast.error("Photo not added", `${f.name}: ${problem}`);
          continue;
        }
        const photo = await uploadPhoto(f);
        added++;
        if (replacing) {
          if (replacing.isMain) await setMainPhoto(photo.id);
          await deletePhoto(replacing.id);
        }
      }
    }, "Photo not added");
    if (added) toast.success(added > 1 ? `${added} photos added` : "Photo added", "New photos are checked by our team, usually within 24 hours.");
  };
  const pickInto = (p: PhotoDto | null) => {
    targetRef.current = p;
    if (fileRef.current) fileRef.current.multiple = p === null;
    fileRef.current?.click();
  };
  const remove = (p: PhotoDto) => void run(() => deletePhoto(p.id), "Couldn’t remove the photo");
  const makeMain = (p: PhotoDto) => void run(() => setMainPhoto(p.id), "Couldn’t change your main photo");

  const save = async () => {
    setTried(true);
    if (aboutError) {
      setTab("about");
      return;
    }
    setBusy(true);
    try {
      await updateAbout(about.trim());
      setSavedAbout(about.trim());
      close();
      toast.success("Profile updated", "Your description is live.");
    } catch (err) {
      toast.error("Couldn’t save", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <div aria-hidden onClick={close} className={cn("absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200", closing ? "opacity-0" : "animate-fade-in")} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
        className={cn(
          "relative flex max-h-[92vh] w-full max-w-[560px] flex-col rounded-t-xl bg-surface-card shadow-xl transition-all duration-200 sm:rounded-xl",
          closing ? "translate-y-4 opacity-0" : "animate-dialog-in",
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-line p-5 sm:px-6">
          <div className="flex-1">
            <h2 id="edit-profile-title" className="text-h5 text-ink">
              Edit profile
            </h2>
            <p className="text-body-sm text-ink-secondary">You can update your description and photos.</p>
          </div>
          <button type="button" aria-label="Close" onClick={close} className="text-ink-tertiary transition-colors hover:text-ink">
            <CloseCircle size={24} color="currentColor" />
          </button>
        </div>

        {/* Tabs — design-system Segmented Tab (same as Dashboard Friends / Messages) */}
        <div className="px-5 pt-4 sm:px-6">
          <SegmentedTabs<Tab>
            label="Edit profile sections"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "about", label: "About me" },
              { id: "photos", label: "Photos", count: photos.length },
              { id: "details", label: "Details" },
            ]}
          />
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5 sm:px-6">
          {tab === "about" ? (
            <Textarea
              key="about"
              label="About me"
              hint="Shown on your profile"
              value={about}
              onChange={setAbout}
              maxLength={MAX_ABOUT}
              rows={7}
              placeholder="Share your values, interests and what you’re looking for in a partner."
              error={tried && aboutError ? aboutError : undefined}
            />
          ) : tab === "photos" ? (
            <div key="photos" className={cn("flex animate-fade-in flex-col gap-3", busy && "pointer-events-none opacity-60")} aria-busy={busy}>
              <div className="grid grid-cols-3 gap-3">
                {sorted.map((ph) => (
                  <div key={ph.id} className="flex flex-col gap-1">
                    <PhotoSlot
                      src={ph.ref}
                      main={ph.isMain}
                      rejected={ph.status === "Rejected"}
                      inReview={ph.status === "Pending"}
                      className="aspect-[3/4]"
                      onPick={() => pickInto(ph)}
                      onMakeMain={ph.status !== "Rejected" ? () => makeMain(ph) : undefined}
                      onRemove={photos.length > 1 || ph.status === "Rejected" ? () => remove(ph) : undefined}
                    />
                    {ph.rejectReason && <span className="text-caption text-error-fg">{ph.rejectReason}</span>}
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && <PhotoSlot src={null} className="aspect-[3/4]" onPick={() => pickInto(null)} />}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={(e) => {
                  void addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <p className="text-body-xs text-ink-tertiary">JPG, PNG or WebP up to 8 MB · clear face photos only · photos are saved straight away and checked before other members see them.</p>
            </div>
          ) : <ProfileDetails />}

          {/* Locked, verified details */}
          <div className="flex gap-3 rounded-[16px] bg-surface-subtle p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-card text-ink-tertiary">
              <Lock1 size={18} color="currentColor" />
            </span>
            <p className="text-body-sm text-ink-secondary">
              <span className="block font-semibold text-ink">Profile details are read-only</span>
              {tab !== "details" && (
                <>
                  <button type="button" onClick={() => setTab("details")} className="font-semibold text-brand-link underline-offset-2 hover:underline">
                    View details
                  </button>
                  {" · "}
                </>
              )}
              <Link href="/support" onClick={close} className="font-semibold text-brand-link underline-offset-2 hover:underline">
                Contact support
              </Link>{" "}
              to update them.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-line p-5 sm:px-6">
          {tab !== "about" && !dirty ? (
            <Button size="md" fullWidth onClick={close}>Done</Button>
          ) : (
            <>
              <Button variant="outline" size="md" className="flex-1" onClick={close}>
                Cancel
              </Button>
              <Button size="md" className="flex-1" disabled={!dirty || busy} loading={busy} onClick={() => void save()}>
                Save changes
              </Button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function displayBirthDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function ProfileDetails() {
  const { session, profile, profileCode, loading } = useAuthSession();
  const registration = readSubmittedKycDetails(session);
  const age = (registration?.dob ? ageFrom(registration.dob) : null) ?? profile?.age;
  const gender = registration?.gender || (profile?.gender === "male" ? "Male" : profile?.gender === "female" ? "Female" : undefined);
  const mobile = registration?.mobile ? `+94 ${registration.mobile}` : session?.phoneNumber;
  const dialCode = COUNTRIES.find((country) => country.iso === registration?.whatsappCountry)?.dial;
  const whatsapp = registration?.whatsappSameAsMobile
    ? mobile
    : registration?.whatsapp ? [dialCode, registration.whatsapp].filter(Boolean).join(" ") : undefined;
  const details = [
    ...(registration ? [
      { label: "First name", value: registration.firstName },
      { label: "Last name", value: registration.lastName },
    ] : [{ label: "Full name", value: profile?.name || session?.fullName }]),
    { label: "Profile ID", value: profileCode },
    { label: "Profile created for", value: registration?.profileFor },
    { label: "Display name format", value: registration?.displayNameFormat },
    { label: "Profile created by", value: registration?.createdBy },
    { label: "Date of birth", value: displayBirthDate(registration?.dob) },
    { label: "Age", value: age ? `${age} years` : undefined },
    { label: "Gender", value: gender },
    { label: "Height", value: registration?.height || profile?.height },
    { label: "Weight", value: (registration?.weightKg || profile?.details?.weightKg) ? `${registration?.weightKg || profile?.details?.weightKg} kg` : undefined },
    { label: "Civil status", value: registration?.civilStatus || profile?.details?.civilStatus },
    { label: "Religion", value: registration?.religion || profile?.religion },
    { label: "Ethnicity", value: registration?.ethnicity || profile?.community },
    { label: "Caste", value: registration?.caste || profile?.details?.caste },
    { label: "Zodiac sign", value: registration?.zodiacSign || profile?.details?.zodiacSign },
    { label: "Location", value: profile?.location },
    { label: "Country of residence", value: registration?.country || profile?.country },
    { label: "District", value: registration?.district || profile?.details?.district },
    { label: "Profession", value: profile?.profession },
    { label: "Monthly salary range", value: registration?.monthlySalaryRange || profile?.details?.monthlySalaryRange },
    { label: "Education", value: profile?.education },
    { label: "Mobile number", value: mobile },
    { label: "Email", value: registration?.email || session?.email },
    { label: "WhatsApp", value: whatsapp },
  ];

  return (
    <section aria-labelledby="profile-details-title" className="flex flex-col gap-3">
      <h3 id="profile-details-title" className="text-h6 text-ink">Profile details</h3>
      {session || profile ? (
        <dl className="grid gap-3 sm:grid-cols-2">
          {details.map(({ label, value }) => (
            <div key={label} className="min-w-0 rounded-md bg-surface-subtle px-4 py-3">
              <dt className="text-caption text-ink-tertiary">{label}</dt>
              <dd className="break-words text-body-sm font-semibold text-ink-secondary">{value?.trim() || "Not available"}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-body-sm text-ink-secondary">{loading ? "Loading your profile details…" : "No profile details available yet."}</p>
      )}
    </section>
  );
}
