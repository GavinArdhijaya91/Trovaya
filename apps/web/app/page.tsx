import Link from "next/link";

import { AiDisclaimer } from "@/components/ai-disclaimer";
import { AssetGallery } from "@/components/asset-gallery";
import { FeeComparison } from "@/components/fee-comparison";
import { IntroExperience } from "@/components/intro-experience";
import { LicensePreview } from "@/components/license-preview";
import { ProtectionForm } from "@/components/protection-form";
import { SiteHeader } from "@/components/site-header";
import { TaxExport } from "@/components/tax-export";

const benefits = [
  {
    number: "01",
    eyebrow: "Provenance",
    title: "Establish where the work came from.",
    description:
      "Create a durable on-chain record connecting your wallet, your work reference, and its provenance.",
  },
  {
    number: "02",
    eyebrow: "AI consent",
    title: "Make your AI permissions explicit.",
    description:
      "State whether your creation may be used for AI training instead of leaving consent ambiguous.",
  },
  {
    number: "03",
    eyebrow: "Licensing",
    title: "Attach terms before distribution.",
    description:
      "Define commercial licensing conditions and give future users a clearer path to legitimate usage.",
  },
] as const;

const protectionSignals = [
  {
    label: "Creator provenance",
    value: "Recorded",
  },
  {
    label: "AI training consent",
    value: "Creator controlled",
  },
  {
    label: "Commercial terms",
    value: "Explicit",
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-sand text-ink">
      <IntroExperience />
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-stone-200">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-mint/80 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.75fr)] lg:items-center lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-leaf/10 bg-mint px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-leaf">
              <span className="h-2 w-2 rounded-full bg-coral" />
              Creator ownership infrastructure
            </div>

            <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl md:text-7xl lg:text-[5.25rem]">
              Your work deserves
              <span className="block text-leaf">
                proof, not promises.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-stone-600 md:text-lg">
              Publish protected previews, establish creator provenance,
              define AI-training consent, and attach licensing terms while
              keeping control of your original work.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="#studio"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-coral px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-coral-dark"
              >
                Protect your work
              </Link>

              <Link
                href="/explore"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-stone-300 bg-white/70 px-6 text-sm font-semibold text-ink transition hover:border-leaf hover:text-leaf"
              >
                Explore creations
                <span aria-hidden="true" className="ml-2">
                  →
                </span>
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-stone-300/70 pt-6 text-xs text-stone-500">
              <span>Creator-controlled consent</span>
              <span>Public protected previews</span>
              <span>On-chain provenance</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[2.5rem] bg-mint/60 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-soft backdrop-blur md:p-7">
              <div className="flex items-center justify-between gap-5 border-b border-stone-100 pb-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coral">
                    Trovaya proof layer
                  </p>

                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">
                    Creator-owned by default.
                  </h2>
                </div>

                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-leaf text-sm font-bold text-white">
                  TV
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-leaf via-[#0c6654] to-[#073c32] p-6 text-white">
                <div className="flex min-h-[220px] flex-col justify-between">
                  <div className="flex items-start justify-between gap-4">
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] backdrop-blur">
                      Protected preview
                    </span>

                    <span className="grid h-9 w-9 place-items-center rounded-full bg-mint text-sm font-bold text-leaf">
                      ✓
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-emerald-100">
                      The public can discover the work.
                    </p>

                    <p className="mt-2 max-w-sm text-2xl font-semibold tracking-[-0.03em]">
                      The creator keeps control of its permissions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {protectionSignals.map((signal) => (
                  <div
                    key={signal.label}
                    className="flex items-center justify-between gap-5 rounded-xl bg-stone-50 px-4 py-3"
                  >
                    <span className="text-xs text-stone-500">
                      {signal.label}
                    </span>

                    <strong className="text-xs text-leaf">
                      {signal.value}
                    </strong>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-[11px] leading-5 text-stone-400">
                Trovaya records evidence and creator preferences. It does not
                adjudicate copyright ownership.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-stone-200 bg-white/30">
        <div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
          <div className="mb-9 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-coral">
                Public gallery
              </p>

              <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
                Discover work with clearer creator intent.
              </h2>
            </div>

            <Link
              href="/explore"
              className="text-sm font-semibold text-leaf transition hover:text-coral"
            >
              Explore all works →
            </Link>
          </div>

          <AssetGallery />
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-28 border-b border-stone-200"
      >
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-coral">
                How it works
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
                One work.
                <br />
                Three layers of clarity.
              </h2>

              <p className="mt-5 max-w-md text-sm leading-7 text-stone-600">
                Trovaya combines provenance, consent, and licensing into a
                creator-facing workflow instead of making users think about
                blockchain infrastructure first.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {benefits.map((benefit) => (
                <article
                  key={benefit.number}
                  className="group rounded-[1.5rem] border border-stone-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-soft"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-coral">
                      {benefit.number}
                    </span>

                    <span className="h-2.5 w-2.5 rounded-full bg-mint transition group-hover:bg-leaf" />
                  </div>

                  <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.14em] text-leaf">
                    {benefit.eyebrow}
                  </p>

                  <h3 className="mt-2 text-xl font-semibold tracking-[-0.025em]">
                    {benefit.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-stone-500">
                    {benefit.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="studio"
        className="scroll-mt-28 border-b border-stone-200 bg-white/45"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-coral">
              Protection studio
            </p>

            <h2 className="mt-3 max-w-xl text-4xl font-semibold tracking-[-0.045em]">
              Protect the work.
              <span className="block text-leaf">
                Publish only what you choose.
              </span>
            </h2>

            <p className="mt-5 max-w-md text-sm leading-7 text-stone-600">
              Register creator provenance, choose AI-training consent, define
              commercial terms, and create an experimental protected public
              preview.
            </p>

            <div className="mt-8 rounded-[1.5rem] border border-stone-200 bg-sand p-5">
              <p className="text-xs font-semibold text-ink">
                Before publishing
              </p>

              <p className="mt-2 text-xs leading-6 text-stone-500">
                Keep your original private whenever possible. Public previews
                should be treated as discoverable derivatives rather than an
                absolute anti-scraping guarantee.
              </p>
            </div>
          </div>

          <ProtectionForm />
        </div>
      </section>

      <section className="border-b border-stone-200">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <div className="mb-9">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-coral">
              Licensing intelligence
            </p>

            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
              Understand the terms before making a decision.
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <FeeComparison />

            <article className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-soft md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-leaf">
                Work audit
              </p>

              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                Read the signals before you license.
              </h3>

              <p className="my-5 text-sm leading-7 text-stone-600">
                Trovaya surfaces provenance and licensing information to help
                users understand the work. These signals are not a legal
                guarantee or investment recommendation.
              </p>

              <AiDisclaimer />

              <div className="mt-5">
                <LicensePreview />
              </div>

              <div className="mt-8 border-t border-stone-200 pt-5">
                <TaxExport rows={[]} />
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
        <div className="overflow-hidden rounded-[2rem] bg-leaf px-6 py-10 text-white md:px-10 md:py-12">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
                Built for creators
              </p>

              <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
                Make your work discoverable without making your intent
                ambiguous.
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-100">
                Share a protected preview, establish provenance, and clearly
                communicate how your creation may be used.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="#studio"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-leaf transition hover:bg-mint"
              >
                Protect a creation
              </Link>

              <Link
                href="/explore"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Browse gallery
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-stone-500 md:flex-row md:items-center md:justify-between md:px-8">
          <span>
            Trovaya — creator provenance, consent, and licensing.
          </span>

          <span>
            Experimental hackathon build.
          </span>
        </div>
      </footer>
    </main>
  );
}