import type { MetadataRoute } from "next";

/** Web App Manifest — lets members install Yugadiwi to their home screen (PWA). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/dashboard",
    name: "Yugadiwi | Sri Lankan marriage proposals",
    short_name: "Yugadiwi",
    description: "Real, photo-verified marriage proposals from across Sri Lanka and Sri Lankans overseas.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#fff5f7",
    theme_color: "#de0547",
    categories: ["lifestyle", "social"],
    icons: [
      { src: "/icons/yd-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/yd-icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/yd-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
