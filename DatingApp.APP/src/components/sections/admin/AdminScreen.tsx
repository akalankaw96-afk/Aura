"use client";

import { useAuthSession } from "@/lib/session";
import { StaffConsole } from "./StaffConsole";

/** Picks the sections the signed-in staff member may use (the API checks every call again). */
export function AdminScreen() {
  const { session, loading } = useAuthSession();
  const role = session?.role;
  if (loading || (role !== "Admin" && role !== "Moderator")) return null;
  return <StaffConsole isAdmin={role === "Admin"} />;
}
