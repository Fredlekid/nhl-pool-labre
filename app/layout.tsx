import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "2026 Playoffs Labre",
  description: "NHL 2026 Playoff Pool — Labre",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="font-[family-name:var(--font-inter)] bg-slate-50 text-slate-900 min-h-full flex flex-col antialiased">
        <Nav />
        <main className="max-w-5xl mx-auto px-4 py-8 w-full flex-1">{children}</main>
      </body>
    </html>
  );
}
