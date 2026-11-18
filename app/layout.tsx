import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Playfair_Display } from "next/font/google";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import "./globals.css";

const hanken = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin"], display: "swap" });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], display: "swap" });

const DESCRIPTION =
  "Live Ram Van tracking, seat reservations, commute planning, and commuter groups for Fordham students. A student-built demo.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Ram Hub | Fordham commuter app", template: "%s | Ram Hub" },
  description: DESCRIPTION,
  applicationName: "Ram Hub",
  openGraph: {
    title: "Ram Hub | Fordham commuter app",
    description: DESCRIPTION,
    siteName: "Ram Hub",
    type: "website",
    images: [{ url: "/brand/ram-van-photo.jpg", width: 1600, height: 1155, alt: "A Fordham Ram Van at Rose Hill" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ram Hub | Fordham commuter app",
    description: DESCRIPTION,
    images: ["/brand/ram-van-photo.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#900028",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${hanken.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
