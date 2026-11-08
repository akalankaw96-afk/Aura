'use client';

import React, { useState } from 'react';
import { faqs } from '../data/mockData';
import { HelpCircle, PhoneCall, MessageCircle, ChevronDown, Clock, ShieldCheck, Mail } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('f1');

  const toggleAccordion = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Support Box */}
          <div className="lg:col-span-5 bg-gradient-to-br from-rose-50/70 via-rose-50/30 to-amber-50/40 rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#801b34] text-white flex items-center justify-center mb-6 shadow-md">
              <HelpCircle className="w-6 h-6" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900 font-serif mb-2">
              Questions? Speak to our team
            </h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              We understand matrimonial decisions require utmost care, family reassurance, and discretion. Our dedicated relationship advisors are here to assist you.
            </p>

            <div className="space-y-4 mb-8">
              <div className="bg-white rounded-xl p-4 border border-rose-100/80 shadow-xs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Customer Hotline (Sri Lanka)</p>
                  <p className="text-sm font-bold text-gray-900">+94 11 7 890 120 / +94 77 123 4567</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-rose-100/80 shadow-xs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">WhatsApp Support Desk</p>
                  <p className="text-sm font-bold text-gray-900">+94 77 889 9001 (24/7 Chat)</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-rose-100/80 shadow-xs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-rose-50 text-[#801b34] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Office Advisory Hours</p>
                  <p className="text-sm font-bold text-gray-900">Mon - Sat: 8:30 AM – 7:00 PM (IST)</p>
                </div>
              </div>
            </div>

            <a
              href="https://wa.me/94778899001"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#801b34] hover:bg-[#681429] text-white font-semibold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat With Matrimonial Advisor</span>
            </a>
          </div>

          {/* Right FAQs Accordion */}
          <div className="lg:col-span-7">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-[#801b34] text-xs font-semibold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Frequently Asked Questions</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 font-serif">
                Everything you need to know
              </h2>
            </div>

            <div className="space-y-3.5">
              {faqs.map((faq) => {
                const isOpen = openId === faq.id;

                return (
                  <div
                    key={faq.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isOpen
                        ? 'border-rose-300 bg-rose-50/30 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <button
                      onClick={() => toggleAccordion(faq.id)}
                      className="w-full py-4 sm:py-5 px-5 sm:px-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <span className="font-semibold text-gray-900 text-sm sm:text-base leading-snug">
                        {faq.question}
                      </span>
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                          isOpen ? 'bg-[#801b34] text-white rotate-180' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-rose-100/60">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

