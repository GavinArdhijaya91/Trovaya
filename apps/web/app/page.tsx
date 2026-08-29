import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import Image from "next/image";
import { ProtectionForm } from "@/components/protection-form";
import { FeeComparison } from "@/components/fee-comparison";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { TaxExport } from "@/components/tax-export";
import { LicensePreview } from "@/components/license-preview";
import { AssetGallery } from "@/components/asset-gallery";
import { IntroExperience } from "@/components/intro-experience";
import { EmailAuth } from "@/components/email-auth";


const benefits = [
  ["01", "Register provenance", "Create a durable on-chain record connecting your wallet and work reference."],
  ["02", "Control AI consent", "Clearly state whether your creation may be used for AI training."],
  ["03", "Earn fairly", "Set commercial terms and automatic resale rewards."],
] as const;

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 pb-16 pt-6 md:px-8">
      <IntroExperience />
      <nav className="flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5">
          <Image src="/trovaya-logo.svg" alt="Trovaya logo" width={32} height={32} priority />
          <span className="text-xl font-bold tracking-tight">Trovaya<span className="text-coral">.</span></span>
        </a>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-leaf hover:bg-mint md:block">
            Creator workspace
          </Link>
          <EmailAuth />
          <ConnectButton label="Connect account" accountStatus="avatar" chainStatus="icon" showBalance={false} />
        </div>
      </nav>

      <section className="grid items-center gap-10 py-16 lg:grid-cols-[1fr_0.9fr] lg:py-24">
        <div>
          <p className="mb-4 inline-flex rounded-full bg-mint px-4 py-2 text-sm font-semibold text-leaf">Built for creators & local businesses</p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">Your ideas deserve <span className="text-leaf">clear protection.</span></h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Register provenance, choose how AI may use your work, and share an experimental public preview. Trovaya records evidence and consent; it does not adjudicate copyright.</p>
          <a href="#studio" className="mt-8 inline-block rounded-xl bg-coral px-6 py-3 font-semibold text-white">Protect your first creation</a>
        </div>
        <div id="studio"><ProtectionForm /></div>
      </section>

      <section id="how-it-works" className="border-t border-slate-300/70 pt-10">
        <p className="mb-6 text-sm font-semibold text-slate-500">ONE SIMPLE PATH FROM IDEA TO PROTECTED ASSET</p>
        <div className="grid gap-4 md:grid-cols-3">
          {benefits.map(([number, title, description]) => (
            <article key={number} className="rounded-2xl border border-slate-200 bg-white/60 p-6">
              <span className="text-sm font-bold text-coral">{number}</span>
              <h2 className="mt-8 text-xl font-semibold">{title}</h2>
              <p className="mt-2 leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-12 grid gap-5 lg:grid-cols-2">
        <FeeComparison />
        <article className="rounded-3xl bg-white p-6 shadow-soft md:p-8">
          <p className="text-sm font-semibold text-leaf">AUDIT KARYA</p>
          <h2 className="mt-2 text-2xl font-semibold">Pahami sebelum memutuskan</h2>
          <p className="my-4 text-slate-600">Pemeriksaan membantu membaca keaslian dan risiko lisensi. Hasilnya bukan jaminan hukum maupun rekomendasi investasi.</p>
          <AiDisclaimer />
          <div className="mt-5"><LicensePreview /></div>
          <div className="mt-8 border-t pt-5"><TaxExport rows={[]} /></div>
        </article>
      </section>
      <AssetGallery />
    </main>
  );
}
