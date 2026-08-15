"use client";

import Image from "next/image";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { useAssets, type IndexedAsset } from "@/hooks/use-assets";
import { getClientContractAddresses } from "@/lib/contracts";

const navigation = [
  { label: "Overview", href: "/dashboard", marker: "01" },
  { label: "Protect a work", href: "/#studio", marker: "02" },
  { label: "Explore works", href: "/#gallery", marker: "03" },
  { label: "License activity", href: "#recent-works", marker: "04" },
  { label: "Trust profile", href: "#trust-profile", marker: "05" },
] as const;

export function CreatorDashboard() {
  const account = useAccount();
  const assets = useAssets();
  const records = assets.data ?? [];
  const licensedForAI = records.filter((asset) => asset.allow_ai_training).length;
  const protectedFromAI = records.length - licensedForAI;
  const licenseReady = records.filter((asset) => asset.commercial_license_fee_wei).length;
  const contractsConfigured = Boolean(getClientContractAddresses());
  const shortAddress = account.address
    ? `${account.address.slice(0, 6)}…${account.address.slice(-4)}`
    : "No account connected";

  return (
    <div className="min-h-screen bg-sand text-ink lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="border-b border-stone-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-5 lg:block lg:px-4 lg:py-6">
          <Link href="/" className="px-2 text-xl font-bold tracking-tight text-leaf">
            Trovaya<span className="text-coral">.</span>
          </Link>
          <span className="rounded-full bg-mint px-3 py-1 text-[11px] font-semibold text-leaf lg:mx-2 lg:mt-3 lg:inline-flex">
            Creator workspace
          </span>
        </div>

        <div className="mx-4 hidden rounded-2xl border border-stone-200 bg-stone-50 p-3 lg:block">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-mint text-xs font-bold text-leaf">
              {account.address ? account.address.slice(2, 4).toUpperCase() : "TV"}
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-sm">Creator account</strong>
              <small className="block truncate text-xs text-stone-500">{shortAddress}</small>
            </span>
          </div>
        </div>

        <nav aria-label="Creator workspace" className="flex gap-2 overflow-x-auto px-4 pb-4 lg:mt-7 lg:block lg:space-y-1 lg:overflow-visible">
          {navigation.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              aria-current={index === 0 ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                index === 0
                  ? "bg-leaf font-semibold text-white"
                  : "text-stone-600 hover:bg-mint hover:text-leaf"
              }`}
            >
              <span className={`text-[10px] font-bold ${index === 0 ? "text-white/70" : "text-stone-400"}`}>
                {item.marker}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mx-4 mt-auto hidden rounded-2xl bg-mint p-4 text-leaf lg:absolute lg:bottom-5 lg:block lg:w-[216px]">
          <strong className="text-sm">Need context?</strong>
          <p className="mt-1 text-xs leading-5 text-leaf/75">
            Technical proof stays available without interrupting the creator journey.
          </p>
          <Link href="/#how-it-works" className="mt-3 inline-flex text-xs font-bold underline underline-offset-4">
            Review the protection flow
          </Link>
        </div>
      </aside>

      <main className="min-w-0">
        <header className="flex min-h-20 items-center justify-between gap-4 border-b border-stone-200 bg-white px-5 py-4 md:px-8">
          <div>
            <p className="text-xs font-medium text-stone-500">Workspace / Overview</p>
            <p className="mt-1 text-sm font-semibold text-ink">Consent-first creator protection</p>
          </div>
          <ConnectButton label="Connect account" accountStatus="avatar" chainStatus="icon" showBalance={false} />
        </header>

        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
          <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-coral">Creator overview</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                Protect the work. Keep the choice.
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
                Track protected previews, AI-training consent, and commercial licensing without
                exposing the clean original.
              </p>
            </div>
            <Link href="/#studio" className="inline-flex justify-center rounded-xl bg-coral px-5 py-3 text-sm font-semibold text-white hover:bg-coral-dark">
              Protect a new work
            </Link>
          </section>

          <section aria-label="Creator summary" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Protected works" value={assets.isLoading ? "Loading" : `${records.length}`} note="Indexed protocol records" />
            <SummaryCard label="Licenses available" value={assets.isLoading ? "Loading" : `${licenseReady}`} note="Commercial terms recorded" />
            <SummaryCard label="AI training allowed" value={assets.isLoading ? "Loading" : `${licensedForAI}`} note="Explicit licensed consent" tone="coral" />
            <SummaryCard label="Account trust" value="SAMPLE" note="Mock verification only" tone="amber" />
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
            <article className="rounded-3xl border border-stone-200 bg-white p-6 md:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-leaf">Protection coverage</p>
                  <h2 className="mt-2 text-xl font-semibold">Every work carries an explicit AI choice</h2>
                </div>
                <DataState isLoading={assets.isLoading} isError={assets.isError} />
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-[1fr_220px] md:items-end">
                <div>
                  <div className="flex h-5 overflow-hidden rounded-full bg-stone-100" aria-label="AI consent distribution">
                    {records.length > 0 ? (
                      <>
                        <span className="bg-leaf" style={{ width: `${(protectedFromAI / records.length) * 100}%` }} />
                        <span className="bg-coral" style={{ width: `${(licensedForAI / records.length) * 100}%` }} />
                      </>
                    ) : (
                      <span className="w-full bg-stone-200" />
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-stone-600">
                    <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-leaf" />No AI training: {protectedFromAI}</span>
                    <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-coral" />Licensed AI training: {licensedForAI}</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-sand p-4">
                  <span className="text-xs text-stone-500">Public exposure model</span>
                  <strong className="mt-1 block text-sm text-leaf">Protected preview only</strong>
                  <p className="mt-1 text-xs leading-5 text-stone-500">Clean sources remain encrypted in the vault boundary.</p>
                </div>
              </div>
            </article>

            <article className="rounded-3xl bg-leaf p-6 text-white md:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">Quick actions</p>
              <div className="mt-5 grid gap-3">
                <QuickAction href="/#studio" index="01" title="Protect a work" detail="Create a protected preview and register consent." />
                <QuickAction href="/#gallery" index="02" title="Explore clear licenses" detail="Review works with explicit commercial terms." />
                <QuickAction href="#recent-works" index="03" title="Review AI choices" detail="Check the consent attached to indexed works." />
              </div>
            </article>
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
            <RecentWorks assets={records} isLoading={assets.isLoading} isError={assets.isError} />

            <div className="grid gap-5">
              <article id="trust-profile" className="rounded-3xl border border-stone-200 bg-white p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-coral">Trust profile</p>
                    <h2 className="mt-2 text-xl font-semibold">Identity is separate from ownership</h2>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold text-amber-800">SAMPLE KYC</span>
                </div>
                <dl className="mt-5 space-y-3 text-sm">
                  <StatusRow label="Wallet connection" value={account.isConnected ? "Connected" : "Not connected"} />
                  <StatusRow label="Protocol addresses" value={contractsConfigured ? "Configured" : "Demo mode"} />
                  <StatusRow label="Identity verification" value="Not submitted" />
                </dl>
                <p className="mt-5 rounded-2xl bg-sand p-3 text-xs leading-5 text-stone-600">
                  Verification supports trust. It never guarantees an asset, business outcome, or investment return.
                </p>
              </article>

              <article className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">AI asset audit</p>
                <h2 className="mt-2 text-lg font-semibold">Understand before licensing</h2>
                <p className="my-4 text-sm leading-6 text-stone-600">
                  Future audit results will explain provenance and licensing red flags without issuing buy, sell, or return predictions.
                </p>
                <AiDisclaimer />
              </article>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ label, value, note, tone = "teal" }: { label: string; value: string; note: string; tone?: "teal" | "coral" | "amber" }) {
  const toneClass = tone === "coral" ? "text-coral" : tone === "amber" ? "text-amber-700" : "text-leaf";
  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <strong className={`mt-3 block text-3xl tracking-tight ${toneClass}`}>{value}</strong>
      <p className="mt-2 text-xs text-stone-500">{note}</p>
    </article>
  );
}

function QuickAction({ href, index, title, detail }: { href: string; index: string; title: string; detail: string }) {
  return (
    <Link href={href} className="group flex items-center gap-4 rounded-2xl bg-white/10 p-3.5 hover:bg-white/15">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[10px] font-bold text-leaf">{index}</span>
      <span>
        <strong className="block text-sm">{title}</strong>
        <small className="mt-1 block leading-5 text-emerald-100">{detail}</small>
      </span>
    </Link>
  );
}

function RecentWorks({ assets, isLoading, isError }: { assets: IndexedAsset[]; isLoading: boolean; isError: boolean }) {
  return (
    <article id="recent-works" className="rounded-3xl border border-stone-200 bg-white p-6 md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-leaf">Recent works</p>
          <h2 className="mt-2 text-xl font-semibold">Indexed protection records</h2>
        </div>
        <Link href="/#gallery" className="text-xs font-bold text-leaf underline underline-offset-4">View gallery</Link>
      </div>

      {isLoading && <p className="mt-6 text-sm text-stone-500">Loading indexed works…</p>}
      {isError && <p role="alert" className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">Indexed works are unavailable. Protection actions remain separate from this cached view.</p>}
      {!isLoading && !isError && assets.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center">
          <strong className="text-sm">No indexed work yet</strong>
          <p className="mt-2 text-xs leading-5 text-stone-500">Protect a first creation or connect Supabase to populate this workspace.</p>
          <Link href="/#studio" className="mt-4 inline-flex rounded-xl bg-leaf px-4 py-2 text-xs font-semibold text-white">Open Protection Studio</Link>
        </div>
      )}
      {assets.length > 0 && (
        <div className="mt-5 divide-y divide-stone-100">
          {assets.slice(0, 4).map((asset) => <WorkRow key={`${asset.chain_id}:${asset.token_id}`} asset={asset} />)}
        </div>
      )}
    </article>
  );
}

function WorkRow({ asset }: { asset: IndexedAsset }) {
  const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? "https://gateway.pinata.cloud/ipfs";
  const isRemoteImage = Boolean(asset.public_poisoned_cid && !asset.public_poisoned_cid.startsWith("demo-"));
  const fee = asset.commercial_license_fee_wei
    ? `${formatEther(BigInt(asset.commercial_license_fee_wei))} ${asset.chain_id === 97 ? "BNB" : "ETH"}`
    : "Terms pending";

  return (
    <div className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-3 py-4 sm:grid-cols-[48px_minmax(0,1fr)_auto_auto]">
      {isRemoteImage ? (
        <Image unoptimized width={48} height={48} src={`${gateway}/${asset.public_poisoned_cid}`} alt="Protected public preview" className="h-12 w-12 rounded-xl object-cover" />
      ) : (
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-mint text-[10px] font-bold text-leaf">IP</span>
      )}
      <span className="min-w-0">
        <strong className="block truncate text-sm">Protected work #{asset.token_id}</strong>
        <small className="mt-1 block truncate text-xs text-stone-500">Creator {asset.creator_wallet}</small>
      </span>
      <span className="col-start-2 rounded-full bg-stone-100 px-3 py-1 text-[10px] font-semibold text-stone-600 sm:col-start-auto">
        {asset.allow_ai_training ? "Licensed AI consent" : "No AI training"}
      </span>
      <strong className="col-start-2 text-xs text-leaf sm:col-start-auto sm:text-right">{fee}</strong>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-b border-stone-100 pb-3"><dt className="text-stone-500">{label}</dt><dd className="text-right font-semibold">{value}</dd></div>;
}

function DataState({ isLoading, isError }: { isLoading: boolean; isError: boolean }) {
  const label = isLoading ? "Loading index" : isError ? "Index unavailable" : "Indexed data";
  const color = isError ? "bg-red-50 text-red-700" : "bg-mint text-leaf";
  return <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${color}`}>{label}</span>;
}
