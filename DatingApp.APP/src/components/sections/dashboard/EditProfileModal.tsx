"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { CloseCircle, Lock1 } from "iconsax-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { ageFrom, containsContactDetails, loadDraft } from "@/lib/registrationDraft";
import { readSubmittedKycDetails } from "@/lib/kycDetails";
import { COUNTRIES } from "@/components/ui/PhoneField";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { useKyc } from "@/lib/verification";
import { useAuthSession } from "@/lib/session";

/**
 * Edit profile — approved members can change ONLY their description and photos.
 * Everything else (name, birth date, religion, location, contact…) is KYC-verified
 * and locked; changes go through support. New photos go to a quick review.
 * Saved in this browser (localStorage "vk-profile") until the edit-profile API exists (#19 PATCH /profiles/me/about, #21 photos).
 */
type Tab = "about" | "photos" | "details";
const OPEN_EVENT = "vk-edit-profile";
const KEY = "vk-profile";
const MAX_PHOTOS = 6;
const MAX_ABOUT = 500;

interface Photo {
  src: string;
  review?: boolean; // new upload waiting for approval
}
interface Stored {
  about: string;
  photos: Photo[];
}

/** Before the first edit: what the member submitted at registration (no demo text). */
function fromRegistration(): Stored {
  const d = loadDraft();
  return { about: d.about || "", photos: d.photo ? [{ src: d.photo }] : [] };
}

function load(): Stored {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    if (s?.about !== undefined && Array.isArray(s.photos)) return s;
  } catch {}
  return fromRegistration();
}

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
  const [saved, setSaved] = useState<Stored>({ about: "", photos: [] });
  const [about, setAbout] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [tried, setTried] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const targetRef = useRef<number | null>(null); // slot being replaced, null = add

  useEffect(() => {
    const show = (e: Event) => {
      const s = load();
      setSaved(s);
      setAbout(s.about);
      setPhotos(s.photos);
      setTried(false);
      setTab(((e as CustomEvent).detail as Tab) || "about");
      setClosing(false);
      setOpen(true);
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
  const dirty = about !== saved.about || JSON.stringify(photos) !== JSON.stringify(saved.photos);
  const newPhotos = photos.filter((p) => p.review && !saved.photos.some((s) => s.src === p.src)).length;

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const room = targetRef.current !== null ? 1 : MAX_PHOTOS - photos.length;
    const picked = Array.from(files)
      .filter((f) => {
        if (!f.type.startsWith("image/")) return false;
        if (f.size > 5 * 1024 * 1024) {
          toast.error("Photo too large", `${f.name} is over 5 MB.`);
          return false;
        }
        return true;
      })
      .slice(0, room);
    if (targetRef.current === null && files.length > room) toast.info("Photo limit", `You can have up to ${MAX_PHOTOS} photos.`);
    // data URLs so the preview survives a reload (photo upload API: Sprint 02)
    const target = targetRef.current;
    if (target !== null && files[0]) {
      const f = Array.from(files).find((x) => x.type.startsWith("image/") && x.size <= 5 * 1024 * 1024);
      if (!f) return;
      const r = new FileReader();
      r.onload = () => setPhotos((ps) => ps.map((p, j) => (j === target ? { src: String(r.result), review: true } : p)));
      r.readAsDataURL(f);
      return;
    }
    picked.forEach((f) => {
      const r = new FileReader();
      r.onload = () => setPhotos((ps) => (ps.length < MAX_PHOTOS ? [...ps, { src: String(r.result), review: true }] : ps));
      r.readAsDataURL(f);
    });
  };
  const pickInto = (i: number | null) => {
    targetRef.current = i;
    if (fileRef.current) fileRef.current.multiple = i === null;
    fileRef.current?.click();
  };
  const replaceAt = (i: number) => pickInto(i);
  const remove = (i: number) => setPhotos((ps) => ps.filter((_, j) => j !== i));
  const makeMain = (i: number) => setPhotos((ps) => [ps[i], ...ps.filter((_, j) => j !== i)]);

  const save = () => {
    setTried(true);
    if (aboutError) {
      setTab("about");
      return;
    }
    const next = { about: about.trim(), photos };
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      toast.error("Couldn’t save", "Your browser storage is full — try fewer or smaller photos.");
      return;
    }
    close();
    if (newPhotos) toast.success("Changes saved", `${newPhotos} new photo${newPhotos > 1 ? "s are" : " is"} in review — usually live within 24 hours.`);
    else toast.success("Profile updated", "Your changes are live.");
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
            <div key="photos" className="flex animate-fade-in flex-col gap-3">
              <div className="grid grid-cols-3 gap-3">
                {photos.map((ph, i) => (
                  <PhotoSlot
                    key={ph.src.slice(-40) + i}
                    src={ph.src}
                    main={i === 0}
                    inReview={ph.review}
                    className="aspect-[3/4]"
                    onPick={() => replaceAt(i)}
                    onMakeMain={() => makeMain(i)}
                    onRemove={photos.length > 1 ? () => remove(i) : undefined}
                  />
                ))}
                {photos.length < MAX_PHOTOS && <PhotoSlot src={null} className="aspect-[3/4]" onPick={() => pickInto(null)} />}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <p className="text-body-xs text-ink-tertiary">JPG or PNG up to 5 MB · clear face photos only · new photos are checked before they go live.</p>
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
          {tab === "details" && !dirty ? (
            <Button size="md" fullWidth onClick={close}>Done</Button>
          ) : (
            <>
              <Button variant="outline" size="md" className="flex-1" onClick={close}>
                Cancel
              </Button>
              <Button size="md" className="flex-1" disabled={!dirty} onClick={save}>
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
