/**
 * "How to use" page copy (EN + SI). Screens live in /public/how-to-use/*.webp — real 390px captures of the app.
 * Sinhala copy: needs a native-speaker review before launch.
 */
import type { Language } from "@/content/translations";

export type StatusTone = "neutral" | "warning" | "success" | "error" | "brand" | "premium" | "info";
export interface Status {
  label: string;
  tone: StatusTone;
}
export interface Shot {
  src: string;
  alt: string;
}
export interface JourneyStep {
  id: string;
  title: string;
  text: string;
  shot: Shot;
  statuses?: Status[];
}
export interface TourItem {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
  where: string;
  shots: Shot[];
  statuses?: Status[];
}
export interface TourGroup {
  id: string;
  title: string;
  description: string;
  items: TourItem[];
}
export interface HowToUseCopy {
  crumb: string;
  title: string;
  subtitle: string;
  trust: string[];
  tourLink: string;
  journeyEyebrow: string;
  journeyTitle: string;
  journeyText: string;
  stepLabel: string;
  statusLabel: string;
  whereLabel: string;
  steps: JourneyStep[];
  tourEyebrow: string;
  tourTitle: string;
  tourText: string;
  groups: TourGroup[];
  ctaTitle: string;
  ctaText: string;
  ctaMemberTitle: string;
  ctaMemberText: string;
  login: string;
  createNew: string;
  dashboard: string;
  search: string;
}

const S = (name: string, alt: string): Shot => ({ src: `/how-to-use/${name}.webp`, alt });

