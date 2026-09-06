"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import Link from "next/link";

import { EmailAuth } from "@/components/email-auth";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-sand/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-5 px-5 md:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="Trovaya home"
        >
          <Image
            src="/trovaya-logo.svg"
            alt="Trovaya"
            width={32}
            height={32}
            priority
          />

          <span className="text-xl font-bold tracking-[-0.04em] text-ink">
            Trovaya
            <span className="text-coral">.</span>
          </span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-7 text-sm lg:flex"
        >
          <Link
            href="/explore"
            className="font-medium text-stone-600 transition hover:text-leaf"
          >
            Explore
          </Link>

          <Link
            href="/#how-it-works"
            className="font-medium text-stone-600 transition hover:text-leaf"
          >
            How it works
          </Link>

          <Link
            href="/#studio"
            className="font-medium text-stone-600 transition hover:text-leaf"
          >
            For creators
          </Link>

          <Link
            href="/dashboard"
            className="font-medium text-stone-600 transition hover:text-leaf"
          >
            Dashboard
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden xl:block">
            <EmailAuth />
          </div>

          <ConnectButton
            label="Connect account"
            accountStatus="avatar"
            chainStatus="icon"
            showBalance={false}
          />

          <Link
            href="/#studio"
            className="hidden min-h-10 items-center justify-center rounded-xl bg-coral px-4 text-sm font-semibold text-white transition hover:bg-coral-dark sm:inline-flex"
          >
            Protect a work
          </Link>
        </div>
      </div>
    </header>
  );
}