/**
 * One typed fetch helper for every API call (S01-T12, TD-04).
 *
 * - The access token lives in memory only (BUG-017). After a reload it is restored from the
 *   httpOnly refresh cookie with POST /auth/refresh — JavaScript never sees a long-lived secret.
 * - Every request has a timeout, so a hung server never leaves a spinner forever.
 * - Errors are RFC 7807 ProblemDetails, turned into `ApiError` (title → message, code → code).
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const NETWORK_ERROR = "We couldn’t reach Vikasitha. Check your connection and try again.";
const TIMEOUT_ERROR = "Vikasitha is taking too long to answer. Please try again.";
const DEFAULT_TIMEOUT_MS = 15_000;

/** Signed-in member details kept in localStorage — never the token (see `SESSION_KEY`). */
export const SESSION_KEY = "aura_session";

/** An API failure with the ProblemDetails `code` (e.g. CODE_INVALID) and extras such as `attemptsLeft`. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly extras: { attemptsLeft?: number; retryAfterSeconds?: number } = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function toApiError(res: Response, fallback: string): Promise<ApiError> {
  const body: { title?: string; message?: string; code?: string; attemptsLeft?: number; retryAfterSeconds?: number } =
    await res.json().catch(() => ({}));
  return new ApiError(body.title || body.message || fallback, res.status, body.code, {
    attemptsLeft: body.attemptsLeft,
    retryAfterSeconds: body.retryAfterSeconds,
  });
}

/* ------------------------------------------------------------------ */
/* Access token (memory only)                                          */
/* ------------------------------------------------------------------ */
let accessToken: string | null = null;
let refreshing: Promise<string | null> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token || null;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/** True when this browser has a signed-in member (the token itself may still need restoring). */
export function hasStoredSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !!window.localStorage.getItem(SESSION_KEY);
  } catch {
    return false;
  }
}

/** Called with the new token after every successful refresh (api.ts keeps the stored session in step). */
let onRefreshed: ((session: { token: string } & Record<string, unknown>) => void) | null = null;
export function onTokenRefreshed(handler: typeof onRefreshed): void {
  onRefreshed = handler;
}

/** Called when the refresh cookie is gone or rejected: the session has really ended. */
let onSessionEnded: (() => void) | null = null;
export function onSessionExpired(handler: typeof onSessionEnded): void {
  onSessionEnded = handler;
}

/**
 * New access token from the httpOnly refresh cookie. Concurrent callers share one request,
 * because the refresh token rotates and a second parallel refresh would look like reuse.
 */
export function refreshAccessToken(): Promise<string | null> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const res = await withTimeout(`${API_BASE_URL}/auth/refresh`, { method: "POST", credentials: "include" });
      if (!res.ok) {
        setAccessToken(null);
        if (res.status === 401) onSessionEnded?.();
        return null;
      }
      const session = (await res.json()) as { token: string } & Record<string, unknown>;
      setAccessToken(session.token);
      onRefreshed?.(session);
      return session.token;
    } catch {
      return null; // offline: keep the stored session, try again later
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/** The current access token, restoring it from the refresh cookie after a reload. */
export async function ensureAccessToken(): Promise<string | null> {
  if (accessToken) return accessToken;
  if (!hasStoredSession()) return null;
  return refreshAccessToken();
}

/* ------------------------------------------------------------------ */
/* Requests                                                            */
/* ------------------------------------------------------------------ */
export interface RequestOptions extends RequestInit {
  /** JSON body (serialised for you). Takes the place of `body`. */
  json?: unknown;
  /** Send the access token, refreshing once on 401. Default true. */
  auth?: boolean;
  timeoutMs?: number;
}

async function withTimeout(url: string, init: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const outerSignal = init.signal;
  const abortFromOuter = () => controller.abort();
  outerSignal?.addEventListener("abort", abortFromOuter);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (controller.signal.aborted && !outerSignal?.aborted) throw new ApiError(TIMEOUT_ERROR, 0, "TIMEOUT");
    if (outerSignal?.aborted) throw err;
    throw new ApiError(NETWORK_ERROR, 0, "NETWORK");
  } finally {
    clearTimeout(timer);
    outerSignal?.removeEventListener("abort", abortFromOuter);
  }
}

/**
 * fetch against the API. Resolves with the Response for any HTTP status;
 * rejects with ApiError(status 0) only when the server can't be reached or times out.
 */
export async function apiRequest(path: string, options: RequestOptions = {}): Promise<Response> {
  const { json, auth = true, timeoutMs, headers, ...init } = options;
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  const send = (token: string | null) =>
    withTimeout(
      url,
      {
        credentials: "include",
        ...init,
        headers: {
          ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
          ...((headers as Record<string, string>) || {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: json !== undefined ? JSON.stringify(json) : init.body,
      },
      timeoutMs,
    );

  if (!auth) return send(null);

  let res = await send(await ensureAccessToken());
  if (res.status === 401 && hasStoredSession()) {
    const fresh = await refreshAccessToken();
    if (fresh) res = await send(fresh);
  }
  return res;
}

/** apiRequest + JSON. Throws ApiError with the ProblemDetails message on any non-2xx. */
export async function apiJson<T>(path: string, options: RequestOptions & { fallbackError?: string } = {}): Promise<T> {
  const { fallbackError = "Something went wrong. Please try again.", ...rest } = options;
  const res = await apiRequest(path, rest);
  if (!res.ok) throw await toApiError(res, fallbackError);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
