import "./globals.css";
import type { Metadata, Viewport } from "next";
import ServiceWorker from "@/components/ServiceWorker";

export const metadata: Metadata = {
  title: "NeuroVital - Unified Health Intelligence Platform",
  description: "NeuroVital is a preventive health dashboard for medical insight and mental wellness reflection.",
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#0B0F14"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans" suppressHydrationWarning>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}

