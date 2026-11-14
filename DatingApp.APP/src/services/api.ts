import { MatchRequest, Profile, ProfileKycDetails, SuccessStory, PricingPlan, FaqItem } from '../types';

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

/** An API failure with the ProblemDetails `code` (e.g. CODE_INVALID) and extras such as `attemptsLeft`. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly extras: { attemptsLeft?: number; retryAfterSeconds?: number } = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const NETWORK_ERROR = 'We couldn’t reach Vikasitha. Check your connection and try again.';

async function toApiError(res: Response, fallback: string): Promise<ApiError> {
  const body: { title?: string; message?: string; code?: string; attemptsLeft?: number; retryAfterSeconds?: number } =
    await res.json().catch(() => ({}));
  return new ApiError(body.title || body.message || fallback, res.status, body.code, {
    attemptsLeft: body.attemptsLeft,
    retryAfterSeconds: body.retryAfterSeconds,
  });
}

/** Gets a new access token from the httpOnly refresh cookie. Returns null when the session has ended. */
async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (!res.ok) return null;
    const session: AuthSession = await res.json();
    if (typeof window !== 'undefined') {
      // keep the profile fields the app already stored; replace only the token
      const raw = localStorage.getItem('aura_session');
      const current = raw ? (JSON.parse(raw) as AuthSession) : session;
      storeSession({ ...current, token: session.token });
    }
    return session.token;
  } catch {
    return null;
  }
}

/** fetch with the access token; on 401 refreshes once and retries (access tokens last 15 minutes). */
async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const send = (token: string | null) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { ...(init.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
  const token = typeof window !== 'undefined' ? localStorage.getItem('aura_token') : null;
  let res = await send(token);
  if (res.status === 401) {
    const fresh = await refreshAccessToken();
    if (fresh) res = await send(fresh);
  }
  return res;
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
  // Home feed (featured profiles, stories, plans, FAQs) — from the database only. Null when the API can't be reached.
  async getHomeContent(): Promise<HomeContentResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/content/home`, { cache: 'no-store' });
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  // Success stories shared by real couples (GET /api/content/stories).
  async getStories(): Promise<SuccessStory[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/content/stories`, { cache: 'no-store' });
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
    return res.json();
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
    return res.json();
  },

  // The signed-in member's own profile (null when not created yet or not signed in).
  async getMyProfile(): Promise<Profile | null> {
    if (typeof window === 'undefined' || !localStorage.getItem('aura_token')) return null;
    try {
      const res = await authFetch('/profiles/me');
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  /**
   * Re-reads the member from the server (GET /auth/me) so verification status and plan are current
   * (e.g. after the safety team approves the profile). Keeps the cached token.
   */
  async refreshSession(): Promise<void> {
    if (typeof window === 'undefined' || !localStorage.getItem('aura_token')) return;
    try {
      const res = await authFetch('/auth/me');
      if (!res.ok) return;
      const me: AuthSession = await res.json();
      const raw = localStorage.getItem('aura_session');
      const current = raw ? (JSON.parse(raw) as AuthSession) : me;
      storeSession({ ...current, ...me, token: localStorage.getItem('aura_token') || current.token });
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
      throw new ApiError(NETWORK_ERROR, 0);
    }
    if (!res.ok) throw await toApiError(res, 'Registration failed. Please try again.');
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
      throw new ApiError(NETWORK_ERROR, 0);
    }
    if (!res.ok) throw await toApiError(res, 'We couldn’t send the code. Please try again.');
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
      throw new ApiError(NETWORK_ERROR, 0);
    }
    if (!res.ok) throw await toApiError(res, 'That code isn’t right.');
    const json: AuthSession = await res.json();
    storeSession(json);
    return json;
  },

  // Create or Update Candidate Profile Details (Step 2/3)
  async createOrUpdateProfile(profileData: CreateProfilePayload): Promise<Profile> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('aura_token') : null;

    // Only a real session can save a profile (old builds stored placeholder tokens like "demo-…").
    const hasRealToken = !!token && !/^(demo|otp|google)-/.test(token);

    if (hasRealToken) {
      let res: Response;
      try {
        res = await authFetch('/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileData),
        });
      } catch {
        throw new ApiError(NETWORK_ERROR, 0);
      }
      // Signed in: a failed save is a real error — never pretend it worked (BUG-014).
      if (!res.ok) throw await toApiError(res, 'We couldn’t save your profile. Please try again.');

      const savedProfile: Profile = await res.json();
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
    }

    // Not signed in: never invent a local profile (BUG-014) — the member must log in first.
    throw new ApiError('Please log in again to submit your profile.', 401, 'UNAUTHENTICATED');
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
