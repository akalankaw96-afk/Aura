import type { LegalDoc } from "@/content/legal";

/**
 * About us copy — same layout as Terms / Privacy (components/sections/legal/LegalPage).
 * Text in [square brackets] is for the business to fill in (founding year, team, address).
 * English only for now; Sinhala to follow.
 */
export const ABOUT: LegalDoc = {
  crumb: "About us",
  title: "About Yugadiwi",
  subtitle: "A Sri Lankan marriage proposals service built around trust, families and respect.",
  readMins: 3,
  summary:
    "Yugadiwi helps Sri Lankan families and individuals, at home and abroad, find a life partner safely. Every member verifies their mobile, profiles are checked by our team, and nobody sees your contact details until you choose to share them.",
  helpTitle: "Want to talk to us?",
  related: [
    { href: "/how-to-use", label: "How it works" },
    { href: "/terms", label: "Terms & Conditions" },
    { href: "/privacy", label: "Privacy Policy" },
  ],
  sections: [
    {
      id: "who-we-are",
      title: "Who we are",
      body: [
        "Yugadiwi (යුගදිවි, “a life together”) is a Sri Lankan marriage proposals platform. We bring the trusted way families have always looked for a partner, through introductions, horoscopes and family values, into a simple, safe website and app.",
        "We started Yugadiwi in [year] in [city] because finding a genuine proposal online was harder and riskier than it should be. [Add a short founder story here.]",
      ],
    },
    {
      id: "what-we-believe",
      title: "What we believe",
      body: [
        "• Marriage is a family decision. Parents and relatives can create and manage a profile together with the person it is for.",
        "• Trust comes first. A real, verified person behind every profile matters more than the number of profiles.",
        "• Your details are yours. Phone numbers and contacts are shared only when both sides agree.",
        "• Respect for every culture, religion and community in Sri Lanka and in Sri Lankan families abroad.",
      ],
    },
    {
      id: "how-we-keep-it-safe",
      title: "How we keep it safe",
      body: [
        "• Mobile verification for every account, and optional ID verification for a Verified badge.",
        "• Every new profile and photo is checked by our team before it appears in search.",
        "• Contact details stay hidden until you accept an interest and choose to share them.",
        "• Report and block on every profile and chat, reviewed by real people.",
      ],
    },
    {
      id: "what-you-can-do",
      title: "What you can do on Yugadiwi",
      body: [
        "Search brides and grooms by age, religion, district, education and more, send interests, chat with friends you have accepted, match horoscopes, and share contact details when you are ready. Free members can try everything; Gold and Platinum unlock unlimited searches, chats and extra features.",
      ],
    },
    {
      id: "who-its-for",
      title: "Who it’s for",
      body: [
        "Sri Lankans aged 18 and over who are looking for marriage, and the parents, brothers, sisters and relatives helping them, whether they live in Sri Lanka or overseas.",
      ],
    },
    {
      id: "our-team",
      title: "Our team",
      body: [
        "We are a small team based in Sri Lanka who care about getting this right. Our support and safety team reads every report and helps members in Sinhala and English. [Add team members or a team photo if you wish.]",
      ],
    },
    {
      id: "contact",
      title: "Contact us",
      body: [
        "Email: [support email] · WhatsApp / phone: [number] · Office: [postal address, Sri Lanka].",
        "For help with your account, use Contact support, we usually reply within one working day.",
      ],
    },
  ],
};
