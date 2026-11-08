'use client';

import React from 'react';
import { pricingPlans } from '../data/mockData';
import { Check, Sparkles, Shield, Crown } from 'lucide-react';

interface PricingPlansProps {
  onSelectPlan: (planId: string) => void;
}

export const PricingPlans: React.FC<PricingPlansProps> = ({ onSelectPlan }) => {
  return (
    <section id="pricing" className="py-20 bg-[#faf6f6] border-t border-b border-rose-100/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-100 text-[#801b34] text-xs font-semibold uppercase tracking-wider mb-3">
            <Crown className="w-3.5 h-3.5" />
            <span>Transparent & Honorable Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 font-serif mb-3">
            Plans for every family
          </h2>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            Choose the ideal membership tier designed for genuine matrimonial search with maximum privacy and verified trust.
          </p>
        </div>

        {/* Pricing Cards Grid (3 columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {pricingPlans.map((plan) => {
            const isPopular = plan.popular;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl transition-all duration-300 flex flex-col justify-between relative ${
                  isPopular
                    ? 'bg-[#801b34] text-white shadow-2xl ring-4 ring-[#801b34]/20 scale-105 z-10 p-7 sm:p-9'
                    : 'bg-white text-gray-900 border border-gray-200/90 shadow-md hover:shadow-xl p-6 sm:p-8'
                }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-[#4a0e1c] text-xs font-extrabold uppercase px-4 py-1.5 rounded-full shadow-md tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Most Popular Choice</span>
                  </div>
                )}

                <div>
                  {/* Plan Name & Tag */}
                  <div className="mb-4">
                    <h3 className={`text-xl font-bold font-serif ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-xs mt-1 leading-relaxed ${isPopular ? 'text-rose-200' : 'text-gray-500'}`}>
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6 pb-6 border-b border-gray-200/40">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl sm:text-4xl font-extrabold font-serif ${isPopular ? 'text-white' : 'text-[#801b34]'}`}>
                        {plan.price}
                      </span>
                    </div>
                    <span className={`text-xs font-medium block mt-1 ${isPopular ? 'text-rose-200' : 'text-gray-500'}`}>
                      {plan.period}
                    </span>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-3.5 mb-8">
                    <p className={`text-xs font-bold uppercase tracking-wider ${isPopular ? 'text-amber-300' : 'text-gray-400'}`}>
                      What&apos;s Included:
                    </p>
                    {plan.features.map((feat, fi) => (
                      <div key={fi} className="flex items-start gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            isPopular ? 'bg-amber-400/20 text-amber-300' : 'bg-rose-100 text-[#801b34]'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span className={`text-xs sm:text-sm leading-relaxed ${isPopular ? 'text-rose-100' : 'text-gray-700'}`}>
                          {feat}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan CTA Button */}
                <div>
                  <button
                    onClick={() => onSelectPlan(plan.id)}
                    className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
                      isPopular
                        ? 'bg-amber-400 hover:bg-amber-300 text-maroon-950 hover:shadow-lg transform hover:-translate-y-0.5'
                        : 'bg-[#801b34] hover:bg-[#681429] text-white'
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                  </button>
                  <p className={`text-[11px] text-center mt-2.5 ${isPopular ? 'text-rose-200' : 'text-gray-400'}`}>
                    Secure payment • Instant activation
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Guarantee Banner below pricing */}
        <div className="mt-14 max-w-4xl mx-auto bg-white rounded-2xl p-5 border border-rose-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">100% Satisfaction & Verification Guarantee</h4>
              <p className="text-xs text-gray-600">Every upgraded member undergoes manual identity and qualification check.</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#801b34] whitespace-nowrap bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200">
            No Automated Subscriptions
          </span>
        </div>

      </div>
    </section>
  );
};

