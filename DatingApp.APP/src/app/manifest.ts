import type { MetadataRoute } from "next";

/** Web App Manifest — lets members install Vikasitha to their home screen (PWA). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/dashboard",
    name: "Vikasitha | Sri Lankan marriage proposals",
    short_name: "Vikasitha",
    description: "Real, photo-verified marriage proposals from across Sri Lanka and Sri Lankans overseas.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#fff5f7",
    theme_color: "#de0547",
    categories: ["lifestyle", "social"],
    icons: [
      { src: "/icons/vk-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/vk-icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/vk-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
