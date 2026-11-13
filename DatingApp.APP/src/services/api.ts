import { Profile, ProfileKycDetails, SuccessStory, PricingPlan, FaqItem } from '../types';
import { mockProfiles, successStories, pricingPlans, faqs } from '../data/mockData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/** Reads the message from an RFC 7807 ProblemDetails error (`title`), falling back to older `{ message }` bodies. */
async function problemMessage(res: Response, fallback: string): Promise<string> {
  const body: { title?: string; message?: string } = await res.json().catch(() => ({}));
  return body.title || body.message || fallback;
}

/** Keeps the signed-in session in localStorage (TODO S01-T05 web part: access token in memory only, BUG-017). */
function storeSession(session: AuthSession): void {
  if (typeof window === 'undefined' || !session.token) return;
  localStorage.setItem('aura_token', session.token);
  localStorage.setItem('aura_session', JSON.stringify(session));
  localStorage.setItem('aura_auth_user', JSON.stringify(session));
  window.dispatchEvent(new Event('aura_auth_change'));
}

export interface HomeContentResponse {
  featuredProfiles: Profile[];
  successStories: SuccessStory[];
  pricingPlans: PricingPlan[];
  faqs: FaqItem[];
  totalVerifiedCount: number;
  totalWeddingsCount: number;
}

export interface SubscriptionInfo {
  planId: 'free' | 'premium' | 'vip';
  planName: string;
  durationMonths: number;
  startDate: string;
  expiresAt: string;
  status: 'active' | 'pending_verification' | 'cancelled' | 'expired';
  autoRenew: boolean;
  amountLkr: number;
  paymentMethod: string;
  transactionId: string;
  bankSlipUrl?: string;
  bankSlipRef?: string;
  retentionDiscountApplied?: boolean;
}

export interface SuccessStorySubmission {
  id: string;
  partnerProfileId: string;
  partnerName: string;
  partnerConfirmed: boolean;
  engagementStatus: 'Engaged' | 'Married' | 'Wedding Planned';
  rating: number; // 1 - 5
  title: string;
  story: string;
  weddingDate: string;
  location: string;
  photoUrl: string;
  consentToPublish: boolean;
  status: 'PendingAdminApproval' | 'Published' | 'Private';
  submittedAt: string;
  hideProfilesOnSuccess: boolean;
}

export interface AccountClosureStatus {
  status: 'active' | 'paused' | 'deactivated' | 'scheduled_for_deletion';
  gracePeriodEndsAt?: string;
  deletionReason?: string;
  scheduledAt?: string;
}

export interface AuthSession {
  token: string;
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  profileId?: string | null;
  hasCompletedProfile: boolean;
  subscription?: SubscriptionInfo;
  closureStatus?: AccountClosureStatus;
  isVerified?: boolean;
  isUnderReview?: boolean;
  isPremium?: boolean;
  planId?: string;
  photoUrl?: string;
}

export interface CreateProfilePayload {
  fullName: string;
  gender: 'female' | 'male';
  age: number;
  height: string;
  profession: string;
  professionCategory: 'Doctor' | 'Engineer' | 'IT' | 'Finance' | 'Legal' | 'Business' | 'Other';
  education: string;
  university: string;
  location: string;
  country: string;
  religion: string;
  community: string;
  bio: string;
  aboutFamily: string;
  horoscopeAvailable: boolean;
  photoUrl: string;
  interests: string[];
  details?: ProfileKycDetails;
}

