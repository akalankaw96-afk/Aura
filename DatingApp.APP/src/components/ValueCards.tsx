'use client';

import React from 'react';
import { ShieldCheck, Lock, Sparkles, CheckCircle2, Star, HeartHandshake } from 'lucide-react';

export const ValueCards: React.FC = () => {
  return (
    <section className="py-12 bg-[#fffdfd] relative -mt-6 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Card 1: Verified Family Trust & Rating */}
          <div className="rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-rose-50/90 to-pink-50/40 border border-rose-200/70 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-xs font-bold text-gray-700 ml-1.5">4.9 / 5</span>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-[#801b34] border border-rose-200 uppercase tracking-wider">
                  Trusted Families
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2 font-serif">
                Approved by Respected Families
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
                &ldquo;We found our daughter&apos;s life partner through Aura. The verification and dignity given to our family traditions made all the difference.&rdquo;
              </p>
            </div>

            <div className="pt-3 border-t border-rose-200/50 flex items-center justify-between text-xs text-gray-500">
              <span className="font-semibold text-gray-700">Mr. & Mrs. Weerasinghe</span>
              <span className="text-[#801b34] font-medium">Colombo 07</span>
            </div>
          </div>

          {/* Card 2: 100% ID & Education Verification */}
          <div className="rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-amber-50/90 to-yellow-50/40 border border-amber-200/70 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white text-emerald-700 flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                  100% Authenticated
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2 font-serif">
                Government ID & Degree Verified
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
                Every member is screened with National Identity Cards (NIC/Passport) and professional credentials (SLMC, IESL, CA Sri Lanka, CIMA).
              </p>
            </div>

            <div className="pt-3 border-t border-amber-200/50 space-y-1.5 text-xs text-gray-700 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero fake profiles guarantee</span>
              </div>
            </div>
          </div>

          {/* Card 3: 94% Compatibility Success */}
          <div className="rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-rose-50/90 to-amber-50/50 border border-rose-200/70 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white text-[#801b34] flex items-center justify-center shadow-xs">
                  <Sparkles className="w-6 h-6 text-[#801b34]" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-[#801b34] border border-rose-200 uppercase tracking-wider">
                  High Success
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2 font-serif">
                94% Compatibility Match Rate
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
                Matching algorithms engineered specifically for professionals — aligning educational parity, cultural background, family ethics, and astrology.
              </p>
            </div>

            <div className="pt-3 border-t border-rose-200/50 flex items-center justify-between text-xs text-gray-700 font-medium">
              <div className="flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-[#801b34]" />
                <span>Over 12,000+ weddings celebrated</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
