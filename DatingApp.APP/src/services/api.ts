import { MatchRequest, Profile, ProfileKycDetails, SuccessStory, PricingPlan, FaqItem } from '../types';
import { resolvePhoto } from '../content/avatars';

import {
  API_BASE_URL,
  ApiError,
  NETWORK_ERROR,
  SESSION_KEY,
  apiRequest,
  hasStoredSession,
  onSessionExpired,
  onTokenRefreshed,
  setAccessToken,
  toApiError,
} from '../lib/http';

export { ApiError } from '../lib/http';

/** Reads the message from an RFC 7807 ProblemDetails error (`title`), falling back to older `{ message }` bodies. */
async function problemMessage(res: Response, fallback: string): Promise<string> {
  const body: { title?: string; message?: string } = await res.json().catch(() => ({}));
  return body.title || body.message || fallback;
}

/** The API stores avatars as "avatar:<id>"; screens get an image they can show. */
function withPhoto<T extends { photoUrl?: string | null }>(item: T): T {
  return item && item.photoUrl ? { ...item, photoUrl: resolvePhoto(item.photoUrl) } : item;
}

function readStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

/**
 * Signs the member in on this browser. The access token goes to memory only (BUG-017, S01-T05);
 * localStorage keeps the member details without any token. The long-lived refresh token is an
 * httpOnly cookie the browser sends to /api/auth/refresh.
 */
function storeSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  session = withPhoto(session);
  if (session.token) setAccessToken(session.token);
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, token: '' }));
  localStorage.removeItem('aura_token'); // older builds kept the token here
  localStorage.removeItem('aura_auth_user');
  window.dispatchEvent(new Event('aura_auth_change'));
}

function clearLocalSession(): void {
  if (typeof window === 'undefined') return;
  setAccessToken(null);
  localStorage.removeItem('aura_token');
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('aura_auth_user');
  localStorage.removeItem('aura_review_status');
  localStorage.removeItem('vk-kyc');
  localStorage.removeItem('vk-plan');
  window.dispatchEvent(new Event('aura_auth_change'));
  window.dispatchEvent(new Event('vk-kyc-change'));
  window.dispatchEvent(new Event('vk-plan-change'));
}

// Keep the stored member details in step with each refresh; end the local session when the server has.
onTokenRefreshed((fresh) => {
  const current = readStoredSession();
  storeSession({ ...(current ?? (fresh as unknown as AuthSession)), ...(fresh as unknown as AuthSession) });
});
onSessionExpired(() => clearLocalSession());

// Another tab signed in as someone else (or signed out): this tab's screen belongs to the old account, but its next
// token refresh would use the shared refresh cookie of the new one — e.g. A's chat sending as B. Reload so the page
// always shows the account it really talks to the API as.
if (typeof window !== 'undefined') {
  const userOf = (raw: string | null) => {
    try {
      return raw ? ((JSON.parse(raw) as { userId?: string }).userId ?? null) : null;
    } catch {
      return null;
    }
  };
  window.addEventListener('storage', (e) => {
    if (e.key !== SESSION_KEY) return;
    if (userOf(e.oldValue) !== userOf(e.newValue)) window.location.reload();
  });
}

// Older builds stored the access token in localStorage — remove it on load (BUG-017).
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('aura_token');
  } catch {
    /* storage blocked */
  }
}

/** fetch with the access token (restored from the refresh cookie after a reload); refreshes once on 401. */
function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return apiRequest(path, init);
}

export interface HomeContentResponse {
  featuredProfiles: Profile[];
  successStories: SuccessStory[];
  pricingPlans: PricingPlan[];
  faqs: FaqItem[];
  totalVerifiedCount: number;
  totalWeddingsCount: number;
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
  isVerified?: boolean;
  isUnderReview?: boolean;
  /** None · Draft · Submitted · ChangesRequested · Resubmitted · Approved · Suspended */
  profileStatus?: string;
  isPremium?: boolean;
  planId?: string;
  photoUrl?: string;
}

/** Result of POST /auth/register. Mobile sign-ups must confirm the SMS code before they are signed in. */
export interface RegisterResult {
  phoneVerificationRequired: boolean;
  userId: string;
  phoneNumber: string;
  session?: AuthSession;
}

export interface CreateProfilePayload {
  fullName: string;
  /** saved to the account when given */
  email?: string;
  gender: 'female' | 'male';
  /** yyyy-mm-dd — the API works out the age */
  dateOfBirth: string;
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
  /** "" | "avatar:<id>" | https URL — never image data */
  photoUrl: string;
  interests: string[];
  details?: ProfileKycDetails;
}

