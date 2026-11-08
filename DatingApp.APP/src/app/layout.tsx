import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aura Matrimony | Find a Life Partner Your Whole Family Can Trust",
  description: "Sri Lanka's premier matchmaking platform for doctors, engineers, IT leaders, chartered accountants, lawyers, and educated professionals.",
  keywords: "matrimony, dating, professional matchmaking, sri lanka matrimony, doctors matrimony, engineers matrimony, verified matrimonial profiles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,500;1,600&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased font-sans text-gray-800 bg-white">
        {children}
      </body>
    </html>
  );
}

