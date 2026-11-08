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
import { PageLoader, RevealObserver } from "@/components/motion";

export const metadata: Metadata = {
  title: "Vikasitha | Find a life partner your whole family can trust",
  description:
    "Real, photo-verified marriage proposals from across Sri Lanka and Sri Lankans overseas. Your contact details stay private until you say yes.",
  keywords: "matrimony, marriage proposals, sri lanka matrimony, poruwa, verified profiles",
};

export const viewport: Viewport = {
  themeColor: "#de0547",
};

/** Before paint: marks JS as on (motion CSS) and sets data-theme so dark mode does not flash. */
const themeScript = `document.documentElement.classList.add("js");try{var t=localStorage.getItem("vk-theme");if(t==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <PageLoader />
        <RevealObserver />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
