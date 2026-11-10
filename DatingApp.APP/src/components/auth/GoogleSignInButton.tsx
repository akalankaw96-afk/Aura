"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiService, AuthSession } from "@/services/api";
import { useToast } from "@/components/ui/Toast";

interface GoogleSignInButtonProps {
  isSignUp?: boolean;
  onSuccess?: (session: AuthSession) => void;
  className?: string;
}

interface GoogleTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (listener?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
          cancel: () => void;
        };
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; error_description?: string }) => void;
            error_callback?: (error: { type?: string; message?: string }) => void;
            prompt?: string;
          }) => GoogleTokenClient;
        };
      };
    };
  }
}

export function GoogleSignInButton({ isSignUp = false, onSuccess, className = "" }: GoogleSignInButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const tokenClientRef = useRef<GoogleTokenClient | null>(null);

  const rawClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const isRealClientId =
    Boolean(rawClientId) &&
    !rawClientId?.includes("YOUR_CLIENT_ID") &&
    rawClientId?.includes(".apps.googleusercontent.com");
  const googleClientId = isRealClientId ? rawClientId?.trim() : undefined;

  // Load Google Identity Services script if Client ID is configured
  useEffect(() => {
    if (!googleClientId) return;

    const existingScript = document.getElementById("google-gsi-client");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-gsi-client";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => setupGoogleAuth();
      document.body.appendChild(script);
    } else {
      setupGoogleAuth();
    }

    function setupGoogleAuth() {
      const google = window.google;
      if (!google?.accounts) return;

      // 1. Initialize Google Sign-In (for One-Tap & credential parsing)
      if (google.accounts.id) {
        try {
          google.accounts.id.initialize({
            client_id: googleClientId!,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Show One-Tap prompt if eligible
          google.accounts.id.prompt();
        } catch (e) {
          console.warn("Google One-Tap initialization notice:", e);
        }
      }

      // 2. Initialize OAuth 2.0 Token Client (for custom button click popup)
      if (google.accounts.oauth2) {
        try {
          tokenClientRef.current = google.accounts.oauth2.initTokenClient({
            client_id: googleClientId!,
            scope: "openid email profile",
            callback: async (tokenResponse) => {
              if (tokenResponse.error) {
                console.error("Google OAuth error:", tokenResponse);
                toast.error(
                  "Google Sign-In Error",
                  tokenResponse.error_description || tokenResponse.error || "Authentication was cancelled."
                );
                setLoading(false);
                return;
              }

              if (tokenResponse.access_token) {
                setLoading(true);
                try {
                  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                    headers: {
                      Authorization: `Bearer ${tokenResponse.access_token}`,
                    },
                  });

                  if (!res.ok) {
                    throw new Error("Unable to retrieve profile from Google.");
                  }

                  const userInfo = await res.json();
                  await executeLogin({
                    email: userInfo.email,
                    fullName: userInfo.name || userInfo.email?.split("@")[0] || "Google Member",
                    photoUrl: userInfo.picture,
                    idToken: tokenResponse.access_token,
                  });
                } catch (err: unknown) {
                  const message = err instanceof Error ? err.message : "Failed to sign in with Google.";
                  toast.error("Google Sign-In Failed", message);
                } finally {
                  setLoading(false);
                }
              }
            },
            error_callback: (error) => {
              console.error("Google OAuth client error:", error);
              setLoading(false);
              toast.error("Google Service Notice", error.message || "Could not open Google authentication window.");
            },
          });
        } catch (e) {
          console.warn("Google OAuth token client initialization notice:", e);
        }
      }
    }
  }, [googleClientId]);

  // Decode JWT payload returned by Google One-Tap credential
  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  const handleGoogleCredentialResponse = async (response: { credential?: string }) => {
    if (!response.credential) return;
    setLoading(true);
    try {
      const payload = parseJwt(response.credential);
      const email = payload?.email || "";
      const fullName = payload?.name || email.split("@")[0] || "Google Member";
      const photoUrl = payload?.picture;

      await executeLogin({
        email,
        fullName,
        photoUrl,
        idToken: response.credential,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google sign-in could not be completed.";
      toast.error("Google Sign-In Failed", message);
    } finally {
      setLoading(false);
    }
  };

  const executeLogin = async (data: { email: string; fullName: string; photoUrl?: string; idToken?: string }) => {
    setLoading(true);
    try {
      const session = await apiService.googleLogin(data);
      toast.success(
        isSignUp ? "Account Created with Google" : "Signed In Successfully",
        `Welcome to Vikasitha, ${session.fullName}!`
      );

      if (onSuccess) {
        onSuccess(session);
        return;
      }

      if (!session.hasCompletedProfile) {
        toast.info("Complete Your Matrimony Profile", "Just a few quick details to activate match recommendations.");
        router.push("/register");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign in with Google.";
      toast.error("Authentication Error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (loading) return;

    if (!googleClientId) {
      toast.warning(
        "Google Sign-In Not Configured",
        "Google Client ID is missing. Please check NEXT_PUBLIC_GOOGLE_CLIENT_ID in your configuration."
      );
      return;
    }

    // Trigger official Google OAuth 2.0 popup
    if (tokenClientRef.current) {
      setLoading(true);
      tokenClientRef.current.requestAccessToken({ prompt: "select_account" });
      return;
    }

    // Fallback to Google One-Tap prompt if token client is still preparing
    const google = window.google;
    if (google?.accounts?.id) {
      google.accounts.id.prompt();
      return;
    }

    toast.info("Initializing Google Sign-In", "Please wait a moment and click again.");
  };

  return (
    <div className={`w-full ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-line bg-surface-card px-4 text-button-sm text-ink shadow-xs transition-all hover:bg-surface-subtle hover:border-line-strong hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-60 cursor-pointer"
      >
        {loading ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        ) : (
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span className="font-semibold">
          {isSignUp ? "Sign up with Google" : "Continue with Google"}
        </span>
      </button>
    </div>
  );
}
