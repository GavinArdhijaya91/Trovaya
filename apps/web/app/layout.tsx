import type { Metadata } from "next";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import { Web3Provider } from "@/components/web3-provider";

export const metadata: Metadata = {
  title: "Trovaya — Protect your creations",
  description: "Consent-first IP protection for creators and UMKMs.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
