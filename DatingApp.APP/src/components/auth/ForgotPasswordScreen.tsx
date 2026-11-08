"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight2 } from "iconsax-react";
import {
  Alert,
  Button,
  Card,
  CardTitle,
  CoupleAvatar,
  OtpInput,
  PasswordField,
  PhoneField,
  flashToast,
  isPasswordAcceptable,
  isValidSriLankanMobile,
  useToast,
} from "@/components/ui";
import { AuthShell } from "./AuthShell";
import { DemoTips } from "./DemoTips";
import { DEMO, formatPhone } from "./shared";

/**
 * Journey 2 · Forgot password (Figma 01d enter mobile, 01e code + new
 * password, 01f password updated → back to Login with a success toast).
 */
export function ForgotPasswordScreen() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<"mobile" | "reset">("mobile");
  const [mobile, setMobile] = useState("");
  const [mobileError, setMobileError] = useState<string>();
  const [notFound, setNotFound] = useState(false);
  const [code, setCode] = useState("");
  const [codeState, setCodeState] = useState<"default" | "error" | "success">("default");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [errors, setErrors] = useState<{ code?: string; pw?: string; pw2?: string }>({});
  const [resendIn, setResendIn] = useState(45);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (step !== "reset" || resendIn <= 0) return;
    const t = window.setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [step, resendIn]);

  // check the code as soon as 6 digits are typed
  useEffect(() => {
    if (code.length < 6) {
      setCodeState("default");
      return;
    }
    if (code === DEMO.otp || code === "123456") {
      setCodeState("success");
      setErrors((e) => ({ ...e, code: undefined }));
      toast.success("Code verified", "Now choose a new password.");
    } else {
      setCodeState("error");
      setErrors((e) => ({ ...e, code: code === DEMO.expiredOtp ? "This code has expired — tap Resend for a new one" : "Incorrect code — please check the SMS and try again" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const sendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setNotFound(false);
    if (!isValidSriLankanMobile(mobile)) {
      setMobileError(mobile ? "Enter a valid Sri Lankan mobile number" : "Enter your registered mobile number");
      return;
    }
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      if (mobile !== DEMO.registeredMobile && mobile !== DEMO.suspendedMobile) {
        setNotFound(true);
        return;
      }
      setStep("reset");
      setResendIn(45);
      toast.success("Code sent", `We sent a 6-digit code to ${formatPhone(mobile)}.`);
    }, 600);
  };

  const update = (e: React.FormEvent) => {
    e.preventDefault();
    const er: typeof errors = {};
    if (codeState !== "success") er.code = code.length < 6 ? "Enter the 6-digit code" : errors.code ?? "Incorrect code";
    if (!isPasswordAcceptable(pw)) er.pw = pw.length < 6 ? "Password must be at least 6 characters" : "Add at least one number";
    if (!pw2) er.pw2 = "Confirm your new password";
    else if (pw !== pw2) er.pw2 = "Passwords don’t match";
    setErrors(er);
    if (Object.keys(er).length) return;
    setLoading(true);
    window.setTimeout(() => {
      flashToast("success", "Password updated", "Log in with your new password.");
      router.push("/login");
    }, 600);
  };

  return (
    <AuthShell
      showTrust
      right={
        <>
          <span className="hidden text-body-md text-ink-secondary sm:inline">New here?</span>
          <Link href="/register" className="flex h-[43px] items-center rounded-full border border-line-strong bg-surface-card px-4 text-button-sm text-ink hover:bg-surface-subtle">
            Create free account
          </Link>
        </>
      }
    >
      <Card className="w-full max-w-[520px] p-6 sm:p-10">
        {step === "mobile" ? (
          <form onSubmit={sendCode} noValidate className="flex flex-col gap-5">
            <div className="flex flex-col items-center gap-2">
              <CoupleAvatar size={72} />
              <CardTitle title="Reset your password" subtitle="Enter your mobile number and we’ll send you a 6-digit code." />
            </div>
            {notFound && (
              <Alert type="error" title="Number not found" action={<Link href="/register" className="font-bold text-brand hover:underline">Create a free account</Link>}>
                There’s no account with {formatPhone(mobile)}. Check the number or create an account.
              </Alert>
            )}
            <PhoneField
              value={mobile}
              onChange={(v) => {
                setMobile(v);
                setMobileError(undefined);
                setNotFound(false);
              }}
              error={mobileError}
              autoFocus
            />
            <Button type="submit" fullWidth loading={loading} rightIcon={<ArrowRight2 size={18} color="currentColor" />}>
              Send code
            </Button>
            <p className="text-body-md text-ink-secondary">
              Remembered it?{" "}
              <Link href="/login" className="font-semibold text-brand underline">
                Back to login
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={update} noValidate className="flex flex-col gap-5">
            <div className="flex flex-col items-center gap-2">
              <CoupleAvatar size={72} />
              <CardTitle title="Create a new password" subtitle={`Enter the code sent to ${formatPhone(mobile)} and choose a new password.`} />
            </div>
            <div className="flex flex-col items-center gap-2">
              <OtpInput value={code} onChange={setCode} state={codeState} autoFocus />
              {errors.code ? (
                <p role="alert" className="text-body-xs text-error-fg">{errors.code}</p>
              ) : (
                <p className="text-body-xs text-ink-tertiary">
                  Didn’t get it?{" "}
                  {resendIn > 0 ? (
                    <span>Resend in 00:{String(resendIn).padStart(2, "0")}</span>
                  ) : (
                    <button
                      type="button"
                      className="font-bold text-brand hover:underline"
                      onClick={() => {
                        setResendIn(45);
                        setCode("");
                        toast.info("New code sent", `Check your SMS on ${formatPhone(mobile)}.`);
                      }}
                    >
                      Resend now
                    </button>
                  )}
                </p>
              )}
            </div>
            <PasswordField label="New password" value={pw} onChange={(v) => { setPw(v); setErrors((e) => ({ ...e, pw: undefined })); }} showStrength helper="At least 6 characters, with a number" error={errors.pw} autoComplete="new-password" />
            <PasswordField label="Confirm new password" value={pw2} onChange={(v) => { setPw2(v); setErrors((e) => ({ ...e, pw2: undefined })); }} error={errors.pw2} autoComplete="new-password" />
            <Button type="submit" fullWidth loading={loading} rightIcon={<ArrowRight2 size={18} color="currentColor" />}>
              Update password
            </Button>
            <p className="text-body-md text-ink-secondary">
              Remembered it?{" "}
              <Link href="/login" className="font-semibold text-brand underline">
                Back to login
              </Link>
            </p>
          </form>
        )}
      </Card>
      <DemoTips
        tips={[
          { label: "Registered number", value: formatPhone(DEMO.registeredMobile) },
          { label: "Any other number → not found" },
          { label: "Correct code", value: DEMO.otp },
          { label: "Expired code", value: DEMO.expiredOtp },
        ]}
        actions={step === "reset" ? [{ label: "Fill correct code", onClick: () => setCode(DEMO.otp) }] : [{ label: "Fill registered number", onClick: () => setMobile(DEMO.registeredMobile) }]}
      />
    </AuthShell>
  );
}
