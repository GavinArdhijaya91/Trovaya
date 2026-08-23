"use client";

import { useEffect, useRef, useState } from "react";

const INTRO_SESSION_KEY = "trovaya:intro-seen";
const DISPLAY_DURATION_MS = 2_300;
const EXIT_DURATION_MS = 520;

type IntroPhase = "hidden" | "visible" | "leaving";

export function IntroExperience() {
  const [phase, setPhase] = useState<IntroPhase>("hidden");
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousOverflow = useRef("");

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || readIntroSeen()) return;

    markIntroSeen();
    const showTimer = setTimeout(() => setPhase("visible"), 0);

    exitTimer.current = setTimeout(() => setPhase("leaving"), DISPLAY_DURATION_MS);
    hideTimer.current = setTimeout(() => setPhase("hidden"), DISPLAY_DURATION_MS + EXIT_DURATION_MS);

    return () => {
      if (exitTimer.current) clearTimeout(exitTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      clearTimeout(showTimer);
      document.body.style.overflow = previousOverflow.current;
    };
  }, []);

  useEffect(() => {
    if (phase === "visible") {
      previousOverflow.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    } else if (phase === "hidden") {
      document.body.style.overflow = previousOverflow.current;
    }
  }, [phase]);

  function skipIntro() {
    if (exitTimer.current) clearTimeout(exitTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setPhase("leaving");
    hideTimer.current = setTimeout(() => setPhase("hidden"), EXIT_DURATION_MS);
  }

  if (phase === "hidden") return null;

  return (
    <section
      aria-label="Trovaya introduction"
      className={`provenance-intro ${phase === "leaving" ? "provenance-intro-leaving" : ""}`}
    >
      <button type="button" onClick={skipIntro} className="provenance-skip">
        Skip intro
      </button>

      <div className="provenance-visual" aria-hidden="true">
        <svg viewBox="0 0 1200 700" role="presentation">
          <defs>
            <linearGradient id="thread-teal" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#5DCAA5" stopOpacity="0.08" />
              <stop offset="0.48" stopColor="#9FE1CB" stopOpacity="0.88" />
              <stop offset="1" stopColor="#1D9E75" stopOpacity="0.12" />
            </linearGradient>
            <radialGradient id="creator-glow">
              <stop offset="0" stopColor="#F0997B" stopOpacity="0.9" />
              <stop offset="1" stopColor="#D85A30" stopOpacity="0" />
            </radialGradient>
            <filter id="soft-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="9" />
            </filter>
          </defs>

          <path className="provenance-thread thread-one" d="M82 430 C245 286 340 510 506 342 S778 170 1112 328" />
          <path className="provenance-thread thread-two" d="M50 255 C236 410 360 146 556 310 S820 534 1150 250" />
          <path className="provenance-thread thread-three" d="M160 570 C318 418 430 470 584 316 S828 190 1040 112" />
          <path className="provenance-thread thread-four" d="M126 128 C322 218 360 340 558 328 S862 282 1086 510" />

          <g className="provenance-nodes">
            <circle cx="82" cy="430" r="4" />
            <circle cx="240" cy="345" r="3" />
            <circle cx="410" cy="412" r="4" />
            <circle cx="558" cy="328" r="5" />
            <circle cx="720" cy="245" r="3" />
            <circle cx="886" cy="288" r="4" />
            <circle cx="1112" cy="328" r="3" />
            <circle cx="160" cy="570" r="3" />
            <circle cx="1040" cy="112" r="3" />
          </g>

          <circle className="creator-glow" cx="558" cy="328" r="72" fill="url(#creator-glow)" filter="url(#soft-glow)" />
          <circle className="creator-origin" cx="558" cy="328" r="8" />
          <rect className="protection-frame" x="478" y="248" width="160" height="160" rx="28" />
          <path className="consent-mark" d="M520 329 L548 356 L603 298" />
        </svg>
      </div>

      <div className="provenance-copy">
        <p>Every creation has an origin.</p>
        <strong>Trovaya keeps it connected to you.</strong>
      </div>
      <div className="provenance-wordmark">Trovaya<span>.</span></div>
    </section>
  );
}

function readIntroSeen(): boolean {
  try {
    return sessionStorage.getItem(INTRO_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

function markIntroSeen(): void {
  try {
    sessionStorage.setItem(INTRO_SESSION_KEY, "true");
  } catch {
    // The intro remains optional when browser storage is unavailable.
  }
}
