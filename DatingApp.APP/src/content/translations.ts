/**
 * Complete Sinhala and English translations dictionary.
 * Supports reactive, instant language switching across the entire platform.
 */

export type Language = "en" | "si";

export interface Translations {
  nav: {
    home: string;
    brides: string;
    grooms: string;
    howItWorks: string;
    pricing: string;
    createOrLogin: string;
    createAccount: string;
    login: string;
    dashboard: string;
    requests: string;
    messages: string;
    plans: string;
    search: string;
    logout: string;
  };
  hero: {
    title: string;
    description: string;
    lookingFor: string;
    bride: string;
    groom: string;
    all: string;
    brides: string;
    grooms: string;
    religion: string;
    age: string;
    search: string;
  };
  howItWorks: {
    eyebrow: string;
    title: string;
    description: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    step4Title: string;
    step4Desc: string;
  };
  featured: {
    eyebrow: string;
    title: string;
    subtitle: string;
    viewDetails: string;
    verified: string;
  };
  stories: {
    eyebrow: string;
    title: string;
    description: string;
    watchStory: string;
    items: Array<{
      badge: string;
      headline: string;
      quote: string;
      names: string;
      meta: string;
      caption: string;
      captionMeta: string;
    }>;
  };
  categories: {
    eyebrow: string;
    title: string;
    description: string;
    exploreAll: string;
    proposals: string;
    labels: Record<string, string>;
  };
  pricing: {
    eyebrow: string;
    title: string;
    subtitle: string;
    free: string;
    gold: string;
    platinum: string;
    choosePlan: string;
  };
  faq: {
    eyebrow: string;
    title: string;
    description: string;
    helpTitle: string;
    helpText: string;
    helpCta: string;
    items: Array<{
      q: string;
      a: string;
    }>;
  };
  signUp: {
    eyebrow: string;
    title: string;
    body: string;
    benefits: string[];
    formTitle: string;
    formSubtitle: string;
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    cta: string;
    legal: string;
  };
  footer: {
    tagline: string;
    rights: string;
    privacy: string;
    terms: string;
    about: string;
    contact: string;
  };
  dashboard: {
    eyebrow: string;
    welcomeBack: string;
    goodMorning: string;
    goodAfternoon: string;
    goodEvening: string;
    matchesWaiting: string;
    seeMatches: string;
    completeProfile: string;
    editProfile: string;
    profileStrength: string;
    profileViews: string;
    interestsReceived: string;
    shortlistedYou: string;
    unreadMessages: string;
    newRequests: string;
    favourites: string;
    allFavourites: string;
    noFavouritesTitle: string;
    noFavouritesBody: string;
    browseProfiles: string;
    viewAllRequests: string;
    newMessages: string;
    openInbox: string;
    quickSearch: string;
    searchSubtitle: string;
    advancedSearch: string;
    bestMatches: string;
    bestMatchesTitle: string;
    accept: string;
    decline: string;
    friends: string;
    allFriends: string;
    messagesTab: string;
    profile: string;
    message: string;
    newFriend: string;
    sayHello: string;
    acceptedAdded: string;
    connectedJustNow: string;
    onlineNow: string;
    noFriendsTitle: string;
    noFriendsBody: string;
    noRequestsTitle: string;
    noRequestsBody: string;
    noMessagesTitle: string;
    noMessagesBody: string;
    addPhotos: string;
    browseMatches: string;
  };
  requests: {
    title: string;
    subtitle: string;
    received: string;
    sent: string;
    accepted: string;
    searchPlaceholder: string;
    acceptInterest: string;
    decline: string;
    interestNote: string;
    aboutTitle: string;
  };
  messages: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    all: string;
    unread: string;
    activeNow: string;
    viewProfile: string;
    typeMessage: string;
    send: string;
    safetyNote: string;
    back: string;
    blocked: string;
    blockedMembers: string;
    blockedHelp: string;
    blockedOn: (date: string) => string;
    unblock: string;
    report: string;
    muteNotifications: string;
    unmuteNotifications: string;
    block: string;
    blockTitle: (name: string) => string;
    blockPoint1: string;
    blockPoint2: string;
    blockPoint3: string;
    reasonLabel: string;
    reasonPlaceholder: string;
    reasons: string[];
    alsoReport: string;
    cancel: string;
    youBlocked: (name: string) => string;
    youBlockedBody: string;
    cantReply: string;
    blockedStatus: string;
    blockedToast: (name: string) => string;
    unblockedToast: (name: string) => string;
    reportedToast: string;
    mutedToast: string;
    unmutedToast: string;
    noBlockedTitle: string;
    noBlockedBody: string;
    moreOptions: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    mobileLabel: string;
    passwordLabel: string;
    loginButton: string;
    forgotPassword: string;
    dontHaveAccount: string;
    registerNow: string;
    registerTitle: string;
    registerSubtitle: string;
  };
}

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    nav: {
      home: "Home",
      brides: "Brides",
      grooms: "Grooms",
      howItWorks: "How it works",
      pricing: "Pricing",
      createOrLogin: "Create/ Login",
      createAccount: "Create New",
      login: "Login",
      dashboard: "Dashboard",
      requests: "Requests",
      messages: "Messages",
      plans: "Plans",
      search: "Search",
      logout: "Log out",
    },
    hero: {
      title: "Find a life partner your whole family can trust",
      description:
        "Real, photo-verified marriage proposals from across Sri Lanka and Sri Lankans overseas. Your contact details stay private until you say yes.",
      lookingFor: "I'm looking for",
      bride: "Bride",
      groom: "Groom",
      all: "All",
      brides: "Brides",
      grooms: "Grooms",
      religion: "Religion",
      age: "Age",
      search: "Search",
    },
    howItWorks: {
      eyebrow: "How it works",
      title: "Four steps to your forever",
      description: "Simple, safe and family-friendly from first profile to the poruwa.",
      step1Title: "Create your profile",
      step1Desc: "Post for yourself or for your son, daughter or sibling with photo verification.",
      step2Title: "Browse verified profiles",
      step2Desc: "Filter by religion, age, district and profession with full privacy controls.",
      step3Title: "Send an interest",
      step3Desc: "Your contact details stay private until both sides agree to connect.",
      step4Title: "Connect and talk",
      step4Desc: "Arrange family calls and take the confident next step together.",
    },
    featured: {
      eyebrow: "Featured profiles",
      title: "Latest verified proposals",
      subtitle: "Handpicked, verified members actively looking for marriage partners.",
      viewDetails: "View details",
      verified: "Verified",
    },
    stories: {
      eyebrow: "Success stories",
      title: "Trusted by 100+ happy couples",
      description: "Real families, real weddings — from Colombo to Melbourne.",
      watchStory: "Watch their story",
      items: [
        {
          badge: "Married 2025",
          headline: "Our families clicked first",
          quote: "Amma found his profile, we spoke for a month, and the horoscopes matched perfectly.",
          names: "Kasun & Sachini",
          meta: "Colombo · Buddhist",
          caption: "Watch their story",
          captionMeta: "Poruwa ceremony · March 2025",
        },
        {
          badge: "Married 2024",
          headline: "Across two continents",
          quote: "I was in Melbourne, she was in Kandy. Video calls with both families made it feel easy.",
          names: "Ravindu & Nadeesha",
          meta: "Melbourne · Buddhist",
          caption: "Watch their story",
          captionMeta: "Kandyan wedding · June 2024",
        },
        {
          badge: "Married 2024",
          headline: "Verified made us brave",
          quote: "Knowing every profile was checked gave my parents the confidence to say yes.",
          names: "Arun & Tharshini",
          meta: "Jaffna · Hindu",
          caption: "Watch their story",
          captionMeta: "Temple wedding · August 2024",
        },
        {
          badge: "Married 2023",
          headline: "A match at the first call",
          quote: "We talked for three hours on our first call. Six months later we were on the poruwa.",
          names: "Dilan & Malsha",
          meta: "Galle · Buddhist",
          caption: "Watch their story",
          captionMeta: "Poruwa ceremony · December 2023",
        },
        {
          badge: "Married 2023",
          headline: "Our parents became friends",
          quote: "Both mothers chatted on the app before we did. By the time we met, the families were already close.",
          names: "Sahan & Hiruni",
          meta: "Kurunegala · Buddhist",
          caption: "Watch their story",
          captionMeta: "Poruwa ceremony · May 2023",
        },
        {
          badge: "Married 2025",
          headline: "Home, even from Dubai",
          quote: "Working abroad I worried I'd miss out. Vikasitha brought a match from my own hometown.",
          names: "Mohamed & Fathima",
          meta: "Dubai · Islam",
          caption: "Watch their story",
          captionMeta: "Nikah ceremony · January 2025",
        },
        {
          badge: "Married 2024",
          headline: "Same values, same dreams",
          quote: "We both wanted a simple wedding and a big family. The filters found exactly that.",
          names: "Janith & Piumi",
          meta: "Negombo · Catholic",
          caption: "Watch their story",
          captionMeta: "Church wedding · October 2024",
        },
      ],
    },
    categories: {
      eyebrow: "Top categories",
      title: "Browse proposals your way",
      description: "Jump straight to the profiles that matter to your family.",
      exploreAll: "Explore all categories",
      proposals: "proposals",
      labels: {
        "Female teachers": "Female teachers",
        "Parent-posted ads": "Parent-posted ads",
        "ID-verified ads": "ID-verified ads",
        "Degree holders": "Degree holders",
        "Female doctors": "Female doctors",
        "Male engineers": "Male engineers",
        "Overseas grooms": "Overseas grooms",
        "Brides in Sri Lanka": "Brides in Sri Lanka",
        "Diploma holders": "Diploma holders",
        "Male IT experts": "Male IT experts",
        "With horoscope": "With horoscope",
        "Premium members": "Premium members",
        "Kandyan": "Kandyan",
        "Low-country": "Low-country",
        "Second marriage": "Second marriage",
        "Nurses": "Nurses",
        "Government sector": "Government sector",
        "Business owners": "Business owners",
      },
    },
    pricing: {
      eyebrow: "Pricing",
      title: "Simple, transparent plans",
      subtitle: "Choose the package that best fits your family's journey.",
      free: "Free",
      gold: "Gold",
      platinum: "Platinum",
      choosePlan: "Choose plan",
    },
    faq: {
      eyebrow: "FAQ",
      title: "Questions families ask",
      description: "Everything you need to know about safety, privacy and how matching works.",
      helpTitle: "Still have questions?",
      helpText: "Call or WhatsApp our Colombo team, 9am–6pm every day.",
      helpCta: "Contact support",
      items: [
        {
          q: "How do you verify profiles?",
          a: "Every member confirms their phone number, and we check a national ID or passport before the Verified badge appears. Report any suspicious profile and our team reviews it within 24 hours.",
        },
        {
          q: "Can parents create a profile for their son or daughter?",
          a: "Yes. Choose “Son”, “Daughter” or another relative when you register. The profile clearly shows it was posted by family.",
        },
        {
          q: "Who can see my photos and phone number?",
          a: "Your phone number is never shown publicly. Photos can be blurred until you accept an interest, and contact details unlock only when both sides accept.",
        },
        {
          q: "Is horoscope matching available?",
          a: "Yes. Upload your horoscope and Gold members can view and compare horoscopes before sending interest.",
        },
        {
          q: "I live overseas — can I join?",
          a: "Absolutely. Sri Lankans in Australia, the UK, Canada, the Middle East and beyond can register and pay by card.",
        },
      ],
    },
    signUp: {
      eyebrow: "Join free today",
      title: "Ready to meet your life partner?",
      body: "Create your profile in two minutes — for yourself or for your family. Your details stay private until you choose to share them.",
      benefits: [
        "Verified, genuine members only",
        "Photo-verified profiles you can trust",
        "Sinhala, Tamil & English support",
      ],
      formTitle: "Create your free profile",
      formSubtitle: "It takes 2 minutes. Your details stay private until you choose to share them.",
      firstName: "First name",
      lastName: "Last name",
      email: "Email",
      mobile: "Mobile number",
      cta: "Register now",
      legal: "By registering you agree to our Terms and Privacy Policy.",
    },
    footer: {
      tagline: "Sri Lanka's trusted, modern marriage proposal platform.",
      rights: "All rights reserved.",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      about: "About Vikasitha",
      contact: "Contact us",
    },
    dashboard: {
      eyebrow: "Welcome back",
      welcomeBack: "Welcome back",
      goodMorning: "Good morning",
      goodAfternoon: "Good afternoon",
      goodEvening: "Good evening",
      matchesWaiting: "new matches and interest requests are waiting for you today.",
      seeMatches: "See new matches",
      completeProfile: "Complete profile",
      editProfile: "Edit profile",
      profileStrength: "Profile strength",
      profileViews: "Profile views",
      interestsReceived: "Interests received",
      shortlistedYou: "Shortlisted you",
      unreadMessages: "Unread messages",
      newRequests: "New requests",
      favourites: "Favourites",
      allFavourites: "All favourites",
      noFavouritesTitle: "No favourites yet",
      noFavouritesBody: "Tap the heart on a profile to save it here.",
      browseProfiles: "Browse profiles",
      viewAllRequests: "View all requests",
      newMessages: "New messages",
      openInbox: "Open inbox",
      quickSearch: "Find your match",
      searchSubtitle: "Search 12,000+ verified profiles from Sri Lanka and abroad",
      advancedSearch: "Advanced search",
      bestMatches: "Best matches",
      bestMatchesTitle: "Your best matches today",
      accept: "Accept",
      decline: "Decline",
      friends: "Friends",
      allFriends: "All friends",
      messagesTab: "Messages",
      profile: "Profile",
      message: "Message",
      newFriend: "New friend",
      sayHello: "Say hello",
      acceptedAdded: "Accepted · added to your friends",
      connectedJustNow: "Connected just now",
      onlineNow: "Online now",
      noFriendsTitle: "No friends yet",
      noFriendsBody: "When you accept an interest — or someone accepts yours — they’ll appear here so you can message them or view their profile.",
      noRequestsTitle: "No new requests",
      noRequestsBody: "When someone sends you an interest, you’ll see it here.",
      noMessagesTitle: "No messages yet",
      noMessagesBody: "Accept an interest or get yours accepted to start chatting safely.",
      addPhotos: "Add photos",
      browseMatches: "Browse matches",
    },
    requests: {
      title: "Requests & Interests",
      subtitle: "Manage proposals and interests you have received, sent, or accepted.",
      received: "Received",
      sent: "Sent",
      accepted: "Accepted",
      searchPlaceholder: "Search by name, ID or profession…",
      acceptInterest: "Accept interest",
      decline: "Decline",
      interestNote: "Sent you an interest",
      aboutTitle: "About",
    },
    messages: {
      title: "Messages",
      subtitle: "Chat safely with members who accepted your interest.",
      searchPlaceholder: "Search conversations…",
      all: "All",
      unread: "Unread",
      activeNow: "Active now",
      viewProfile: "View profile",
      typeMessage: "Type a message…",
      send: "Send",
      safetyNote: "Keep chats on Vikasitha. Never share bank details or send money.",
      back: "Back",
      blocked: "Blocked",
      blockedMembers: "Blocked members",
      blockedHelp: "Blocked members can't message you, see your profile or find you in search.",
      blockedOn: (d) => `Blocked ${d}`,
      unblock: "Unblock",
      report: "Report",
      muteNotifications: "Mute notifications",
      unmuteNotifications: "Unmute notifications",
      block: "Block",
      blockTitle: (n) => `Block ${n}?`,
      blockPoint1: "They can't message you or see your profile",
      blockPoint2: "You won't appear in their search results",
      blockPoint3: "They aren't told — you can unblock anytime",
      reasonLabel: "Reason (optional)",
      reasonPlaceholder: "Choose a reason",
      reasons: ["Asked for money or bank details", "Rude or inappropriate messages", "Fake or misleading profile", "Not interested anymore", "Other"],
      alsoReport: "Also report this member to our safety team",
      cancel: "Cancel",
      youBlocked: (n) => `You blocked ${n}`,
      youBlockedBody: "They can't message you, see your profile or find you in search. They aren't told that you blocked them.",
      cantReply: "You can't reply to a blocked member. Unblock to chat again.",
      blockedStatus: "Blocked · can't contact you",
      blockedToast: (n) => `${n} is blocked`,
      unblockedToast: (n) => `${n} is unblocked — you can chat again`,
      reportedToast: "Thanks — our safety team will review this member.",
      mutedToast: "Notifications muted for this chat",
      unmutedToast: "Notifications turned back on",
      noBlockedTitle: "No blocked members",
      noBlockedBody: "Members you block will show here. You can unblock them anytime.",
      moreOptions: "More options",
    },
    auth: {
      loginTitle: "Log in to your account",
      loginSubtitle: "Enter your mobile number and password to continue",
      mobileLabel: "Mobile number",
      passwordLabel: "Password",
      loginButton: "Log in",
      forgotPassword: "Forgot password?",
      dontHaveAccount: "Don't have an account?",
      registerNow: "Register now",
      registerTitle: "Create your profile",
      registerSubtitle: "Join Sri Lanka's most trusted matrimony community",
    },
  },

  si: {
    nav: {
      home: "මුල් පිටුව",
      brides: "මනමාලියන්",
      grooms: "මනමාලයන්",
      howItWorks: "ක්‍රියාකාරිත්වය",
      pricing: "මිල ගණන්",
      createOrLogin: "ලියාපදිංචිය / පිවිසෙන්න",
      createAccount: "නව ගිණුමක් සාදන්න",
      login: "පිවිසෙන්න",
      dashboard: "පාලක පුවරුව",
      requests: "යෝජනා",
      messages: "පණිවිඩ",
      plans: "ගාස්තු සැලසුම්",
      search: "සොයන්න",
      logout: "ඉවත් වන්න",
    },
    hero: {
      title: "ඔබේ මුළු පවුලටම විශ්වාස කළ හැකි ජීවිත සහකරුවෙකු සොයා ගන්න",
      description:
        "ශ්‍රී ලංකාව සහ විදේශයන්හි වෙසෙන ශ්‍රී ලාංකිකයන්ගෙන් සත්‍යාපනය කළ සැබෑ මංගල යෝජනා. ඔබ කැමැත්ත ලබා දෙන තුරු ඔබේ සම්බන්ධතා තොරතුරු රහසිගතව තබා ගනී.",
      lookingFor: "මම සොයන්නේ",
      bride: "මනමාලියක්",
      groom: "මනමාලයෙක්",
      all: "සියල්ල",
      brides: "මනමාලියන්",
      grooms: "මනමාලයන්",
      religion: "ආගම",
      age: "වයස",
      search: "යෝජනා සොයන්න",
    },
    howItWorks: {
      eyebrow: "ක්‍රියාකාරිත්වය",
      title: "පොරුව දක්වා පියවර හතරක්",
      description: "පළමු පැතිකඩෙහි සිට පෝරුව දක්වා සරල, ආරක්ෂිත සහ පවුලට ගැළපෙන සේවාවක්.",
      step1Title: "පැතිකඩක් සාදන්න",
      step1Desc: "ඔබ වෙනුවෙන් හෝ ඔබේ පුතා, දියණිය හෝ ඥාතීන් වෙනුවෙන් ඡායාරූප සත්‍යාපනය සමඟ ලියාපදිංචි වන්න.",
      step2Title: "සත්‍යාපිත යෝජනා බලන්න",
      step2Desc: "ආගම, වයස, දිස්ත්‍රික්කය සහ රැකියාව අනුව සම්පූර්ණ රහස්‍යභාවය සහිතව තෝරන්න.",
      step3Title: "කැමැත්ත පළ කරන්න",
      step3Desc: "දෙපාර්ශවයම එකඟ වන තුරු ඔබගේ සම්බන්ධතා තොරතුරු පූර්ණ රහසිගතව පවතී.",
      step4Title: "සම්බන්ධ වී කතාබහ කරන්න",
      step4Desc: "පවුල් අතර සබඳතා ඇති කරගෙන විශ්වාසයෙන් යුතුව මීළඟ පියවර තබන්න.",
    },
    featured: {
      eyebrow: "විශේෂිත යෝජනා",
      title: "නව මංගල යෝජනා",
      subtitle: "විවාහය සඳහා සූදානම්, පරීක්ෂා කර තහවුරු කළ සාමාජිකයින්.",
      viewDetails: "විස්තර බලන්න",
      verified: "සත්‍යාපිතයි",
    },
    stories: {
      eyebrow: "සාර්ථක කතා",
      title: "සතුටුදායක යුවළ 100+ කට වැඩි පිරිසකගේ විශ්වාසය",
      description: "සැබෑ පවුල්, සැබෑ මංගල්‍යයන් — කොළඹ සිට මෙල්බර්න් දක්වා.",
      watchStory: "ඔවුන්ගේ කතාව බලන්න",
      items: [
        {
          badge: "2025 දී විවාහ විය",
          headline: "පළමුවෙන්ම අපේ පවුල් එකඟ වුණා",
          quote: "අම්මා තමයි එයාගේ පැතිකඩ හොයාගත්තේ. අපි මාසයක් කතා කළා, කේන්දරත් අපූරුවට ගැළපුණා.",
          names: "කසුන් සහ සචිනි",
          meta: "කොළඹ · බෞද්ධ",
          caption: "ඔවුන්ගේ කතාව බලන්න",
          captionMeta: "පෝරු මංගල්‍යය · 2025 මාර්තු",
        },
        {
          badge: "2024 දී විවාහ විය",
          headline: "මහාද්වීප දෙකක් යා කරමින්",
          quote: "මම හිටියේ මෙල්බර්න් වල, ඇය මහනුවර. පවුල් දෙක අතර වීඩියෝ ඇමතුම් නිසා හැමදේම හරිම පහසු වුණා.",
          names: "රවිඳු සහ නදීෂා",
          meta: "මෙල්බර්න් · බෞද්ධ",
          caption: "ඔවුන්ගේ කතාව බලන්න",
          captionMeta: "උඩරට මංගල්‍යය · 2024 ජූනි",
        },
        {
          badge: "2024 දී විවාහ විය",
          headline: "සත්‍යාපනය නිසා ලැබුණු විශ්වාසය",
          quote: "සෑම පැතිකඩක්ම පරීක්ෂා කර ඇති බව දැන සිටීම නිසා දෙමාපියන්ට කැමැත්ත දෙන්න ලොකු විශ්වාසයක් ලැබුණා.",
          names: "අරුන් සහ තර්ෂිණී",
          meta: "යාපනය · හින්දු",
          caption: "ඔවුන්ගේ කතාව බලන්න",
          captionMeta: "කෝවිල් මංගල්‍යය · 2024 අගෝස්තු",
        },
        {
          badge: "2023 දී විවාහ විය",
          headline: "පළමු ඇමතුමෙන්ම ඇතිවූ ගැළපීම",
          quote: "පළමු ඇමතුමෙන්ම අපි පැය තුනක් කතා කළා. මාස හයකින් අපි පෝරුවේ හිටියා.",
          names: "ඩිලාන් සහ මල්ෂා",
          meta: "ගාල්ල · බෞද්ධ",
          caption: "ඔවුන්ගේ කතාව බලන්න",
          captionMeta: "පෝරු මංගල්‍යය · 2023 දෙසැම්බර්",
        },
        {
          badge: "2023 දී විවාහ විය",
          headline: "අපේ දෙමාපියන් මුලින්ම මිතුරන් වුණා",
          quote: "අපි කතා කරන්න කලින් අපේ අම්මලා දෙන්නා ඇප් එකෙන් කතා කළා. අපි හමුවෙනකොටත් පවුල් දෙක හරිම ළෙන්ගතුයි.",
          names: "සහන් සහ හිරුනි",
          meta: "කුරුණෑගල · බෞද්ධ",
          caption: "ඔවුන්ගේ කතාව බලන්න",
          captionMeta: "පෝරු මංගල්‍යය · 2023 මැයි",
        },
        {
          badge: "2025 දී විවාහ විය",
          headline: "ඩුබායි සිටියත් උපන්ගමෙන්ම සහකරුවෙක්",
          quote: "විදේශයක රැකියාව කරද්දී හොඳ යෝජනාවක් මගහැරෙයි කියලා බයවුණා. විකසිත මගේම නගරයෙන් ගැළපෙන කෙනෙක් මුණගැස්සුවා.",
          names: "මොහොමඩ් සහ ෆාතිමා",
          meta: "ඩුබායි · ඉස්ලාම්",
          caption: "ඔවුන්ගේ කතාව බලන්න",
          captionMeta: "නිකාහ් උත්සවය · 2025 ජනවාරි",
        },
        {
          badge: "2024 දී විවාහ විය",
          headline: "එකම අගයන්, එකම සිහින",
          quote: "අප දෙදෙනාටම අවශ්‍ය වුණේ සරල විවාහයක් සහ සමගි පවුලක්. ෆිල්ටර්ස් මගින් හරියටම ඒ ගැළපීම ලැබුණා.",
          names: "ජනිත් සහ පියුමි",
          meta: "මීගමුව · කතෝලික",
          caption: "ඔවුන්ගේ කතාව බලන්න",
          captionMeta: "දේවස්ථාන මංගල්‍යය · 2024 ඔක්තෝබර්",
        },
      ],
    },
    categories: {
      eyebrow: "ප්‍රධාන කාණ්ඩ",
      title: "ඔබට කැමති ආකාරයට යෝජනා තෝරන්න",
      description: "ඔබේ පවුලට වඩාත්ම වැදගත් වන පැතිකඩ වෙත කෙලින්ම පිවිසෙන්න.",
      exploreAll: "සියලුම කාණ්ඩ බලන්න",
      proposals: "යෝජනා",
      labels: {
        "Female teachers": "ගුරුවරියන්",
        "Parent-posted ads": "දෙමාපියන් පළකළ දැන්වීම්",
        "ID-verified ads": "හැඳුනුම්පත් සත්‍යාපිත",
        "Degree holders": "උපාධිධාරීන්",
        "Female doctors": "වෛද්‍යවරියන්",
        "Male engineers": "ඉංජිනේරුවන්",
        "Overseas grooms": "විදේශගත මනමාලයන්",
        "Brides in Sri Lanka": "ලංකාවේ මනමාලියන්",
        "Diploma holders": "ඩිප්ලෝමාධාරීන්",
        "Male IT experts": "තොරතුරු තාක්ෂණ වෘත්තිකයන්",
        "With horoscope": "කේන්දර සහිත",
        "Premium members": "ප්‍රිමියම් සාමාජිකයින්",
        "Kandyan": "උඩරට",
        "Low-country": "පහතරට",
        "Second marriage": "දෙවන විවාහය",
        "Nurses": "හෙදියන්",
        "Government sector": "රාජ්‍ය අංශයේ",
        "Business owners": "ව්‍යාපාරිකයන්",
      },
    },
    pricing: {
      eyebrow: "මිල ගණන්",
      title: "පැහැදිලි සහ සාධාරණ පැකේජ",
      subtitle: "ඔබගේ පවුලේ අවශ්‍යතාවයට වඩාත්ම ගැළපෙන සැලසුම තෝරාගන්න.",
      free: "නොමිලේ",
      gold: "රන් (Gold)",
      platinum: "ප්ලැටිනම් (Platinum)",
      choosePlan: "සැලසුම තෝරන්න",
    },
    faq: {
      eyebrow: "නිතර අසන පැන",
      title: "පවුල් නිතර අසන ප්‍රශ්න",
      description: "ආරක්ෂාව, පෞද්ගලිකත්වය සහ ගැළපීම් සිදුවන ආකාරය ගැන ඔබ දැනගත යුතු සියල්ල.",
      helpTitle: "තවමත් ප්‍රශ්න තිබේද?",
      helpText: "දිනපතා පෙ.ව. 9 සිට ප.ව. 6 දක්වා කොළඹ කාර්යාලය අමතන්න හෝ WhatsApp කරන්න.",
      helpCta: "සහාය අමතන්න",
      items: [
        {
          q: "පැතිකඩ සත්‍යාපනය කරන්නේ කෙසේද?",
          a: "සෑම සාමාජිකයෙක්ම දුරකථන අංකය තහවුරු කරන අතර, සත්‍යාපිත ලාංඡනය ලබාදීමට පෙර ජාතික හැඳුනුම්පත හෝ විදේශ ගමන් බලපත්‍රය පරීක්ෂා කරනු ලැබේ. කිසියම් සැකකටයුතු පැතිකඩක් ඇත්නම් වාර්තා කරන්න, පැය 24ක් තුළ අපගේ කණ්ඩායම එය සමාලෝචනය කරයි.",
        },
        {
          q: "දෙමාපියන්ට තම පුතා හෝ දියණිය වෙනුවෙන් පැතිකඩක් සෑදිය හැකිද?",
          a: "ඔව්. ලියාපදිංචි වීමේදී “පුතා”, “දියණිය” හෝ වෙනත් ඥාතියෙකු තෝරන්න. එම පැතිකඩ පවුලේ අය විසින් පළ කරන ලද්දක් බව පැහැදිලිව පෙන්වනු ලැබේ.",
        },
        {
          q: "මගේ ඡායාරූප සහ දුරකථන අංකය දැකිය හැක්කේ කාටද?",
          a: "ඔබගේ දුරකථන අංකය කිසිවිටෙක ප්‍රසිද්ධියේ නොපෙන්වයි. ඔබ කැමැත්ත පිළිගන්නා තෙක් ඡායාරූප අපැහැදිලිව (blur) තැබිය හැකි අතර, සම්බන්ධතා තොරතුරු හෙළිවන්නේ දෙපාර්ශවයම එකඟ වූ පසු පමණි.",
        },
        {
          q: "කේන්දර ගැළපීම් පරීක්ෂා කළ හැකිද?",
          a: "ඔව්. ඔබගේ කේන්දර සටහන එක් කරන්න. රන් (Gold) සාමාජිකයින්ට කැමැත්ත යැවීමට පෙර කේන්දර සටහන් බැලීමට සහ සංසන්දනය කිරීමට හැකියාව ඇත.",
        },
        {
          q: "මම ජීවත් වන්නේ විදේශයකයි — මටත් සම්බන්ධ විය හැකිද?",
          a: "නියත වශයෙන්ම. ඕස්ට්‍රේලියාව, එක්සත් රාජධානිය, කැනඩාව, මැදපෙරදිග ඇතුළු ලොව පුරා වෙසෙන ශ්‍රී ලාංකිකයන්ට ලියාපදිංචි වී කාඩ්පත් මගින් ගෙවීම් සිදු කළ හැක.",
        },
      ],
    },
    signUp: {
      eyebrow: "අදම නොමිලේ එක්වන්න",
      title: "ඔබේ ජීවිත සහකරු හමුවීමට සූදානම්ද?",
      body: "මිනිත්තු දෙකකින් ඔබගේ පැතිකඩ සාදන්න — ඔබ වෙනුවෙන් හෝ ඔබේ පවුලේ අය වෙනුවෙන්. ඔබ බෙදාගැනීමට තීරණය කරන තුරු ඔබේ තොරතුරු රහසිගතව පවතී.",
      benefits: [
        "සත්‍යාපිත, සැබෑ සාමාජිකයින් පමණි",
        "විශ්වාසවන්ත ඡායාරූප සත්‍යාපිත පැතිකඩ",
        "සිංහල, දෙමළ සහ ඉංග්‍රීසි සහාය",
      ],
      formTitle: "නොමිලේ පැතිකඩ සාදන්න",
      formSubtitle: "ගතවන්නේ මිනිත්තු 2ක් පමණි. ඔබේ තොරතුරු පූර්ණ රහසිගතව පවතී.",
      firstName: "මුල් නම",
      lastName: "වාසගම",
      email: "විද්‍යුත් තැපෑල",
      mobile: "ජංගම දුරකථන අංකය",
      cta: "දැන්ම ලියාපදිංචි වන්න",
      legal: "ලියාපදිංචි වීමෙන් ඔබ අපගේ සේවා කොන්දේසි සහ පෞද්ගලිකත්ව ප්‍රතිපත්තියට එකඟ වේ.",
    },
    footer: {
      tagline: "ශ්‍රී ලංකාවේ වඩාත්ම විශ්වාසවන්ත සහ නවීන මංගල යෝජනා සේවාව.",
      rights: "සියලුම හිමිකම් ඇවිරිණි.",
      privacy: "පෞද්ගලිකත්ව ප්‍රතිපත්තිය",
      terms: "සේවා කොන්දේසි",
      about: "විකසිත ගැන",
      contact: "අප අමතන්න",
    },
    dashboard: {
      eyebrow: "සාදරයෙන් පිළිගනිමු",
      welcomeBack: "නැවත සාදරයෙන් පිළිගනිමු",
      goodMorning: "සුබ උදෑසනක්",
      goodAfternoon: "සුබ දහවලක්",
      goodEvening: "සුබ සැන්දෑවක්",
      matchesWaiting: "නව ගැළපීම් සහ කැමැත්ත ප්‍රකාශ කිරීම් අද ඔබ වෙනුවෙන් සූදානම්ව ඇත.",
      seeMatches: "නව යෝජනා බලන්න",
      completeProfile: "පැතිකඩ සම්පූර්ණ කරන්න",
      editProfile: "පැතිකඩ සංස්කරණය",
      profileStrength: "පැතිකඩ ප්‍රගතිය",
      profileViews: "පැතිකඩ බැලීම්",
      interestsReceived: "ලැබුණු කැමැත්ත",
      shortlistedYou: "ඔබව තෝරාගත් අය",
      unreadMessages: "නොකියවූ පණිවිඩ",
      newRequests: "නව යෝජනා",
      favourites: "ප්‍රියතම",
      allFavourites: "සියලු ප්‍රියතම පැතිකඩ",
      noFavouritesTitle: "තවම ප්‍රියතම පැතිකඩ නැත",
      noFavouritesBody: "පැතිකඩක් සුරැකීමට හෘද සලකුණ ඔබන්න.",
      browseProfiles: "පැතිකඩ බලන්න",
      viewAllRequests: "සියලු යෝජනා බලන්න",
      newMessages: "නව පණිවිඩ",
      openInbox: "පණිවිඩ වෙත යන්න",
      quickSearch: "ගැළපෙන සහකරු සොයන්න",
      searchSubtitle: "ශ්‍රී ලංකාවෙන් සහ විදේශයන්හි 12,000+ කට අධික සත්‍යාපිත යෝජනා",
      advancedSearch: "සවිස්තරාත්මක සෙවුම",
      bestMatches: "හොඳම ගැළපීම්",
      bestMatchesTitle: "අද දිනයේ ඔබට ගැළපෙනම යෝජනා",
      accept: "පිළිගන්න",
      decline: "ප්‍රතික්ෂේප කරන්න",
      friends: "මිතුරන්",
      allFriends: "සියලු මිතුරන්",
      messagesTab: "පණිවිඩ",
      profile: "පැතිකඩ",
      message: "පණිවිඩය",
      newFriend: "නව මිතුරා",
      sayHello: "ආයුබෝවන් කියන්න",
      acceptedAdded: "පිළිගත්තා · ඔබේ මිතුරන්ට එක් කළා",
      connectedJustNow: "දැන් සම්බන්ධ විය",
      onlineNow: "දැන් සබැඳිව",
      noFriendsTitle: "තවම මිතුරන් නැත",
      noFriendsBody: "ඔබ කැමැත්තක් පිළිගත් විට — හෝ කෙනෙක් ඔබේ කැමැත්ත පිළිගත් විට — ඔවුන් මෙහි පෙන්වයි.",
      noRequestsTitle: "නව යෝජනා නැත",
      noRequestsBody: "කෙනෙක් ඔබට කැමැත්තක් එවූ විට එය මෙහි පෙන්වයි.",
      noMessagesTitle: "තවම පණිවිඩ නැත",
      noMessagesBody: "කතාබහ ආරම්භ කිරීමට කැමැත්තක් පිළිගන්න.",
      addPhotos: "ඡායාරූප එක් කරන්න",
      browseMatches: "ගැළපීම් බලන්න",
    },
    requests: {
      title: "යෝජනා සහ කැමැත්ත",
      subtitle: "ඔබට ලැබුණු, යැවූ සහ පිළිගත් මංගල යෝජනා කළමනාකරණය කරන්න.",
      received: "ලැබුණු යෝජනා",
      sent: "යැවූ යෝජනා",
      accepted: "පිළිගත් යෝජනා",
      searchPlaceholder: "නම, අංකය හෝ රැකියාව අනුව සොයන්න…",
      acceptInterest: "කැමැත්ත පිළිගන්න",
      decline: "ප්‍රතික්ෂේප කරන්න",
      interestNote: "ඔබට කැමැත්ත පළ කර ඇත",
      aboutTitle: "තොරතුරු",
    },
    messages: {
      title: "පණිවිඩ",
      subtitle: "ඔබේ කැමැත්ත පිළිගත් සාමාජිකයන් සමඟ ආරක්ෂිතව කතාබස් කරන්න.",
      searchPlaceholder: "පණිවිඩ සොයන්න…",
      all: "සියල්ල",
      unread: "නොකියවූ",
      activeNow: "දැන් සක්‍රියයි",
      viewProfile: "පැතිකඩ බලන්න",
      typeMessage: "පණිවිඩයක් ලියන්න…",
      send: "යවන්න",
      safetyNote: "කතාබස් විකසිත තුළම තබාගන්න. කිසිවිටෙක බැංකු තොරතුරු හෝ මුදල් හුවමාරු නොකරන්න.",
      back: "ආපසු",
      blocked: "අවහිර කළ",
      blockedMembers: "අවහිර කළ සාමාජිකයන්",
      blockedHelp: "අවහිර කළ සාමාජිකයන්ට ඔබට පණිවිඩ යැවීමට, ඔබේ පැතිකඩ බැලීමට හෝ සෙවීමේදී ඔබව සොයාගැනීමට නොහැක.",
      blockedOn: (d) => `${d} අවහිර කළා`,
      unblock: "අවහිරය ඉවත් කරන්න",
      report: "වාර්තා කරන්න",
      muteNotifications: "දැනුම්දීම් නිහඬ කරන්න",
      unmuteNotifications: "දැනුම්දීම් සක්‍රිය කරන්න",
      block: "අවහිර කරන්න",
      blockTitle: (n) => `${n} අවහිර කරන්නද?`,
      blockPoint1: "ඔවුන්ට ඔබට පණිවිඩ යැවීමට හෝ ඔබේ පැතිකඩ බැලීමට නොහැක",
      blockPoint2: "ඔවුන්ගේ සෙවුම් ප්‍රතිඵලවල ඔබ නොපෙන්වයි",
      blockPoint3: "ඔවුන්ට දැනුම් නොදේ — ඕනෑම වේලාවක අවහිරය ඉවත් කළ හැක",
      reasonLabel: "හේතුව (අත්‍යවශ්‍ය නොවේ)",
      reasonPlaceholder: "හේතුවක් තෝරන්න",
      reasons: ["මුදල් හෝ බැංකු තොරතුරු ඉල්ලුවා", "අශිෂ්ට හෝ නුසුදුසු පණිවිඩ", "ව්‍යාජ හෝ නොමඟ යවන පැතිකඩ", "තවදුරටත් උනන්දුවක් නැත", "වෙනත්"],
      alsoReport: "මෙම සාමාජිකයා අපගේ ආරක්ෂක කණ්ඩායමට ද වාර්තා කරන්න",
      cancel: "අවලංගු කරන්න",
      youBlocked: (n) => `ඔබ ${n} අවහිර කළා`,
      youBlockedBody: "ඔවුන්ට ඔබට පණිවිඩ යැවීමට, ඔබේ පැතිකඩ බැලීමට හෝ ඔබව සොයාගැනීමට නොහැක. ඔබ අවහිර කළ බව ඔවුන්ට දැනුම් නොදේ.",
      cantReply: "අවහිර කළ සාමාජිකයෙකුට පිළිතුරු දිය නොහැක. නැවත කතාබස් කිරීමට අවහිරය ඉවත් කරන්න.",
      blockedStatus: "අවහිර කළා · ඔබව සම්බන්ධ කළ නොහැක",
      blockedToast: (n) => `${n} අවහිර කළා`,
      unblockedToast: (n) => `${n} ගේ අවහිරය ඉවත් කළා — නැවත කතාබස් කළ හැක`,
      reportedToast: "ස්තූතියි — අපගේ ආරක්ෂක කණ්ඩායම මෙම සාමාජිකයා පරීක්ෂා කරනු ඇත.",
      mutedToast: "මෙම කතාබහේ දැනුම්දීම් නිහඬ කළා",
      unmutedToast: "දැනුම්දීම් නැවත සක්‍රියයි",
      noBlockedTitle: "අවහිර කළ සාමාජිකයන් නැත",
      noBlockedBody: "ඔබ අවහිර කරන සාමාජිකයන් මෙහි පෙන්වයි. ඕනෑම වේලාවක අවහිරය ඉවත් කළ හැක.",
      moreOptions: "තවත් විකල්ප",
    },
    auth: {
      loginTitle: "ඔබේ ගිණුමට පිවිසෙන්න",
      loginSubtitle: "ඉදිරියට යාමට ඔබගේ ජංගම දුරකථන අංකය සහ මුරපදය ඇතුළත් කරන්න",
      mobileLabel: "ජංගම දුරකථන අංකය",
      passwordLabel: "මුරපදය",
      loginButton: "පිවිසෙන්න",
      forgotPassword: "මුරපදය අමතකද?",
      dontHaveAccount: "ගිණුමක් නැද්ද?",
      registerNow: "දැන්ම ලියාපදිංචි වන්න",
      registerTitle: "ඔබේ පැතිකඩ සාදන්න",
      registerSubtitle: "ශ්‍රී ලංකාවේ විශ්වාසවන්තම මංගල සේවාව හා එක්වන්න",
    },
  },
};
