"use client";

import React, { useEffect, useState } from "react";
import { Verify, CloseCircle, DocumentText } from "iconsax-react";
import { AdminShell } from "@/components/layout/AdminShell";
import { adminApi, PendingProfile } from "@/services/adminApi";
import { useToast } from "@/components/ui/Toast";

export default function ModerationPage() {
  const toast = useToast();
  const [profiles, setProfiles] = useState<PendingProfile[]>([]);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; profile: PendingProfile | null; reason: string }>({
    open: false,
    profile: null,
    reason: "",
  });

  useEffect(() => {
    adminApi.getPendingProfiles().then(setProfiles);
  }, []);

  const handleApprove = async (profile: PendingProfile) => {
    const ok = await adminApi.approveProfile(profile.id);
    if (ok) {
      setProfiles((prev) => prev.map((p) => (p.id === profile.id ? { ...p, status: "approved" } : p)));
      toast.success("Profile Approved", `${profile.name} (${profile.code}) verified successfully.`);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.profile) return;
    const reason = rejectModal.reason || "Unclear National ID image";
    const ok = await adminApi.rejectProfile(rejectModal.profile.id, reason);
    if (ok) {
      const pid = rejectModal.profile.id;
      setProfiles((prev) => prev.map((p) => (p.id === pid ? { ...p, status: "rejected" } : p)));
      toast.info("Profile Rejected", `${rejectModal.profile.name} declined with reason: ${reason}`);
      setRejectModal({ open: false, profile: null, reason: "" });
    }
  };

  return (
    <AdminShell
      title="Candidate Moderation Queue"
      subtitle="Verify National Identity Cards (NIC), inspect photo authenticity, and grant Verified badges."
    >
      <div className="flex flex-col gap-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((p) => (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col justify-between transition-all gap-4 ${
                p.status === "approved"
                  ? "border-emerald-300 bg-emerald-50/20"
                  : p.status === "rejected"
                  ? "border-rose-300 opacity-60"
                  : "border-slate-200"
              }`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.profilePhotoUrl}
                      alt={p.name}
                      className="h-14 w-14 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {p.code} · {p.age} yrs · {p.gender}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                      p.status === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : p.status === "rejected"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 text-xs flex flex-col gap-1 text-slate-600">
                  <p><strong>Profession:</strong> {p.profession}</p>
                  <p><strong>Location:</strong> {p.location}</p>
                  <p><strong>Religion:</strong> {p.religion}</p>
                  <p><strong>NIC Number:</strong> <span className="font-mono font-bold text-slate-900">{p.nicNumber}</span></p>
                  <p className="italic text-slate-500 line-clamp-2 pt-1">"{p.bio}"</p>
                </div>

                {/* Simulated National ID Document Preview */}
                <div className="rounded-xl border border-slate-800 p-2.5 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DocumentText size={18} color="currentColor" className="text-emerald-400" />
                    <span className="text-xs font-mono font-bold">NIC_FRONT_DOC.PDF</span>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-emerald-300 font-bold px-2 py-0.5 rounded">
                    98% Face Match
                  </span>
                </div>
              </div>

              {p.status === "pending" ? (
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setRejectModal({ open: true, profile: p, reason: "" })}
                    className="flex-1 flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <CloseCircle size={16} color="currentColor" /> Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(p)}
                    className="flex-1 flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition-colors"
                  >
                    <Verify size={16} color="currentColor" /> Approve & Verify
                  </button>
                </div>
              ) : (
                <div className="text-center text-xs font-semibold text-slate-400 pt-2 border-t border-slate-100">
                  Moderation Completed
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Reject Reason Modal */}
        {rejectModal.open && rejectModal.profile && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4">
              <h3 className="font-bold text-slate-900 text-base">Reject Candidate Profile</h3>
              <p className="text-xs text-slate-500">
                Please provide the reason for declining <strong>{rejectModal.profile.name}</strong>. The applicant will be notified to correct these details.
              </p>
              <textarea
                rows={3}
                value={rejectModal.reason}
                onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g., Unclear National ID document, photo obscured, or inconsistent age."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModal({ open: false, profile: null, reason: "" })}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

