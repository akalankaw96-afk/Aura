export const SUPPORT_EMAIL = "support@vikasitha.lk";

/** Supply an international number, including the country code. */
function supportNumber(value?: string) {
  const display = value?.trim();
  const dial = display?.replace(/[\s()-]/g, "");
  return display && dial && /^\+[1-9]\d{6,14}$/.test(dial) ? { display, dial } : null;
}

const whatsapp = supportNumber(process.env.SUPPORT_WHATSAPP_NUMBER);
const hotline = supportNumber(process.env.SUPPORT_HOTLINE_NUMBER);

export const SUPPORT = {
  title: "Contact support",
  subtitle: "Need help with your account, verification, or membership? Choose how you’d like to reach us.",
  channels: [
    {
      id: "email",
      title: "Email",
      description: "Send us a message about your account, profile, or membership.",
      contact: SUPPORT_EMAIL,
      href: `mailto:${SUPPORT_EMAIL}`,
      action: "Email support",
    },
    {
      id: "whatsapp",
      title: "WhatsApp",
      description: "Start a chat with our support team on WhatsApp.",
      contact: whatsapp?.display ?? "Not available yet",
      href: whatsapp ? `https://wa.me/${whatsapp.dial.slice(1)}` : null,
      action: "Open WhatsApp",
    },
    {
      id: "hotline",
      title: "Hotline",
      description: "Speak to our support team over the phone.",
      contact: hotline?.display ?? "Not available yet",
      href: hotline ? `tel:${hotline.dial}` : null,
      action: "Call support",
    },
  ],
  unavailable: "Not available yet. Please contact us by email.",
  /** ⚠️ example values — change to the team's real hours / reply promise */
  hours: "Mon–Sat, 9.00 am – 6.00 pm",
  replyTime: "We reply within 24 hours",
  quickLinks: [
    { label: "How it works", href: "/how-to-use" },
    { label: "Privacy policy", href: "/privacy" },
    { label: "Delete account", href: "/privacy#delete-account" },
  ],
} as const;

/** "Send us a message" topics — the API stores the id, staff filter by it. */
export const SUPPORT_TOPICS = [
  { id: "payments", label: "Payments" },
  { id: "account", label: "Account and login" },
  { id: "verification", label: "Verification" },
  { id: "report", label: "Report a member" },
  { id: "technical", label: "Technical problem" },
  { id: "other", label: "Other" },
] as const;
export type SupportTopic = (typeof SUPPORT_TOPICS)[number]["id"];

export const SUPPORT_MESSAGE_MAX = 1000;
export const SUPPORT_ATTACHMENT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export const SUPPORT_ATTACHMENT_MAX_MB = 10;
