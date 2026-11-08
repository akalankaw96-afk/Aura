'use client';

import React from 'react';
import { Heart, ShieldCheck, Mail, Phone, MapPin, Globe, Lock, ArrowUp } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#121215] text-gray-400 text-sm border-t border-gray-800">
      
      {/* Top Banner inside footer */}
      <div className="border-b border-gray-800/80 py-8 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 via-rose-300 to-amber-200 flex items-center justify-center">
              <Heart className="w-5 h-5 text-[#801b34] fill-[#801b34]" />
            </div>
            <div>
              <span className="text-xl font-bold text-white font-serif tracking-tight">
                Aura Matrimony
              </span>
              <p className="text-xs text-gray-400">Sri Lanka&apos;s Highest Rated Matchmaker For Professionals</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-gray-300">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              100% ID Verified
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-400" />
              Privacy Shield Protected
            </span>
            <button
              onClick={scrollToTop}
              className="w-9 h-9 rounded-full bg-gray-800 hover:bg-[#801b34] text-white flex items-center justify-center transition-colors"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Col 1: Brand & Bio */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-white text-base font-bold font-serif">About Aura Matrimony</h4>
            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              Founded on the pillars of honor, family integrity, and professional compatibility. We bring together distinguished singles from healthcare, engineering, information technology, academia, and global commerce.
            </p>
            <div className="space-y-2 text-xs text-gray-300 pt-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#d44969]" />
                <span>Level 24, World Trade Centre, Echelon Square, Colombo 01</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#d44969]" />
                <span>+94 11 7 890 120 (Mon - Sat 8:30 AM - 7:00 PM)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#d44969]" />
                <span>advisory@auramatrimony.lk</span>
              </div>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#search-section" className="hover:text-amber-300 transition-colors">Find Matches</a></li>
              <li><a href="#featured-profiles" className="hover:text-amber-300 transition-colors">Recent Profiles</a></li>
              <li><a href="#stories" className="hover:text-amber-300 transition-colors">Success Stories</a></li>
              <li><a href="#pricing" className="hover:text-amber-300 transition-colors">Membership Plans</a></li>
              <li><a href="#faq" className="hover:text-amber-300 transition-colors">Astrology & Porondam</a></li>
              <li><a href="#faq" className="hover:text-amber-300 transition-colors">Frequently Asked Questions</a></li>
            </ul>
          </div>

          {/* Col 3: Popular Professions */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Professions
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#communities" className="hover:text-amber-300 transition-colors">Doctors & Medical (MBBS)</a></li>
              <li><a href="#communities" className="hover:text-amber-300 transition-colors">Software Architects & Tech</a></li>
              <li><a href="#communities" className="hover:text-amber-300 transition-colors">Chartered Accountants (CA/CIMA)</a></li>
              <li><a href="#communities" className="hover:text-amber-300 transition-colors">Civil & Structural Engineers</a></li>
              <li><a href="#communities" className="hover:text-amber-300 transition-colors">Attorneys & Legal Scholars</a></li>
              <li><a href="#communities" className="hover:text-amber-300 transition-colors">Expat Professionals (UK/Aus/USA)</a></li>
            </ul>
          </div>

          {/* Col 4: Trust & Legal */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Trust & Legal
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#" className="hover:text-amber-300 transition-colors">Verification Process</a></li>
              <li><a href="#" className="hover:text-amber-300 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-amber-300 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-amber-300 transition-colors">Community Guidelines</a></li>
              <li><a href="#" className="hover:text-amber-300 transition-colors">Fraud Prevention & Safety</a></li>
              <li><a href="#" className="hover:text-amber-300 transition-colors">Report a Profile</a></li>
            </ul>
          </div>

        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-gray-800/80 py-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Aura Matrimony (Pvt) Ltd. All rights reserved.</p>
          <p className="text-gray-400">Crafted with care for Sri Lankan & Global Professionals</p>
        </div>
      </div>

    </footer>
  );
};

