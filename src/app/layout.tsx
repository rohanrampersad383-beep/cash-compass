import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cash-compass-finance.vercel.app"),
  applicationName: "Cash Compass",
  title: {
    default: "Cash Compass",
    template: "%s | Cash Compass",
  },
  description: "A polished personal finance tracker and rule-based money guide for spending, bills, goals, budgets, and CSV imports.",
  openGraph: {
    title: "Cash Compass",
    description: "Track spending, bills, budgets, savings goals, CSV imports, and rule-based money guidance in one polished finance dashboard.",
    url: "https://cash-compass-finance.vercel.app",
    siteName: "Cash Compass",
    images: [
      {
        url: "/cash-compass-logo.png",
        width: 535,
        height: 140,
        alt: "Cash Compass logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Cash Compass",
    description: "A polished personal finance tracker for spending, bills, budgets, goals, CSV imports, and rule-based guidance.",
    images: ["/cash-compass-logo.png"],
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
