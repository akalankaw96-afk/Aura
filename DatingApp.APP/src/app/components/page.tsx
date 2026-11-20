import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComponentsShowcase } from "@/components/dev/ComponentsShowcase";

export const metadata: Metadata = { title: "Components | Aura Matrimony", robots: { index: false, follow: false } };

/**
 * /components — design-system showcase for designers and developers. Development builds only (owner decision
 * 2026-11-17, S05-T01): production builds answer 404 so members and search engines never see it.
 */
export default function ComponentsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ComponentsShowcase />;
}
