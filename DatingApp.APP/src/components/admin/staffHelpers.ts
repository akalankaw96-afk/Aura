import type { BadgeTone } from "@/components/ui/Badge";

/** Small helpers shared by the staff screens (S05-T01: split out of the old StaffConsole). */
export const when = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export const statusTone = (s: string): BadgeTone =>
  s === "Approved" ? "success" : s === "ChangesRequested" || s === "Rejected" || s === "Suspended" ? "error" : s === "Resubmitted" ? "info" : "warning";

export const DOC_LABEL: Record<string, string> = { NicFront: "NIC — front", NicBack: "NIC — back", Passport: "Passport", Selfie: "Selfie" };
