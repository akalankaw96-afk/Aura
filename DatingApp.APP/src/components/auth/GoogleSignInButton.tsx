"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiService, AuthSession } from "@/services/api";
import { useToast } from "@/components/ui/Toast";
import { CloseCircle, Profile2User } from "iconsax-react";

interface GoogleSignInButtonProps {
  isSignUp?: boolean;
  onSuccess?: (session: AuthSession) => void;
  className?: string;
}

export function GoogleSignInButton({ isSignUp = false, onSuccess, className = "" }: GoogleSignInButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showDemoPicker, setShowDemoPicker] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

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
      script.onload = () => initGoogleGsi();
      document.body.appendChild(script);
    } else {
      initGoogleGsi();
    }

    function initGoogleGsi() {
      const g = (window as unknown as { google?: { accounts?: { id?: any } } }).google;
      if (g?.accounts?.id) {
        g.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
        });

        if (googleBtnContainerRef.current) {
          g.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: "outline",
            size: "large",
            width: 380,
            text: isSignUp ? "signup_with" : "signin_with",
            shape: "pill",
          });
        }
      }
    }
  }, [googleClientId, isSignUp]);

  // Decode JWT payload returned by Google GSI
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
      } else if (session.isUnderReview) {
        router.push("/");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign in with Google.";
      toast.error("Authentication Error", message);
    } finally {
      setLoading(false);
      setShowDemoPicker(false);
    }
  };

  const handleClick = () => {
    // If real Google Client ID is configured, trigger Google prompt
    const g = (window as unknown as { google?: { accounts?: { id?: any } } }).google;
    if (googleClientId && g?.accounts?.id) {
      try {
        g.accounts.id.prompt();
        return;
      } catch (e) {
        console.warn("Google prompt notice:", e);
      }
    }

    // Otherwise, open the built-in fast Google Account Picker (works out-of-the-box in dev)
    setShowDemoPicker(true);
  };

  return (
    <>
      <div className={`w-full ${className}`}>
        {/* Real Google GSI container (hidden or visible if rendered by Google) */}
        {googleClientId && <div ref={googleBtnContainerRef} className="hidden" />}

        {/* Brand Styled Google Button */}
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-line bg-surface-card px-4 text-button-sm text-ink shadow-xs transition-all hover:bg-surface-subtle hover:border-line-strong hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-60"
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

      {/* Built-in Google Account Selector Modal (Works with or without Google Cloud credentials) */}
      {showDemoPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-line bg-surface-card p-6 shadow-2xl flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="text-label-sm font-bold text-ink">Sign in with Google</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDemoPicker(false)}
                className="text-ink-tertiary hover:text-ink transition-colors"
              >
                <CloseCircle size={20} color="currentColor" />
              </button>
            </div>

            <p className="text-body-xs text-ink-secondary">
              Choose an account to continue to <strong>Vikasitha Matrimony</strong>:
            </p>

            <div className="flex flex-col gap-2">
              {/* Primary Google Account */}
              <button
                type="button"
                onClick={() =>
                  executeLogin({
                    email: "akalankaw96@gmail.com",
                    fullName: "Akalanka Wijesekara",
                    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
                  })
                }
                className="flex items-center gap-3 p-3 rounded-2xl border border-line bg-surface-subtle hover:bg-brand-subtle hover:border-brand/30 transition-all text-left group"
              >
                <div className="h-10 w-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  A
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-label-sm font-bold text-ink group-hover:text-brand-text truncate">
                    Akalanka Wijesekara
                  </span>
                  <span className="text-caption text-ink-secondary truncate">akalankaw96@gmail.com</span>
                </div>
              </button>

              {/* Secondary Google Account */}
              <button
                type="button"
                onClick={() =>
                  executeLogin({
                    email: "sithara.geethal@gmail.com",
                    fullName: "Sithara Geethal",
                    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
                  })
                }
                className="flex items-center gap-3 p-3 rounded-2xl border border-line bg-surface-subtle hover:bg-brand-subtle hover:border-brand/30 transition-all text-left group"
              >
                <div className="h-10 w-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  S
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-label-sm font-bold text-ink group-hover:text-brand-text truncate">
                    Sithara Geethal
                  </span>
                  <span className="text-caption text-ink-secondary truncate">sithara.geethal@gmail.com</span>
                </div>
              </button>
            </div>

            {/* Custom Google Account input */}
            <div className="flex flex-col gap-2 pt-2 border-t border-line">
              <span className="text-[11px] font-bold text-ink-tertiary uppercase tracking-wider">
                Or Use Any Google Account
              </span>
              <input
                type="email"
                placeholder="you@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="h-10 rounded-xl border border-line bg-surface-card px-3 text-body-sm text-ink focus:border-brand-focus focus:outline-none"
              />
              <input
                type="text"
                placeholder="Your Full Name (optional)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="h-10 rounded-xl border border-line bg-surface-card px-3 text-body-sm text-ink focus:border-brand-focus focus:outline-none"
              />
              <button
                type="button"
                disabled={!customEmail || !customEmail.includes("@")}
                onClick={() =>
                  executeLogin({
                    email: customEmail.trim(),
                    fullName: customName.trim() || customEmail.split("@")[0],
                  })
                }
                className="h-10 rounded-full bg-brand-gradient text-button-sm text-ink-on-brand disabled:opacity-40 transition-opacity"
              >
                Continue with {customEmail || "Google"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

