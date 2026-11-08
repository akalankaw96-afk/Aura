'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, ShieldCheck, Menu, X, UserCheck, PhoneCall, Sparkles, LogOut, User, LayoutDashboard } from 'lucide-react';
import { AuthSession } from '../services/api';

interface NavbarProps {
  onOpenRegister: () => void;
  onOpenSignIn: () => void;
  currentUser?: AuthSession | null;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenRegister,
  onOpenSignIn,
  currentUser,
  onSignOut,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="w-full bg-white text-gray-800 sticky top-0 z-50 border-b border-rose-100 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <a href="#" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#801b34] to-[#a32242] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold tracking-tight text-[#801b34] flex items-center gap-1.5 font-serif">
                  Aura <span className="text-[#801b34] text-[10px] tracking-widest font-sans font-bold uppercase px-1.5 py-0.5 rounded bg-rose-100 border border-rose-200">VIP</span>
                </span>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                  Professional Matrimony
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-sm font-medium text-gray-700">
            <a href="#search-section" className="hover:text-[#801b34] transition-colors">
              Find Matches
            </a>
            <a href="#featured-profiles" className="hover:text-[#801b34] transition-colors">
              Recent Profiles
            </a>
            <a href="#stories" className="hover:text-[#801b34] transition-colors">
              Success Stories
            </a>
            <a href="#communities" className="hover:text-[#801b34] transition-colors">
              By Profession
            </a>
            <a href="#pricing" className="hover:text-[#801b34] transition-colors">
              Membership
            </a>
            <a href="#faq" className="hover:text-[#801b34] transition-colors">
              Help & FAQ
            </a>
            {currentUser && (
              <Link href="/dashboard" className="text-[#801b34] font-bold hover:underline flex items-center gap-1 transition-colors">
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
            )}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center space-x-3">
            <div className="hidden xl:flex items-center space-x-2 text-gray-600 text-xs pr-3 border-r border-gray-200">
              <PhoneCall className="w-3.5 h-3.5 text-[#801b34]" />
              <span className="font-semibold text-gray-700">011 7 890 120</span>
            </div>

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pl-3 pr-2.5 rounded-full bg-rose-50 border border-rose-200 text-[#801b34] hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-[#801b34] text-white flex items-center justify-center text-xs font-bold">
                    {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-bold max-w-[120px] truncate">{currentUser.fullName}</span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-[11px] text-gray-400 uppercase font-semibold">Signed In</p>
                      <p className="text-xs font-bold text-gray-900 truncate">{currentUser.email || currentUser.phoneNumber}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-[#801b34]" />
                      <span>My Dashboard</span>
                    </Link>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onSignOut && onSignOut();
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={onOpenSignIn}
                  className="text-sm font-semibold text-gray-700 hover:text-[#801b34] px-4 py-2 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-[#801b34]" />
                  Sign In
                </button>
                <button
                  onClick={onOpenRegister}
                  className="text-sm font-bold bg-[#801b34] hover:bg-[#681429] text-white px-5 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Create Profile
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-[#801b34] p-2 rounded-md hover:bg-rose-50 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-b border-rose-100 px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <nav className="flex flex-col space-y-2.5 text-base font-medium text-gray-800">
            <a
              href="#search-section"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-rose-50 hover:text-[#801b34]"
            >
              Find Matches
            </a>
            <a
              href="#featured-profiles"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-rose-50 hover:text-[#801b34]"
            >
              Recent Profiles
            </a>
            <a
              href="#stories"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-rose-50 hover:text-[#801b34]"
            >
              Success Stories
            </a>
            <a
              href="#communities"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-rose-50 hover:text-[#801b34]"
            >
              By Profession
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-rose-50 hover:text-[#801b34]"
            >
              Membership Plans
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-rose-50 hover:text-[#801b34]"
            >
              FAQ & Help
            </a>
          </nav>
          <div className="pt-4 border-t border-gray-100 flex flex-col gap-2.5">
            {currentUser ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignOut && onSignOut();
                }}
                className="w-full text-center py-2.5 rounded-lg border border-rose-200 text-[#801b34] font-semibold"
              >
                Sign Out ({currentUser.fullName})
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSignIn();
                  }}
                  className="w-full text-center py-2.5 rounded-lg border border-rose-200 text-[#801b34] font-semibold"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenRegister();
                  }}
                  className="w-full text-center py-2.5 rounded-lg bg-[#801b34] text-white font-bold"
                >
                  Create Profile
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
