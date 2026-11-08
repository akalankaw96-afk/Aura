'use client';

import React, { useState } from 'react';
import { Profile } from '../types';
import { ShieldCheck, Heart, MapPin, GraduationCap, Briefcase, ChevronRight, Sparkles, Check, Search } from 'lucide-react';
import { FloatingHeartsOverlay } from './DecorativeHeartBackground';

interface FeaturedProfilesProps {
  profiles: Profile[];
  onSelectProfile: (profile: Profile) => void;
  onConnectProfile: (profile: Profile) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export const FeaturedProfiles: React.FC<FeaturedProfilesProps> = ({
  profiles,
  onSelectProfile,
  onConnectProfile,
  activeFilter,
  onFilterChange,
}) => {
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [connectedMap, setConnectedMap] = useState<Record<string, boolean>>({});

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleConnect = (profile: Profile, e: React.MouseEvent) => {
    e.stopPropagation();
    setConnectedMap((prev) => ({ ...prev, [profile.id]: true }));
    onConnectProfile(profile);
  };

  const filterTabs = [
    { id: 'All', label: 'All Profiles' },
    { id: 'female', label: 'Brides (Women)' },
    { id: 'male', label: 'Grooms (Men)' },
    { id: 'Doctor', label: 'Doctors' },
    { id: 'Engineer', label: 'Engineers' },
    { id: 'IT', label: 'Software / IT' },
    { id: 'Finance', label: 'Chartered Accountants' },
  ];

  const filteredProfiles = profiles.filter((p) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'female' || activeFilter === 'male') return p.gender === activeFilter;
    if (activeFilter === 'Doctor' || activeFilter === 'Engineer' || activeFilter === 'IT' || activeFilter === 'Finance') {
      return p.professionCategory === activeFilter;
    }
    return true;
  });

  return (
    <section id="featured-profiles" className="py-16 bg-[#faf7f7] border-t border-b border-rose-100/60 relative overflow-hidden">
      {/* Floating background hearts */}
      <FloatingHeartsOverlay variant="light" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header with Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-[#801b34] text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Verified Singles</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 font-serif">
              Recently added profiles
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Find your ideal match from recently joined verified professional profiles
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onFilterChange(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  activeFilter === tab.id
                    ? 'bg-[#801b34] text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-rose-50 hover:text-[#801b34] border border-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Profiles Grid or No Results / Widen Filters (Flow 2) */}
        {filteredProfiles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-rose-200 p-8 max-w-lg mx-auto shadow-xs">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-[#801b34] flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 font-serif">No profiles found</h3>
            <p className="text-xs text-gray-500 mt-1 mb-5 leading-relaxed">
              No verified candidates currently match this filter. Try widening your criteria to view more compatible matches.
            </p>
            <button
              onClick={() => onFilterChange('All')}
              className="px-6 py-2.5 rounded-full bg-[#801b34] text-white text-xs font-bold shadow-md hover:bg-[#681429] transition-all cursor-pointer"
            >
              Widen Filters & Show All
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProfiles.map((profile) => {
            const isFav = !!favorites[profile.id];
            const isConnected = !!connectedMap[profile.id];

            return (
              <div
                key={profile.id}
                onClick={() => onSelectProfile(profile)}
                className="bg-white rounded-3xl overflow-hidden border border-gray-200/90 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  {/* Image container */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                    <img
                      src={profile.photoUrl}
                      alt={profile.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Bottom gradient on image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                    {/* Verified badge top left */}
                    {profile.verified && (
                      <div className="absolute top-3 left-3 bg-emerald-600/95 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>VERIFIED</span>
                      </div>
                    )}

                    {/* Favorite toggle top right */}
                    <button
                      onClick={(e) => toggleFavorite(profile.id, e)}
                      aria-label="Add to favorites"
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-gray-700 hover:text-rose-600 hover:bg-white transition-colors shadow-sm cursor-pointer"
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          isFav ? 'text-rose-600 fill-rose-600' : 'text-gray-500'
                        }`}
                      />
                    </button>

                    {/* Profile Code & Category badge overlay on image */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs">
                      <span className="font-mono bg-black/50 px-2 py-0.5 rounded text-[11px]">
                        {profile.code}
                      </span>
                      <span className="bg-[#801b34]/95 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide">
                        {profile.professionCategory}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 sm:p-5">
                    
                    {/* Name */}
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-[#801b34] transition-colors font-serif leading-snug mb-1">
                      {profile.name}
                    </h3>

                    {/* Specs Line */}
                    <p className="text-xs font-semibold text-[#801b34] mb-3 flex items-center gap-1.5">
                      <span>{profile.age} Yrs</span>
                      <span>•</span>
                      <span>{profile.height}</span>
                      <span>•</span>
                      <span className="truncate">{profile.religion}</span>
                    </p>

                    {/* Key Details */}
                    <div className="space-y-1.5 text-xs text-gray-600 mb-2">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-800 truncate">
                          {profile.profession}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{profile.education}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{profile.location}, {profile.country}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="px-4 pb-4 pt-1 border-t border-gray-100 grid grid-cols-2 gap-2">
                  <button
                    onClick={(e) => handleConnect(profile, e)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                      isConnected
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-[#801b34] hover:bg-[#681429] text-white shadow-xs'
                    }`}
                  >
                    {isConnected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Connected</span>
                      </>
                    ) : (
                      <>
                        <Heart className="w-3.5 h-3.5" />
                        <span>Connect</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onSelectProfile(profile)}
                    className="py-2 px-2.5 rounded-xl text-xs font-semibold border border-rose-200 text-[#801b34] hover:bg-rose-50 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        )}

        {/* View More Profiles Centered Button */}
        <div className="mt-12 text-center">
          <button
            onClick={() => onFilterChange('All')}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full border-2 border-[#801b34] text-[#801b34] hover:bg-[#801b34] hover:text-white font-bold text-xs sm:text-sm transition-all duration-200 shadow-xs hover:shadow group cursor-pointer"
          >
            <span>View All Profiles</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </section>
  );
};
