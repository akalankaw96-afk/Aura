'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  ShieldCheck,
  Check,
  X,
  MessageCircle,
  Phone,
  Lock,
  Sparkles,
  User,
  MapPin,
  Briefcase,
  GraduationCap,
  AlertTriangle,
  Send,
  Flag,
  Share2,
  Trash2,
  Bell,
  Clock,
  CheckCircle2,
  ChevronRight,
  MoreVertical,
  VolumeX,
  UserX,
  CreditCard,
  Crown,
  Receipt,
  FileCheck,
  Percent,
  CalendarDays,
  ShieldAlert,
  ArrowUpRight,
  RefreshCw,
  Settings
} from 'lucide-react';
import {
  apiService,
  AuthSession,
  SubscriptionInfo,
  AccountClosureStatus,
  SuccessStorySubmission
} from '../services/api';
import { Profile } from '../types';
import { mockProfiles } from '../data/mockData';
import { HeartPattern } from "@/components/ui/Decor";
import { CheckoutModal } from './CheckoutModal';
import { FoundMatchModal } from './FoundMatchModal';
import { AccountClosureModal } from './AccountClosureModal';

interface MatchItem {
  id: string;
  senderProfileId: string;
  senderName: string;
  senderProfession: string;
  senderPhotoUrl: string;
  receiverProfileId: string;
  receiverName: string;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Withdrawn';
  note?: string;
  createdAt: string;
  senderAge?: number;
  senderLocation?: string;
  senderEducation?: string;
  phoneShared?: boolean;
}

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  delivered: boolean;
  isSafetyWarning?: boolean;
}

