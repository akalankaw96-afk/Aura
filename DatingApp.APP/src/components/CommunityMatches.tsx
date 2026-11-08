'use client';

import React from 'react';
import { communityCategories } from '../data/mockData';
import { ArrowUpRight, Users, Compass, MapPin } from 'lucide-react';

interface CommunityMatchesProps {
  onSelectCategory: (category: string) => void;
}

export const CommunityMatches: React.FC<CommunityMatchesProps> = ({ onSelectCategory }) => {
  const popularCities = [
    'Colombo', 'Kandy', 'Galle', 'Gampaha', 'Kurunegala', 'Negombo', 'Melbourne / Sydney', 'London (UK)', 'Toronto (Canada)', 'USA'
  ];

  const popularCommunities = [
    'Buddhist', 'Christian / Catholic', 'Hindu', 'Islamic'
  ];

  return (
    <section id="communities" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-[#801b34] text-xs font-bold uppercase tracking-wider mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>Communities & Professions</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 font-serif mb-2">
              Find matches in your community
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Connect with partners whose educational pedigree, career vision, and lifestyle harmonize with yours.
            </p>
          </div>

          <div className="mt-3 md:mt-0">
            <button
              onClick={() => onSelectCategory('All')}
              className="text-xs sm:text-sm font-bold text-[#801b34] hover:text-[#651428] flex items-center gap-1 group cursor-pointer"
            >
              <span>Explore all categories</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Categories Cards Row (5 cards matching Figma screenshot) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
          {communityCategories.slice(0, 5).map((cat, idx) => (
            <div
              key={idx}
              onClick={() => onSelectCategory(cat.title)}
              className="group relative rounded-3xl overflow-hidden aspect-[4/5] bg-gray-900 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer border border-gray-100"
            >
              {/* Background image */}
              <img
                src={cat.image}
                alt={cat.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-70"
              />

              {/* Gradient mask */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

              {/* Top Tag */}
              <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                {cat.badge.split(',')[0]}
              </div>

              {/* Bottom text */}
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <h3 className="text-sm font-bold font-serif leading-snug group-hover:text-amber-300 transition-colors">
                  {cat.title}
                </h3>
                <div className="flex items-center gap-1 text-[11px] text-rose-200 mt-1 font-medium">
                  <Users className="w-3 h-3" />
                  <span>{cat.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Filter Pill Rows (as seen in screenshot) */}
        <div className="bg-[#fcf9f9] rounded-3xl p-6 sm:p-8 border border-rose-100/80">
          <div className="space-y-4">
            
            {/* By Location */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[120px] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#801b34]" />
                Top Cities:
              </span>
              {popularCities.map((c) => (
                <button
                  key={c}
                  onClick={() => onSelectCategory(c)}
                  className="text-xs bg-white hover:bg-rose-100 text-gray-700 hover:text-[#801b34] px-3 py-1.5 rounded-full border border-gray-200 transition-colors cursor-pointer"
                >
                  {c}
                </button>
              ))}
            </div>

            {/* By Faith & Community */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-rose-100">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[120px] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#801b34]" />
                Communities:
              </span>
              {popularCommunities.map((r) => (
                <button
                  key={r}
                  onClick={() => onSelectCategory(r)}
                  className="text-xs bg-white hover:bg-rose-100 text-gray-700 hover:text-[#801b34] px-3 py-1.5 rounded-full border border-gray-200 transition-colors cursor-pointer"
                >
                  {r}
                </button>
              ))}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
