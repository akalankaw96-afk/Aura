'use client';

import React, { useState } from 'react';
import { X, Heart, ShieldCheck, Check, Sparkles, Lock, Mail, Phone, User } from 'lucide-react';

interface RegisterSignInModalProps {
  isOpen: boolean;
  initialMode: 'register' | 'signin';
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export const RegisterSignInModal: React.FC<RegisterSignInModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'register' | 'signin'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileFor, setProfileFor] = useState('Myself');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      onSuccess(email);
      setSubmitted(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-rose-100 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-[#801b34] to-[#6d142b] p-6 text-white text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md mx-auto flex items-center justify-center mb-3">
            <Heart className="w-6 h-6 text-amber-300 fill-amber-300" />
          </div>
          <h3 className="text-xl font-bold font-serif">
            {mode === 'register' ? 'Join Aura Matrimony' : 'Welcome Back'}
          </h3>
          <p className="text-xs text-rose-200 mt-1">
            {mode === 'register'
              ? 'Connect with verified Sri Lankan & global professionals'
              : 'Log in to your confidential account'}
          </p>

          {/* Tab Switcher */}
          <div className="flex bg-black/20 p-1 rounded-xl mt-4 max-w-xs mx-auto">
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                mode === 'register' ? 'bg-white text-[#801b34] shadow-sm' : 'text-rose-100 hover:text-white'
              }`}
            >
              Register Free
            </button>
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                mode === 'signin' ? 'bg-white text-[#801b34] shadow-sm' : 'text-rose-100 hover:text-white'
              }`}
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 font-serif">
                {mode === 'register' ? 'Account Created Successfully!' : 'Sign In Successful!'}
              </h4>
              <p className="text-xs text-gray-600">
                Redirecting you to your verified dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Creating Profile For
                    </label>
                    <select
                      value={profileFor}
                      onChange={(e) => setProfileFor(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#801b34]"
                    >
                      <option value="Myself">Myself</option>
                      <option value="Son">My Son</option>
                      <option value="Daughter">My Daughter</option>
                      <option value="Brother">My Brother</option>
                      <option value="Sister">My Sister</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Candidate Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Dilshan Senanayake"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#801b34]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+94 77 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#801b34]"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#801b34]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-600">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <a href="#" className="text-[11px] text-[#801b34] hover:underline font-medium">
                      Forgot Password?
                    </a>
                  )}
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#801b34]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#801b34] hover:bg-[#681429] text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all duration-200 text-sm mt-4 cursor-pointer"
              >
                {mode === 'register' ? 'Register Free Profile' : 'Sign In'}
              </button>

              <div className="pt-2 text-center text-xs text-gray-500 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Strict confidentiality guaranteed</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

