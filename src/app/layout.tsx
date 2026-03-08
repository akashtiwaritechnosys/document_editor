import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Syllabus Documentation System",
  description: "A Confluence-style documentation system built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${jetbrainsMono.variable} antialiased flex h-screen overflow-hidden`}>
        <div className="glow glow-1"></div>
        <div className="glow glow-2"></div>
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
