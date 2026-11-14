"use client";

import React, { useState } from "react";
import {
  CloseCircle,
  Heart,
  Verify,
  ShieldTick,
  Star1,
  Location,
  Briefcase,
  Teacher,
  MessageText,
  Share,
  Send,
  Warning2,
  TickCircle,
  Flag as FlagIcon
} from "iconsax-react";
import { Flag } from "@/components/ui/Flag";
import { cn } from "@/lib/cn";
import { apiService } from "@/services/api";
import { requirePaidAction } from "@/lib/usage";
import { allowVerificationAction } from "@/lib/session";

export interface ProposalDetail {
  id: string;
  name?: string;
  code?: string;
  gender: "bride" | "groom" | "female" | "male";
  age: number;
  height: string;
  profession: string;
  education: string;
  location: string;
  country: string;
  religion: string;
  community?: string;
  photo: string;
  bio?: string;
  aboutFamily?: string;
  horoscope?: boolean;
  rasi?: string;
  nakshatra?: string;
}

interface ProfileDetailModalProps {
  profile: ProposalDetail | null;
  onClose: () => void;
  onConnect?: (profile: ProposalDetail, note?: string) => void;
}

export function ProfileDetailModal({ profile, onClose, onConnect }: ProfileDetailModalProps) {
  const [shortlisted, setShortlisted] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteWarning, setNoteWarning] = useState<string | null>(null);
  const [interestSent, setInterestSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reported, setReported] = useState(false);

  if (!profile) return null;

  const isBride = profile.gender === "bride" || profile.gender === "female";
  const displayId = profile.code || profile.id;
  const displayName = profile.name || (isBride ? `Bride ${displayId}` : `Groom ${displayId}`);

  // Flow 2 Guardrail: Phone number or URL scanner in introductory note
  const handleNoteChange = (text: string) => {
    if (!allowVerificationAction("add a note")) return;
    setNoteText(text);
    const phoneRegex = /(\+?\d[\d\s-]{6,}\d)/;
    const linkRegex = /(https?:\/\/|www\.|\.com|\.lk|\.net)/i;

    if (phoneRegex.test(text)) {
      setNoteWarning("Contact details blocked. Phone numbers cannot be sent in initial requests. They are unlocked after mutual acceptance.");
    } else if (linkRegex.test(text)) {
      setNoteWarning("Links blocked. External URLs are not allowed in introductory notes.");
    } else {
      setNoteWarning(null);
    }
  };

  const handleSend = () => {
    if (!requirePaidAction("interests", "send an interest")) return;
    if (noteWarning) return;
    setInterestSent(true);
    apiService.sendMatchRequest(profile.id, noteText);
    onConnect?.(profile, noteText);
  };

  const handleShare = () => {
    if (!allowVerificationAction("share profiles")) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + `/search?id=${displayId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-surface-card rounded-2xl shadow-2xl border border-line overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <CloseCircle size={24} color="currentColor" />
        </button>

        {/* Modal Top Photo & Hero */}
        <div className="relative aspect-[16/9] w-full bg-rose-950 overflow-hidden shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.photo}
            alt={displayName}
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

          {/* Badges on Hero */}
          <div className="absolute top-4 left-4 flex flex-col items-start gap-1.5">
            <span className="on-photo inline-flex items-center gap-1 rounded-full bg-success-bg px-2.5 py-0.5 text-label-sm text-success-fg font-semibold backdrop-blur-md">
              <Verify size={14} color="currentColor" /> Government ID Verified
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-scrim px-2.5 py-0.5 text-label-sm text-ink-on-brand backdrop-blur-md">
              <ShieldTick size={14} color="currentColor" /> Photo Verified
            </span>
          </div>

          {/* Name & Basic Meta in Hero Bottom */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-serif">{displayName}</h2>
                <p className="text-xs sm:text-sm text-rose-100 flex items-center gap-2 mt-0.5">
                  <span>{profile.age} yrs</span>
                  <span>&bull;</span>
                  <span>{profile.height}</span>
                  <span>&bull;</span>
                  <span className="inline-flex items-center gap-1">
                    <Flag country={profile.country.toLowerCase() as any} />
                    {profile.location}
                  </span>
                </p>
              </div>

              {/* Shortlist Heart Button */}
              <button
                type="button"
                onClick={() => {
                  if (allowVerificationAction("shortlist profiles")) setShortlisted(!shortlisted);
                }}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
              >
                <Heart size={20} color={shortlisted ? "#de0547" : "currentColor"} variant={shortlisted ? "Bold" : "Linear"} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5 text-ink flex-1">
          
          {/* Key Attributes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-surface-subtle border border-line text-xs">
              <span className="text-ink-tertiary block text-[11px]">Profession</span>
              <span className="font-semibold text-ink mt-0.5 flex items-center gap-1.5 truncate">
                <Briefcase size={14} className="text-icon-brand shrink-0" />
                {profile.profession}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface-subtle border border-line text-xs">
              <span className="text-ink-tertiary block text-[11px]">Education</span>
              <span className="font-semibold text-ink mt-0.5 flex items-center gap-1.5 truncate">
                <Teacher size={14} className="text-icon-brand shrink-0" />
                {profile.education}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface-subtle border border-line text-xs">
              <span className="text-ink-tertiary block text-[11px]">Religion</span>
              <span className="font-semibold text-ink mt-0.5 block truncate">
                {profile.religion}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface-subtle border border-line text-xs">
              <span className="text-ink-tertiary block text-[11px]">Horoscope</span>
              <span className="font-semibold text-ink mt-0.5 flex items-center gap-1 truncate text-amber-700">
                <Star1 size={14} color="currentColor" />
                {profile.horoscope ? "Available" : "On Request"}
              </span>
            </div>
          </div>

          {/* About Candidate */}
          {profile.bio && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-tertiary">
                About Candidate
              </h4>
              <p className="text-body-sm text-ink-secondary leading-relaxed bg-surface-subtle p-3.5 rounded-xl border border-line">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Family Heritage */}
          {profile.aboutFamily && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-tertiary">
                Family Background
              </h4>
              <p className="text-body-sm text-ink-secondary leading-relaxed bg-surface-subtle p-3.5 rounded-xl border border-line">
                {profile.aboutFamily}
              </p>
            </div>
          )}

          {/* Optional Intro Message Box (Flow 2) */}
          {showNote && !interestSent && (
            <div className="space-y-2 p-3.5 rounded-xl border border-rose-200 bg-rose-50/50">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-brand flex items-center gap-1.5">
                  <MessageText size={16} />
                  Add a respectful message (Optional):
                </span>
                <span className="text-ink-tertiary text-[11px]">Max 150 chars</span>
              </div>
              <textarea
                rows={2}
                maxLength={150}
                value={noteText}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder="e.g. Greetings! Our family admired your background and values. We would be honored to connect."
                className="w-full p-2.5 text-xs rounded-lg border border-line bg-surface-card focus:ring-2 focus:ring-brand outline-none"
              />
              {noteWarning && (
                <div className="p-2 rounded-lg bg-red-50 text-error-fg text-xs flex items-start gap-1.5">
                  <Warning2 size={16} className="shrink-0 mt-0.5" />
                  <span>{noteWarning}</span>
                </div>
              )}
            </div>
          )}

          {/* Success State if interest sent */}
          {interestSent && (
            <div className="p-4 rounded-xl bg-success-bg border border-green-200 text-success-fg text-xs flex items-center gap-2.5">
              <TickCircle size={20} color="currentColor" />
              <div>
                <span className="font-bold block">Interest Request Sent Successfully!</span>
                <span className="text-green-700 text-[11px]">
                  {displayName} has been notified. When they accept, direct chat and contact numbers will unlock.
                </span>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-line">
            
            {/* Share & Report */}
            <div className="flex items-center gap-3 text-xs text-ink-tertiary">
              <button
                type="button"
                onClick={handleShare}
                className="hover:text-brand flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Share size={16} />
                <span>{copied ? "Link Copied!" : "Share Profile"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!allowVerificationAction("report a profile")) return;
                  setReported(true);
                  alert(`Candidate profile ${displayId} flagged for review.`);
                }}
                className="hover:text-error-fg flex items-center gap-1 cursor-pointer transition-colors"
              >
                <FlagIcon size={16} />
                <span>{reported ? "Reported" : "Report / Block"}</span>
              </button>
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {!interestSent && !showNote && (
                <button
                  type="button"
                  onClick={() => {
                    if (allowVerificationAction("add a note")) setShowNote(true);
                  }}
                  className="py-2.5 px-3.5 rounded-full border border-line text-ink hover:bg-surface-subtle text-xs font-semibold cursor-pointer"
                >
                  + Add Message
                </button>
              )}

              <button
                type="button"
                disabled={interestSent || !!noteWarning}
                onClick={handleSend}
                className={cn(
                  "flex-1 sm:flex-initial py-2.5 px-6 rounded-full text-xs font-bold transition-all shadow flex items-center justify-center gap-2 cursor-pointer",
                  interestSent
                    ? "bg-success-fg text-white opacity-90 cursor-default"
                    : "bg-brand-gradient hover:shadow-glow text-ink-on-brand"
                )}
              >
                {interestSent ? (
                  <>
                    <TickCircle size={16} color="currentColor" />
                    <span>Interest Expressed</span>
                  </>
                ) : (
                  <>
                    <Send size={16} color="currentColor" />
                    <span>Send Connect Interest</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

