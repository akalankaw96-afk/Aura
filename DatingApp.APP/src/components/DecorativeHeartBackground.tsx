'use client';

import React from 'react';

interface HeartConfig {
  id: string;
  top: string;
  left?: string;
  right?: string;
  size: number;
  dashed?: boolean;
  color: string;
  rotate: number;
  opacity: number;
  animationDelay?: string;
  duration?: number;
}

interface DecorativeHeartBackgroundProps {
  children?: React.ReactNode;
  showBottomHill?: boolean;
  isModal?: boolean;
  className?: string;
}

export const DecorativeHeartBackground: React.FC<DecorativeHeartBackgroundProps> = ({
  children,
  showBottomHill = true,
  isModal = false,
  className = '',
}) => {
  // Delicate hearts scattered across the canvas, directly reproducing the user's reference image:
  // (media_1794116090402_573d0e3b.jpg)
  // Types:
  // 1. Solid thin outline pink hearts
  // 2. Dashed thin outline pink hearts
  // 3. Dashed thin outline soft yellow/gold hearts (#f59e0b / #fbbf24)
  // 4. Subtle variable rotations (-18° to +18°) and gentle floating animations

  const leftHearts: HeartConfig[] = [
    { id: 'lh-1', top: '5%', left: '4%', size: 26, color: '#f472b6', rotate: -14, opacity: 0.6, duration: 4.2 },
    { id: 'lh-2', top: '16%', left: '12%', size: 34, dashed: true, color: '#f472b6', rotate: 16, opacity: 0.5, duration: 5.0 },
    { id: 'lh-3', top: '27%', left: '-10px', size: 68, color: '#f9a8d4', rotate: -22, opacity: 0.35, duration: 6.0 }, // Large bleeding heart
    { id: 'lh-4', top: '42%', left: '7%', size: 28, color: '#f472b6', rotate: 10, opacity: 0.55, duration: 4.5 },
    { id: 'lh-5', top: '56%', left: '13%', size: 22, dashed: true, color: '#f472b6', rotate: -8, opacity: 0.45, duration: 4.8 },
    { id: 'lh-6', top: '69%', left: '5%', size: 30, dashed: true, color: '#f59e0b', rotate: -15, opacity: 0.7, duration: 5.2 }, // Golden dashed heart!
    { id: 'lh-7', top: '82%', left: '11%', size: 32, color: '#f472b6', rotate: 12, opacity: 0.55, duration: 4.6 },
    { id: 'lh-8', top: '91%', left: '3%', size: 18, dashed: true, color: '#f9a8d4', rotate: -6, opacity: 0.4, duration: 5.5 },
  ];

  const rightHearts: HeartConfig[] = [
    { id: 'rh-1', top: '3%', right: '14%', size: 24, color: '#f472b6', rotate: -10, opacity: 0.6, duration: 4.0 },
    { id: 'rh-2', top: '14%', right: '22%', size: 34, color: '#f472b6', rotate: 16, opacity: 0.55, duration: 4.8 },
    { id: 'rh-3', top: '28%', right: '9%', size: 18, dashed: true, color: '#f472b6', rotate: -8, opacity: 0.5, duration: 5.3 }, // Tiny dashed heart
    { id: 'rh-4', top: '41%', right: '4%', size: 38, color: '#f472b6', rotate: 14, opacity: 0.5, duration: 4.4 },
    { id: 'rh-5', top: '54%', right: '15%', size: 26, dashed: true, color: '#f472b6', rotate: 10, opacity: 0.55, duration: 4.9 },
    { id: 'rh-6', top: '68%', right: '10%', size: 32, color: '#f472b6', rotate: 8, opacity: 0.6, duration: 5.1 },
    { id: 'rh-7', top: '77%', right: '20%', size: 28, dashed: true, color: '#f59e0b', rotate: -12, opacity: 0.7, duration: 4.7 }, // Golden dashed heart!
    { id: 'rh-8', top: '89%', right: '6%', size: 18, dashed: true, color: '#f472b6', rotate: 15, opacity: 0.45, duration: 5.4 },
  ];

  return (
    <div
      className={`relative w-full overflow-x-hidden bg-gradient-to-b from-[#fff5f8] via-[#fef0f3] to-[#fcecee] ${
        isModal ? 'min-h-[auto] p-2 sm:p-4' : 'min-h-screen py-6 px-4'
      } ${className}`}
    >
      {/* ======================================================== */}
      {/* FLOATING DECORATIVE HEARTS OVERLAY                       */}
      {/* ======================================================== */}
      <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
        {/* Left column hearts */}
        {leftHearts.map((h, i) => (
          <div
            key={h.id}
            className="absolute transition-transform will-change-transform"
            style={{
              top: h.top,
              left: h.left,
              opacity: h.opacity,
              animation: `floatingHeart ${h.duration || 4.5}s ease-in-out infinite alternate`,
              animationDelay: `${(i * 0.35).toFixed(1)}s`,
            }}
          >
            <HeartSvg
              size={h.size}
              dashed={h.dashed}
              color={h.color}
              rotate={h.rotate}
            />
          </div>
        ))}

        {/* Right column hearts */}
        {rightHearts.map((h, i) => (
          <div
            key={h.id}
            className="absolute transition-transform will-change-transform"
            style={{
              top: h.top,
              right: h.right,
              opacity: h.opacity,
              animation: `floatingHeart ${h.duration || 4.8}s ease-in-out infinite alternate`,
              animationDelay: `${(i * 0.32 + 0.15).toFixed(1)}s`,
            }}
          >
            <HeartSvg
              size={h.size}
              dashed={h.dashed}
              color={h.color}
              rotate={h.rotate}
            />
          </div>
        ))}

        {/* Floating Heart Keyframes */}
        <style jsx>{`
          @keyframes floatingHeart {
            0% {
              transform: translateY(0px) scale(1);
            }
            50% {
              transform: translateY(-6px) scale(1.02);
            }
            100% {
              transform: translateY(-11px) scale(1.04);
            }
          }
        `}</style>
      </div>

      {/* Main content container */}
      <div className="relative z-10 flex flex-col justify-between min-h-full">
        {children}

        {/* ======================================================== */}
        {/* BOTTOM LANDSCAPE HILL WITH GOLDEN HEART & SPARKLES       */}
        {/* Pixel-matching uploaded media_1794116090402_573d0e3b     */}
        {/* ======================================================== */}
        {showBottomHill && (
          <footer className="w-full relative pt-10 pb-4 text-center z-0 mt-auto select-none">
            <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center">
              
              {/* Floating Heart Balloons & Couple Accent */}
              <div className="flex items-end justify-center gap-6 mb-[-14px] relative z-20 pointer-events-none">
                {/* Pink balloon */}
                <div className="flex flex-col items-center animate-bounce duration-1000">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#f43f5e">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <div className="w-[1.5px] h-8 bg-rose-300" />
                </div>

                {/* Amber/Gold balloon */}
                <div className="flex flex-col items-center animate-bounce duration-700 delay-150">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#f59e0b">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <div className="w-[1.5px] h-11 bg-amber-300" />
                </div>

                {/* Rose balloon */}
                <div className="flex flex-col items-center animate-bounce duration-1000 delay-300">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#fb7185">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <div className="w-[1.5px] h-7 bg-rose-200" />
                </div>
              </div>

              {/* The Central Curved Hill Mound */}
              <div className="relative w-full max-w-lg mx-auto flex items-center justify-center">
                <div className="w-52 sm:w-64 h-14 rounded-t-full bg-gradient-to-t from-[#f9a8d4]/50 via-[#fbcfe8] to-[#fce7f3] border-t border-rose-200/90 shadow-sm relative z-10 flex items-center justify-center pt-2">
                  
                  {/* Golden Heart with Sparkles from Reference Image */}
                  <div className="relative flex items-center justify-center">
                    {/* Rich Warm Gold Heart */}
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      className="drop-shadow-[0_2px_5px_rgba(217,119,6,0.3)] animate-pulse"
                      style={{ animationDuration: '3s' }}
                    >
                      <path
                        fill="url(#goldGradientBg)"
                        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                      />
                      <defs>
                        <linearGradient id="goldGradientBg" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#fbbf24" />
                          <stop offset="50%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Top-Right 4-point Sparkle Star (Gold) */}
                    <div className="absolute -top-3 -right-3 animate-spin" style={{ animationDuration: '10s' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b">
                        <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
                      </svg>
                    </div>

                    {/* Lower-Right Tiny Sparkle (Pink) */}
                    <div className="absolute -bottom-1 -right-3.5 animate-pulse delay-200">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="#ec4899">
                        <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
                      </svg>
                    </div>

                    {/* Glistening white sparkle dots */}
                    <div className="absolute -left-7 top-1 w-1.5 h-1.5 rounded-full bg-white shadow-sm opacity-90 animate-ping" />
                    <div className="absolute left-10 -top-2 w-1 h-1 rounded-full bg-white opacity-80" />
                  </div>
                </div>
              </div>

              {/* Multi-tier pastel wavy landscape bands */}
              <div className="w-full relative -mt-3 z-0">
                {/* Layer 1: Soft rose-blush curve */}
                <div className="w-full h-5 bg-gradient-to-r from-rose-100 via-rose-200 to-rose-100 rounded-t-[40px] opacity-85" />
                {/* Layer 2: Pale champagne/creamy curve */}
                <div className="w-full h-3 bg-gradient-to-r from-amber-50 via-amber-100 to-amber-50 rounded-t-[30px] -mt-1 opacity-90" />
              </div>
            </div>

            <p className="text-[11px] text-gray-500 mt-2 font-medium">
              &copy; 2026 Aura Matrimony Sri Lanka. Verified Matrimony for Sri Lankan Professionals.
            </p>
          </footer>
        )}
      </div>
    </div>
  );
};

// SVG Heart matching reference strokes & dash patterns
export function HeartSvg({
  size,
  dashed = false,
  color,
  rotate,
}: {
  size: number;
  dashed?: boolean;
  color: string;
  rotate: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeDasharray={dashed ? '3 3' : undefined}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: `rotate(${rotate}deg)`,
        display: 'block',
      }}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export interface FloatingHeartsOverlayProps {
  variant?: 'light' | 'dark';
  className?: string;
}

export const FloatingHeartsOverlay: React.FC<FloatingHeartsOverlayProps> = ({
  variant = 'light',
  className = '',
}) => {
  const isDark = variant === 'dark';

  const darkHearts: HeartConfig[] = [
    { id: 'dh-l1', top: '8%', left: '3%', size: 28, color: '#fbbf24', rotate: -14, opacity: 0.45, duration: 4.5 },
    { id: 'dh-l2', top: '26%', left: '7%', size: 34, dashed: true, color: '#fda4af', rotate: 16, opacity: 0.4, duration: 5.2 },
    { id: 'dh-l3', top: '50%', left: '2%', size: 22, color: '#fef3c7', rotate: -8, opacity: 0.35, duration: 4.0 },
    { id: 'dh-l4', top: '72%', left: '6%', size: 32, dashed: true, color: '#fbbf24', rotate: 12, opacity: 0.45, duration: 4.8 },
    { id: 'dh-l5', top: '88%', left: '3%', size: 24, color: '#fda4af', rotate: -15, opacity: 0.35, duration: 5.0 },

    { id: 'dh-r1', top: '6%', right: '4%', size: 30, color: '#fda4af', rotate: 10, opacity: 0.45, duration: 4.2 },
    { id: 'dh-r2', top: '24%', right: '8%', size: 22, dashed: true, color: '#fbbf24', rotate: -12, opacity: 0.4, duration: 4.9 },
    { id: 'dh-r3', top: '48%', right: '3%', size: 36, dashed: true, color: '#fda4af', rotate: 14, opacity: 0.45, duration: 5.4 },
    { id: 'dh-r4', top: '70%', right: '7%', size: 26, color: '#fef3c7', rotate: -10, opacity: 0.35, duration: 4.6 },
    { id: 'dh-r5', top: '86%', right: '4%', size: 20, dashed: true, color: '#fbbf24', rotate: 8, opacity: 0.4, duration: 5.1 },
  ];

  const lightHearts: HeartConfig[] = [
    { id: 'lh-l1', top: '10%', left: '3%', size: 26, color: '#f472b6', rotate: -14, opacity: 0.5, duration: 4.4 },
    { id: 'lh-l2', top: '32%', left: '6%', size: 32, dashed: true, color: '#f59e0b', rotate: 15, opacity: 0.6, duration: 5.0 },
    { id: 'lh-l3', top: '58%', left: '2%', size: 22, dashed: true, color: '#f472b6', rotate: -8, opacity: 0.45, duration: 4.8 },
    { id: 'lh-l4', top: '80%', left: '5%', size: 34, color: '#f472b6', rotate: 12, opacity: 0.5, duration: 4.6 },

    { id: 'lh-r1', top: '8%', right: '4%', size: 24, dashed: true, color: '#f472b6', rotate: -10, opacity: 0.45, duration: 4.2 },
    { id: 'lh-r2', top: '30%', right: '8%', size: 36, color: '#f472b6', rotate: 16, opacity: 0.5, duration: 5.1 },
    { id: 'lh-r3', top: '56%', right: '3%', size: 28, dashed: true, color: '#f59e0b', rotate: -12, opacity: 0.6, duration: 4.7 },
    { id: 'lh-r4', top: '82%', right: '6%', size: 22, color: '#f472b6', rotate: 10, opacity: 0.45, duration: 5.3 },
  ];

  const hearts = isDark ? darkHearts : lightHearts;

  return (
    <div className={`absolute inset-0 pointer-events-none select-none z-0 overflow-hidden ${className}`}>
      {hearts.map((h, i) => (
        <div
          key={h.id}
          className="absolute transition-transform will-change-transform"
          style={{
            top: h.top,
            left: h.left,
            right: h.right,
            opacity: h.opacity,
            animation: `floatingHeart ${h.duration || 4.5}s ease-in-out infinite alternate`,
            animationDelay: `${(i * 0.35).toFixed(1)}s`,
          }}
        >
          <HeartSvg
            size={h.size}
            dashed={h.dashed}
            color={h.color}
            rotate={h.rotate}
          />
        </div>
      ))}
      <style jsx>{`
        @keyframes floatingHeart {
          0% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-6px) scale(1.02);
          }
          100% {
            transform: translateY(-11px) scale(1.04);
          }
        }
      `}</style>
    </div>
  );
};
