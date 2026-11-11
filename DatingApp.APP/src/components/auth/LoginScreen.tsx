"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { takeReturnTo } from "@/lib/session";
import { ArrowRight2 } from "iconsax-react";
import {
  Alert,
  Button,
  Card,
  CardTitle,
  Checkbox,
  CoupleAvatar,
  Input,
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
import { GoogleSignInButton } from "./GoogleSignInButton";
import { IdentifierTabs } from "./IdentifierTabs";
import { apiService } from "@/services/api";

type LoginError = null | "wrong" | "locked" | "suspended";
const LOCK_SECONDS = 15 * 60;

export function LoginScreen() {
  const router = useRouter();
  const toast = useToast();
  useFlashToast();

  const [mode, setMode] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
  const [error, setError] = useState<LoginError>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [attempts, setAttempts] = useState(0);
  const [lockLeft, setLockLeft] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lockLeft <= 0) return;
    const t = window.setInterval(() => setLockLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [lockLeft]);

  useEffect(() => {
    if (error === "locked" && lockLeft === 0 && attempts >= 5) {
      setError(null);
      setAttempts(0);
    }
  }, [lockLeft, error, attempts]);

  const locked = lockLeft > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fe: typeof fieldErrors = {};

    const identifier = mode === "email" ? email.trim() : mobile.trim();

    if (!identifier) {
      fe.identifier = mode === "email" ? "Enter your email address" : "Enter your mobile number";
    } else if (mode === "phone" && !isValidSriLankanMobile(identifier)) {
      fe.identifier = "Enter a valid Sri Lankan mobile number";
    } else if (mode === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      fe.identifier = "Enter a valid email address";
    }

    if (!password) {
      fe.password = "Enter your password";
    }

    setFieldErrors(fe);
    if (Object.keys(fe).length > 0) return;

    setLoading(true);
    setError(null);
    setErrorMessage("");

    try {
      // Real API Login Call
      const session = await apiService.login({
        email: identifier,
        password: password,
      });

      setLoading(false);
      flashToast("success", `Welcome back, ${session.fullName || "Member"}!`, "You’re logged in.");
      toast.success(`Welcome back, ${session.fullName || "Member"}!`, "You’re logged in.");
      router.push(takeReturnTo()); // back to the profile / page the guest came from
    } catch (err: unknown) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : "Invalid credentials. Please try again.";
      setErrorMessage(msg);

      const n = attempts + 1;
      setAttempts(n);

      if (n >= 5) {
        setError("locked");
        setLockLeft(LOCK_SECONDS);
      } else {
        setError("wrong");
        setFieldErrors({
          password: `${msg} (${5 - n} attempt${5 - n === 1 ? "" : "s"} left)`,
        });
      }
    }
  };

  const mm = String(Math.floor(lockLeft / 60)).padStart(2, "0");
  const ss = String(lockLeft % 60).padStart(2, "0");

  return (
    <AuthShell showTrust action="create-account">
      <Card className="w-full max-w-[520px] p-6 sm:p-10">
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-2">
            <CoupleAvatar size={72} />
            <CardTitle title="Welcome back" subtitle="Log in to see your matches and messages." />
          </div>

          <IdentifierTabs
            value={mode}
            onChange={(m) => {
              setMode(m);
              setFieldErrors({});
              setError(null);
            }}
          />

          {error === "wrong" && (
            <Alert
              type="error"
              title="Login failed"
              action={
                <Link href="/forgot-password" className="font-bold text-brand hover:underline">
                  Reset password
                </Link>
              }
            >
              {errorMessage || "Invalid email, mobile number or password. Please try again."}
            </Alert>
          )}

          {error === "locked" && (
            <Alert type="warning" title="Too many attempts — account locked">
              For your safety, login is paused for <b>{mm}:{ss}</b>. You can{" "}
              <Link href="/forgot-password" className="font-bold text-brand hover:underline">
                reset your password
              </Link>{" "}
              now.
            </Alert>
          )}

          {mode === "email" ? (
            <Input
              label="Email address"
              type="email"
              placeholder="e.g. demo@auramatrimony.lk"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((f) => ({ ...f, identifier: undefined }));
              }}
              error={fieldErrors.identifier}
              disabled={locked}
              autoComplete="email"
              autoFocus
            />
          ) : (
            <PhoneField
              value={mobile}
              onChange={(v) => {
                setMobile(v);
                setFieldErrors((f) => ({ ...f, identifier: undefined }));
              }}
              error={fieldErrors.identifier}
              disabled={locked}
              autoFocus
            />
          )}

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
            <Checkbox checked={remember} onChange={setRemember}>
              Remember me
            </Checkbox>
            <Link href="/forgot-password" className="text-link-sm text-brand-link underline">
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            fullWidth
            loading={loading}
            disabled={locked}
            rightIcon={<ArrowRight2 size={18} color="currentColor" />}
          >
            {locked ? `Locked · ${mm}:${ss}` : "Log in"}
          </Button>

          <OrDivider />

          <GoogleSignInButton />

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
          { label: "Demo Account", value: "demo@auramatrimony.lk" },
          { label: "Password", value: "AuraDemo123!" },
          { label: "Custom Account", value: "Use any registered email or phone" },
        ]}
        actions={[
          {
            label: "Fill Demo Login",
            onClick: () => {
              setMode("email");
              setEmail("demo@auramatrimony.lk");
              setPassword("AuraDemo123!");
              setError(null);
              setFieldErrors({});
            },
          },
          {
            label: "Reset Attempts",
            onClick: () => {
              setAttempts(0);
              setLockLeft(0);
              setError(null);
              setFieldErrors({});
            },
          },
        ]}
      />
    </AuthShell>
  );
}