const en: HowToUseCopy = {
  crumb: "How to use",
  title: "How Vikasitha works",
  subtitle: "Every step from creating your account to sharing contact details, with the real screens you’ll see.",
  trust: ["ID-verified members", "Private by default", "Sri Lanka & abroad"],
  tourLink: "See the full tour",
  journeyEyebrow: "Your journey",
  journeyTitle: "From sign-up to your first conversation",
  journeyText: "Six simple steps. Tap a step to see the screen.",
  stepLabel: "Step",
  statusLabel: "What you’ll see",
  whereLabel: "Find it in",
  steps: [
    {
      id: "register",
      title: "Create your account",
      text: "Sign up with your mobile number or Google, verify it with a 6-digit code, then add your profile details and photos.",
      shot: S("register", "Create your free account screen"),
    },
    {
      id: "login",
      title: "Log in",
      text: "Use your email or mobile number and password. Forgot it? Reset it with a code sent to your email or mobile.",
      shot: S("login", "Log in screen"),
    },
    {
      id: "verify",
      title: "Get verified",
      text: "Our safety team checks your profile and ID. You’ll see the status on your dashboard. Fix anything flagged and resubmit.",
      shot: S("kyc-pending", "Profile under review on the dashboard"),
      statuses: [
        { label: "Pending review", tone: "warning" },
        { label: "Changes needed", tone: "error" },
        { label: "Approved", tone: "success" },
      ],
    },
    {
      id: "find",
      title: "Find your match",
      text: "See today’s best matches, search with filters and open full profiles. Free members get 3 searches and 5 profile views a month.",
      shot: S("search", "Search proposals screen"),
    },
    {
      id: "interest",
      title: "Send interest",
      text: "Like someone? Send an interest. When they accept, you become Friends and chat unlocks.",
      shot: S("send-interest", "Send interest button on a profile"),
      statuses: [
        { label: "Interest sent", tone: "info" },
        { label: "Accepted · Friends", tone: "success" },
        { label: "Declined", tone: "neutral" },
      ],
    },
    {
      id: "chat",
      title: "Chat & share contacts",
      text: "Message your friends safely. When you’re both ready, request to swap mobile and WhatsApp numbers, shared only if they accept.",
      shot: S("contact-request", "Contact details request in chat"),
      statuses: [
        { label: "Request sent", tone: "warning" },
        { label: "Accept & share", tone: "brand" },
        { label: "Contact shared", tone: "success" },
      ],
    },
  ],
  tourEyebrow: "The full tour",
  tourTitle: "Everything you can do",
  tourText: "A closer look at each part of Vikasitha, and where to find it.",
  groups: [
    {
      id: "account",
      title: "Your account",
      description: "Sign up, log in and get your profile approved.",
      items: [
        {
          id: "register",
          title: "Create your account",
          summary: "A free account in four short steps.",
          bullets: ["Sign up with mobile number or Google", "Verify your mobile with a 6-digit code", "Add profile details: religion, education, job, family", "Upload photos or choose an avatar"],
          where: "Home → Create New",
          shots: [S("register", "Create account screen"), S("register-verify", "Verify your mobile with a 6-digit code")],
        },
        {
          id: "login",
          title: "Log in & reset your password",
          summary: "Log in with email or mobile, and get back in fast if you forget your password.",
          bullets: ["Email or mobile number + password", "Continue with Google", "Forgot password: choose email or mobile → 6-digit code → new password"],
          where: "Login → Forgot password?",
          shots: [S("login", "Log in screen"), S("forgot-password", "Reset password screen")],
        },
        {
          id: "verify",
          title: "Profile verification",
          summary: "Every profile is checked by our safety team before it goes live.",
          bullets: ["See exactly what we’re checking", "If something needs a fix, we show which fields and why", "Fix and resubmit, no need to start again"],
          where: "Dashboard",
          shots: [S("kyc-pending", "Profile under review"), S("kyc-changes", "Profile needs changes")],
          statuses: [
            { label: "Pending review", tone: "warning" },
            { label: "Changes needed", tone: "error" },
            { label: "Resubmitted", tone: "info" },
            { label: "Approved · Profile live", tone: "success" },
          ],
        },
        {
          id: "edit",
          title: "Edit your profile",
          summary: "Keep your profile fresh after it’s approved.",
          bullets: ["Update your “About me” description", "Add, reorder or remove photos", "Other details are read-only. Contact support to change them"],
          where: "Dashboard → Edit profile",
          shots: [S("edit-profile", "Edit your description"), S("edit-photos", "Edit your photos")],
        },
      ],
    },
    {
      id: "find",
      title: "Finding a match",
      description: "Browse matches picked for you, or search your own way.",
      items: [
        {
          id: "dashboard",
          title: "Your dashboard",
          summary: "Your home after logging in: new matches, interests and your plan at a glance.",
          bullets: ["Today’s best matches", "New interests and messages", "Profile strength and plan usage"],
          where: "Dashboard",
          shots: [S("dashboard", "Member dashboard"), S("dashboard-matches", "Plan and activity on the dashboard")],
        },
        {
          id: "search",
          title: "Search & view profiles",
          summary: "Filter by age, religion, location and more, then open a full profile.",
          bullets: ["Filters, sort and grid / list view", "Full profile: details, family, horoscope", "Save favourites, share or report a profile"],
          where: "Search",
          shots: [S("search", "Search results"), S("profile", "Profile details")],
        },
        {
          id: "limits",
          title: "Free plan limits",
          summary: "Free members get 3 searches and 5 profile views each month. The counter resets on the 1st.",
          bullets: ["Remaining searches and views are shown on Search", "When they run out you can upgrade or go back to your dashboard"],
          where: "Search · Dashboard",
          shots: [S("search", "Searches and views left"), S("free-limit", "Free limit reached")],
        },
      ],
    },
    {
      id: "connect",
      title: "Connecting",
      description: "Interests, friends, messages and contact details, always with both people’s consent.",
      items: [
        {
          id: "interest",
          title: "Send an interest",
          summary: "Show someone you’re interested. They decide whether to accept.",
          bullets: ["Gold members can send interests", "Photos and contact details stay private until they accept", "Track sent interests on the Friends page"],
          where: "Profile → Send interest",
          shots: [S("profile", "Open a profile"), S("send-interest", "Send interest on a profile")],
          statuses: [
            { label: "Interest sent", tone: "info" },
            { label: "Accepted", tone: "success" },
            { label: "Declined", tone: "neutral" },
          ],
        },
        {
          id: "respond",
          title: "Accept or decline",
          summary: "Interests you receive wait for you on the Friends page.",
          bullets: ["See who is interested and why it’s a match", "Accept to become Friends and unlock chat", "Decline politely, they won’t see a reason"],
          where: "Friends → Received",
          shots: [S("interest-received", "Interest received"), S("accept-interest", "Accept or decline an interest")],
          statuses: [
            { label: "Request received", tone: "brand" },
            { label: "Accepted · Friends", tone: "success" },
            { label: "Declined", tone: "neutral" },
          ],
        },
        {
          id: "sent",
          title: "Track sent interests",
          summary: "Every interest you send is listed in Friends → Sent, with its latest status.",
          bullets: ["See who hasn’t replied yet", "Accepted interests move to Friends", "Open the profile again any time"],
          where: "Friends → Sent",
          shots: [S("interest-sent", "Sent interests"), S("sent-detail", "Waiting for a reply")],
          statuses: [
            { label: "Waiting for reply", tone: "warning" },
            { label: "Accepted", tone: "success" },
            { label: "Declined", tone: "neutral" },
          ],
        },
        {
          id: "favourites",
          title: "Favourites",
          summary: "Not ready to send an interest? Tap the heart to save a profile for later.",
          bullets: ["Tap ♡ on any profile card", "Find saved profiles in Friends → Favourites", "Send an interest when you’re ready"],
          where: "Friends → Favourites",
          shots: [S("promoted", "Tap the heart on a profile"), S("favourites", "Favourites")],
        },
        {
          id: "friends",
          title: "Friends page",
          summary: "All your connections in one place.",
          bullets: ["Friends · Favourites · Received · Sent", "Open any profile on the right", "Message a friend in one tap"],
          where: "Friends",
          shots: [S("friends", "Friends page"), S("friend-detail", "Message a friend")],
        },
        {
          id: "chat",
          title: "Messages",
          summary: "Chat safely with members who accepted your interest.",
          bullets: ["Safety tips in every chat", "Block or report in one tap", "Never share bank details or send money"],
          where: "Messages",
          shots: [S("messages-list", "Your conversations"), S("chat", "Chat conversation")],
        },
        {
          id: "contact",
          title: "Share contact details",
          summary: "Swap mobile and WhatsApp numbers only when you both agree.",
          bullets: ["Tap Share contact in the chat (Gold)", "They choose Accept & share or Not now", "Only mobile & WhatsApp, never email or address"],
          where: "Messages → Share contact",
          shots: [S("contact-request", "Contact details request"), S("contact-shared", "Contact details shared")],
          statuses: [
            { label: "Request sent", tone: "warning" },
            { label: "Accept & share", tone: "brand" },
            { label: "Not now", tone: "neutral" },
            { label: "Contact shared", tone: "success" },
          ],
        },
      ],
    },
    {
      id: "safety",
      title: "Safety & privacy",
      description: "You stay in control of who sees you and what you share.",
      items: [
        {
          id: "report",
          title: "Report or block",
          summary: "If something doesn’t feel right, tell us. Reports are private.",
          bullets: ["Report a profile with a reason. The member won’t know it was you", "Block from a chat: they can’t see or message you", "Our safety team reviews every report"],
          where: "Profile → Report profile · Chat → ⋯ → Block",
          shots: [S("report", "Report a profile"), S("chat-menu", "Block or report from a chat")],
          statuses: [
            { label: "Report sent", tone: "info" },
            { label: "Under review", tone: "warning" },
            { label: "Action taken", tone: "success" },
          ],
        },
      ],
    },
    {
      id: "plans",
      title: "Plans",
      description: "Start free. Upgrade only when you’re ready.",
      items: [
        {
          id: "gold",
          title: "Free vs Gold",
          summary: "Gold unlocks unlimited search, interests, messages and contact sharing.",
          bullets: ["1, 3 or 6 months, save up to 25%", "Promote your profile to appear first", "Cancel anytime, no hidden fees"],
          where: "Plans",
          shots: [S("plans", "Plans page"), S("plans-gold", "The Gold plan")],
          statuses: [
            { label: "Free", tone: "neutral" },
            { label: "Gold", tone: "premium" },
          ],
        },
        {
          id: "promote",
          title: "Promote your profile",
          summary: "Gold members can boost their profile to the top of matching searches.",
          bullets: ["7-day boost for LKR 500", "Gold card with a “Promoted” badge", "Shown only to members inside your partner preferences"],
          where: "Dashboard → Promote your profile",
          shots: [S("promote", "Promote your profile"), S("promoted", "Promoted profiles in search")],
          statuses: [
            { label: "7-day boost", tone: "premium" },
            { label: "Promoted", tone: "success" },
          ],
        },
      ],
    },
  ],
  ctaTitle: "Ready to meet your match?",
  ctaText: "Create your free account in a few minutes. Upgrade only when you’re ready.",
  ctaMemberTitle: "You’re all set",
  ctaMemberText: "Head back to your dashboard to see today’s matches.",
  login: "Login",
  createNew: "Create New",
  dashboard: "Go to dashboard",
  search: "Search proposals",
};

