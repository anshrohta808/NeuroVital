import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NeuroVital",
    short_name: "NeuroVital",
    description: "NeuroVital lifestyle and preventive health intelligence dashboard.",
    start_url: "/",
    display: "standalone",
    background_color: "#F3F5F7",
    theme_color: "#0B0F14",
    icons: [
      {
        src: "/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any"
      }
    ]
  };
}
