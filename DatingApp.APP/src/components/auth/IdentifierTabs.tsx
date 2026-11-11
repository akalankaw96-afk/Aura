"use client";

import React from "react";
import { Call, Sms } from "iconsax-react";
import { SegmentedSwitch } from "@/components/ui";

export type IdentifierMethod = "email" | "phone";

/**
 * Email / Mobile choice on the auth screens (Login, Forgot password).
 * Thin preset over the shared `SegmentedSwitch` so every auth flow looks the same.
 */
export function IdentifierTabs({
  value,
  onChange,
  disabled,
  className,
}: {
  value: IdentifierMethod;
  onChange: (method: IdentifierMethod) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <SegmentedSwitch
      label="Choose email or mobile"
      options={[
        { id: "email", label: "Email Address", shortLabel: "Email", Icon: Sms },
        { id: "phone", label: "Mobile Number", shortLabel: "Mobile", Icon: Call },
      ]}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={className}
    />
  );
}
