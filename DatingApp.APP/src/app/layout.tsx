import type { Metadata, Viewport } from "next";

// Fonts are self-hosted (no Google Fonts request) — Figma: font/family/*
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/600.css";
import "@fontsource/nunito/700.css";
import "@fontsource/nunito/800.css";
import "@fontsource/yaldevi/400.css";
import "@fontsource/yaldevi/600.css";
import "@fontsource/yaldevi/700.css";
import "@fontsource/noto-sans-tamil/400.css";
import "@fontsource/noto-sans-tamil/600.css";
import "@fontsource/noto-sans-tamil/700.css";
import "./globals.css";

import { ToastProvider } from "@/components/ui/Toast";
import { LanguageProvider } from "@/context/LanguageContext";
import { PageLoader, RevealObserver } from "@/components/motion";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { InstallAppBanner } from "@/components/layout/InstallAppBanner";
import { UpgradePrompt } from "@/components/layout/UpgradePrompt";

export const metadata: Metadata = {
  title: "Vikasitha | Find a life partner your whole family can trust",
  description:
    "Real, photo-verified marriage proposals from across Sri Lanka and Sri Lankans overseas. Your contact details stay private until you say yes.",
  keywords: "matrimony, marriage proposals, sri lanka matrimony, poruwa, verified profiles",
  appleWebApp: { capable: true, title: "Vikasitha", statusBarStyle: "default" },
  icons: { icon: "/icons/vk-icon-192.png", apple: "/icons/vk-apple-touch-icon.png" },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#de0547",
};

/** Before paint: marks JS as on (motion CSS), restores theme and language so no flash occurs. */
const themeScript = `document.documentElement.classList.add("js");try{var t=localStorage.getItem("vk-theme");if(t==="dark")document.documentElement.setAttribute("data-theme","dark");var l=localStorage.getItem("vk-lang");if(l==="si")document.documentElement.setAttribute("lang","si")}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <PageLoader />
        <RevealObserver />
        <LanguageProvider>
          <ToastProvider>
            {/* phones: "Get the Vikasitha app" install banner + how-to sheet (PWA) */}
            <InstallAppBanner />
            {children}
            {/* signed-in members on phones: floating app-style tab bar */}
            <MobileTabBar />
            {/* free-plan limit reached → upgrade prompt */}
            <UpgradePrompt />
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
