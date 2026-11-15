/**
 * Terms & Conditions and Privacy Policy copy (Figma: 📄 Info Pages).
 * Text in [square brackets] is a placeholder the business must fill in or confirm with a lawyer
 * before launch. English only for now; Sinhala to follow after legal review.
 */
export type LegalSection = {
  id: string;
  title: string;
  /** paragraphs; a paragraph starting with "• " is shown as a bullet */
  body: string[];
};

export type LegalDoc = {
  crumb: string;
  title: string;
  subtitle: string;
  updated: string;
  readMins: number;
  summary: string;
  sections: LegalSection[];
};

export const LEGAL_UPDATED = "15 November 2026";

export const TERMS: LegalDoc = {
  crumb: "Terms & Conditions",
  title: "Terms & Conditions",
  subtitle: "The rules that keep Vikasitha safe, genuine and respectful for every family.",
  updated: LEGAL_UPDATED,
  readMins: 6,
  summary:
    "In short: be genuine, be respectful, and use Vikasitha only to find a marriage partner. We can remove profiles that break these rules, and you can delete your account at any time.",
  sections: [
    {
      id: "acceptance",
      title: "Acceptance of terms",
      body: [
        "By creating an account or using Vikasitha you agree to these Terms. If you do not agree, please do not use the service.",
        "These Terms work together with our Privacy Policy, which explains how we handle your information.",
      ],
    },
    {
      id: "who-can-use",
      title: "Who can use Vikasitha",
      body: [
        "You must be at least 18 years old (or the legal age of marriage where you live) and legally free to marry.",
        "Parents, siblings or relatives may create and manage a profile on behalf of an adult family member, with that person’s knowledge and consent.",
        "One person may have only one active profile.",
      ],
    },
    {
      id: "your-profile",
      title: "Your profile & content",
      body: [
        "• Information you post must be true and up to date.",
        "• Photos must be of the person the profile is for.",
        "• Do not post phone numbers, addresses or links in public profile text.",
        "• You keep ownership of your content but give us permission to display it to other members.",
      ],
    },
    {
      id: "conduct",
      title: "Respectful conduct",
      body: [
        "Harassment, abusive language, requests for money, commercial promotion and fake profiles are not allowed. Report anything suspicious and our team will review it.",
      ],
    },
    {
      id: "verification",
      title: "Verification",
      body: [
        "Phone verification is required. ID verification is optional and earns a Verified badge. Verification reduces risk but does not guarantee anyone’s identity or intentions, so always take care when meeting someone.",
      ],
    },
    {
      id: "plans",
      title: "Paid plans & refunds",
      body: [
        "Free accounts can browse and send a limited number of interests. Paid plans unlock extra features for the period you pay for.",
        "Plans do not renew automatically. [Add your refund rules here.]",
      ],
    },
    {
      id: "suspension",
      title: "Suspension, termination & deleting your account",
      body: [
        "We may suspend or remove profiles that break these Terms.",
        "You can delete your account at any time. Deleting your account removes your profile from search straight away and ends any paid plan without a refund for the unused time. How we delete your data is explained in the Privacy Policy under “Deleting your account”.",
      ],
    },
    {
      id: "liability",
      title: "Liability",
      body: [
        "Vikasitha introduces members; we are not a party to any relationship or marriage that results. [Your legal adviser should complete this section.]",
      ],
    },
    {
      id: "changes",
      title: "Changes & contact",
      body: [
        "We may update these Terms and will notify members of important changes. Questions: [support email] · [WhatsApp number].",
      ],
    },
  ],
};

export const PRIVACY: LegalDoc = {
  crumb: "Privacy Policy",
  title: "Privacy Policy",
  subtitle: "How we collect, use and protect your information, written in plain language.",
  updated: LEGAL_UPDATED,
  readMins: 5,
  summary:
    "In short: we collect only what we need to help you find a match, we never sell your data, and nobody sees your phone or contact details until you choose to share them.",
  sections: [
    {
      id: "collect",
      title: "Information we collect",
      body: [
        "• Account details: mobile number, password (encrypted).",
        "• Profile details you choose to add: name, age, religion, education, profession, photos, horoscope, family details.",
        "• Usage data: pages viewed, interests sent, device and approximate location, to keep the service safe and working.",
      ],
    },
    {
      id: "use",
      title: "How we use it",
      body: [
        "To show your profile to suitable members, suggest matches, verify accounts, prevent fraud, provide support, and (only if you agree) send you updates and offers.",
      ],
    },
    {
      id: "who-sees",
      title: "Who can see your information",
      body: [
        "• Your profile (without contact details) is visible to logged-in members.",
        "• Phone number and full contact details are shared only after you accept an interest and agree to share them.",
        "• You can hide your photos until you accept an interest.",
        "• We never sell personal data.",
      ],
    },
    {
      id: "sharing",
      title: "Sharing with others",
      body: [
        "We share data only with service providers who help us run Vikasitha (hosting, SMS, payments) under confidentiality agreements, or when required by law.",
      ],
    },
    {
      id: "security",
      title: "Storage & security",
      body: [
        "Data is stored on secure servers with encryption in transit. Payments are handled by a certified payment gateway; we do not store card numbers.",
      ],
    },
    {
      id: "rights",
      title: "Your rights",
      body: [
        "You can view, update or download your data, withdraw consent for marketing, and delete your account at any time. This policy is intended to follow Sri Lanka’s Personal Data Protection Act No. 9 of 2022. [Confirm with your legal adviser.]",
      ],
    },
    {
      id: "delete-account",
      title: "Deleting your account",
      body: [
        "You can ask us to delete your account and personal data at any time, free of charge.",
        "• Open your profile menu → Account settings → Delete account, tell us why (optional comment), and confirm.",
        "• We send a one-time SMS code to your verified mobile to confirm it is you, then hide your profile from search immediately.",
        "• Can’t log in? Contact support from your registered mobile number or email and tell us your profile ID (for example MP-24688).",
        "• Your profile, photos, messages and ID documents are permanently deleted within [30] days. We keep only what the law requires (for example payment records) for as long as it requires.",
        "If you only want a break, choose Account settings → Take a break to hide your profile instead. You can show it again any time without creating a new account.",
      ],
    },
    {
      id: "retention",
      title: "How long we keep data",
      body: [
        "We keep your data while your account is active. After deletion, profile data is removed within [30] days, except records we must keep by law.",
      ],
    },
    {
      id: "cookies",
      title: "Cookies",
      body: [
        "We use essential cookies to keep you logged in and optional analytics cookies to improve the site. You can manage cookies in your browser.",
      ],
    },
    {
      id: "contact",
      title: "Contact us",
      body: ["Data protection questions: [privacy email] · [postal address, Sri Lanka]."],
    },
  ],
};
