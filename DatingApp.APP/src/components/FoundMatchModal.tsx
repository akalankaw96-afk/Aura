'use client';

import React, { useState } from 'react';
import {
  X,
  Heart,
  Sparkles,
  Camera,
  Star,
  CheckCircle2,
  Calendar,
  MapPin,
  ShieldCheck,
  Lock,
  ArrowRight,
  Upload,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { apiService, SuccessStorySubmission } from '../services/api';
import { mockProfiles } from '../data/mockData';

interface FoundMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessSubmitted: (submission: SuccessStorySubmission) => void;
}

type StepType = 'select_partner' | 'partner_confirm' | 'story_review' | 'consent_privacy' | 'completed';

export const FoundMatchModal: React.FC<FoundMatchModalProps> = ({
  isOpen,
  onClose,
  onSuccessSubmitted,
}) => {
  // Wizard Step
  const [step, setStep] = useState<StepType>('select_partner');

  // Step 1: Partner & Status
  const [partnerMode, setPartnerMode] = useState<'preset' | 'custom'>('preset');
  const [selectedPartnerId, setSelectedPartnerId] = useState(mockProfiles[2].id); // default to Dinithi
  const [customPartnerName, setCustomPartnerName] = useState('');
  const [customPartnerCode, setCustomPartnerCode] = useState('');
  const [engagementStatus, setEngagementStatus] = useState<'Engaged' | 'Married' | 'Wedding Planned'>('Engaged');

  // Step 2: Confirmation
  const [partnerConfirmed, setPartnerConfirmed] = useState(true);
  const [isVerifyingPing, setIsVerifyingPing] = useState(false);

  // Step 3: Review & Photo
  const [rating, setRating] = useState(5);
  const [storyTitle, setStoryTitle] = useState('Found our eternal love through mutual respect and family values');
  const [storyReview, setStoryReview] = useState(
    'Our journey began on Aura Matrimony with sincere family conversations. The verified background and educational credentials gave our parents total confidence. We are overjoyed to start our lives together!'
  );
  const [weddingDate, setWeddingDate] = useState('April 2026');
  const [weddingLocation, setWeddingLocation] = useState('Colombo, Sri Lanka');
  const [photoPreview, setPhotoPreview] = useState<string>(
    'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop'
  );

  // Step 4: Consent & Privacy
  const [consentToPublish, setConsentToPublish] = useState(true);
  const [hideProfiles, setHideProfiles] = useState(true);

  if (!isOpen) return null;

  // Selected partner name
  const currentPartner = mockProfiles.find((p) => p.id === selectedPartnerId);
  const effectivePartnerName = partnerMode === 'preset' ? currentPartner?.name || 'Partner' : customPartnerName || 'Partner';
  const effectivePartnerCode = partnerMode === 'preset' ? currentPartner?.code || 'LK-XXXX' : customPartnerCode || 'LK-XXXX';

  // Handler for Partner Confirmation Check
  const handlePartnerConfirmCheck = () => {
    setIsVerifyingPing(true);
    setTimeout(() => {
      setIsVerifyingPing(false);
      if (partnerConfirmed) {
        setStep('story_review');
      }
    }, 1200);
  };

  // Submit Final Story
  const handleFinalSubmit = () => {
    const submission: SuccessStorySubmission = {
      id: `story-${Date.now()}`,
      partnerProfileId: selectedPartnerId,
      partnerName: effectivePartnerName,
      partnerConfirmed,
      engagementStatus,
      rating,
      title: storyTitle,
      story: storyReview,
      weddingDate,
      location: weddingLocation,
      photoUrl: photoPreview,
      consentToPublish,
      status: consentToPublish ? 'PendingAdminApproval' : 'Private',
      submittedAt: new Date().toISOString(),
      hideProfilesOnSuccess: hideProfiles,
    };

    apiService.submitSuccessStory(submission);
    setStep('completed');
    onSuccessSubmitted(submission);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-rose-100 flex flex-col max-h-[92vh]">
        
        {/* Top Celebratory Header */}
        <div className="bg-gradient-to-r from-[#801b34] via-[#99203e] to-[#801b34] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-400 text-maroon-950 flex items-center justify-center font-bold shadow-md">
              <Heart className="w-5 h-5 text-[#801b34] fill-[#801b34]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-serif leading-tight">
                  Congratulations! Found My Match
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400 text-maroon-950">
                  Flow 5
                </span>
              </div>
              <p className="text-xs text-rose-200">
                Share your blessing with family consent & celebrate with Aura
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 sm:p-7 space-y-6 flex-1">
          
          {/* STEP 1: SELECT PARTNER & STATUS */}
          {step === 'select_partner' && (
            <div className="space-y-5">
              <div className="text-center max-w-md mx-auto space-y-1">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
                  Step 1 of 4: Match Verification
                </span>
                <h3 className="text-xl font-bold font-serif text-gray-900">
                  Who did you connect with?
                </h3>
                <p className="text-xs text-gray-500">
                  Select your partner from your connections or enter their candidate profile code.
                </p>
              </div>

              {/* Partner source selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                  Select Partner from Your Verified Connections:
                </label>
                
                <div className="space-y-2">
                  {mockProfiles.slice(0, 3).map((candidate) => (
                    <label
                      key={candidate.id}
                      className={`flex items-center gap-3.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                        selectedPartnerId === candidate.id && partnerMode === 'preset'
                          ? 'border-[#801b34] bg-rose-50/60 ring-2 ring-[#801b34]/20 shadow-xs'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="partnerSelect"
                        checked={selectedPartnerId === candidate.id && partnerMode === 'preset'}
                        onChange={() => {
                          setSelectedPartnerId(candidate.id);
                          setPartnerMode('preset');
                        }}
                        className="text-[#801b34] focus:ring-0"
                      />
                      <img
                        src={candidate.photoUrl}
                        alt={candidate.name}
                        className="w-12 h-12 rounded-full object-cover border border-rose-200"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-gray-900">{candidate.name}</h4>
                          <span className="text-[10px] font-mono text-gray-400">({candidate.code})</span>
                        </div>
                        <p className="text-xs text-gray-500">{candidate.profession} &bull; {candidate.location}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Engagement Status */}
                <div className="pt-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
                    Current Matrimonial Stage:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Engaged', 'Married', 'Wedding Planned'] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setEngagementStatus(status)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          engagementStatus === status
                            ? 'bg-[#801b34] text-white border-[#801b34] shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {status === 'Engaged' && '💍 '}
                        {status === 'Married' && '👰🤵 '}
                        {status === 'Wedding Planned' && '💒 '}
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setStep('partner_confirm')}
                  className="px-6 py-2.5 bg-[#801b34] hover:bg-[#681429] text-white text-xs font-bold rounded-xl shadow cursor-pointer flex items-center gap-2"
                >
                  <span>Continue to Confirmation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PARTNER CONFIRMATION (Flow 5: "Partner confirms? Yes/No") */}
          {step === 'partner_confirm' && (
            <div className="space-y-5 text-center max-w-md mx-auto py-2">
              <div className="w-14 h-14 rounded-full bg-rose-100 text-[#801b34] flex items-center justify-center mx-auto">
                <UserCheck className="w-7 h-7" />
              </div>

              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
                  Step 2 of 4: Mutual Partner Consent
                </span>
                <h3 className="text-xl font-bold font-serif text-gray-900 mt-2">
                  Confirming with {effectivePartnerName}
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  According to Flow 5 integrity rules, both candidates must confirm the union before a public review or success story can be published.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900">Partner Verification Check:</span>
                  <span className="text-[11px] font-mono font-semibold text-[#801b34]">{effectivePartnerCode}</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  A verification confirmation alert has been delivered to {effectivePartnerName}&apos;s Aura mobile app and dashboard.
                </p>
              </div>

              {/* Verification simulation */}
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-left text-xs space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-700 font-medium">Simulate Partner Response:</span>
                  <select
                    value={partnerConfirmed ? 'yes' : 'no'}
                    onChange={(e) => setPartnerConfirmed(e.target.value === 'yes')}
                    className="text-xs border border-gray-300 rounded-lg p-1 bg-white font-bold"
                  >
                    <option value="yes">Yes - Partner Confirms Engagement</option>
                    <option value="no">No - Not Confirmed</option>
                  </select>
                </label>

                {!partnerConfirmed && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      Flowchart Rule: If partner does not confirm, nothing will be published publicly.
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep('select_partner')}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  onClick={handlePartnerConfirmCheck}
                  disabled={isVerifyingPing || !partnerConfirmed}
                  className="px-6 py-2.5 bg-[#801b34] hover:bg-[#681429] text-white text-xs font-bold rounded-xl shadow cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isVerifyingPing ? (
                    <span>Verifying Response...</span>
                  ) : (
                    <>
                      <span>Partner Confirmed &bull; Write Review</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: WRITE REVIEW + RATING + COUPLE PHOTO */}
          {step === 'story_review' && (
            <div className="space-y-4">
              <div className="text-center max-w-md mx-auto space-y-1">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
                  Step 3 of 4: Your Love Story
                </span>
                <h3 className="text-xl font-bold font-serif text-gray-900">
                  Write Review & Upload Couple Photo
                </h3>
                <p className="text-xs text-gray-500">
                  Inspire thousands of families across Sri Lanka seeking authentic companionship.
                </p>
              </div>

              {/* Star Rating */}
              <div className="bg-rose-50/50 p-3.5 rounded-2xl border border-rose-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-800 block">Your Experience Rating:</span>
                  <span className="text-[11px] text-gray-500">How would you rate Aura Matrimony?</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Story Title & Text */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">
                    Story Headline:
                  </label>
                  <input
                    type="text"
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                    placeholder="e.g. United across continents with parents' blessings"
                    className="w-full px-3.5 py-2 text-xs font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#801b34] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">
                    Your Testimonial / Story:
                  </label>
                  <textarea
                    rows={3}
                    value={storyReview}
                    onChange={(e) => setStoryReview(e.target.value)}
                    placeholder="Describe how you met, your families' first meeting, and your advice for other singles..."
                    className="w-full p-3 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#801b34] outline-none"
                  />
                </div>

                {/* Wedding Date & City */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">
                      Ceremony / Wedding Date:
                    </label>
                    <input
                      type="text"
                      value={weddingDate}
                      onChange={(e) => setWeddingDate(e.target.value)}
                      placeholder="e.g. December 2026"
                      className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#801b34] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">
                      Location / City:
                    </label>
                    <input
                      type="text"
                      value={weddingLocation}
                      onChange={(e) => setWeddingLocation(e.target.value)}
                      placeholder="e.g. Colombo, Sri Lanka"
                      className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#801b34] outline-none"
                    />
                  </div>
                </div>

                {/* Couple Photo Upload */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">
                    Couple Photo (Engagement / Wedding / Portrait):
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border border-rose-200 shrink-0 bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photoPreview} alt="Couple Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5 text-gray-500" />
                        <span>Upload Couple Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-gray-400">
                        High resolution portrait or wedding picture (JPG or PNG)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('partner_confirm')}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep('consent_privacy')}
                  className="px-6 py-2.5 bg-[#801b34] hover:bg-[#681429] text-white text-xs font-bold rounded-xl shadow cursor-pointer flex items-center gap-2"
                >
                  <span>Next: Consent & Privacy</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: CONSENT & PROFILE HIDING (Flow 5: "Both consent to publish? -> Admin approves / Review kept private") */}
          {step === 'consent_privacy' && (
            <div className="space-y-5">
              <div className="text-center max-w-md mx-auto space-y-1">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
                  Step 4 of 4: Publishing Consent
                </span>
                <h3 className="text-xl font-bold font-serif text-gray-900">
                  Consent & Profile Privacy
                </h3>
                <p className="text-xs text-gray-500">
                  Control how your story is handled and manage your search visibility.
                </p>
              </div>

              {/* Consent to publish */}
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-4 rounded-2xl border border-rose-200 bg-rose-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentToPublish}
                    onChange={(e) => setConsentToPublish(e.target.checked)}
                    className="rounded text-[#801b34] mt-1 focus:ring-0"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-gray-900 block">
                      Both Partner and I Consent to Public Feature
                    </span>
                    <span className="text-gray-600 text-[11px] leading-relaxed block mt-0.5">
                      Our story will be submitted to Aura editors (Flow 6 Admin review) for showcase on the public Success Stories wall.
                    </span>
                  </div>
                </label>

                {!consentToPublish && (
                  <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 border border-gray-200">
                    <strong>Flowchart Note:</strong> Review will be kept strictly private (internal) for platform feedback. No names or photos will be published.
                  </div>
                )}

                {/* Hide both profiles (Flow 5: "Both profiles hidden - option to delete") */}
                <label className="flex items-start gap-3 p-4 rounded-2xl border border-gray-200 hover:border-gray-300 bg-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideProfiles}
                    onChange={(e) => setHideProfiles(e.target.checked)}
                    className="rounded text-[#801b34] mt-1 focus:ring-0"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-gray-900 block">
                      Hide Both Profiles from Public Search (Recommended)
                    </span>
                    <span className="text-gray-500 text-[11px] leading-relaxed block mt-0.5">
                      Since you have found your life partner, both candidate profiles will be immediately paused from new matchmaking searches and contact requests.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setStep('story_review')}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  className="px-6 py-2.5 bg-[#801b34] hover:bg-[#681429] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Heart className="w-4 h-4 fill-white" />
                  <span>Submit Success Story</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: COMPLETED CELEBRATION */}
          {step === 'completed' && (
            <div className="py-8 text-center space-y-5 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                  Successfully Recorded
                </span>
                <h3 className="text-2xl font-bold font-serif text-gray-900 mt-2">
                  May Your Union Be Blessed!
                </h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Congratulations to you and {effectivePartnerName}!
                  {consentToPublish
                    ? ' Your story has been queued for editorial review and will soon appear on our Success Stories.'
                    : ' Your private feedback has been recorded.'}
                </p>
              </div>

              {hideProfiles && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-[#801b34] text-left">
                  <span className="font-bold block">✓ Profiles Archived & Hidden:</span>
                  <span className="text-[11px] text-gray-600">
                    Both profiles are now paused from matchmaking searches. You can still access your dashboard and message archive anytime.
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-[#801b34] hover:bg-[#681429] text-white text-xs font-bold rounded-xl shadow cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