export const apiService = {
  // Home feed (featured profiles, stories, plans, FAQs) — from the database only. Null when the API can't be reached.
  async getHomeContent(): Promise<HomeContentResponse | null> {
    try {
      const res = await apiRequest('/content/home', { cache: 'no-store', auth: false });
      if (!res.ok) return null;
      const home: HomeContentResponse = await res.json();
      return { ...home, featuredProfiles: (home.featuredProfiles ?? []).map(withPhoto) };
    } catch {
      return null;
    }
  },

  // Success stories shared by real couples (GET /api/content/stories).
  async getStories(): Promise<SuccessStory[]> {
    try {
      const res = await apiRequest('/content/stories', { cache: 'no-store', auth: false });
      return res.ok ? await res.json() : [];
    } catch {
      return [];
    }
  },

  // Members in the database matching the filters (GET /api/profiles). Throws ApiError when the API fails.
  async getProfiles(filters?: {
    gender?: string;
    ageFrom?: number;
    ageTo?: number;
    profession?: string;
    location?: string;
    verifiedOnly?: boolean;
  }): Promise<Profile[]> {
    const params = new URLSearchParams();
    if (filters?.gender) params.append('gender', filters.gender);
    if (filters?.ageFrom) params.append('ageFrom', filters.ageFrom.toString());
    if (filters?.ageTo) params.append('ageTo', filters.ageTo.toString());
    if (filters?.profession && filters.profession !== 'All') params.append('profession', filters.profession);
    if (filters?.location && filters.location !== 'All') params.append('location', filters.location);
    if (filters?.verifiedOnly) params.append('verifiedOnly', 'true');

    let res: Response;
    try {
      res = await authFetch(`/profiles?${params.toString()}`, { cache: 'no-store' });
    } catch {
      throw new ApiError(NETWORK_ERROR, 0);
    }
    if (!res.ok) throw await toApiError(res, 'We couldn’t load profiles. Please try again.');
    return ((await res.json()) as Profile[]).map(withPhoto);
  },

  // One member's profile. Null when it doesn't exist; throws ApiError when the API fails.
  async getProfileById(id: string): Promise<Profile | null> {
    let res: Response;
    try {
      res = await authFetch(`/profiles/${encodeURIComponent(id)}`, { cache: 'no-store' });
    } catch {
      throw new ApiError(NETWORK_ERROR, 0);
    }
    if (res.status === 404 || res.status === 400) return null;
    if (!res.ok) throw await toApiError(res, 'We couldn’t load this profile. Please try again.');
    return withPhoto((await res.json()) as Profile);
  },

  // The signed-in member's own profile (null when not created yet or not signed in).
  async getMyProfile(): Promise<Profile | null> {
    if (!hasStoredSession()) return null;
    try {
      const res = await authFetch('/profiles/me');
      return res.ok ? withPhoto((await res.json()) as Profile) : null;
    } catch {
      return null;
    }
  },

  /**
   * Re-reads the member from the server (GET /auth/me) so verification status and plan are current
   * (e.g. after the safety team approves the profile). Keeps the cached token.
   */
  async refreshSession(): Promise<void> {
    if (!hasStoredSession()) return;
    try {
      const res = await authFetch('/auth/me');
      if (!res.ok) return;
      const me: AuthSession = await res.json();
      storeSession({ ...(readStoredSession() ?? me), ...me, token: '' });
      window.dispatchEvent(new Event('vk-kyc-change'));
      window.dispatchEvent(new Event('vk-plan-change'));
    } catch {
      /* offline: keep the cached session */
    }
  },

  // Authentication: Register with Email. No fake session if the API fails (BUG-003).
  async register(data: {
    fullName?: string;
    email?: string;
    password: string;
    phoneNumber?: string;
    profileFor?: string;
    gender?: string;
  }): Promise<RegisterResult> {
    let res: Response;
    try {
      res = await apiRequest('/auth/register', {
        auth: false,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // e-mail sign-up receives the httpOnly refresh cookie
        body: JSON.stringify(data),
      });
    } catch {
      throw new ApiError(NETWORK_ERROR, 0);
    }
    if (!res.ok) throw await toApiError(res, 'Registration failed. Please try again.');
    // 201: mobile sign-up — no session until the SMS code is confirmed (POST /auth/verify-otp)
    if (res.status === 201) {
      const pending: { userId: string; phoneNumber: string } = await res.json();
      return { phoneVerificationRequired: true, userId: pending.userId, phoneNumber: pending.phoneNumber };
    }
    const json: AuthSession = await res.json();
    storeSession(json);
    return { phoneVerificationRequired: false, userId: json.userId, phoneNumber: json.phoneNumber ?? '', session: json };
  },

  // Authentication: Login with Email or Mobile
  async login(credentials: { email: string; password: string }): Promise<AuthSession> {
    let res: Response;
    try {
      res = await apiRequest('/auth/login', {
        auth: false,
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
        storeSession(json);
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
      res = await apiRequest('/auth/google-login', {
        auth: false,
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
      window.dispatchEvent(new Event('vk-kyc-change'));
      window.dispatchEvent(new Event('vk-plan-change'));
    }
    return session;
  },

  // Authentication: Send a 6-digit code by SMS. The code is never in the response (BUG-001).
  async sendOtp(phoneNumber: string): Promise<{ success: boolean; message: string; resendAvailableInSeconds?: number; resendsLeft?: number }> {
    let res: Response;
    try {
      res = await apiRequest('/auth/send-otp', {
        auth: false,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
    } catch {
      throw new ApiError(NETWORK_ERROR, 0);
    }
    if (!res.ok) throw await toApiError(res, 'We couldn’t send the code. Please try again.');
    return res.json();
  },

  // Authentication: Verify the SMS code (signs the member in).
  async verifyOtp(phoneNumber: string, otpCode: string, fullName?: string): Promise<AuthSession> {
    let res: Response;
    try {
      res = await apiRequest('/auth/verify-otp', {
        auth: false,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phoneNumber, otpCode, fullName }),
      });
    } catch {
      throw new ApiError(NETWORK_ERROR, 0);
    }
    if (!res.ok) throw await toApiError(res, 'That code isn’t right.');
    const json: AuthSession = await res.json();
    storeSession(json);
    return json;
  },

  // Create or Update Candidate Profile Details (Step 2/3)
  async createOrUpdateProfile(profileData: CreateProfilePayload): Promise<Profile> {
    // Not signed in: never invent a local profile (BUG-014) — the member must log in first.
    if (!hasStoredSession()) throw new ApiError('Please log in again to submit your profile.', 401, 'UNAUTHENTICATED');

    // Signed in: a failed save is a real error — never pretend it worked (BUG-014).
    const res = await authFetch('/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
    if (!res.ok) throw await toApiError(res, 'We couldn’t save your profile. Please try again.');

    const savedProfile: Profile = withPhoto((await res.json()) as Profile);
    const current = readStoredSession();
    if (current) {
      storeSession({ ...current, hasCompletedProfile: true, profileId: savedProfile.id, fullName: savedProfile.name, token: '' });
    }
    return savedProfile;
  },

  // Match Interest Request
  // Send an interest (POST /api/match-requests). Throws ApiError on failure — never pretends it was sent.
  async sendMatchRequest(receiverProfileId: string, note?: string): Promise<MatchRequest> {
    let res: Response;
    try {
      res = await authFetch('/match-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverProfileId, note }),
      });
    } catch {
      throw new ApiError(NETWORK_ERROR, 0);
    }
    if (!res.ok) throw await toApiError(res, 'We couldn’t send your interest. Please try again.');
    return res.json();
  },

  // Interests I sent and received (GET /api/match-requests/my).
  async getMyRequests(): Promise<MatchRequest[]> {
    let res: Response;
    try {
      res = await authFetch('/match-requests/my');
    } catch {
      throw new ApiError(NETWORK_ERROR, 0);
    }
    if (!res.ok) throw await toApiError(res, 'We couldn’t load your interests. Please try again.');
    return res.json();
  },

  // Accept or decline a received interest (PUT /api/match-requests/{id}/respond).
  async respondMatchRequest(requestId: string, accept: boolean): Promise<MatchRequest> {
    let res: Response;
    try {
      res = await authFetch(`/match-requests/${encodeURIComponent(requestId)}/respond`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept }),
      });
    } catch {
      throw new ApiError(NETWORK_ERROR, 0);
    }
    if (!res.ok) throw await toApiError(res, 'We couldn’t update this interest. Please try again.');
    return res.json();
  },

  // Flow 4: Subscriptions & Billing
  logoutAllDevices(): void {
    if (typeof window !== 'undefined') {
      // End the session on the server and clear the httpOnly refresh cookie (fire-and-forget).
      fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include', keepalive: true }).catch(() => undefined);
      clearLocalSession();
      sessionStorage.clear();

      try {
        const googleAuth = (window as unknown as { google?: { accounts?: { id?: { disableAutoSelect?: () => void } } } }).google;
        googleAuth?.accounts?.id?.disableAutoSelect?.();
      } catch (e) {
        console.warn('Google auto-select disable notice:', e);
      }
    }
  },
};
