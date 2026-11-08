'use client';

import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, Heart, Sparkles, ArrowRight, Lock } from 'lucide-react';
import { FloatingHeartsOverlay } from './DecorativeHeartBackground';

interface CtaRegisterBannerProps {
  onSuccessRegister: (data: any) => void;
}

export const CtaRegisterBanner: React.FC<CtaRegisterBannerProps> = ({ onSuccessRegister }) => {
  const [profileFor, setProfileFor] = useState('Myself');
  const [gender, setGender] = useState('female');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    onSuccessRegister({ profileFor, gender, fullName, mobile, email });
  };

  return (
    <section id="register-banner" className="py-16 bg-[#f7f2f3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-gradient-to-br from-[#801b34] via-[#75162e] to-[#5b0f22] rounded-3xl p-6 sm:p-10 lg:p-14 shadow-2xl relative overflow-hidden border border-rose-900/40 text-white">
          
          {/* Floating background hearts */}
          <FloatingHeartsOverlay variant="dark" />

          {/* Decorative glowing circles */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            
            {/* Left Column: Value proposition */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-rose-200 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Begin Your Sacred Journey</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif leading-tight">
                Ready to meet your <br />
                <span className="text-amber-300 italic">ideal life partner?</span>
              </h2>

              <p className="text-rose-100 text-sm sm:text-base leading-relaxed max-w-lg">
                Join thousands of doctors, engineers, corporate executives, and overseas professionals who chose Aura for authentic family matchmaking.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  '100% Verified profiles with National ID & Qualifications',
                  'Family-managed or candidate-managed profiles supported',
                  'Complete privacy filters for photos and contact info',
                  'Complimentary Porondam matching and matrimonial advice'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs sm:text-sm text-rose-100">
                    <div className="w-5 h-5 rounded-full bg-amber-400 text-[#4a0e1c] flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center gap-4 text-xs text-rose-200">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>ISO & Data Privacy Compliant</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-300" />
                  <span>256-bit Encrypted</span>
                </div>
              </div>
            </div>

            {/* Right Column: Quick Registration Form Card */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-gray-900 shadow-2xl border border-rose-100">
                
                {submitted ? (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold font-serif text-gray-900">
                      Registration Initiated!
                    </h3>
                    <p className="text-sm text-gray-600 max-w-sm mx-auto">
                      Welcome, <span className="font-semibold text-gray-800">{fullName || 'Candidate'}</span>! An SMS verification code has been dispatched to your mobile.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="text-xs text-[#801b34] font-semibold underline"
                    >
                      Create another profile
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="text-left mb-2">
                      <h3 className="text-xl sm:text-2xl font-bold font-serif text-gray-900">
                        Create your free profile
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Takes less than 2 minutes. No credit card required.
                      </p>
                    </div>

                    {/* Profile For */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Creating Profile For
                      </label>
                      <select
                        value={profileFor}
                        onChange={(e) => setProfileFor(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#801b34]"
                      >
                        <option value="Myself">Myself</option>
                        <option value="Son">My Son</option>
                        <option value="Daughter">My Daughter</option>
                        <option value="Brother">My Brother</option>
                        <option value="Sister">My Sister</option>
                        <option value="Relative/Friend">A Relative or Friend</option>
                      </select>
                    </div>

                    {/* Gender & Full Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Candidate Gender
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setGender('female')}
                            className={`py-2 text-xs font-semibold rounded-xl border transition-colors ${
                              gender === 'female'
                                ? 'bg-[#801b34] text-white border-[#801b34]'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            Female
                          </button>
                          <button
                            type="button"
                            onClick={() => setGender('male')}
                            className={`py-2 text-xs font-semibold rounded-xl border transition-colors ${
                              gender === 'male'
                                ? 'bg-[#801b34] text-white border-[#801b34]'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            Male
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Candidate Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Dr. Kasun Silva"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#801b34]"
                        />
                      </div>
                    </div>

                    {/* Mobile & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Mobile Number
                        </label>
                        <input
                          type="tel"
                          required
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          placeholder="+94 77 123 4567"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#801b34]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#801b34]"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Create Account Password
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#801b34]"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full bg-[#801b34] hover:bg-[#681429] text-white font-bold py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 mt-4 cursor-pointer"
                    >
                      <span>Register Free Profile</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <p className="text-[11px] text-gray-500 text-center leading-tight">
                      By registering, you agree to our Terms of Use and Privacy Policy. Your details remain confidential.
                    </p>
                  </form>
                )}

              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

