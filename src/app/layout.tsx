import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Work_Sans } from "next/font/google";
import ServiceWorker from "@/components/ServiceWorker";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap"
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});

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
      <body
        className={`${spaceGrotesk.variable} ${workSans.variable} font-sans`}
        suppressHydrationWarning
      >
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}

