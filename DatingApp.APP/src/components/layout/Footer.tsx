"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Brand";
import { useLanguage } from "@/context/LanguageContext";
import { FOOTER } from "@/content/home";

/**
 * Figma: 09 Footer — bg-inverse (#1a1d21), padding 64/80/32, gap 48.
 * Always dark in both themes (uses gray primitives on purpose).
 */
export function Footer() {
  const { t, lang } = useLanguage();

  const columns = [
    {
      title: lang === "si" ? "යෝජනා සොයන්න" : "Browse",
      links: [
        [t.nav.brides, "/search?for=bride"],
        [t.nav.grooms, "/search?for=groom"],
        [lang === "si" ? "විදේශීය යෝජනා" : "Overseas proposals", "/search?overseas=1"],
        [lang === "si" ? "සාර්ථක කතා" : "Success stories", "/#stories"],
      ] as [string, string][],
    },
    {
      title: lang === "si" ? "ආයතනය" : "Company",
      links: [
        [t.footer.about, "/about"],
        [t.nav.howItWorks, "/#how-it-works"],
        [t.nav.pricing, "/#pricing"],
        [t.footer.contact, "/support"],
      ] as [string, string][],
    },
    {
      title: lang === "si" ? "සහාය" : "Support",
      links: [
        [lang === "si" ? "ආරක්ෂක උපදෙස්" : "Safety tips", "/safety"],
        [lang === "si" ? "පැමිණිලි කරන්න" : "Report a profile", "/report"],
        [t.footer.privacy, "/privacy"],
        [t.footer.terms, "/terms"],
      ] as [string, string][],
    },
  ];

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="container-page flex flex-col gap-12 pb-8 pt-16">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="flex max-w-[320px] flex-col gap-4">
            <Logo height={72} />
            <p className="text-body-md">{t.footer.tagline}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:flex sm:gap-20">
            {columns.map((col) => (
              <nav key={col.title} aria-label={col.title} className="flex flex-col gap-3">
                <p className="text-label-lg text-gray-0">{col.title}</p>
                {col.links.map(([label, href]) => (
                  <Link key={label} href={href} className="text-body-sm text-gray-400 transition-colors hover:text-gray-0">
                    {label}
                  </Link>
                ))}
              </nav>
            ))}
          </div>
        </div>
        <div className="h-px bg-gray-600 opacity-40" />
        <div className="flex flex-col gap-2 text-caption sm:flex-row sm:justify-between">
          <p>{lang === "si" ? "© 2026 විකසිත. සියලුම හිමිකම් ඇවිරිණි." : FOOTER.copyright}</p>
          <p>
            English · <span lang="si">සිංහල</span> · <span lang="ta">தமிழ்</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