const si: HowToUseCopy = {
  ...en,
  crumb: "භාවිතා කරන ආකාරය",
  title: "විකසිත භාවිතා කරන ආකාරය",
  subtitle: "ගිණුමක් සෑදීමේ සිට සම්බන්ධතා තොරතුරු බෙදා ගැනීම දක්වා සෑම පියවරක්ම, ඔබට පෙනෙන සැබෑ තිර සමඟ.",
  trust: ["හැඳුනුම්පත සත්‍යාපිත සාමාජිකයින්", "පෙරනිමියෙන් පෞද්ගලිකයි", "ශ්‍රී ලංකාව සහ විදේශ"],
  tourLink: "සම්පූර්ණ මාර්ගෝපදේශය බලන්න",
  journeyEyebrow: "ඔබේ ගමන",
  journeyTitle: "ලියාපදිංචියේ සිට පළමු සංවාදය දක්වා",
  journeyText: "සරල පියවර හයක්. තිරය බැලීමට පියවරක් තට්ටු කරන්න.",
  stepLabel: "පියවර",
  statusLabel: "ඔබට පෙනෙන දේ",
  whereLabel: "සොයා ගත හැකි තැන",
  steps: [
    { ...en.steps[0], title: "ගිණුමක් සාදන්න", text: "ජංගම අංකය හෝ Google මගින් ලියාපදිංචි වී, ඉලක්කම් 6ක කේතයකින් තහවුරු කර, ඔබේ විස්තර සහ ඡායාරූප එක් කරන්න." },
    { ...en.steps[1], title: "පිවිසෙන්න", text: "ඊමේල් හෝ ජංගම අංකය සහ මුරපදය භාවිතා කරන්න. අමතක වුණාද? ඊමේල් හෝ ජංගම දුරකථනයට එවන කේතයකින් යළි සකසන්න." },
    {
      ...en.steps[2],
      title: "සත්‍යාපනය ලබා ගන්න",
      text: "අපගේ ආරක්ෂක කණ්ඩායම ඔබේ පැතිකඩ සහ හැඳුනුම්පත පරීක්ෂා කරයි. තත්ත්වය පාලක පුවරුවේ පෙනේ, සඳහන් කළ දේ නිවැරදි කර නැවත ඉදිරිපත් කරන්න.",
      statuses: [
        { label: "සමාලෝචනය වෙමින්", tone: "warning" },
        { label: "වෙනස්කම් අවශ්‍යයි", tone: "error" },
        { label: "අනුමතයි", tone: "success" },
      ],
    },
    { ...en.steps[3], title: "ගැළපෙන අයෙකු සොයන්න", text: "අද හොඳම ගැළපීම් බලන්න, පෙරහන් සමඟ සොයන්න, සම්පූර්ණ පැතිකඩ විවෘත කරන්න. නොමිලේ සාමාජිකයින්ට මසකට සෙවීම් 3ක් සහ පැතිකඩ බැලීම් 5ක්." },
    {
      ...en.steps[4],
      title: "කැමැත්ත යවන්න",
      text: "කෙනෙකුට කැමතිද? කැමැත්ත යවන්න. ඔවුන් පිළිගත් විට ඔබ මිතුරන් වන අතර කතාබහ විවෘත වේ.",
      statuses: [
        { label: "කැමැත්ත යැව්වා", tone: "info" },
        { label: "පිළිගත්තා · මිතුරන්", tone: "success" },
        { label: "ප්‍රතික්ෂේප කළා", tone: "neutral" },
      ],
    },
    {
      ...en.steps[5],
      title: "කතාබහ සහ සම්බන්ධතා",
      text: "ඔබේ මිතුරන් සමඟ ආරක්ෂිතව කතා කරන්න. දෙදෙනාම සූදානම් වූ විට ජංගම සහ WhatsApp අංක හුවමාරුවට ඉල්ලන්න, ඔවුන් පිළිගත්තොත් පමණි.",
      statuses: [
        { label: "ඉල්ලීම යැව්වා", tone: "warning" },
        { label: "පිළිගෙන බෙදන්න", tone: "brand" },
        { label: "සම්බන්ධතා බෙදා ගත්තා", tone: "success" },
      ],
    },
  ],
  tourEyebrow: "සම්පූර්ණ මාර්ගෝපදේශය",
  tourTitle: "ඔබට කළ හැකි සියල්ල",
  tourText: "විකසිතයේ සෑම කොටසක්ම සහ එය සොයා ගත හැකි තැන.",
  ctaTitle: "ඔබේ සහකරු හමු වීමට සූදානම්ද?",
  ctaText: "මිනිත්තු කිහිපයකින් නොමිලේ ගිණුමක් සාදන්න. සූදානම් වූ විට පමණක් උසස් කරන්න.",
  ctaMemberTitle: "ඔබ සූදානම්",
  ctaMemberText: "අද ගැළපීම් බැලීමට ඔබේ පාලක පුවරුවට යන්න.",
  login: "පිවිසෙන්න",
  createNew: "නව ගිණුමක්",
  dashboard: "පාලක පුවරුවට",
  search: "යෝජනා සොයන්න",
};

export const HOW_TO_USE: Record<Language, HowToUseCopy> = { en, si };
