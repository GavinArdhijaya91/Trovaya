"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { formatEther } from "viem";

import { SiteHeader } from "@/components/site-header";
import { MyCircles } from "@/components/my-circles";
import { useAssets, type IndexedAsset } from "@/hooks/use-assets";

function shortenAddress(address: string) {
  if (!address) return "Kreator";
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function getLicenseLabel(asset: IndexedAsset) {
  if (!asset.commercial_license_fee_wei) return "Belum terdaftar";
  try {
    const amount = formatEther(BigInt(asset.commercial_license_fee_wei));
    const currency = asset.chain_id === 97 || asset.chain_id === 56 ? "BNB" : "ETH";
    return `${amount} ${currency}`;
  } catch {
    return "Lisensi tersedia";
  }
}

export default function CreatorProfilePage() {
  const params = useParams<{ address: string }>();
  const creatorAddress = params?.address ?? "";
  const assets = useAssets();
  const [copied, setCopied] = useState(false);

  const creatorAssets = useMemo(() => {
    if (!assets.data || !creatorAddress) return [];
    return assets.data.filter(
      (a) => a.creator_wallet.toLowerCase() === creatorAddress.toLowerCase(),
    );
  }, [assets.data, creatorAddress]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(creatorAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const totalWorks = creatorAssets.length;
  const protectedWorks = creatorAssets.filter((a) => !a.allow_ai_training).length;
  const licensableWorks = creatorAssets.filter((a) => Boolean(a.commercial_license_fee_wei)).length;

  return (
    <main className="min-h-screen bg-sand text-ink">
      <SiteHeader />

      {/* Creator Profile Banner */}
      <section className="relative overflow-hidden border-b border-stone-200 bg-white">
        <div className="h-36 w-full bg-gradient-to-r from-leaf via-[#085a4b] to-mint/80 relative">
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-coral/20 blur-2xl"
          />
        </div>

        <div className="mx-auto max-w-7xl px-5 pb-8 md:px-8">
          <div className="relative -mt-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              {/* Creator Avatar */}
              <div className="grid h-28 w-28 shrink-0 place-items-center rounded-3xl border-4 border-white bg-sand shadow-lg text-4xl">
                🎨
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                    {shortenAddress(creatorAddress)}
                  </h1>
                  <span className="rounded-full bg-mint px-2.5 py-0.5 text-xs font-semibold text-leaf border border-leaf/20">
                    Kreator Terverifikasi On-Chain
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                  <button
                    type="button"
                    onClick={copyAddress}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 hover:bg-stone-100 font-mono"
                    title="Salin alamat wallet"
                  >
                    <span>{creatorAddress}</span>
                    <span>{copied ? "✓ Tersalin" : "📋"}</span>
                  </button>

                  <a
                    href={`https://testnet.bscscan.com/address/${creatorAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-leaf hover:underline font-medium"
                  >
                    <span>BSCScan Explorer</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Reputation Badges Pill Box */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                <span>🛡️</span>
                <span>Provenance Originator</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50/80 px-3 py-1.5 text-xs font-semibold text-teal-800">
                <span>🔒</span>
                <span>Anti-Scraping Active</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700">
                <span>⚡</span>
                <span>BNB Chain Verified</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 grid grid-cols-3 gap-4 border-t border-stone-100 pt-6 sm:max-w-xl">
            <div>
              <strong className="block text-2xl font-bold tracking-tight text-leaf">
                {assets.isLoading ? "…" : totalWorks}
              </strong>
              <span className="text-xs text-stone-500">Karya Terdaftar</span>
            </div>
            <div>
              <strong className="block text-2xl font-bold tracking-tight text-leaf">
                {assets.isLoading ? "…" : protectedWorks}
              </strong>
              <span className="text-xs text-stone-500">Dilindungi Anti-AI</span>
            </div>
            <div>
              <strong className="block text-2xl font-bold tracking-tight text-leaf">
                {assets.isLoading ? "…" : licensableWorks}
              </strong>
              <span className="text-xs text-stone-500">Siap Dilisenkan</span>
            </div>
          </div>
        </div>
      </section>

      {/* Creator Works Gallery */}
      <MyCircles wallet={creatorAddress} />
      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Katalog Karya Kreator</h2>
            <p className="mt-1 text-xs text-stone-500">
              Karya publik yang dicetak dan dilisensikan oleh alamat ini.
            </p>
          </div>

          <Link
            href="/marketplace"
            className="text-xs font-semibold text-leaf hover:underline"
          >
            ← Kembali ke Marketplace
          </Link>
        </div>

        {assets.isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-stone-200" />
            ))}
          </div>
        )}

        {!assets.isLoading && creatorAssets.length === 0 && (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center">
            <span className="text-4xl">🎨</span>
            <h3 className="mt-3 text-lg font-semibold">Belum Ada Karya Terpublikasi</h3>
            <p className="mt-1 text-xs text-stone-500">
              Kreator ini belum mempublikasikan karya berlisensi di jaringan ini.
            </p>
          </div>
        )}

        {!assets.isLoading && creatorAssets.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {creatorAssets.map((asset) => {
              const gateway =
                process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? "https://gateway.pinata.cloud/ipfs";
              const hasRealPreview = Boolean(
                asset.public_poisoned_cid && !asset.public_poisoned_cid.startsWith("demo-"),
              );
              const fee = getLicenseLabel(asset);
              const detailHref = `/artwork/${asset.chain_id}/${asset.token_id}`;

              return (
                <article
                  key={`${asset.chain_id}:${asset.token_id}`}
                  className="group flex flex-col rounded-3xl border border-stone-200 bg-white p-3.5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <Link href={detailHref} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone-100">
                    {hasRealPreview ? (
                      <Image
                        unoptimized
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        src={`${gateway}/${asset.public_poisoned_cid}`}
                        alt={`Karya #${asset.token_id}`}
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full place-items-center bg-sand p-4 text-center">
                        <span className="text-xs font-semibold text-leaf">Preview Terproteksi</span>
                      </div>
                    )}

                    <div className="absolute left-3 top-3">
                      <span className="rounded-full bg-leaf/90 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
                        {asset.allow_ai_training ? "AI Training OK" : "Anti-AI Scraping"}
                      </span>
                    </div>
                  </Link>

                  <div className="mt-3 flex flex-1 flex-col justify-between">
                    <div>
                      <Link href={detailHref}>
                        <h3 className="text-sm font-semibold text-ink transition group-hover:text-leaf">
                          Karya Terproteksi #{asset.token_id}
                        </h3>
                      </Link>
                      <p className="mt-0.5 text-[11px] text-stone-500">
                        BSC Testnet · Token #{asset.token_id}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase">Lisensi</span>
                        <strong className="text-xs font-bold text-leaf">{fee}</strong>
                      </div>

                      <Link
                        href={detailHref}
                        className="rounded-xl bg-sand px-3 py-1.5 text-xs font-semibold text-leaf hover:bg-mint transition"
                      >
                        Beli Lisensi →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
