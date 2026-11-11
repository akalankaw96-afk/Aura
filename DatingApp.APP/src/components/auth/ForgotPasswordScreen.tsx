"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight2 } from "iconsax-react";
import {
  Alert,
  BackButton,
  Button,
  Card,
  CardTitle,
  CoupleAvatar,
  Input,
  OtpInput,
  PasswordField,
  PhoneField,
  flashToast,
  isPasswordAcceptable,
  isValidSriLankanMobile,
  useToast,
} from "@/components/ui";
import {
  RESET_RULES,
  maskIdentifier,
  requestResetCode,
  resetPassword,
  verifyResetCode,
  type ResetChannel,
} from "@/services/passwordReset";
import { AuthShell } from "./AuthShell";
import { DemoTips } from "./DemoTips";
import { IdentifierTabs } from "./IdentifierTabs";
import { DEMO, formatPhone } from "./shared";

type Step = "identify" | "code" | "password";
const STEP_NO: Record<Step, number> = { identify: 1, code: 2, password: 3 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_ERROR = ["Something went wrong", "Check your connection and try again."] as const;

/**
 * Journey 2 · Forgot password
 * 1. Choose Email or Mobile → enter it → Send code (same message whether or not it is registered)
 * 2. Enter the 6-digit code → verified on the server → short-lived reset token
 * 3. New password + confirm → Login with a success toast
 */
export function ForgotPasswordScreen() {
  const router = useRouter();
  const toast = useToast();

  const [step, setStep] = useState<Step>("identify");
  const [channel, setChannel] = useState<ResetChannel>("phone");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [idError, setIdError] = useState<string>();

  const [code, setCode] = useState("");
  const [codeState, setCodeState] = useState<"default" | "error" | "success">("default");
  const [codeError, setCodeError] = useState<string>();
  const [tooMany, setTooMany] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [resends, setResends] = useState(0);
  const [resetToken, setResetToken] = useState("");

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwErrors, setPwErrors] = useState<{ pw?: string; pw2?: string }>({});
  const [loading, setLoading] = useState(false);

  const value = channel === "phone" ? mobile : email.trim();
  const masked = maskIdentifier(channel, value);
  const channelWord = channel === "phone" ? "mobile number" : "email address";

  // resend countdown
  useEffect(() => {
    if (step !== "code" || resendIn <= 0) return;
    const t = window.setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [step, resendIn]);

  // verify as soon as 6 digits are typed
  useEffect(() => {
    if (step === "code" && code.length === RESET_RULES.codeLength && codeState === "default" && !loading && !tooMany) {
      void verify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  /* ---------- step 1 ---------- */
  const validateIdentifier = (): string | undefined => {
    if (channel === "phone") {
      if (!mobile) return "Enter your registered mobile number";
      if (!isValidSriLankanMobile(mobile)) return "Enter a valid Sri Lankan mobile number";
    } else {
      if (!email.trim()) return "Enter your registered email address";
      if (!EMAIL_RE.test(email.trim())) return "Enter a valid email address";
    }
    return undefined;
  };

  const sendCode = async (isResend = false) => {
    setLoading(true);
    try {
      await requestResetCode(channel, value);
      setCode("");
      setCodeState("default");
      setCodeError(undefined);
      setTooMany(false);
      setResendIn(RESET_RULES.resendSeconds);
      if (isResend) {
        setResends((n) => n + 1);
        toast.info("New code sent", `Check ${channel === "phone" ? "your SMS" : "your inbox"} for the latest code.`);
      } else {
        setResends(0);
        setStep("code");
        toast.success("Code sent", `If this ${channelWord} is registered, a 6-digit code is on its way.`);
      }
    } catch {
      toast.error(...GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const submitIdentifier = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateIdentifier();
    setIdError(err);
    if (!err) void sendCode();
  };

  /* ---------- step 2 ---------- */
  async function verify() {
    if (code.length < RESET_RULES.codeLength) {
      setCodeState("error");
      setCodeError("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const res = await verifyResetCode(channel, value, code);
      if (res.ok) {
        setCodeState("success");
        setResetToken(res.resetToken);
        toast.success("Code verified", "Now choose a new password.");
        setStep("password");
        return;
      }
      setCodeState("error");
      if (res.reason === "too-many") {
        setTooMany(true);
        setCodeError(undefined);
      } else if (res.reason === "expired") {
        setCodeError("This code has expired — tap Resend for a new one");
      } else {
        setCodeError(
          `Incorrect code — ${res.attemptsLeft} ${res.attemptsLeft === 1 ? "try" : "tries"} left`,
        );
      }
    } catch {
      toast.error(...GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  }

  const changeIdentifier = () => {
    setStep("identify");
    setCode("");
    setCodeState("default");
    setCodeError(undefined);
    setTooMany(false);
  };

  /** Back (top-left): step 1 → previous page (Login), step 2 → step 1, step 3 → step 2 */
  const backButton =
    step === "identify" ? (
      <BackButton fallback="/login" label="Back to login" />
    ) : step === "code" ? (
      <BackButton label="Back to change email or mobile" onClick={changeIdentifier} />
    ) : (
      <BackButton
        label="Back to code"
        onClick={() => {
          setStep("code");
          setResetToken("");
          setCodeState("default");
          setPw("");
          setPw2("");
          setPwErrors({});
        }}
      />
    );

  /* ---------- step 3 ---------- */
  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: typeof pwErrors = {};
    if (!isPasswordAcceptable(pw)) er.pw = pw.length < 6 ? "Password must be at least 6 characters" : "Add at least one number";
    if (!pw2) er.pw2 = "Confirm your new password";
    else if (pw !== pw2) er.pw2 = "Passwords don’t match";
    setPwErrors(er);
    if (Object.keys(er).length) return;
    setLoading(true);
    try {
      await resetPassword(resetToken, pw);
      flashToast("success", "Password updated", "Log in with your new password. You’ve been signed out on other devices.");
      router.push("/login");
    } catch {
      toast.error(...GENERIC_ERROR);
      setLoading(false);
    }
  };

  const backToLogin = (
    <p className="text-body-md text-ink-secondary">
      Remembered it?{" "}
      <Link href="/login" className="font-semibold text-brand underline">
        Back to login
      </Link>
    </p>
  );

  const header = (title: string, subtitle: React.ReactNode) => (
    <div className="flex flex-col items-center gap-2">
      <CoupleAvatar size={72} />
      <p className="text-label-sm text-ink-tertiary">Step {STEP_NO[step]} of 3</p>
      <CardTitle title={title} subtitle={subtitle} />
    </div>
  );

  return (
    <AuthShell showTrust action="create-account">
      <Card className="relative w-full max-w-[520px] p-6 sm:p-10">
        <div className="absolute left-4 top-4 sm:left-6 sm:top-6">{backButton}</div>
        {step === "identify" && (
          <form onSubmit={submitIdentifier} noValidate className="flex flex-col gap-5">
            {header("Reset your password", "Choose how you registered and we’ll send you a 6-digit code.")}
            <IdentifierTabs
              value={channel}
              onChange={(m) => {
                setChannel(m);
                setIdError(undefined);
              }}
            />
            {channel === "phone" ? (
              <PhoneField
                value={mobile}
                onChange={(v) => {
                  setMobile(v);
                  setIdError(undefined);
                }}
                error={idError}
                autoFocus
              />
            ) : (
              <Input
                label="Email address"
                type="email"
                placeholder="e.g. name@gmail.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setIdError(undefined);
                }}
                error={idError}
                autoComplete="email"
                autoFocus
              />
            )}
            <Button type="submit" fullWidth loading={loading} rightIcon={<ArrowRight2 size={18} color="currentColor" />}>
              Send code
            </Button>
            {backToLogin}
          </form>
        )}

        {step === "code" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void verify();
            }}
            noValidate
            className="flex flex-col gap-5"
          >
            {header(
              "Enter your code",
              <>
                If this {channelWord} is registered, we sent a 6-digit code to <b className="text-ink">{masked}</b>.{" "}
                <button type="button" onClick={changeIdentifier} className="font-semibold text-brand underline">
                  Change
                </button>
              </>,
            )}

            {tooMany && (
              <Alert
                type="error"
                title="Too many incorrect codes"
                action={
                  <button type="button" className="font-bold text-brand hover:underline" onClick={() => void sendCode(true)}>
                    Send a new code
                  </button>
                }
              >
                For your safety this code no longer works. Request a new one to continue.
              </Alert>
            )}

            <div className="flex flex-col items-center gap-2">
              <OtpInput
                value={code}
                onChange={(v) => {
                  setCode(v);
                  setCodeError(undefined);
                  setCodeState("default");
                }}
                state={codeState}
                disabled={tooMany}
                autoFocus
              />
              {codeError ? (
                <p role="alert" className="text-body-xs text-error-fg">
                  {codeError}
                </p>
              ) : (
                <p className="text-body-xs text-ink-tertiary">
                  Didn’t get it?{" "}
                  {resendIn > 0 ? (
                    <span>Resend in 00:{String(resendIn).padStart(2, "0")}</span>
                  ) : resends < RESET_RULES.maxResends ? (
                    <button type="button" className="font-bold text-brand hover:underline" onClick={() => void sendCode(true)}>
                      Resend now
                    </button>
                  ) : (
                    <span>Resend limit reached</span>
                  )}
                </p>
              )}
            </div>

            {resends >= 2 && (
              <Alert
                type="info"
                title="Still no code?"
                action={
                  <Link href="/support" className="font-bold text-brand hover:underline">
                    Contact support
                  </Link>
                }
              >
                Check the {channelWord} is correct, or{" "}
                <button
                  type="button"
                  className="font-semibold text-brand underline"
                  onClick={() => {
                    changeIdentifier();
                    setChannel(channel === "phone" ? "email" : "phone");
                  }}
                >
                  use your {channel === "phone" ? "email address" : "mobile number"} instead
                </button>
                .
              </Alert>
            )}

            <Button type="submit" fullWidth loading={loading} disabled={tooMany} rightIcon={<ArrowRight2 size={18} color="currentColor" />}>
              Verify code
            </Button>
            {backToLogin}
          </form>
        )}

        {step === "password" && (
          <form onSubmit={submitPassword} noValidate className="flex flex-col gap-5">
            {header("Create a new password", "Choose a password you haven’t used here before.")}
            <PasswordField
              label="New password"
              value={pw}
              onChange={(v) => {
                setPw(v);
                setPwErrors((e) => ({ ...e, pw: undefined }));
              }}
              showStrength
              helper="At least 6 characters, with a number"
              error={pwErrors.pw}
              autoComplete="new-password"
              autoFocus
            />
            <PasswordField
              label="Confirm new password"
              value={pw2}
              onChange={(v) => {
                setPw2(v);
                setPwErrors((e) => ({ ...e, pw2: undefined }));
              }}
              error={pwErrors.pw2}
              autoComplete="new-password"
            />
            <Button type="submit" fullWidth loading={loading} rightIcon={<ArrowRight2 size={18} color="currentColor" />}>
              Update password
            </Button>
            {backToLogin}
          </form>
        )}
      </Card>

      <DemoTips
        tips={[
          { label: "Registered number", value: formatPhone(DEMO.registeredMobile) },
          { label: "Registered email", value: DEMO.registeredEmail },
          { label: "Correct code", value: DEMO.otp },
          { label: "Expired code", value: DEMO.expiredOtp },
          { label: `Wrong code ${RESET_RULES.maxAttempts}× → locked` },
          { label: "Unknown account → same message, code never works" },
        ]}
        actions={
          step === "identify"
            ? [
                { label: "Fill registered number", onClick: () => { setChannel("phone"); setMobile(DEMO.registeredMobile); } },
                { label: "Fill registered email", onClick: () => { setChannel("email"); setEmail(DEMO.registeredEmail); } },
              ]
            : step === "code"
              ? [{ label: "Fill correct code", onClick: () => { setCode(DEMO.otp); setCodeError(undefined); setCodeState("default"); } }]
              : []
        }
      />
    </AuthShell>
  );
}