export const MemberDashboard: React.FC = () => {
  const router = useRouter();

  // Active Session & Profile State
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<'received' | 'sent' | 'matches' | 'chat' | 'billing'>('received');
  
  // Subscription & Billing State (Flow 4)
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelStep, setCancelStep] = useState<'survey' | 'retention' | 'confirm'>('survey');
  const [cancelReason, setCancelReason] = useState('Found a match');
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [refundRequested, setRefundRequested] = useState(false);

  // Requests & Matches State
  const [receivedRequests, setReceivedRequests] = useState<MatchItem[]>([]);
  const [sentRequests, setSentRequests] = useState<MatchItem[]>([]);
  const [activeMatch, setActiveMatch] = useState<MatchItem | null>(null);

  // Profile Privacy & Pause State (Flow 5)
  const [isPaused, setIsPaused] = useState(false);
  const [isFoundMatchOpen, setIsFoundMatchOpen] = useState(false);
  const [isAccountClosureOpen, setIsAccountClosureOpen] = useState(false);
  const [closureStatus, setClosureStatus] = useState<AccountClosureStatus>({ status: 'active' });
  const [mySuccessStory, setMySuccessStory] = useState<SuccessStorySubmission | null>(null);

  // Chat State (Flow 3)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [safetyBanner, setSafetyBanner] = useState<string | null>(null);
  const [rateLimitLocked, setRateLimitLocked] = useState(false);
  const [rateCountdown, setRateCountdown] = useState(0);
  const [phoneRequested, setPhoneRequested] = useState(false);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [showSafetyMenu, setShowSafetyMenu] = useState(false);

  // Toast State
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Initial Load & Hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('aura_session');
      if (stored) {
        try {
          const sess: AuthSession = JSON.parse(stored);
          setSession(sess);
          initializeSampleRequests(sess);
        } catch {
          // ignore
        }
      } else {
        // Fallback demo session if accessing directly
        const demoSess: AuthSession = {
          token: 'demo-token-12345',
          userId: 'usr-demo-1',
          fullName: 'Dr. Kasun Jayawardena',
          email: 'kasun.j@auramatrimony.lk',
          role: 'Member',
          hasCompletedProfile: true,
          profileId: 'prof-demo-1',
        };
        setSession(demoSess);
        initializeSampleRequests(demoSess);
      }

      // Load active subscription (Flow 4)
      const sub = apiService.getSubscription();
      // If user is new demo, give them active premium to experience full features
      if (sub.planId === 'free' && !localStorage.getItem('aura_subscription')) {
        const defaultSub: SubscriptionInfo = {
          planId: 'premium',
          planName: 'Premium Matrimonial',
          durationMonths: 3,
          startDate: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          autoRenew: true,
          amountLkr: 3900,
          paymentMethod: 'Credit/Debit Card (ending 8821)',
          transactionId: 'TXN-773912',
        };
        apiService.activateSubscription(defaultSub);
        setSubscription(defaultSub);
      } else {
        setSubscription(sub);
      }

      // Load Flow 5 Status
      const closure = apiService.getClosureStatus();
      setClosureStatus(closure);
      if (closure.status === 'paused') {
        setIsPaused(true);
      }
      setMySuccessStory(apiService.getMySuccessStory());
    }
  }, []);

  const initializeSampleRequests = (userSess: AuthSession) => {
    const candidates = mockProfiles;
    
    // Sample incoming interests (Flow 2)
    const incoming: MatchItem[] = [
      {
        id: 'req-in-1',
        senderProfileId: candidates[2].id, // Dinithi Jayasuriya (Legal Counsel)
        senderName: candidates[2].name,
        senderProfession: candidates[2].profession,
        senderPhotoUrl: candidates[2].photoUrl,
        senderAge: candidates[2].age,
        senderLocation: candidates[2].location,
        senderEducation: candidates[2].education,
        receiverProfileId: userSess.profileId || 'self',
        receiverName: userSess.fullName,
        status: 'Pending',
        note: 'Hello, my parents and I admire your background and Buddhist values. Would be honored to connect.',
        createdAt: '2 hours ago',
      },
      {
        id: 'req-in-2',
        senderProfileId: candidates[4].id, // Dr. Priya Wickramasinghe
        senderName: candidates[4].name,
        senderProfession: candidates[4].profession,
        senderPhotoUrl: candidates[4].photoUrl,
        senderAge: candidates[4].age,
        senderLocation: candidates[4].location,
        senderEducation: candidates[4].education,
        receiverProfileId: userSess.profileId || 'self',
        receiverName: userSess.fullName,
        status: 'Pending',
        note: 'Greetings! Our horoscopes match well (18 Porondam). Looking forward to introducing our families.',
        createdAt: '1 day ago',
      },
    ];

    // Sample outgoing requests (Flow 2)
    const outgoing: MatchItem[] = [
      {
        id: 'req-out-1',
        senderProfileId: userSess.profileId || 'self',
        senderName: userSess.fullName,
        senderProfession: 'Software Architect',
        senderPhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
        receiverProfileId: candidates[0].id,
        receiverName: candidates[0].name,
        status: 'Pending',
        note: 'Respectful connect request sent from Colombo 07.',
        createdAt: 'Yesterday',
      },
    ];

    // Sample mutual accepted match ready for chat (Flow 3)
    const mutualAccepted: MatchItem = {
      id: 'req-match-1',
      senderProfileId: candidates[2].id,
      senderName: candidates[2].name,
      senderProfession: candidates[2].profession,
      senderPhotoUrl: candidates[2].photoUrl,
      senderAge: candidates[2].age,
      senderLocation: candidates[2].location,
      senderEducation: candidates[2].education,
      receiverProfileId: userSess.profileId || 'self',
      receiverName: userSess.fullName,
      status: 'Accepted',
      note: 'Mutual connection confirmed!',
      createdAt: '3 days ago',
      phoneShared: false,
    };

    setReceivedRequests(incoming);
    setSentRequests(outgoing);
    setActiveMatch(mutualAccepted);

    // Initial chat history with active match
    setChatMessages([
      {
        id: 'm1',
        senderId: candidates[2].id,
        text: 'Ayubowan! Thank you for accepting my connect request.',
        timestamp: '10:30 AM',
        delivered: true,
      },
      {
        id: 'm2',
        senderId: 'self',
        text: 'Ayubowan Dinithi! It is wonderful to connect with you. How is your work in corporate arbitration going?',
        timestamp: '10:32 AM',
        delivered: true,
      },
      {
        id: 'm3',
        senderId: candidates[2].id,
        text: 'It is quite fulfilling! My parents also reviewed your family background and were very pleased.',
        timestamp: '10:35 AM',
        delivered: true,
      },
    ]);
  };

  // 2. Respond to Received Request (Flow 2: Accept vs Decline with 90-day cooldown)
  const handleAcceptRequest = async (item: MatchItem) => {
    try {
      await apiService.respondMatchRequest(item.id, true);
    } catch {
      // fallback
    }

    const updated = { ...item, status: 'Accepted' as const };
    setReceivedRequests((prev) => prev.filter((r) => r.id !== item.id));
    setActiveMatch(updated);
    setActiveTab('chat');
    showToast(`Accepted! "It's a Match!" — Chat and contact requests unlocked with ${item.senderName}!`);
  };

  const handleDeclineRequest = async (item: MatchItem) => {
    try {
      await apiService.respondMatchRequest(item.id, false);
    } catch {
      // fallback
    }

    setReceivedRequests((prev) => prev.filter((r) => r.id !== item.id));
    showToast(`Request politely declined. Resend is locked for 90 days as per safety policy.`);
  };

  // 3. Withdraw Outgoing Request (Flow 2)
  const handleWithdrawRequest = (id: string) => {
    setSentRequests((prev) => prev.filter((r) => r.id !== id));
    showToast('Interest request withdrawn successfully.');
  };

  // 4. Send In-Chat Message (Flow 3: Rate Limiting & Anti-Scam Words Scanner)
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (rateLimitLocked) {
      showToast('Rate limit: Please slow down before sending another message.');
      return;
    }

    const text = inputText.trim();

    // Flow 3: Keyword & Money words detection (Scam guardrail)
    const moneyRegex = /(money|wire transfer|western union|crypto|bank account|pay advance|urgent funds|lkr \d{4,})/i;
    const phoneRegex = /(\+?\d[\d\s-]{6,}\d)/;

    if (moneyRegex.test(text)) {
      setSafetyBanner(
        '⚠️ Safety Alert: Never transfer money, pay advances, or share banking credentials with anyone. Matrimony advisors will never ask for private financial details.'
      );
    } else if (phoneRegex.test(text)) {
      setSafetyBanner(
        '💡 Privacy Tip: Please use the official "Request Verified Phone Number" button below so both sides can exchange contacts securely.'
      );
    } else {
      setSafetyBanner(null);
    }

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      senderId: 'self',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      delivered: true,
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Trigger mock polite reply after 2.5 seconds
    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: 'reply-' + Date.now(),
        senderId: activeMatch?.senderProfileId || 'partner',
        text: 'Thank you for your thoughtful message! Our family values open and honest communication.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        delivered: true,
      };
      setChatMessages((prev) => [...prev, replyMsg]);
    }, 2500);
  };

  // 5. Mutual Contact Request (Flow 3: Request to Share Phone Number)
  const handleRequestPhone = () => {
    setPhoneRequested(true);
    showToast('Contact share request dispatched to ' + (activeMatch?.senderName || 'candidate') + '.');

    // Simulate approval after 2 seconds
    setTimeout(() => {
      setPhoneRevealed(true);
      showToast('Phone number approved! Verified contact is now visible.');
    }, 2000);
  };

  return (
    <div className="relative isolate min-h-screen bg-page-gradient py-6 px-4 sm:px-6">
      <HeartPattern className="-z-10" />
      
      {/* Toast popup */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#801b34] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-rose-300/40 animate-bounce text-xs sm:text-sm font-semibold">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto w-full">
        
        {/* Top Header / Profile Banner */}
        <header className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-sm border border-rose-100 mb-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5 text-center sm:text-left flex-col sm:flex-row">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop"
                alt="Profile Avatar"
                className="w-20 h-20 rounded-full object-cover border-4 border-rose-100 shadow-md"
              />
              <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full" title="Online" />
            </div>

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold font-serif text-gray-900">
                  {session?.fullName || 'Dr. Kasun Jayawardena'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  VERIFIED
                </span>
                
                {/* Dynamic Flow 4 Plan Badge */}
                {subscription?.status === 'pending_verification' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[11px] font-bold">
                    <Clock className="w-3 h-3 text-blue-600" />
                    SLIP VERIFICATION PENDING
                  </span>
                ) : subscription?.planId === 'vip' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-300">
                    <Crown className="w-3 h-3 text-amber-600" />
                    ELITE VIP MEMBER
                  </span>
                ) : subscription?.planId === 'premium' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-[#801b34] text-[11px] font-bold border border-rose-200">
                    <Sparkles className="w-3 h-3 text-[#801b34]" />
                    PREMIUM MEMBER
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px] font-bold">
                    BASIC EXPLORER
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Candidate ID: <strong className="font-mono text-[#801b34]">LK-9280</strong> &bull; Colombo 07, Sri Lanka &bull; Software Architect
              </p>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-end">
            {/* Flow 5 "Found My Match" Button */}
            <button
              onClick={() => setIsFoundMatchOpen(true)}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-rose-600 to-[#801b34] hover:from-rose-700 hover:to-[#681429] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer transform hover:-translate-y-0.5"
            >
              <Heart className="w-3.5 h-3.5 fill-white" />
              <span>Found My Match!</span>
            </button>

            {/* Upgrade Button */}
            <button
              onClick={() => setIsCheckoutModalOpen(true)}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>{subscription?.planId === 'vip' ? 'Manage Plan' : 'Upgrade Plan'}</span>
            </button>

            <button
              onClick={() => {
                const nextPaused = !isPaused;
                setIsPaused(nextPaused);
                apiService.pauseProfile(nextPaused);
                showToast(nextPaused ? 'Profile paused (hidden in search results, chats kept).' : 'Profile resumed and active in search!');
              }}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                isPaused
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {isPaused ? '⏸️ Paused' : 'Active in Search'}
            </button>

            {/* Account Settings & Security Modal Trigger */}
            <button
              onClick={() => setIsAccountClosureOpen(true)}
              className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
              title="Account Settings & Security"
            >
              <Settings className="w-4 h-4" />
            </button>

            <Link
              href="/"
              className="px-4 py-2 rounded-full bg-[#801b34] text-white text-xs font-bold hover:bg-[#681429] transition-all shadow-xs"
            >
              Browse &rarr;
            </Link>
          </div>
        </header>

        {/* Flow 5 Success Story Active Banner (if user submitted a match) */}
        {mySuccessStory && (
          <div className="bg-gradient-to-r from-rose-50 via-amber-50/60 to-rose-50 border border-rose-200 rounded-3xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#801b34] text-white flex items-center justify-center font-bold shrink-0 shadow">
                <Heart className="w-6 h-6 fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold font-serif text-gray-900 text-sm sm:text-base">
                    Match Union Celebrated: {mySuccessStory.title}
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {mySuccessStory.status === 'Published' ? 'Published' : 'Editorial Review'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  Partner: <strong>{mySuccessStory.partnerName}</strong> &bull; {mySuccessStory.weddingDate} &bull; {mySuccessStory.location}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsFoundMatchOpen(true)}
              className="px-4 py-2 bg-white border border-rose-200 hover:bg-rose-50 text-[#801b34] text-xs font-bold rounded-xl cursor-pointer shrink-0"
            >
              View Story Details
            </button>
          </div>
        )}

        {/* 4 Stat Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-rose-100 shadow-xs">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Received Interests</span>
            <span className="text-2xl font-bold font-serif text-[#801b34] mt-1 block">{receivedRequests.length}</span>
            <span className="text-[10px] text-emerald-600 font-medium">New requests awaiting review</span>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-rose-100 shadow-xs">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Mutual Matches</span>
            <span className="text-2xl font-bold font-serif text-emerald-700 mt-1 block">1</span>
            <span className="text-[10px] text-gray-500 font-medium">Chat & Contacts Unlocked</span>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-rose-100 shadow-xs">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Sent Interests</span>
            <span className="text-2xl font-bold font-serif text-gray-800 mt-1 block">{sentRequests.length}</span>
            <span className="text-[10px] text-gray-500 font-medium">Pending responses</span>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-rose-100 shadow-xs">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Safety Guard</span>
            <span className="text-2xl font-bold font-serif text-emerald-600 mt-1 block">100%</span>
            <span className="text-[10px] text-emerald-700 font-medium">Verified Identity & Privacy</span>
          </div>
        </div>

        {/* Navigation Tabs (Flow 2 & Flow 3) */}
        <div className="flex border-b border-rose-200/80 mb-6 bg-white/70 backdrop-blur-sm rounded-2xl p-1.5 shadow-xs">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'received'
                ? 'bg-[#801b34] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Received Interests ({receivedRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'chat'
                ? 'bg-[#801b34] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Matches & Direct Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'sent'
                ? 'bg-[#801b34] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Sent Interests ({sentRequests.length})</span>
          </button>

          {/* Flow 4: Membership & Billing Tab */}
          <button
            onClick={() => setActiveTab('billing')}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'billing'
                ? 'bg-[#801b34] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Plans & Billing</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: RECEIVED INTERESTS (FLOW 2: ACCEPT OR DECLINE)   */}
        {/* ======================================================== */}
        {activeTab === 'received' && (
          <div className="space-y-4">
            {receivedRequests.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-rose-200 p-8">
                <Heart className="w-10 h-10 text-rose-300 mx-auto mb-2" />
                <h3 className="font-bold text-gray-800 font-serif">No new incoming requests</h3>
                <p className="text-xs text-gray-500 mt-1">Browse more verified profiles to find your ideal match!</p>
              </div>
            ) : (
              receivedRequests.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-rose-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={item.senderPhotoUrl}
                      alt={item.senderName}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-sm shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif font-bold text-lg text-gray-900">{item.senderName}</h3>
                        <span className="text-xs text-gray-500 font-semibold">{item.senderAge} yrs</span>
                        <span className="text-[10px] bg-rose-100 text-[#801b34] font-bold px-2 py-0.5 rounded-full">
                          {item.createdAt}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 font-medium mt-0.5 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-[#801b34]" />
                        <span>{item.senderProfession}</span> &bull; <span>{item.senderLocation}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                        <span>{item.senderEducation}</span>
                      </p>

                      {/* Introductory Note from candidate */}
                      {item.note && (
                        <div className="mt-2.5 p-3 rounded-xl bg-rose-50/60 border border-rose-100 text-xs text-gray-700 italic">
                          &ldquo;{item.note}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Flow 2 Decision Actions */}
                  <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
                    <button
                      onClick={() => handleAcceptRequest(item)}
                      className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Accept Match</span>
                    </button>

                    <button
                      onClick={() => handleDeclineRequest(item)}
                      className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: SENT INTERESTS (FLOW 2: TRACK & WITHDRAW)        */}
        {/* ======================================================== */}
        {activeTab === 'sent' && (
          <div className="space-y-4">
            {sentRequests.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-rose-100 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={item.senderPhotoUrl}
                    alt={item.receiverName}
                    className="w-14 h-14 rounded-2xl object-cover shadow-sm shrink-0"
                  />
                  <div>
                    <h3 className="font-serif font-bold text-base text-gray-900">{item.receiverName}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.senderProfession} &bull; {item.senderLocation}
                    </p>
                    <span className="inline-block mt-1 text-[11px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-medium">
                      Status: {item.status} (Awaiting response)
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleWithdrawRequest(item.id)}
                  className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                >
                  Withdraw Request
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: ACTIVE MATCHES & LIVE CHAT (FLOW 3 SAFE CHAT)     */}
        {/* ======================================================== */}
        {activeTab === 'chat' && (
          <div className="bg-white rounded-3xl shadow-md border border-rose-100 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
            
            {/* Left Match Sidebar */}
            <div className="md:col-span-4 border-r border-rose-100 bg-[#fffbfc] p-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">
                  Mutual Connections ({activeMatch ? 1 : 0})
                </h3>

                {activeMatch && (
                  <div className="p-3.5 rounded-2xl bg-white border border-rose-200 shadow-sm flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <img
                        src={activeMatch.senderPhotoUrl}
                        alt={activeMatch.senderName}
                        className="w-12 h-12 rounded-full object-cover shadow-xs"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border border-white rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif font-bold text-sm text-gray-900 truncate">
                          {activeMatch.senderName}
                        </h4>
                        <span className="text-[10px] text-gray-400">Online</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{activeMatch.senderProfession}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Verified Contact Exchange Box */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 mt-4 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>Verified Contact Sharing</span>
                </div>
                <p className="text-gray-600 text-[11px] leading-relaxed mb-2.5">
                  Phone numbers are shared only upon mutual consent.
                </p>

                {phoneRevealed ? (
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-300 font-mono text-emerald-900 font-bold text-center">
                    📞 +94 77 456 7890 (Verified)
                  </div>
                ) : (
                  <button
                    onClick={handleRequestPhone}
                    disabled={phoneRequested}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {phoneRequested ? 'Request Dispatched...' : 'Request Phone Number'}
                  </button>
                )}
              </div>
            </div>

            {/* Right Chat Room */}
            <div className="md:col-span-8 flex flex-col justify-between h-[580px] bg-white">
              
              {/* Chat Header */}
              <div className="p-4 border-b border-rose-100 flex items-center justify-between bg-white z-10">
                <div className="flex items-center gap-3">
                  <img
                    src={activeMatch?.senderPhotoUrl || 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800'}
                    alt="Active partner"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 font-serif">
                      {activeMatch?.senderName || 'Dinithi Jayasuriya'}
                    </h3>
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active Match &bull; Chat Unlocked
                    </span>
                  </div>
                </div>

                {/* Flow 3 Safety Menu (Mute, Block, Report, Unmatch) */}
                <div className="relative">
                  <button
                    onClick={() => setShowSafetyMenu(!showSafetyMenu)}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {showSafetyMenu && (
                    <div className="absolute right-0 top-10 w-48 bg-white rounded-2xl shadow-xl border border-rose-100 py-1.5 z-30 text-xs font-medium animate-fadeIn">
                      <button
                        onClick={() => {
                          showToast('Chat muted.');
                          setShowSafetyMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700 cursor-pointer"
                      >
                        <VolumeX className="w-3.5 h-3.5" /> Mute Notifications
                      </button>
                      <button
                        onClick={() => {
                          showToast('User blocked. Both profiles are now hidden.');
                          setShowSafetyMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600 cursor-pointer"
                      >
                        <UserX className="w-3.5 h-3.5" /> Block User
                      </button>
                      <button
                        onClick={() => {
                          showToast('Report submitted for administrative review.');
                          setShowSafetyMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600 cursor-pointer"
                      >
                        <Flag className="w-3.5 h-3.5" /> Report Candidate
                      </button>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={() => {
                          showToast('Connection removed.');
                          setShowSafetyMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Unmatch & Close
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Feed */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1 bg-[#fffdfd]">
                {chatMessages.map((msg) => {
                  const isMe = msg.senderId === 'self';
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[78%] rounded-2xl p-3 text-xs leading-relaxed shadow-xs ${
                          isMe
                            ? 'bg-gradient-to-r from-[#801b34] to-[#99203e] text-white rounded-tr-xs'
                            : 'bg-gray-100 text-gray-800 rounded-tl-xs border border-gray-200/60'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <span
                          className={`text-[9px] block mt-1 text-right ${
                            isMe ? 'text-rose-200' : 'text-gray-400'
                          }`}
                        >
                          {msg.timestamp} {isMe && '✓✓'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Flow 3 In-Chat Anti-Scam Warning Banner */}
              {safetyBanner && (
                <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-amber-900 text-xs flex items-center gap-2 animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="flex-1 text-[11px]">{safetyBanner}</span>
                  <button
                    onClick={() => setSafetyBanner(null)}
                    className="text-amber-700 font-bold hover:underline ml-2"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-rose-100 flex items-center gap-2 bg-white">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a respectful message..."
                  className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#801b34]/30 focus:border-[#801b34]"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2.5 rounded-full bg-[#801b34] text-white hover:bg-[#681429] transition-colors cursor-pointer disabled:opacity-40 shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: MEMBERSHIP & BILLING (FLOW 4: PLANS & RENEWALS) */}
        {/* ======================================================== */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            
            {/* 1. Main Subscription Status Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-rose-100 relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-gray-400">
                      Current Subscription
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      subscription?.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : subscription?.status === 'pending_verification'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {subscription?.status === 'active' ? '● Active' : subscription?.status === 'pending_verification' ? '● Verification Pending' : '● Cancelled'}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold font-serif text-gray-900 flex items-center gap-2">
                    <span>{subscription?.planName || 'Basic Explorer'}</span>
                    {subscription?.planId === 'vip' ? (
                      <Crown className="w-5 h-5 text-amber-500" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-[#801b34]" />
                    )}
                  </h2>

                  <p className="text-xs text-gray-600">
                    {subscription?.planId === 'free'
                      ? 'You are currently on the Free Basic plan. Upgrade to unlock direct messaging & contact details.'
                      : `Billed ${subscription?.paymentMethod} &bull; Ref: ${subscription?.transactionId}`}
                  </p>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsCheckoutModalOpen(true)}
                    className="px-5 py-2.5 bg-[#801b34] hover:bg-[#681429] text-white text-xs font-bold rounded-xl transition-all shadow cursor-pointer flex items-center gap-1.5"
                  >
                    <Crown className="w-4 h-4 text-amber-300" />
                    <span>{subscription?.planId === 'vip' ? 'Extend Plan' : 'Upgrade Membership'}</span>
                  </button>

                  {subscription?.planId !== 'free' && (
                    <button
                      onClick={() => {
                        setCancelStep('survey');
                        setIsCancelModalOpen(true);
                      }}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel Membership
                    </button>
                  )}
                </div>
              </div>

              {/* Subscription Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100/70">
                  <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                    <CalendarDays className="w-4 h-4 text-[#801b34]" />
                    <span>Valid Until</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {subscription?.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'Lifetime'}
                  </div>
                  <span className="text-[11px] text-[#801b34] font-medium block mt-0.5">
                    {subscription?.status === 'active' ? 'Full Member Privileges' : 'Lapsed / Reverts to Free'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100/70">
                  <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                    <Bell className="w-4 h-4 text-amber-700" />
                    <span>Flow 4 Expiry Reminders</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    SMS & Email Active
                  </div>
                  <span className="text-[11px] text-gray-600 block mt-0.5">
                    Alerts dispatched 7 days & 1 day before
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/70">
                  <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-gray-700" />
                      <span>Auto-Renewal</span>
                    </span>
                    <button
                      onClick={() => {
                        if (subscription) {
                          const updated = apiService.updateAutoRenew(!subscription.autoRenew);
                          setSubscription(updated);
                          showToast(updated.autoRenew ? 'Auto-renew turned ON.' : 'Auto-renew turned OFF.');
                        }
                      }}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                        subscription?.autoRenew
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {subscription?.autoRenew ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {subscription?.autoRenew
                      ? 'Seamless renewal enabled with saved payment method.'
                      : 'Account gracefully reverts to Free Basic on expiry date (data kept).'}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Plan Comparison Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-rose-100">
              <h3 className="text-lg font-bold font-serif text-gray-900 mb-4">
                Membership Tier Privileges
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500">
                      <th className="py-3 pr-4 font-semibold">Feature / Privilege</th>
                      <th className="py-3 px-4 font-semibold text-center">Basic Explorer</th>
                      <th className="py-3 px-4 font-semibold text-center text-[#801b34]">Premium</th>
                      <th className="py-3 pl-4 font-semibold text-center text-amber-700">Elite VIP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-3 pr-4 font-medium text-gray-800">Browse verified profiles</td>
                      <td className="py-3 px-4 text-center">✓</td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓</td>
                      <td className="py-3 pl-4 text-center text-emerald-600 font-bold">✓</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-gray-800">Direct Chat & Unlimited Messaging</td>
                      <td className="py-3 px-4 text-center text-gray-300">—</td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓</td>
                      <td className="py-3 pl-4 text-center text-emerald-600 font-bold">✓</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-gray-800">View Verified Phone & Family Numbers</td>
                      <td className="py-3 px-4 text-center text-gray-300">—</td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓</td>
                      <td className="py-3 pl-4 text-center text-emerald-600 font-bold">✓</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-gray-800">Horoscope Matching (Porondam)</td>
                      <td className="py-3 px-4 text-center text-gray-300">—</td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓</td>
                      <td className="py-3 pl-4 text-center text-emerald-600 font-bold">✓</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-gray-800">Personal Matrimonial Matchmaker Advisor</td>
                      <td className="py-3 px-4 text-center text-gray-300">—</td>
                      <td className="py-3 px-4 text-center text-gray-300">—</td>
                      <td className="py-3 pl-4 text-center text-amber-600 font-bold">✓ Dedicated</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Transaction History */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-rose-100 text-xs">
              <h3 className="font-bold font-serif text-gray-900 text-base mb-3">
                Billing Receipts & Invoices
              </h3>
              <div className="border border-gray-200/80 rounded-2xl overflow-hidden divide-y divide-gray-100">
                <div className="p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-gray-900 block">{subscription?.planName || 'Plan Purchase'}</span>
                    <span className="text-[11px] text-gray-500 font-mono">
                      Ref: {subscription?.transactionId} &bull; {subscription?.paymentMethod}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-900">
                      LKR {subscription?.amountLkr ? subscription.amountLkr.toLocaleString() : '3,900'}
                    </span>
                    <button
                      onClick={() => window.print()}
                      className="text-xs text-[#801b34] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Download Receipt</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* FLOW 4: CANCELLATION & RETENTION SURVEY MODAL           */}
        {/* ======================================================== */}
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-7 border border-rose-100">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h3 className="font-bold font-serif text-gray-900 text-lg">
                  {cancelStep === 'survey' ? 'Cancellation Survey' : cancelStep === 'retention' ? 'Exclusive Stay Offer' : 'Confirm Cancellation'}
                </h3>
                <button
                  onClick={() => setIsCancelModalOpen(false)}
                  className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* STEP 1: SURVEY REASON */}
              {cancelStep === 'survey' && (
                <div className="py-4 space-y-4">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    We are continuously refining Aura Matrimony to best serve families. Please let us know the main reason for your cancellation:
                  </p>

                  <div className="space-y-2">
                    {[
                      'I found my life partner on Aura Matrimony! 🎉',
                      'Subscription fee is too high right now',
                      'Taking a temporary break from matchmaking',
                      'Not enough matching candidates in my profession/community',
                      'Other personal reasons',
                    ].map((reason) => (
                      <label
                        key={reason}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          cancelReason === reason
                            ? 'border-[#801b34] bg-rose-50 text-gray-900 font-semibold'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="cancelReason"
                          value={reason}
                          checked={cancelReason === reason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          className="text-[#801b34] focus:ring-0"
                        />
                        <span>{reason}</span>
                      </label>
                    ))}
                  </div>

                  {/* Flow 5 Celebration Hook inside Cancellation */}
                  {cancelReason.includes('found my life partner') && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-xs text-rose-900 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-[#801b34]">
                        <Heart className="w-4 h-4 fill-[#801b34]" />
                        <span>Congratulations from the Aura Family! 💍</span>
                      </div>
                      <p className="text-[11px] text-gray-700 leading-relaxed">
                        We are thrilled for your union! You can share your story and photos on our Success Stories showcase before closing your membership:
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCancelModalOpen(false);
                          setIsFoundMatchOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-[#801b34] text-white rounded-lg text-xs font-bold hover:bg-[#681429] cursor-pointer shadow-xs flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Submit Love Story (Flow 5)</span>
                      </button>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsCancelModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
                    >
                      Keep Subscription
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (cancelReason.includes('found my life partner')) {
                          // Flow 5 hook
                          setCancelStep('confirm');
                        } else {
                          setCancelStep('retention');
                        }
                      }}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-[#801b34] hover:bg-[#681429] text-white cursor-pointer"
                    >
                      Continue &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: RETENTION OFFER (Flow 4 - "Accept retention offer?") */}
              {cancelStep === 'retention' && (
                <div className="py-4 space-y-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <Sparkles className="w-7 h-7" />
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                      Special 30% Retention Offer
                    </span>
                    <h4 className="text-xl font-bold font-serif text-gray-900 mt-2">
                      Stay with Aura for 30% Off
                    </h4>
                    <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto leading-relaxed">
                      We want to support your sincere journey to marriage. Keep your Premium privileges for the next 3 months at just <strong>LKR 2,730</strong> (save LKR 1,170).
                    </p>
                  </div>

                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3 text-xs text-left space-y-1">
                    <div className="font-semibold text-gray-900">What you keep:</div>
                    <ul className="text-[11px] text-gray-600 space-y-1">
                      <li>• Unlimited chat & verified phone contact sharing</li>
                      <li>• 5x boosted profile placement in matches</li>
                      <li>• Complete horoscope & Porondam compatibility reports</li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        apiService.cancelSubscription(cancelReason, true);
                        if (subscription) {
                          setSubscription({ ...subscription, retentionDiscountApplied: true });
                        }
                        setIsCancelModalOpen(false);
                        showToast('Offer accepted! 30% discount applied to your renewal.');
                      }}
                      className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                    >
                      Accept 30% Off & Stay
                    </button>

                    <button
                      type="button"
                      onClick={() => setCancelStep('confirm')}
                      className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Decline & Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: CONFIRM CANCELLATION & POLICY REFUND */}
              {cancelStep === 'confirm' && (
                <div className="py-4 space-y-4 text-xs text-gray-600">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                    <div className="font-bold text-gray-900">Summary of Cancellation:</div>
                    <ul className="space-y-1 text-[11px]">
                      <li>• Auto-renew is turned <strong>OFF</strong> immediately.</li>
                      <li>• Your member privileges remain active until <strong>{subscription?.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'period end'}</strong>.</li>
                      <li>• <strong>No data loss:</strong> Profile and previous chats remain saved when reverting to Free Basic.</li>
                    </ul>
                  </div>

                  {/* Flow 4: Request refund check */}
                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={refundRequested}
                      onChange={(e) => setRefundRequested(e.target.checked)}
                      className="rounded text-[#801b34] mt-0.5 focus:ring-0"
                    />
                    <div className="text-[11px]">
                      <span className="font-bold text-gray-800 block">Request Finance Policy Refund</span>
                      <span className="text-gray-500">
                        Check if eligible under Aura&apos;s 7-day money-back satisfaction guarantee. Finance team will review your ticket within 2 business days.
                      </span>
                    </div>
                  </label>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCancelModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      Keep Subscription
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = apiService.cancelSubscription(cancelReason, false, refundRequested);
                        setSubscription(updated);
                        setIsCancelModalOpen(false);
                        showToast(
                          refundRequested
                            ? 'Subscription cancelled and refund request submitted to Finance.'
                            : 'Auto-renewal cancelled. Plan active until end of billing cycle.'
                        );
                      }}
                      className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl cursor-pointer shadow"
                    >
                      Confirm Cancellation
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Flow 4 Checkout Modal */}
        <CheckoutModal
          isOpen={isCheckoutModalOpen}
          initialPlanId={subscription?.planId === 'free' ? 'premium' : subscription?.planId}
          onClose={() => setIsCheckoutModalOpen(false)}
          onSuccess={(newSub) => {
            setSubscription(newSub);
            setIsCheckoutModalOpen(false);
            showToast(`Membership successfully activated: ${newSub.planName}!`);
          }}
        />

        {/* Flow 5 "Found My Match" Celebration Modal */}
        <FoundMatchModal
          isOpen={isFoundMatchOpen}
          onClose={() => setIsFoundMatchOpen(false)}
          onSuccessSubmitted={(submission) => {
            setMySuccessStory(submission);
            if (submission.hideProfilesOnSuccess) {
              setIsPaused(true);
            }
            showToast('🎉 Success story submitted! May your union be blessed.');
          }}
        />

        {/* Flow 5 Account Closure, Pause, Deactivate & Deletion Modal */}
        <AccountClosureModal
          isOpen={isAccountClosureOpen}
          subscription={subscription}
          currentStatus={closureStatus}
          onClose={() => setIsAccountClosureOpen(false)}
          onLoggedOut={() => {
            router.push('/');
          }}
          onStatusChanged={(newStatus) => {
            setClosureStatus(newStatus);
            if (newStatus.status === 'paused') {
              setIsPaused(true);
              showToast('Profile paused (hidden in search, chats kept).');
            } else if (newStatus.status === 'active') {
              setIsPaused(false);
              showToast('Profile active and discoverable in search.');
            }
          }}
        />

      </div>
    </div>
  );
};

