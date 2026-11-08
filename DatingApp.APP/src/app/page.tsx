'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { ValueCards } from '../components/ValueCards';
import { FeaturedProfiles } from '../components/FeaturedProfiles';
import { SuccessStories } from '../components/SuccessStories';
import { CommunityMatches } from '../components/CommunityMatches';
import { PricingPlans } from '../components/PricingPlans';
import { FaqSection } from '../components/FaqSection';
import { CtaRegisterBanner } from '../components/CtaRegisterBanner';
import { Footer } from '../components/Footer';
import { ProfileDetailModal } from '../components/ProfileDetailModal';
import { AuthOnboardingModal } from '../components/AuthOnboardingModal';
import { CheckoutModal } from '../components/CheckoutModal';
import { mockProfiles } from '../data/mockData';
import { Profile } from '../types';
import { apiService, AuthSession, SubscriptionInfo } from '../services/api';
import { Sparkles, X, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const [profiles, setProfiles] = useState<Profile[]>(mockProfiles);
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [connectedIds, setConnectedIds] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Authentication & Onboarding State
  const [currentUser, setCurrentUser] = useState<AuthSession | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [targetConnectProfile, setTargetConnectProfile] = useState<Profile | null>(null);

  // Flow 4: Checkout & Membership Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState('premium');

  // Restore authenticated session from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('aura_session');
      if (stored) {
        try {
          const parsed: AuthSession = JSON.parse(stored);
          setCurrentUser(parsed);
        } catch {
          // ignore corrupted data
        }
      }
    }

    // Load initial content from API (with instant fallback)
    async function loadData() {
      try {
        const data = await apiService.getHomeContent();
        if (data.featuredProfiles && data.featuredProfiles.length > 0) {
          setProfiles(data.featuredProfiles);
        }
      } catch (e) {
        // Fallback remains active
      }
    }
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Profile Search Filter
  const handleHeroSearch = async (filters: { gender: string; ageFrom: string; ageTo: string; profession: string; location: string }) => {
    const from = parseInt(filters.ageFrom);
    const to = parseInt(filters.ageTo);
    
    const results = await apiService.getProfiles({
      gender: filters.gender,
      ageFrom: isNaN(from) ? undefined : from,
      ageTo: isNaN(to) ? undefined : to,
      profession: filters.profession,
      location: filters.location,
    });

    setProfiles(results.length > 0 ? results : mockProfiles);
    setActiveFilter('All');
    showToast(`Found ${results.length > 0 ? results.length : mockProfiles.length} verified matches for your search!`);
  };

  const handleFilterProfession = (prof: string) => {
    if (prof === 'Expats') {
      const exp = mockProfiles.filter((p) => p.country !== 'Sri Lanka');
      setProfiles(exp);
      setActiveFilter('All');
      showToast(`Showing ${exp.length} Overseas / Expat professionals`);
      const target = document.getElementById('featured-profiles');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setActiveFilter(prof);
    showToast(`Filtered by ${prof}`);
    const target = document.getElementById('featured-profiles');
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  };

  // Connect Handler: Requires User to Create Profile First!
  const handleConnect = async (profile: Profile) => {
    // Check if user has authenticated and completed profile details
    if (!currentUser || !currentUser.hasCompletedProfile) {
      setTargetConnectProfile(profile);
      setIsAuthModalOpen(true);
      showToast(`Please verify your phone/email & create your profile before connecting with ${profile.name}.`);
      return;
    }

    // User is already logged in with completed profile:
    setConnectedIds((prev) => ({ ...prev, [profile.id]: true }));
    await apiService.sendMatchRequest(profile.id, 'Interested in connecting');
    showToast(`Connection interest sent to ${profile.name}!`);
  };

  // Called when user completes Onboarding & Profile details
  const handleOnboardingCompleted = async (session: AuthSession, createdProfile: Profile) => {
    setCurrentUser(session);
    
    // Add created profile to top of list if new
    if (createdProfile && createdProfile.name) {
      setProfiles((prev) => [createdProfile, ...prev.filter((p) => p.id !== createdProfile.id)]);
    }

    // If they initiated connect with a specific profile:
    if (targetConnectProfile) {
      setConnectedIds((prev) => ({ ...prev, [targetConnectProfile.id]: true }));
      await apiService.sendMatchRequest(targetConnectProfile.id, 'Interested in connecting');
      showToast(`Welcome, ${createdProfile.name}! Your profile was created and your request was sent to ${targetConnectProfile.name}!`);
      setTargetConnectProfile(null);
    } else {
      showToast(`Welcome, ${createdProfile.name}! Your verified profile is active.`);
    }
  };

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aura_token');
      localStorage.removeItem('aura_session');
    }
    setCurrentUser(null);
    showToast('You have signed out.');
  };

  const handleSelectPlan = (planId: string) => {
    if (planId === 'free') {
      showToast('Selected Basic Explorer plan. Opening profile registration...');
      setIsAuthModalOpen(true);
    } else {
      setSelectedPlanForCheckout(planId);
      setIsCheckoutOpen(true);
    }
  };

  const handleCategorySelect = (category: string) => {
    if (category.includes('Doctor')) {
      setActiveFilter('Doctor');
    } else if (category.includes('Software') || category.includes('IT')) {
      setActiveFilter('IT');
    } else if (category.includes('Engineer')) {
      setActiveFilter('Engineer');
    } else if (category.includes('Finance') || category.includes('Accountant')) {
      setActiveFilter('Finance');
    } else if (category.includes('Expat') || category.includes('Aus') || category.includes('UK')) {
      const exp = mockProfiles.filter((p) => p.country !== 'Sri Lanka');
      setProfiles(exp);
      setActiveFilter('All');
    } else {
      setActiveFilter('All');
      setProfiles(mockProfiles);
    }

    showToast(`Browsing category: ${category}`);
    const target = document.getElementById('featured-profiles');
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#801b34] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-rose-300/30 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="w-5 h-5 rounded-full hover:bg-white/20 flex items-center justify-center ml-2 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sticky Header Navigation */}
      <Navbar
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onOpenRegister={() => {
          setTargetConnectProfile(null);
          setIsAuthModalOpen(true);
        }}
        onOpenSignIn={() => {
          setTargetConnectProfile(null);
          setIsAuthModalOpen(true);
        }}
      />

      {/* Deep Maroon Hero Section with Quick Search & 6 Candidate Previews */}
      <div id="search-section">
        <HeroSection
          onSearch={handleHeroSearch}
          onFilterProfession={handleFilterProfession}
          onSelectProfile={(p) => setSelectedProfile(p)}
        />
      </div>

      {/* 3 Core Value Cards */}
      <ValueCards />

      {/* Recently Added Profiles Grid (8 Profiles in 4 Columns) */}
      <FeaturedProfiles
        profiles={profiles}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onSelectProfile={(p) => setSelectedProfile(p)}
        onConnectProfile={handleConnect}
      />

      {/* Success Stories Carousel */}
      <SuccessStories />

      {/* Community / Profession Categories */}
      <CommunityMatches onSelectCategory={handleCategorySelect} />

      {/* Membership Pricing Plans */}
      <PricingPlans onSelectPlan={handleSelectPlan} />

      {/* Support Hotline & FAQ Accordion */}
      <FaqSection />

      {/* Bottom Maroon CTA Banner with Embedded Registration */}
      <CtaRegisterBanner
        onSuccessRegister={() => {
          setIsAuthModalOpen(true);
        }}
      />

      {/* Full Page Footer */}
      <Footer />

      {/* Candidate Profile Detail Modal */}
      <ProfileDetailModal
        profile={selectedProfile}
        onClose={() => setSelectedProfile(null)}
        onConnect={handleConnect}
        isConnected={selectedProfile ? !!connectedIds[selectedProfile.id] : false}
      />

      {/* Full Multi-Step Onboarding Modal: Phone OTP / Google / Email + Details Entry */}
      <AuthOnboardingModal
        isOpen={isAuthModalOpen}
        targetProfile={targetConnectProfile}
        onClose={() => {
          setIsAuthModalOpen(false);
          setTargetConnectProfile(null);
        }}
        onCompleted={handleOnboardingCompleted}
      />

      {/* Flow 4: Checkout & Payment Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        initialPlanId={selectedPlanForCheckout}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={(sub: SubscriptionInfo) => {
          setIsCheckoutOpen(false);
          showToast(`Congratulations! You have successfully upgraded to ${sub.planName}!`);
          if (currentUser) {
            const updated = { ...currentUser, subscription: sub };
            setCurrentUser(updated);
          }
        }}
      />
    </div>
  );
}
