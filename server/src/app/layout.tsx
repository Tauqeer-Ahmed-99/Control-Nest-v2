import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import localFont from "next/font/local";
import { SiteHeader, SiteFooter } from "@/components/site/site-shell";
import { SiteMotion } from "@/components/site/site-motion";
import "./globals.css";

const lexend = localFont({
  src: [
    { path: "./fonts/Lexend_400Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Lexend_500Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Lexend_600SemiBold.ttf", weight: "600", style: "normal" },
  ],
  variable: "--font-lexend",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Control Nest | Home control from your phone",
    template: "%s | Control Nest",
  },
  description:
    "Control lights, fans, and schedules with Control Nest and AutoPiHub on your Raspberry Pi. Shared API and remote access by NMT Solutions OPC Pvt Ltd.",
  icons: { icon: "/brand/control-nest.png", apple: "/brand/control-nest.png" },
  openGraph: {
    title: "Control Nest | Home control from your phone",
    description:
      "Install AutoPiHub, pair your Raspberry Pi, and control your home with the Control Nest app.",
    type: "website",
    siteName: "Control Nest",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider signInForceRedirectUrl="/dashboard" signUpForceRedirectUrl="/dashboard">
    <html lang="en" className={lexend.variable}>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
        <SiteMotion />
      </body>
    </html>
    </ClerkProvider>
  );
}
