"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatEther } from "viem";

import { SiteHeader } from "@/components/site-header";
import {
  useAssets,
  type IndexedAsset,
} from "@/hooks/use-assets";

type MarketplaceFilter =
  | "all"
  | "protected"
  | "ai-licensed"
  | "license-ready";

const filters: {
  id: MarketplaceFilter;
  label: string;
  icon: string;
}[] = [
  {
    id: "all",
    label: "Semua Karya",
    icon: "🎨",
  },
  {
    id: "protected",
    label: "Anti-Scraping AI",
    icon: "🛡️",
  },
  {
    id: "ai-licensed",
    label: "Lisensi AI Training",
    icon: "🤖",
  },
  {
    id: "license-ready",
    label: "Siap Beli Lisensi",
    icon: "💎",
  },
];

function shortenAddress(address: string) {
  if (!address) return "Kreator Anonim";
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function getAssetKey(asset: IndexedAsset) {
  return `${asset.chain_id}:${asset.token_id}`;
}

function getChainLabel(chainId: number) {
  if (chainId === 97) return "BSC Testnet";
  if (chainId === 56) return "BNB Chain";
  if (chainId === 1) return "Ethereum";
  if (chainId === 11155111) return "Sepolia";
  return `Chain ${chainId}`;
}

function getLicenseLabel(asset: IndexedAsset) {
  if (!asset.commercial_license_fee_wei) {
    return "Belum terdaftar";
  }

  try {
    const amount = formatEther(BigInt(asset.commercial_license_fee_wei));
    const currency = asset.chain_id === 97 || asset.chain_id === 56 ? "BNB" : "ETH";
    return `${amount} ${currency}`;
  } catch {
    return "Lisensi tersedia";
  }
}

function matchesSearch(asset: IndexedAsset, search: string) {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return true;

  const searchableValue = [
    asset.token_id,
    asset.creator_wallet,
    asset.chain_id,
  ]
    .join(" ")
    .toLowerCase();

  return searchableValue.includes(normalizedSearch);
}

function matchesFilter(asset: IndexedAsset, filter: MarketplaceFilter) {
  switch (filter) {
    case "protected":
      return !asset.allow_ai_training;
    case "ai-licensed":
      return Boolean(asset.allow_ai_training);
    case "license-ready":
      return Boolean(asset.commercial_license_fee_wei);
    default:
      return true;
  }
}

export default function MarketplacePage() {
  const assets = useAssets();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<MarketplaceFilter>("all");

  const records = useMemo(() => assets.data ?? [], [assets.data]);

  const filteredAssets = useMemo(() => {
    return records.filter((asset) => {
      return (
        matchesSearch(asset, search) &&
        matchesFilter(asset, activeFilter)
      );
    });
  }, [records, search, activeFilter]);

  const protectedCount = records.filter((asset) => !asset.allow_ai_training).length;
  const licensedCount = records.filter((asset) => Boolean(asset.commercial_license_fee_wei)).length;

  return (
    <main className="min-h-screen bg-sand text-ink">
      <SiteHeader />

      {/* Hero Marketplace */}
      <section className="relative overflow-hidden border-b border-stone-200">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-mint/80 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-coral/10 blur-2xl"
        />

        <div className="relative mx-auto max-w-7xl px-5 pb-12 pt-12 md:px-8 md:pb-16 md:pt-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-leaf/20 bg-leaf/5 px-3 py-1 text-xs font-semibold text-leaf">
                <span>🏪</span>
                <span>Marketplace Pembeli & Lisensi Komersial</span>
              </div>

              <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                Temukan karya autentik,
                <span className="block text-leaf">
                  lisensikan hak komersialnya on-chain.
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
                Jelajahi karya kreator Indonesia dengan preview terproteksi anti-scraping.
                Verifikasi provenance, beli lisensi komersial transparan, dan buka enkripsi vault karya asli.
              </p>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-3 gap-5 rounded-2xl border border-stone-200/80 bg-white/80 p-5 shadow-soft backdrop-blur-md lg:min-w-[380px]">
              <MarketplaceMetric
                value={assets.isLoading ? "—" : `${records.length}`}
                label="Karya Terdaftar"
              />
              <MarketplaceMetric
                value={assets.isLoading ? "—" : `${protectedCount}`}
                label="Anti-Scraping AI"
              />
              <MarketplaceMetric
                value={assets.isLoading ? "—" : `${licensedCount}`}
                label="Siap Lisensi"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Filter & Search Toolbar */}
      <section className="sticky top-[76px] z-40 border-b border-stone-200/90 bg-sand/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 md:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
            >
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
              <path d="M16 16L20 20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari token ID, wallet kreator, atau chain..."
              className="h-11 w-full rounded-full border border-stone-200 bg-white pl-11 pr-5 text-xs text-ink outline-none transition placeholder:text-stone-400 focus:border-leaf focus:ring-2 focus:ring-leaf/10 sm:text-sm"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {filters.map((filter) => {
              const active = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-leaf text-white shadow-sm"
                      : "border border-stone-200 bg-white text-stone-600 hover:border-leaf/40 hover:text-leaf"
                  }`}
                >
                  <span>{filter.icon}</span>
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Assets Grid */}
      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-coral">
              Katalog Pasar
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
              Karya Kreatif Tersedia
            </h2>
          </div>

          {!assets.isLoading && !assets.isError && (
            <p className="text-xs text-stone-500">
              Menampilkan{" "}
              <strong className="font-semibold text-ink">
                {filteredAssets.length}
              </strong>{" "}
              dari {records.length} karya
            </p>
          )}
        </div>

        {assets.isLoading && <LoadingGrid />}
        {assets.isError && <ErrorDisplay />}
        {!assets.isLoading && !assets.isError && records.length === 0 && <EmptyMarketplace />}
        {!assets.isLoading && !assets.isError && records.length > 0 && filteredAssets.length === 0 && (
          <NoResults
            onReset={() => {
              setSearch("");
              setActiveFilter("all");
            }}
          />
        )}

        {!assets.isLoading && !assets.isError && filteredAssets.length > 0 && (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAssets.map((asset) => (
              <MarketplaceCard key={getAssetKey(asset)} asset={asset} />
            ))}
          </div>
        )}
      </section>

      {/* Dedicated Creator Promotion Section */}
      <section className="border-t border-stone-200 bg-white/50">
        <div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-16">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-leaf to-[#063d33] px-6 py-10 text-white md:px-10 md:py-12">
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-300/20 px-3 py-1 text-xs font-semibold text-emerald-200">
                  <span>🎨</span> Mode Kreator
                </span>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Punya karya asli yang ingin dilindungi?
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-emerald-100/90">
                  Daftarkan karya Anda di Trovaya Creator Studio. Proteksi gambar dengan teknologi anti-scraping,
                  atur ketentuan lisensi komersial, dan pantau royalti langsung di dashboard kreator.
                </p>
              </div>

              <Link
                href="/dashboard"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-leaf transition hover:bg-mint"
              >
                Buka Dashboard Kreator →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-stone-500 md:flex-row md:items-center md:justify-between md:px-8">
          <span>Trovaya Protocol — Decentralized IP Registry & Marketplace.</span>
          <div className="flex gap-4">
            <Link href="/dashboard" className="hover:text-leaf">Dashboard Kreator</Link>
            <Link href="/explore" className="hover:text-leaf">Eksplorasi</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function MarketplaceMetric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <strong className="block text-xl font-bold tracking-tight text-leaf sm:text-2xl">
        {value}
      </strong>
      <span className="mt-0.5 block text-[11px] text-stone-500">{label}</span>
    </div>
  );
}

function MarketplaceCard({ asset }: { asset: IndexedAsset }) {
  const gateway =
    process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? "https://gateway.pinata.cloud/ipfs";

  const hasRealPreview = Boolean(
    asset.public_poisoned_cid && !asset.public_poisoned_cid.startsWith("demo-"),
  );

  const creator = shortenAddress(asset.creator_wallet);
  const fee = getLicenseLabel(asset);
  const chain = getChainLabel(asset.chain_id);
  const detailHref = `/artwork/${asset.chain_id}/${asset.token_id}`;

  return (
    <article className="group relative flex flex-col rounded-3xl border border-stone-200/90 bg-white p-3.5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-leaf/30 hover:shadow-xl">
      <Link href={detailHref} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone-100">
        {hasRealPreview ? (
          <Image
            unoptimized
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            src={`${gateway}/${asset.public_poisoned_cid}`}
            alt={`Karya terproteksi #${asset.token_id}`}
            className="object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="relative flex h-full flex-col justify-between overflow-hidden bg-gradient-to-br from-[#dff4ed] via-[#f7f6f1] to-[#ebe7dc] p-5">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-leaf">
                Trovaya Preview
              </span>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-leaf text-xs font-bold text-white">
                TV
              </span>
            </div>
            <div>
              <strong className="block text-xl font-semibold text-leaf">
                Protected Public Derivative
              </strong>
              <span className="mt-1 block text-xs text-stone-500">
                Preview demo
              </span>
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md ${
              asset.allow_ai_training
                ? "bg-coral/90 text-white"
                : "bg-leaf/90 text-white"
            }`}
          >
            {asset.allow_ai_training ? "🤖 AI Licensed" : "🛡️ Anti-AI Training"}
          </span>
        </div>

        <div className="absolute bottom-3 right-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            On-Chain
          </span>
        </div>
      </Link>

      {/* Card Info */}
      <div className="flex flex-1 flex-col justify-between pt-3.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link href={detailHref} className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold text-ink transition group-hover:text-leaf">
                Karya Terproteksi #{asset.token_id}
              </h3>
            </Link>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">
              {chain}
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-xs text-stone-500">Kreator:</span>
            <Link
              href={`/profile/${asset.creator_wallet}`}
              className="text-xs font-medium text-stone-700 hover:text-leaf underline-offset-2 hover:underline"
              title="Lihat profil kreator"
            >
              {creator}
            </Link>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-stone-100 pt-3">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-stone-400">
              Biaya Lisensi
            </span>
            <strong className="mt-0.5 block text-sm font-bold text-leaf">
              {fee}
            </strong>
          </div>

          <Link
            href={detailHref}
            className="inline-flex items-center gap-1 rounded-xl bg-sand px-3 py-1.5 text-xs font-semibold text-leaf transition hover:bg-mint"
          >
            Beli Lisensi →
          </Link>
        </div>
      </div>
    </article>
  );
}

function LoadingGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-3xl border border-stone-200 bg-white p-3.5">
          <div className="aspect-[4/5] animate-pulse rounded-2xl bg-stone-200" />
          <div className="mt-4 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-stone-200" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-stone-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorDisplay() {
  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
      <h3 className="text-lg font-semibold text-red-900">Gagal Memuat Marketplace</h3>
      <p className="mt-2 text-xs text-red-700">
        Karya terindeks on-chain saat ini belum dapat diambil dari indexer.
      </p>
    </div>
  );
}

function EmptyMarketplace() {
  return (
    <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center">
      <span className="text-4xl">🏪</span>
      <h3 className="mt-4 text-xl font-semibold">Marketplace Belum Memiliki Karya</h3>
      <p className="mt-2 text-xs text-stone-500">
        Karya pertama yang didaftarkan di studio akan langsung muncul di katalog ini.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex rounded-xl bg-leaf px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#063d33]"
      >
        Daftarkan Karya Sekarang
      </Link>
    </div>
  );
}

function NoResults({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center">
      <h3 className="text-base font-semibold">Tidak ada karya yang cocok</h3>
      <p className="mt-1 text-xs text-stone-500">Coba kata kunci atau filter lain.</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 rounded-xl bg-leaf px-4 py-2 text-xs font-semibold text-white hover:bg-[#063d33]"
      >
        Reset Filter
      </button>
    </div>
  );
}
