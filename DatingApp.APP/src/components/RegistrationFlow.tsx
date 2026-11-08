"use client";

import React from "react";
import { useRouter } from "next/navigation";
import type { AuthSession } from "../services/api";
import type { Profile } from "../types";
import { RegisterFlow } from "./auth/RegisterFlow";
import type { RegistrationDraft } from "@/lib/demo";

interface RegistrationFlowProps {
  initialScreen?: "login" | "register";
  targetProfile?: Profile | null;
  onFinished?: (session: AuthSession, profile: Profile) => void;
  isModal?: boolean;
  onClose?: () => void;
}

function toMock(d: RegistrationDraft): { session: AuthSession; profile: Profile } {
  const id = `demo-${Date.now()}`;
  const year = d.dob ? new Date(d.dob).getFullYear() : 1997;
  return {
    session: {
      token: "demo-token",
      userId: id,
      fullName: d.fullName || "New member",
      email: "",
      phoneNumber: d.mobile ? `+94${d.mobile}` : undefined,
      role: "Member",
      profileId: id,
      hasCompletedProfile: true,
    },
    profile: {
      id,
      code: "VK" + id.slice(-5),
      name: d.fullName || "New member",
      gender: d.gender === "Male" ? "male" : "female",
      age: new Date().getFullYear() - year,
      height: d.height || "",
      profession: d.profession || "",
      professionCategory: "Other",
      education: d.education || "",
      location: d.district || "",
      country: d.livingIn || "Sri Lanka",
      religion: d.religion || "",
      community: "",
      verified: false,
      premium: false,
      photoUrl: d.photo || "/brand/couple.png",
      bio: d.about || "",
      aboutFamily: "",
      horoscopeAvailable: false,
      interests: [],
    },
  };
}

export const RegistrationFlow: React.FC<RegistrationFlowProps> = ({ initialScreen = "register", onFinished, isModal = false }) => {
  const router = useRouter();

  // Full-page login lives at /login now
  if (initialScreen === "login" && !isModal) {
    router.replace("/login");
    return null;
  }

  return (
    <RegisterFlow
      embedded={isModal}
      onComplete={(draft) => {
        const { session, profile } = toMock(draft);
        onFinished?.(session, profile);
      }}
    />
  );
};