export const apiService = {
  // Fetch home feed (featured profiles, stories, pricing, faqs)
  async getHomeContent(): Promise<HomeContentResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/content/home`, {
        cache: 'no-store',
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Backend API not reachable at', API_BASE_URL, '- falling back to embedded verified data.');
    }

    // Resilient fallback to mock store
    return {
      featuredProfiles: mockProfiles,
      successStories,
      pricingPlans,
      faqs,
      totalVerifiedCount: 50000,
      totalWeddingsCount: 12000,
    };
  },

  // Query profiles with filter criteria
  async getProfiles(filters?: {
    gender?: string;
    ageFrom?: number;
    ageTo?: number;
    profession?: string;
    location?: string;
  }): Promise<Profile[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.gender) params.append('gender', filters.gender);
      if (filters?.ageFrom) params.append('ageFrom', filters.ageFrom.toString());
      if (filters?.ageTo) params.append('ageTo', filters.ageTo.toString());
      if (filters?.profession && filters.profession !== 'All') params.append('profession', filters.profession);
      if (filters?.location && filters.location !== 'All') params.append('location', filters.location);

      const token = typeof window !== 'undefined' ? localStorage.getItem('aura_token') : null;
      const res = await fetch(`${API_BASE_URL}/profiles?${params.toString()}`, {
        cache: 'no-store',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('API error fetching profiles, using local dataset.');
    }

    // Local filter fallback
    return mockProfiles.filter((p) => {
      if (filters?.gender && p.gender !== filters.gender) return false;
      if (filters?.ageFrom && p.age < filters.ageFrom) return false;
      if (filters?.ageTo && p.age > filters.ageTo) return false;
      if (filters?.profession && filters.profession !== 'All' && p.professionCategory !== filters.profession) {
        return false;
      }
      if (filters?.location && filters.location !== 'All' && !p.location.includes(filters.location) && !p.country.includes(filters.location)) {
        return false;
      }
      return true;
    });
  },

  // Profile details
  async getProfileById(id: string): Promise<Profile | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/profiles/${id}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return mockProfiles.find((p) => p.id === id) || null;
  },

  // Get current logged-in candidate profile
  async getMyProfile(): Promise<Profile | null> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('aura_token') : null;
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/profiles/me`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const json: Profile = await res.json();
        return json;
      }
    } catch (e) {
      console.warn('API getMyProfile error:', e);
    }
    return null;
  },

  // Authentication: Register with Email. No fake session if the API fails (BUG-003).
  async register(data: {
    fullName: string;
    email: string;
    password: string;
    phoneNumber: string;
    profileFor?: string;
    gender?: string;
  }): Promise<AuthSession> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // receives the httpOnly refresh cookie
        body: JSON.stringify(data),
      });
    } catch {
      throw new Error('We couldn’t reach Vikasitha. Check your connection and try again.');
    }
    if (!res.ok) throw new Error(await problemMessage(res, 'Registration failed. Please try again.'));
    const json: AuthSession = await res.json();
    storeSession(json);
    return json;
  },

  // Authentication: Login with Email or Mobile
  async login(credentials: { email: string; password: string }): Promise<AuthSession> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // receives the httpOnly refresh cookie
        body: JSON.stringify(credentials),
      });
    } catch (networkErr: unknown) {
      console.warn('Network error connecting to API:', networkErr);
      throw new Error(`Unable to connect to authentication server at ${API_BASE_URL}. Please ensure the API is running.`);
    }

    if (res.ok) {
      const json: AuthSession = await res.json();
      if (typeof window !== 'undefined' && json.token) {
        localStorage.setItem('aura_token', json.token);
        localStorage.setItem('aura_session', JSON.stringify(json));
        localStorage.setItem('aura_auth_user', JSON.stringify(json));
        if (json.isUnderReview || json.isVerified === false || !json.hasCompletedProfile) {
          localStorage.setItem('aura_review_status', 'submitted');
          localStorage.setItem('vk-kyc', 'pending');
        } else {
          localStorage.setItem('vk-kyc', 'live');
        }
        localStorage.setItem('vk-plan', json.isPremium ? (json.planId || 'gold') : 'free');
        window.dispatchEvent(new Event('aura_auth_change'));
        window.dispatchEvent(new Event('vk-kyc-change'));
        window.dispatchEvent(new Event('vk-plan-change'));
      }
      return json;
    }

    throw new Error(await problemMessage(res, res.status === 401 ? 'Invalid email, mobile number or password.' : 'Login failed. Please try again.'));
  },

  // Authentication: Google Sign-In. Only the Google token is sent; the server verifies it (BUG-002).
  // No fake session when the API fails (BUG-003).
  async googleLogin(data: { email?: string; fullName?: string; photoUrl?: string; idToken?: string }): Promise<AuthSession> {
    if (!data.idToken) throw new Error('Google sign-in failed. Please try again.');
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/auth/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken: data.idToken }),
      });
    } catch {
      throw new Error('We couldn’t reach Vikasitha. Check your connection and try again.');
    }
    if (!res.ok) throw new Error(await problemMessage(res, 'Google sign-in failed. Please try again.'));

    const json: AuthSession = await res.json();
    const session: AuthSession = { ...json, planId: json.planId || 'free', photoUrl: json.photoUrl || data.photoUrl };
    storeSession(session);
    if (typeof window !== 'undefined') {
      if (session.isUnderReview || session.isVerified === false || !session.hasCompletedProfile) {
        localStorage.setItem('aura_review_status', 'submitted');
        localStorage.setItem('vk-kyc', 'pending');
      } else {
        localStorage.setItem('vk-kyc', 'live');
      }
      localStorage.setItem('vk-plan', session.isPremium ? (session.planId || 'gold') : 'free');
      window.dispatchEvent(new Event('vk-kyc-change'));
      window.dispatchEvent(new Event('vk-plan-change'));
    }
    return session;
  },

  // Authentication: Send a 6-digit code by SMS. The code is never in the response (BUG-001).
  async sendOtp(phoneNumber: string): Promise<{ success: boolean; message: string; resendAvailableInSeconds?: number; resendsLeft?: number }> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
    } catch {
      throw new Error('We couldn’t reach Vikasitha. Check your connection and try again.');
    }
    if (!res.ok) throw new Error(await problemMessage(res, 'We couldn’t send the code. Please try again.'));
    return res.json();
  },

  // Authentication: Verify the SMS code (signs the member in).
  async verifyOtp(phoneNumber: string, otpCode: string, fullName?: string): Promise<AuthSession> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phoneNumber, otpCode, fullName }),
      });
    } catch {
      throw new Error('We couldn’t reach Vikasitha. Check your connection and try again.');
    }
    if (!res.ok) throw new Error(await problemMessage(res, 'That code isn’t right.'));
    const json: AuthSession = await res.json();
    storeSession(json);
    return json;
  },

  // Create or Update Candidate Profile Details (Step 2/3)
  async createOrUpdateProfile(profileData: CreateProfilePayload): Promise<Profile> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('aura_token') : null;

    // No real session → keep the profile locally (demo) instead of inventing an account (BUG-002/003).
    const hasRealToken = !!token && !/^(demo|otp|google)-/.test(token);

    if (hasRealToken) {
      try {
        const res = await fetch(`${API_BASE_URL}/profiles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(profileData),
        });

        if (res.ok) {
          const savedProfile: Profile = await res.json();
          console.log('✅ Profile successfully persisted to SQL Server database (LocalDB\\MSSQLLocalDB):', savedProfile);
          if (typeof window !== 'undefined') {
            const raw = localStorage.getItem('aura_session');
            if (raw) {
              const sess = JSON.parse(raw);
              sess.hasCompletedProfile = true;
              sess.profileId = savedProfile.id;
              sess.fullName = savedProfile.name;
              localStorage.setItem('aura_session', JSON.stringify(sess));
            }
          }
          return savedProfile;
        } else {
          const errorText = await res.text();
          console.error('API create profile returned error status:', res.status, errorText);
        }
      } catch (err) {
        console.warn('API create profile error:', err);
      }
    }

    // Local fallback
    const newProfile: Profile = {
      id: 'p-custom-' + Date.now(),
      code: `LK-${Math.floor(1000 + Math.random() * 9000)}`,
      name: profileData.fullName,
      gender: profileData.gender,
      age: profileData.age,
      height: profileData.height,
      profession: profileData.profession,
      professionCategory: profileData.professionCategory,
      education: profileData.education,
      location: profileData.location,
      country: profileData.country,
      religion: profileData.religion,
      community: profileData.community,
      verified: true,
      premium: false,
      photoUrl: profileData.photoUrl,
      bio: profileData.bio,
      aboutFamily: profileData.aboutFamily,
      horoscopeAvailable: profileData.horoscopeAvailable,
      interests: profileData.interests,
      details: profileData.details,
    };

    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('aura_session');
      if (raw) {
        const sess = JSON.parse(raw);
        sess.hasCompletedProfile = true;
        sess.profileId = newProfile.id;
        sess.fullName = newProfile.name;
        localStorage.setItem('aura_session', JSON.stringify(sess));
      }
    }

    return newProfile;
  },

  // Match Interest Request
  async sendMatchRequest(receiverProfileId: string, note?: string) {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aura_token') : null;
      const res = await fetch(`${API_BASE_URL}/match-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ receiverProfileId, note }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('API match request error:', err);
    }
    return { success: true, message: 'Request sent' };
  },

  // Get My Requests (Incoming & Sent)
  async getMyRequests(): Promise<any[]> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aura_token') : null;
      const res = await fetch(`${API_BASE_URL}/match-requests/my`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('API get requests error:', err);
    }
    return [];
  },

  // Respond to Request (Accept or Decline)
  async respondMatchRequest(requestId: string, accept: boolean) {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('aura_token') : null;
      const res = await fetch(`${API_BASE_URL}/match-requests/${requestId}/respond`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ accept }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('API respond match request error:', err);
    }
    return { success: true };
  },

  // Flow 4: Subscriptions & Billing
  getSubscription(): SubscriptionInfo {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('aura_subscription');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    // Default free plan
    return {
      planId: 'free',
      planName: 'Basic Explorer',
      durationMonths: 0,
      startDate: new Date().toISOString(),
      expiresAt: '2099-12-31T23:59:59Z',
      status: 'active',
      autoRenew: false,
      amountLkr: 0,
      paymentMethod: 'None',
      transactionId: 'TXN-FREE',
    };
  },

  activateSubscription(sub: SubscriptionInfo): SubscriptionInfo {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aura_subscription', JSON.stringify(sub));
      const rawSess = localStorage.getItem('aura_session');
      if (rawSess) {
        try {
          const sess = JSON.parse(rawSess);
          sess.subscription = sub;
          localStorage.setItem('aura_session', JSON.stringify(sess));
        } catch {}
      }
    }
    return sub;
  },

  updateAutoRenew(enabled: boolean): SubscriptionInfo {
    const current = this.getSubscription();
    current.autoRenew = enabled;
    return this.activateSubscription(current);
  },

  cancelSubscription(reason: string, acceptRetention: boolean, refundRequested?: boolean): SubscriptionInfo {
    const current = this.getSubscription();
    if (acceptRetention) {
      current.retentionDiscountApplied = true;
      current.autoRenew = true;
      return this.activateSubscription(current);
    }
    current.autoRenew = false;
    current.status = 'cancelled';
    if (typeof window !== 'undefined') {
      localStorage.setItem('aura_cancel_survey', JSON.stringify({
        reason,
        cancelledAt: new Date().toISOString(),
        refundRequested: !!refundRequested,
      }));
    }
    return this.activateSubscription(current);
  },

  verifyPromoCode(code: string): { valid: boolean; discountPercent: number; message: string } {
    const clean = code.trim().toUpperCase();
    if (clean === 'AURA30' || clean === 'WELCOME30') {
      return { valid: true, discountPercent: 30, message: '30% Special Introductory Discount Applied!' };
    }
    if (clean === 'PROMO50' || clean === 'MATCH50') {
      return { valid: true, discountPercent: 50, message: '50% Half-Price Festival Discount Applied!' };
    }
    if (clean === 'VIP2025' || clean === 'VIP2026') {
      return { valid: true, discountPercent: 25, message: '25% Elite VIP Matchmaker Discount Applied!' };
    }
    return { valid: false, discountPercent: 0, message: 'Invalid or expired promo code.' };
  },

  // Flow 5: "Found My Match" & Success Story Submission
  submitSuccessStory(submission: SuccessStorySubmission): SuccessStorySubmission {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aura_my_success_story', JSON.stringify(submission));
      // If user chose to hide both profiles on success
      if (submission.hideProfilesOnSuccess) {
        this.pauseProfile(true);
      }
    }
    return submission;
  },

  getMySuccessStory(): SuccessStorySubmission | null {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('aura_my_success_story');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return null;
  },

  // Flow 5: Account Closure, Pause, Deactivate & Deletion
  pauseProfile(paused: boolean): AccountClosureStatus {
    const status: AccountClosureStatus = {
      status: paused ? 'paused' : 'active',
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('aura_closure_status', JSON.stringify(status));
      const rawSess = localStorage.getItem('aura_session');
      if (rawSess) {
        try {
          const sess = JSON.parse(rawSess);
          sess.closureStatus = status;
          localStorage.setItem('aura_session', JSON.stringify(sess));
        } catch {}
      }
    }
    return status;
  },

  deactivateAccount(): AccountClosureStatus {
    const status: AccountClosureStatus = {
      status: 'deactivated',
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('aura_closure_status', JSON.stringify(status));
    }
    return status;
  },

  scheduleAccountDeletion(reason: string, otpOrPassword: string, graceDays = 30): AccountClosureStatus {
    const graceEnds = new Date();
    graceEnds.setDate(graceEnds.getDate() + graceDays);

    const status: AccountClosureStatus = {
      status: 'scheduled_for_deletion',
      gracePeriodEndsAt: graceEnds.toISOString(),
      deletionReason: reason,
      scheduledAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('aura_closure_status', JSON.stringify(status));
    }
    return status;
  },

  restoreAccount(): AccountClosureStatus {
    const status: AccountClosureStatus = {
      status: 'active',
    };
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aura_closure_status');
    }
    return status;
  },

  getClosureStatus(): AccountClosureStatus {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('aura_closure_status');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return { status: 'active' };
  },

  logoutAllDevices(): void {
    if (typeof window !== 'undefined') {
      // End the session on the server and clear the httpOnly refresh cookie (fire-and-forget).
      fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include', keepalive: true }).catch(() => undefined);
      localStorage.removeItem('aura_token');
      localStorage.removeItem('aura_session');
      localStorage.removeItem('aura_auth_user');
      localStorage.removeItem('aura_review_status');
      localStorage.removeItem('vk-kyc');
      localStorage.removeItem('vk-plan');
      sessionStorage.clear();

      try {
        const googleAuth = (window as unknown as { google?: { accounts?: { id?: { disableAutoSelect?: () => void } } } }).google;
        googleAuth?.accounts?.id?.disableAutoSelect?.();
      } catch (e) {
        console.warn('Google auto-select disable notice:', e);
      }

      window.dispatchEvent(new Event('aura_auth_change'));
      window.dispatchEvent(new Event('vk-kyc-change'));
      window.dispatchEvent(new Event('vk-plan-change'));
    }
  },
};
