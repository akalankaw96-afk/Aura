'use client';

import React, { useState } from 'react';
import { Profile } from '../types';
import {
  X,
  ShieldCheck,
  Heart,
  MapPin,
  GraduationCap,
  Briefcase,
  Calendar,
  Sparkles,
  Check,
  Phone,
  Lock,
  FileText,
  Share2,
  Bookmark,
  Flag,
  AlertTriangle,
  MessageCircle
} from 'lucide-react';

interface ProfileDetailModalProps {
  profile: Profile | null;
  onClose: () => void;
  onConnect: (profile: Profile) => void;
  isConnected: boolean;
}

export const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({
  profile,
  onClose,
  onConnect,
  isConnected,
}) => {
  const [shortlisted, setShortlisted] = useState(false);
  const [showNoteBox, setShowNoteBox] = useState(false);
  const [introNote, setIntroNote] = useState('');
  const [noteWarning, setNoteWarning] = useState<string | null>(null);
  const [reported, setReported] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  if (!profile) return null;

  // Flowchart Guardrail: "Message has phone / link? -> Yes -> Contact details blocked -> edit"
  const handleNoteChange = (text: string) => {
    setIntroNote(text);
    setNoteWarning(null);

    // Regex check for phone number (7+ digits) or web links
    const phoneRegex = /(\+?\d[\d\s-]{6,}\d)/;
    const linkRegex = /(https?:\/\/|www\.|\.com|\.lk|\.net|\.org)/i;

    if (phoneRegex.test(text)) {
      setNoteWarning('Contact details blocked — Phone numbers cannot be sent in the initial request. They are shared securely after mutual acceptance.');
    } else if (linkRegex.test(text)) {
      setNoteWarning('External links blocked — Please keep introductory notes friendly and free of URLs.');
    }
  };

  const handleSendConnect = () => {
    if (noteWarning) return;
    onConnect(profile);
    setShowNoteBox(false);
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + '/?profile=' + profile.code);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-rose-100 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Top Banner with Image */}
        <div className="relative aspect-[16/9] w-full bg-gray-900">
          <img
            src={profile.photoUrl}
            alt={profile.name}
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />

          {/* Badges on banner */}
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
            {profile.verified && (
              <span className="bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Professional</span>
              </span>
            )}
            {profile.premium && (
              <span className="bg-amber-400 text-maroon-950 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>VIP Member</span>
              </span>
            )}
          </div>

          {/* Name & Headline on banner bottom */}
          <div className="absolute bottom-4 left-6 right-6 text-white flex items-end justify-between">
            <div>
              <span className="font-mono bg-black/50 px-2 py-0.5 rounded text-xs text-rose-200">
                ID: {profile.code}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif mt-1">
                {profile.name}
              </h2>
              <p className="text-sm text-rose-100 flex items-center gap-2 mt-0.5">
                <span>{profile.age} Years</span>
                <span>•</span>
                <span>{profile.height}</span>
                <span>•</span>
                <span>{profile.location}, {profile.country}</span>
              </p>
            </div>

            {/* Flow 2: Shortlist / Share Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShortlisted(!shortlisted)}
                title="Shortlist profile"
                className={`p-2.5 rounded-full backdrop-blur-md transition-colors cursor-pointer ${
                  shortlisted
                    ? 'bg-rose-500 text-white'
                    : 'bg-white/20 hover:bg-white/40 text-white'
                }`}
              >
                <Bookmark className="w-4 h-4" />
              </button>
              <button
                onClick={handleShare}
                title="Share profile"
                className="p-2.5 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Share Feedback Toast */}
        {shareCopied && (
          <div className="bg-emerald-700 text-white text-xs py-1.5 px-4 text-center font-medium animate-fadeIn">
            ✓ Profile link copied to clipboard!
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Flow 2: Accepted "It's a Match!" Celebration Banner */}
          {isConnected && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3.5 shadow-xs animate-fadeIn">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Heart className="w-5 h-5 fill-white" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm text-emerald-800">Interest Sent / Connected!</div>
                <div className="text-xs text-emerald-700 mt-0.5">
                  Receiver has been notified. When accepted: &ldquo;It&apos;s a match!&rdquo; — direct chat & family contacts will unlock.
                </div>
              </div>
            </div>
          )}

          {/* Key Quick Facts Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Profession</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-0.5">{profile.profession}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Education</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-0.5 truncate">{profile.education}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Community & Religion</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-0.5">{profile.community} ({profile.religion})</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Residency Status</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-0.5">{profile.country}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Horoscope (Porondam)</p>
              <p className="text-xs sm:text-sm font-semibold text-emerald-700 mt-0.5">
                {profile.horoscopeAvailable ? 'Available on Request' : 'Not Required'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Profile Privacy</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-0.5 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-[#801b34]" />
                Shield Protected
              </p>
            </div>
          </div>

          {/* About Candidate */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#801b34] mb-2 flex items-center gap-1.5 font-sans">
              <FileText className="w-4 h-4" />
              <span>About Candidate</span>
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
              {profile.bio}
            </p>
          </div>

          {/* Family Background */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#801b34] mb-2 flex items-center gap-1.5 font-sans">
              <Heart className="w-4 h-4" />
              <span>Family Background</span>
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
              {profile.aboutFamily}
            </p>
          </div>

          {/* Interests & Passions */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5">
              Personal Interests & Lifestyle
            </h4>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest, i) => (
                <span
                  key={i}
                  className="text-xs bg-rose-50 text-[#801b34] font-medium px-3 py-1 rounded-full border border-rose-200"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          {/* Flow 2: Optional Intro Message Box */}
          {!isConnected && showNoteBox && (
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5 text-[#801b34]" />
                  Add a respectful message (Optional):
                </span>
                <span className="text-[11px] text-gray-500">Max 150 chars</span>
              </div>
              <textarea
                rows={2}
                maxLength={150}
                value={introNote}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder="e.g. Hello, my family and I admire your background and values. Would love to connect."
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#801b34]/30 focus:border-[#801b34] bg-white"
              />
              
              {/* Phone / Link Guardrail Error */}
              {noteWarning && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{noteWarning}</span>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Report / Block trigger (Flow 2 / Flow 3) */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <button
                onClick={() => {
                  setReported(true);
                  alert(`Thank you. Candidate profile ${profile.code} has been flagged for administrative review.`);
                }}
                className="text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{reported ? 'Flagged for Review' : 'Report / Block'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {!isConnected && !showNoteBox && (
                <button
                  type="button"
                  onClick={() => setShowNoteBox(true)}
                  className="py-3 px-4 rounded-xl border border-rose-200 text-[#801b34] hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  + Add Message
                </button>
              )}

              <button
                onClick={handleSendConnect}
                disabled={!!noteWarning}
                className={`flex-1 sm:flex-initial py-3 px-6 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  isConnected
                    ? 'bg-emerald-600 text-white'
                    : noteWarning
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#801b34] hover:bg-[#681429] text-white shadow-md'
                }`}
              >
                {isConnected ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Interest Expressed</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4" />
                    <span>Send Connect Request</span>
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="py-3 px-5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 text-sm font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
