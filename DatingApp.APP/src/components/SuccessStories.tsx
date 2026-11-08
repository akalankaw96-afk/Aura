'use client';

import React, { useState } from 'react';
import { successStories } from '../data/mockData';
import { Heart, Quote, ChevronLeft, ChevronRight, Calendar, MapPin, Award } from 'lucide-react';
import { FloatingHeartsOverlay } from './DecorativeHeartBackground';

export const SuccessStories: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevStory = () => {
    setCurrentIndex((prev) => (prev === 0 ? successStories.length - 1 : prev - 1));
  };

  const nextStory = () => {
    setCurrentIndex((prev) => (prev === successStories.length - 1 ? 0 : prev + 1));
  };

  const current = successStories[currentIndex];
  const sideIndex1 = (currentIndex + 1) % successStories.length;
  const sideIndex2 = (currentIndex + 2) % successStories.length;

  return (
    <section id="stories" className="py-20 bg-gradient-to-b from-white via-rose-50/30 to-white overflow-hidden relative">
      {/* Floating background hearts */}
      <FloatingHeartsOverlay variant="light" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-100 text-[#801b34] text-xs font-bold uppercase tracking-wider mb-2">
            <Heart className="w-3.5 h-3.5 fill-[#801b34]" />
            <span>Success Stories</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 font-serif mb-2">
            Trusted by 10k+ Happy Couples
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Real love stories of professionals and respected families united through Aura
          </p>
        </div>

        {/* Carousel with Side Preview Cards (Matching the Figma Mockup) */}
        <div className="relative max-w-6xl mx-auto flex items-center justify-center gap-4">
          
          {/* Left Preview Card (Hidden on mobile) */}
          <div className="hidden lg:block w-36 h-80 rounded-3xl overflow-hidden opacity-40 hover:opacity-75 transition-opacity shrink-0 shadow-md">
            <img
              src={successStories[sideIndex1].photoUrl}
              alt="Previous couple"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Main Center Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-rose-100/90 overflow-hidden max-w-4xl w-full">
            <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
              
              {/* Text Column */}
              <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-between order-2 md:order-1">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-base">★</span>
                      ))}
                      <span className="text-[11px] font-bold text-gray-500 ml-1.5">Verified Marriage</span>
                    </div>
                    <Quote className="w-7 h-7 text-rose-200" />
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 font-serif mb-3 leading-snug">
                    {current.title}
                  </h3>

                  <p className="text-gray-700 text-xs sm:text-sm leading-relaxed italic mb-6">
                    {current.quote}
                  </p>

                  <div className="space-y-1.5 mb-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#801b34]">
                      <Award className="w-3.5 h-3.5" />
                      <span>{current.professionInfo}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {current.weddingDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {current.location}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom controls & Names */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-gray-900 font-serif">
                      {current.coupleNames}
                    </h4>
                    <p className="text-[11px] text-gray-500">Aura Matrimonial Match</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={prevStory}
                      aria-label="Previous story"
                      className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-rose-50 hover:text-[#801b34] transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={nextStory}
                      aria-label="Next story"
                      className="w-9 h-9 rounded-full bg-[#801b34] text-white flex items-center justify-center hover:bg-[#681429] transition-colors shadow-xs cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Photo Column */}
              <div className="md:col-span-5 relative aspect-square md:aspect-auto min-h-[260px] order-1 md:order-2 overflow-hidden bg-rose-50">
                <img
                  src={current.photoUrl}
                  alt={current.coupleNames}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-[#801b34] shadow-xs flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-[#801b34]" />
                  <span>Story {currentIndex + 1} of {successStories.length}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Right Preview Card (Hidden on mobile) */}
          <div className="hidden lg:block w-36 h-80 rounded-3xl overflow-hidden opacity-40 hover:opacity-75 transition-opacity shrink-0 shadow-md">
            <img
              src={successStories[sideIndex2].photoUrl}
              alt="Next couple"
              className="w-full h-full object-cover"
            />
          </div>

        </div>

        {/* Carousel pagination dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {successStories.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to story ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                currentIndex === idx ? 'w-6 bg-[#801b34]' : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
};
