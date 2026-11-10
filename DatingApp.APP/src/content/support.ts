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
      contact: whatsapp?.display ?? "+94 00 000 0000",
      href: whatsapp ? `https://wa.me/${whatsapp.dial.slice(1)}` : null,
      action: "Open WhatsApp",
    },
    {
      id: "hotline",
      title: "Hotline",
      description: "Speak to our support team over the phone.",
      contact: hotline?.display ?? "+94 00 000 0001",
      href: hotline ? `tel:${hotline.dial}` : null,
      action: "Call support",
    },
  ],
  unavailable: "Demo number. Please contact us by email.",
} as const;
