'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  LogOut,
  PauseCircle,
  UserMinus,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Info
} from 'lucide-react';
import { apiService, AccountClosureStatus, SubscriptionInfo } from '../services/api';

interface AccountClosureModalProps {
  isOpen: boolean;
  subscription: SubscriptionInfo | null;
  currentStatus: AccountClosureStatus;
  onClose: () => void;
  onLoggedOut: () => void;
  onStatusChanged: (newStatus: AccountClosureStatus) => void;
}

type TabMode = 'menu' | 'logout' | 'pause' | 'deactivate' | 'delete';

export const AccountClosureModal: React.FC<AccountClosureModalProps> = ({
  isOpen,
  subscription,
  currentStatus,
  onClose,
  onLoggedOut,
  onStatusChanged,
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>('menu');

  // Logout state
  const [logoutScope, setLogoutScope] = useState<'this' | 'all'>('this');

  // Deletion state
  const [deleteReason, setDeleteReason] = useState('Found a partner offline');
  const [customDeleteReason, setCustomDeleteReason] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmOtp, setConfirmOtp] = useState('123456');
  const [stepDelete, setStepDelete] = useState<'survey' | 'warning' | 'grace_confirm' | 'done'>('survey');

  if (!isOpen) return null;

  const hasActivePaidPlan = subscription && subscription.planId !== 'free' && subscription.status === 'active';

  // 1. Handle Logout
  const handleLogout = () => {
    if (logoutScope === 'all') {
      apiService.logoutAllDevices();
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('aura_token');
        localStorage.removeItem('aura_session');
      }
    }
    onClose();
    onLoggedOut();
  };

  // 2. Handle Pause / Unpause
  const handleTogglePause = () => {
    const isCurrentlyPaused = currentStatus.status === 'paused';
    const updated = apiService.pauseProfile(!isCurrentlyPaused);
    onStatusChanged(updated);
    onClose();
  };

  // 3. Handle Deactivate
  const handleDeactivate = () => {
    const updated = apiService.deactivateAccount();
    onStatusChanged(updated);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aura_token');
      localStorage.removeItem('aura_session');
    }
    onClose();
    onLoggedOut();
  };

  // 4. Handle Schedule Deletion (Flow 5: 30-day grace period with restore on login)
  const handleConfirmDelete = () => {
    const reason = deleteReason === 'Other' ? customDeleteReason : deleteReason;
    const updated = apiService.scheduleAccountDeletion(reason, confirmOtp, 30);
    onStatusChanged(updated);
    setStepDelete('done');
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('aura_token');
        localStorage.removeItem('aura_session');
      }
      onClose();
      onLoggedOut();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-rose-100 flex flex-col max-h-[92vh]">
        
        {/* Modal Top Banner */}
        <div className="bg-[#801b34] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-serif leading-tight">
                  Account Settings & Security
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400 text-maroon-950">
                  Flow 5
                </span>
              </div>
              <p className="text-xs text-rose-200">
                Manage sessions, pause search, deactivate or delete account
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
          
          {/* MENU VIEW: 4 FLOW 5 CHOICES */}
          {activeTab === 'menu' && (
            <div className="space-y-4">
              <div className="text-center max-w-sm mx-auto space-y-1">
                <h3 className="text-lg font-bold font-serif text-gray-900">
                  What would you like to do?
                </h3>
                <p className="text-xs text-gray-500">
                  Select an account privacy or session option below.
                </p>
              </div>

              <div className="space-y-2.5">
                {/* Option 1: Log Out */}
                <button
                  type="button"
                  onClick={() => setActiveTab('logout')}
                  className="w-full p-4 rounded-2xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-between gap-4 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-gray-200 text-gray-700 flex items-center justify-center shrink-0">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Log Out</h4>
                      <p className="text-xs text-gray-500">Log out from this device or all active sessions</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700" />
                </button>

                {/* Option 2: Pause Profile */}
                <button
                  type="button"
                  onClick={() => setActiveTab('pause')}
                  className="w-full p-4 rounded-2xl border border-amber-200/80 hover:border-amber-300 bg-amber-50/40 hover:bg-amber-50 flex items-center justify-between gap-4 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 group-hover:bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                      <PauseCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900">Hide / Pause Profile</h4>
                        {currentStatus.status === 'paused' && (
                          <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                            Currently Paused
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">Invisible in search results &bull; Active chats kept</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-800" />
                </button>

                {/* Option 3: Deactivate Account */}
                <button
                  type="button"
                  onClick={() => setActiveTab('deactivate')}
                  className="w-full p-4 rounded-2xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-between gap-4 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 group-hover:bg-rose-100 text-[#801b34] flex items-center justify-center shrink-0">
                      <UserMinus className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Deactivate Account</h4>
                      <p className="text-xs text-gray-500">Temporarily hide everything &bull; Log in again to reactivate</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700" />
                </button>

                {/* Option 4: Delete Account */}
                <button
                  type="button"
                  onClick={() => {
                    setStepDelete('survey');
                    setActiveTab('delete');
                  }}
                  className="w-full p-4 rounded-2xl border border-rose-200 hover:border-rose-300 bg-rose-50/20 hover:bg-rose-50/50 flex items-center justify-between gap-4 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 group-hover:bg-rose-200 text-rose-700 flex items-center justify-center shrink-0">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-rose-800">Delete Account (PDPA)</h4>
                      <p className="text-xs text-rose-600">30-day grace period &bull; Permanent personal data wipe</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-rose-400 group-hover:text-rose-700" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: LOG OUT (THIS / ALL DEVICES) */}
          {activeTab === 'logout' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-serif text-gray-900">
                Log Out of Aura Matrimony
              </h3>
              <p className="text-xs text-gray-600">
                Select your preferred logout scope:
              </p>

              <div className="space-y-2.5">
                <label className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  logoutScope === 'this'
                    ? 'border-[#801b34] bg-rose-50/60 font-semibold text-gray-900'
                    : 'border-gray-200 text-gray-700'
                }`}>
                  <input
                    type="radio"
                    name="logoutScope"
                    checked={logoutScope === 'this'}
                    onChange={() => setLogoutScope('this')}
                    className="text-[#801b34] focus:ring-0 mt-0.5"
                  />
                  <div className="text-xs">
                    <span className="block font-bold">Log out from this browser only</span>
                    <span className="text-gray-500 text-[11px]">Keep other logged in devices (such as mobile app) active.</span>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  logoutScope === 'all'
                    ? 'border-[#801b34] bg-rose-50/60 font-semibold text-gray-900'
                    : 'border-gray-200 text-gray-700'
                }`}>
                  <input
                    type="radio"
                    name="logoutScope"
                    checked={logoutScope === 'all'}
                    onChange={() => setLogoutScope('all')}
                    className="text-[#801b34] focus:ring-0 mt-0.5"
                  />
                  <div className="text-xs">
                    <span className="block font-bold">Log out of ALL devices</span>
                    <span className="text-gray-500 text-[11px]">Invalidates all active tokens across mobile apps and web browsers.</span>
                  </div>
                </label>
              </div>

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('menu')}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-6 py-2.5 bg-[#801b34] hover:bg-[#681429] text-white text-xs font-bold rounded-xl shadow cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Confirm Log Out</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PAUSE / HIDE PROFILE */}
          {activeTab === 'pause' && (
            <div className="space-y-4 text-center max-w-md mx-auto py-2">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                <PauseCircle className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold font-serif text-gray-900">
                  {currentStatus.status === 'paused' ? 'Resume Your Profile?' : 'Pause Profile Visibility?'}
                </h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {currentStatus.status === 'paused'
                    ? 'Your profile is currently hidden from matchmaking search. Resuming will make it discoverable again to verified candidates.'
                    : 'Pausing your profile hides you from search results and featured feeds. Your existing chats, mutual connections, and match history remain completely safe and accessible.'}
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-left space-y-1.5 text-amber-900">
                <div className="font-bold">Flow 5 Behavior:</div>
                <div className="flex items-center gap-2 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Hidden from search & filters immediately</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>All candidate data & active conversations kept</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Resume anytime in 1-click</span>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('menu')}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  onClick={handleTogglePause}
                  className={`px-6 py-2.5 text-white text-xs font-bold rounded-xl shadow cursor-pointer ${
                    currentStatus.status === 'paused'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {currentStatus.status === 'paused' ? 'Resume Profile Now' : 'Pause Profile'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: DEACTIVATE ACCOUNT */}
          {activeTab === 'deactivate' && (
            <div className="space-y-4 max-w-md mx-auto py-2">
              <div className="w-14 h-14 rounded-full bg-rose-100 text-[#801b34] flex items-center justify-center mx-auto">
                <UserMinus className="w-7 h-7" />
              </div>

              <div className="text-center">
                <h3 className="text-xl font-bold font-serif text-gray-900">
                  Deactivate Your Account
                </h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Deactivation temporarily shuts down your profile visibility and signs you out.
                </p>
              </div>

              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-xs text-left space-y-2 text-[#801b34]">
                <span className="font-bold block">How Deactivation Works:</span>
                <ul className="list-disc list-inside text-[11px] space-y-1 text-gray-700">
                  <li>Your profile is completely hidden from other candidates.</li>
                  <li>No new match requests can be sent to you.</li>
                  <li><strong>Instant Reactivation:</strong> Whenever you are ready to return, simply log in with your phone or email to reactivate everything!</li>
                </ul>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('menu')}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  onClick={handleDeactivate}
                  className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                >
                  Deactivate & Log Out
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: DELETE ACCOUNT (PDPA COMPLIANT WITH GRACE PERIOD) */}
          {activeTab === 'delete' && (
            <div className="space-y-4">
              
              {/* SUB-STEP A: REASON & AUTH */}
              {stepDelete === 'survey' && (
                <div className="space-y-4">
                  <div className="text-center max-w-sm mx-auto space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-100 px-3 py-1 rounded-full">
                      PDPA Data Deletion
                    </span>
                    <h3 className="text-xl font-bold font-serif text-gray-900 mt-1">
                      Delete Account Request
                    </h3>
                    <p className="text-xs text-gray-500">
                      Please tell us why you are leaving and verify your credentials.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                      Reason for Deletion:
                    </label>
                    {[
                      'Found a partner offline / through relatives',
                      'Found a match on another platform',
                      'Privacy & confidentiality concerns',
                      'No longer looking for marriage',
                      'Other',
                    ].map((reason) => (
                      <label
                        key={reason}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          deleteReason === reason
                            ? 'border-[#801b34] bg-rose-50 text-gray-900 font-semibold'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="deleteReason"
                          value={reason}
                          checked={deleteReason === reason}
                          onChange={(e) => setDeleteReason(e.target.value)}
                          className="text-[#801b34] focus:ring-0"
                        />
                        <span>{reason}</span>
                      </label>
                    ))}
                  </div>

                  {/* Verification Input */}
                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                      Verify Security (SMS OTP or Password):
                    </label>
                    <input
                      type="text"
                      value={confirmOtp}
                      onChange={(e) => setConfirmOtp(e.target.value)}
                      placeholder="Enter SMS OTP or Password (demo: 123456)"
                      className="w-full px-3.5 py-2 text-xs font-mono border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#801b34] outline-none"
                    />
                  </div>

                  <div className="flex justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('menu')}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      &larr; Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (hasActivePaidPlan) {
                          setStepDelete('warning');
                        } else {
                          setStepDelete('grace_confirm');
                        }
                      }}
                      className="px-6 py-2.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl shadow cursor-pointer flex items-center gap-2"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* SUB-STEP B: PAID PLAN WARNING (Flow 5: "Active paid plan? -> Warning: no refund unless policy allows") */}
              {stepDelete === 'warning' && (
                <div className="space-y-4 text-center max-w-md mx-auto py-2">
                  <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-8 h-8" />
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 bg-rose-100 px-3 py-1 rounded-full">
                      Active Paid Plan Detected
                    </span>
                    <h3 className="text-xl font-bold font-serif text-gray-900 mt-2">
                      Notice: Membership Forfeiture
                    </h3>
                    <p className="text-xs text-rose-800 mt-1 font-semibold">
                      You currently have an active {subscription?.planName} subscription.
                    </p>
                  </div>

                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-left space-y-2 text-rose-900">
                    <span className="font-bold block">Important Flow 5 Policy Notice:</span>
                    <p className="text-[11px] leading-relaxed">
                      Deleting your account immediately terminates all active VIP and Premium benefits. In accordance with platform terms, <strong>no automatic refund is issued upon voluntary deletion</strong> unless an approved refund request has been submitted under our 7-day satisfaction policy.
                    </p>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setStepDelete('survey')}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      &larr; Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStepDelete('grace_confirm')}
                      className="px-6 py-2.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                    >
                      I Understand &bull; Proceed
                    </button>
                  </div>
                </div>
              )}

              {/* SUB-STEP C: 30-DAY GRACE PERIOD CONFIRMATION */}
              {stepDelete === 'grace_confirm' && (
                <div className="space-y-4 max-w-md mx-auto py-2 text-left">
                  <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                    <Clock className="w-8 h-8" />
                  </div>

                  <div className="text-center">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                      Safety Grace Period (30 Days)
                    </span>
                    <h3 className="text-xl font-bold font-serif text-gray-900 mt-2">
                      30-Day Safe Deletion Period
                    </h3>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs space-y-2.5 text-gray-700">
                    <div className="font-bold text-gray-900">How the Grace Period Works:</div>
                    <div className="flex items-start gap-2 text-[11px]">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold">1</span>
                      <span>Your profile is <strong>hidden immediately</strong> from all searches and public view.</span>
                    </div>
                    <div className="flex items-start gap-2 text-[11px]">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold">2</span>
                      <span><strong>Changed your mind?</strong> Simply log back in within 30 days to instantly restore your account and all history!</span>
                    </div>
                    <div className="flex items-start gap-2 text-[11px]">
                      <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center shrink-0 font-bold">3</span>
                      <span>If you do not log in within 30 days, all profile photos, family details, and messages will be permanently deleted under Sri Lanka PDPA regulations (payment records kept for legal audits).</span>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setStepDelete('survey')}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Cancel & Keep Account
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      className="px-6 py-2.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                    >
                      Confirm Scheduled Deletion
                    </button>
                  </div>
                </div>
              )}

              {/* SUB-STEP D: DELETED CONFIRMATION */}
              {stepDelete === 'done' && (
                <div className="py-8 text-center space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h3 className="text-xl font-bold font-serif text-gray-900">
                    Account Scheduled for Deletion
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Your profile is now hidden. You have 30 days to log back in if you wish to restore your account. Logging you out now...
                  </p>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
