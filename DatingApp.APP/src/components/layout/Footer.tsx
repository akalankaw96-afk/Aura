import React from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Brand";
import { FOOTER } from "@/content/home";

/**
 * Figma: 09 Footer — bg-inverse (#1a1d21), padding 64/80/32, gap 48.
 * Always dark in both themes (uses gray primitives on purpose).
 */
export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="container-page flex flex-col gap-12 pb-8 pt-16">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="flex max-w-[320px] flex-col gap-4">
            <Logo height={72} />
            <p className="text-body-md">{FOOTER.brand}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:flex sm:gap-20">
            {FOOTER.columns.map((col) => (
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
          <p>{FOOTER.copyright}</p>
          <p>
            English · <span lang="si">සිංහල</span> · <span lang="ta">தமிழ்</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
