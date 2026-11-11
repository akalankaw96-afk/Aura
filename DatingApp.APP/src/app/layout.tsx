import type { Metadata, Viewport } from "next";

// Fonts are self-hosted (no Google Fonts request) — Figma: font/family/*
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/600.css";
import "@fontsource/nunito/700.css";
import "@fontsource/nunito/800.css";
// Sinhala: trying Noto Sans Sinhala (Figma uses Yaldevi — @fontsource/yaldevi is kept installed to switch back)
import "@fontsource/noto-sans-sinhala/400.css";
import "@fontsource/noto-sans-sinhala/600.css";
import "@fontsource/noto-sans-sinhala/700.css";
import "@fontsource/noto-sans-sinhala/800.css";
import "@fontsource/noto-sans-tamil/400.css";
import "@fontsource/noto-sans-tamil/600.css";
import "@fontsource/noto-sans-tamil/700.css";
import "./globals.css";

import { ToastProvider } from "@/components/ui/Toast";
import { LanguageProvider } from "@/context/LanguageContext";
import { PageLoader, RevealObserver } from "@/components/motion";
import { FloatingHearts } from "@/components/motion/FloatingHearts";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { InstallAppBanner } from "@/components/layout/InstallAppBanner";
import { UpgradePrompt } from "@/components/layout/UpgradePrompt";
import { LoginRequiredModal } from "@/components/layout/LoginRequiredModal";

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

// The browser can make the install prompt available before React hydrates.
const installScript = `window.addEventListener("beforeinstallprompt",function(event){event.preventDefault();window.__vkInstallPrompt=event;});window.addEventListener("appinstalled",function(){delete window.__vkInstallPrompt;});`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: installScript }} />
      </head>
      <body>
        <PageLoader />
        <RevealObserver />
        <FloatingHearts />
        <LanguageProvider>
          <ToastProvider>
            {/* phones: "Get the Vikasitha app" install banner + how-to sheet (PWA) */}
            <InstallAppBanner />
            {children}
            {/* signed-in members on phones: floating app-style tab bar */}
            <MobileTabBar />
            {/* free-plan limit reached → upgrade prompt */}
            <UpgradePrompt />
            <LoginRequiredModal />
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
