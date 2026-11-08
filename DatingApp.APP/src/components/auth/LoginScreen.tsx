"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight2, Messages2 } from "iconsax-react";
import {
  Alert,
  Button,
  Card,
  CardTitle,
  Checkbox,
  CoupleAvatar,
  OrDivider,
  PasswordField,
  PhoneField,

  flashToast,
  isValidSriLankanMobile,
  useFlashToast,
  useToast,
} from "@/components/ui";
import { AuthShell } from "./AuthShell";
import { DemoTips } from "./DemoTips";
import { DEMO, formatPhone } from "./shared";

/**
 * Journey 1 · Login (Figma 01, 01a wrong password, 01b locked, 01c suspended,
 * 01g success). Front-end only — see src/lib/demo.ts for the test values.
 */
type LoginError = null | "wrong" | "locked" | "suspended";
const LOCK_SECONDS = 15 * 60;

export function LoginScreen() {
  const router = useRouter();
  const toast = useToast();
  useFlashToast(); // e.g. "Password updated" coming from Forgot password

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{ mobile?: string; password?: string }>({});
  const [error, setError] = useState<LoginError>(null);
  const [attempts, setAttempts] = useState(0);
  const [lockLeft, setLockLeft] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lockLeft <= 0) return;
    const t = window.setInterval(() => setLockLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [lockLeft]);

  useEffect(() => {
    if (error === "locked" && lockLeft === 0 && attempts >= DEMO.maxLoginAttempts) {
      setError(null);
      setAttempts(0);
    }
  }, [lockLeft, error, attempts]);

  const locked = lockLeft > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const fe: typeof fieldErrors = {};
    if (!mobile) fe.mobile = "Enter your mobile number";
    else if (!isValidSriLankanMobile(mobile)) fe.mobile = "Enter a valid Sri Lankan mobile number";
    if (!password) fe.password = "Enter your password";
    setFieldErrors(fe);
    if (Object.keys(fe).length) return;

    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      if (mobile === DEMO.suspendedMobile) {
        setError("suspended");
        return;
      }
      if (mobile === DEMO.registeredMobile && password === DEMO.password) {
        setError(null);
        flashToast("success", "Welcome back, Nethmi!", "You’re logged in.");
        toast.success("Welcome back, Nethmi!", "You’re logged in.");
        window.setTimeout(() => router.push("/"), 900);
        return;
      }
      const n = attempts + 1;
      setAttempts(n);
      if (n >= DEMO.maxLoginAttempts) {
        setError("locked");
        setLockLeft(LOCK_SECONDS);
      } else {
        setError("wrong");
        setFieldErrors({ password: `Incorrect password · ${DEMO.maxLoginAttempts - n} attempt${DEMO.maxLoginAttempts - n === 1 ? "" : "s"} left` });
      }
    }, 600);
  };

  const mm = String(Math.floor(lockLeft / 60)).padStart(2, "0");
  const ss = String(lockLeft % 60).padStart(2, "0");

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
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-2">
            <CoupleAvatar size={72} />
            <CardTitle title="Welcome back" subtitle="Log in to see your matches and messages." />
          </div>

          {error === "wrong" && (
            <Alert type="error" title="Login failed" action={<Link href="/forgot-password" className="font-bold text-brand hover:underline">Reset password</Link>}>
              Mobile number or password is incorrect.
            </Alert>
          )}
          {error === "locked" && (
            <Alert type="warning" title="Too many attempts — account locked">
              For your safety, login is paused for <b>{mm}:{ss}</b>. You can{" "}
              <Link href="/forgot-password" className="font-bold text-brand hover:underline">reset your password</Link> now.
            </Alert>
          )}
          {error === "suspended" && (
            <Alert type="error" title="Account suspended" action={<a href="mailto:support@vikasitha.lk" className="font-bold text-brand hover:underline">Contact support</a>}>
              This account was suspended after a safety review. If you think this is a mistake, contact our support team.
            </Alert>
          )}

          <PhoneField
            value={mobile}
            onChange={(v) => {
              setMobile(v);
              setFieldErrors((f) => ({ ...f, mobile: undefined }));
            }}
            error={fieldErrors.mobile}
            disabled={locked}
          />
          <PasswordField
            value={password}
            onChange={(v) => {
              setPassword(v);
              setFieldErrors((f) => ({ ...f, password: undefined }));
            }}
            error={fieldErrors.password}
            disabled={locked}
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between gap-3">
            <Checkbox checked={remember} onChange={setRemember}>Remember me</Checkbox>
            <Link href="/forgot-password" className="text-link-sm text-brand-link underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" fullWidth loading={loading} disabled={locked} rightIcon={<ArrowRight2 size={18} color="currentColor" />}>
            {locked ? `Locked · ${mm}:${ss}` : "Log in"}
          </Button>
          <OrDivider />
          <Button
            variant="outline"
            fullWidth
            leftIcon={<Messages2 size={20} color="currentColor" />}
            onClick={() => toast.info("Log in with OTP", "Coming soon in this prototype — use your password for now.")}
          >
            Log in with OTP instead
          </Button>
          <p className="text-body-md text-ink-secondary">
            New here?{" "}
            <Link href="/register" className="font-semibold text-brand underline">
              Create a free account
            </Link>
          </p>
        </form>
      </Card>

      <DemoTips
        tips={[
          { label: "Login works with", value: formatPhone(DEMO.registeredMobile) },
          { label: "Password", value: DEMO.password },
          { label: "Suspended account", value: formatPhone(DEMO.suspendedMobile) },
          { label: "Wrong password 5× → locked 15 min" },
        ]}
        actions={[
          { label: "Fill correct login", onClick: () => { setMobile(DEMO.registeredMobile); setPassword(DEMO.password); setError(null); setFieldErrors({}); } },
          { label: "Reset attempts", onClick: () => { setAttempts(0); setLockLeft(0); setError(null); setFieldErrors({}); } },
        ]}
      />
    </AuthShell>
  );
}

