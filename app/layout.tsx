// app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/auth-context"; // ✅ AuthProvider import
import PresencePinger from "@/components/presence/PresencePinger";
import ImpersonationBanner from "@/components/auth/ImpersonationBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Task Management Ann Nahl",
  description: "Task Management Ann Nahl",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* ✅ পুরো অ্যাপকে AuthProvider দিয়ে wrap করলাম */}
        <AuthProvider>
          <ImpersonationBanner /> {/* 🆕 */}
          <PresencePinger /> {/* 🆕 lastSeen heartbeat */}
          {children}
          <Toaster position="bottom-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
