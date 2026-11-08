'use client';

import React, { useState } from 'react';
import { Search, ShieldCheck, Heart, User, CheckCircle2, Award, Sparkles, MapPin, Briefcase, ChevronRight } from 'lucide-react';
import { mockProfiles } from '../data/mockData';
import { Profile } from '../types';
import { FloatingHeartsOverlay } from './DecorativeHeartBackground';

interface HeroSectionProps {
  onSearch: (filters: { gender: string; ageFrom: string; ageTo: string; profession: string; location: string }) => void;
  onFilterProfession: (profession: string) => void;
  onSelectProfile?: (profile: Profile) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSearch, onFilterProfession, onSelectProfile }) => {
  const [gender, setGender] = useState('female');
  const [ageFrom, setAgeFrom] = useState('22');
  const [ageTo, setAgeTo] = useState('32');
  const [profession, setProfession] = useState('All');
  const [location, setLocation] = useState('All');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ gender, ageFrom, ageTo, profession, location });
    const target = document.getElementById('featured-profiles');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const professionChips = [
    { label: 'Doctors & Medical', value: 'Doctor' },
    { label: 'Software Engineers', value: 'IT' },
    { label: 'Civil & Tech Engineers', value: 'Engineer' },
    { label: 'Chartered Accountants', value: 'Finance' },
    { label: 'Attorneys & Legal', value: 'Legal' },
    { label: 'Living Abroad (Expats)', value: 'Expats' },
  ];

  // 6 preview candidates for the hero bottom strip (matching the Figma screenshot)
  const heroCandidates = mockProfiles.slice(0, 6);

  return (
    <section className="relative bg-gradient-to-b from-[#801b34] via-[#75162e] to-[#600e23] text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Delicate floating background hearts */}
      <FloatingHeartsOverlay variant="dark" />

      {/* Decorative background glow & pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 text-center">
        
        {/* Top Trust Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-rose-200 text-xs sm:text-sm font-medium mb-5 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>SRI LANKA&apos;S #1 TRUSTED PROFESSIONAL MATCHMAKING NETWORK</span>
        </div>

        {/* Main Hero Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4 font-serif max-w-4xl mx-auto leading-tight">
          Find a life partner your <span className="text-amber-300 italic">whole family</span> can trust
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base lg:text-lg text-rose-100 max-w-2xl mx-auto mb-9 font-normal leading-relaxed">
          Over 50,000+ verified profiles of doctors, engineers, software architects, chartered accountants, and corporate leaders worldwide.
        </p>

        {/* Quick Search Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-rose-100/50 max-w-5xl mx-auto text-gray-800">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
            
            {/* Looking for */}
            <div className="text-left">
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                I am looking for
              </label>
              <div className="relative">
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-xs sm:text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#801b34] focus:bg-white appearance-none cursor-pointer"
                >
                  <option value="female">A Bride (Woman)</option>
                  <option value="male">A Groom (Man)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <User className="w-4 h-4 text-[#801b34]" />
                </div>
              </div>
            </div>

            {/* Age Range */}
            <div className="text-left">
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                Age Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={ageFrom}
                  onChange={(e) => setAgeFrom(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-3 text-xs sm:text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#801b34] focus:bg-white appearance-none cursor-pointer"
                >
                  {[20, 22, 24, 26, 28, 30, 32, 35].map((a) => (
                    <option key={a} value={a}>{a} yrs</option>
                  ))}
                </select>
                <select
                  value={ageTo}
                  onChange={(e) => setAgeTo(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-3 text-xs sm:text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#801b34] focus:bg-white appearance-none cursor-pointer"
                >
                  {[26, 28, 30, 32, 35, 38, 42, 45].map((a) => (
                    <option key={a} value={a}>{a} yrs</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Profession */}
            <div className="text-left">
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                Profession
              </label>
              <div className="relative">
                <select
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-xs sm:text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#801b34] focus:bg-white appearance-none cursor-pointer"
                >
                  <option value="All">All Professions</option>
                  <option value="Doctor">Doctor / Medical</option>
                  <option value="IT">Software / IT</option>
                  <option value="Engineer">Engineer (Civil/Mech)</option>
                  <option value="Finance">Chartered Accountant</option>
                  <option value="Legal">Attorney / Legal</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <Briefcase className="w-4 h-4 text-[#801b34]" />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="text-left">
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                Location
              </label>
              <div className="relative">
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-xs sm:text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#801b34] focus:bg-white appearance-none cursor-pointer"
                >
                  <option value="All">All Locations</option>
                  <option value="Colombo">Colombo</option>
                  <option value="Kandy">Kandy</option>
                  <option value="Galle">Galle</option>
                  <option value="Australia">Australia</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="USA">United States</option>
                  <option value="Canada">Canada</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <MapPin className="w-4 h-4 text-[#801b34]" />
                </div>
              </div>
            </div>

            {/* Search Button */}
            <div>
              <button
                type="submit"
                className="w-full bg-[#801b34] hover:bg-[#681429] text-white font-bold py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
              >
                <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Search Profiles</span>
              </button>
            </div>
          </form>

          {/* Quick profession pills under the search bar */}
          <div className="mt-4 pt-3.5 border-t border-gray-100 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-1">
              Popular Searches:
            </span>
            {professionChips.map((chip) => (
              <button
                key={chip.label}
                onClick={() => onFilterProfession(chip.value)}
                className="text-xs bg-rose-50 hover:bg-rose-100 text-[#801b34] px-3 py-1 rounded-full font-medium transition-colors border border-rose-200/60 cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6 Preview Profile Cards at Bottom of Hero (Matching the Figma Screenshot) */}
        <div className="mt-10 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-200 mb-3">
            Recently Joined Verified Professionals:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 max-w-5xl mx-auto">
            {heroCandidates.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectProfile && onSelectProfile(c)}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl p-2.5 border border-white/20 text-left transition-all duration-200 hover:scale-105 cursor-pointer flex items-center gap-2.5 group"
              >
                <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 border border-amber-300/40">
                  <img src={c.photoUrl} alt={c.name} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border border-white rounded-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate font-serif group-hover:text-amber-300">
                    {c.name}
                  </h4>
                  <p className="text-[10px] text-rose-200 truncate font-medium">
                    {c.professionCategory} • {c.age} Yrs
                  </p>
                  <p className="text-[10px] text-gray-300 truncate">
                    {c.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
