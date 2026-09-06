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

type ExploreFilter =
  | "all"
  | "protected"
  | "ai-licensed"
  | "license-ready";

const filters: {
  id: ExploreFilter;
  label: string;
}[] = [
  {
    id: "all",
    label: "All works",
  },
  {
    id: "protected",
    label: "No AI training",
  },
  {
    id: "ai-licensed",
    label: "AI licensed",
  },
  {
    id: "license-ready",
    label: "License ready",
  },
];

function shortenAddress(address: string) {
  if (!address) {
    return "Unknown creator";
  }

  if (address.length <= 12) {
    return address;
  }

  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function getAssetKey(asset: IndexedAsset) {
  return `${asset.chain_id}:${asset.token_id}`;
}

function getChainLabel(chainId: number) {
  if (chainId === 97) {
    return "BSC Testnet";
  }

  if (chainId === 56) {
    return "BNB Chain";
  }

  if (chainId === 1) {
    return "Ethereum";
  }

  if (chainId === 11155111) {
    return "Sepolia";
  }

  return `Chain ${chainId}`;
}

function getLicenseLabel(asset: IndexedAsset) {
  if (!asset.commercial_license_fee_wei) {
    return "Not listed";
  }

  try {
    const amount = formatEther(
      BigInt(asset.commercial_license_fee_wei),
    );

    const currency =
      asset.chain_id === 97 ||
      asset.chain_id === 56
        ? "BNB"
        : "ETH";

    return `${amount} ${currency}`;
  } catch {
    return "License available";
  }
}

function matchesSearch(
  asset: IndexedAsset,
  search: string,
) {
  const normalizedSearch = search
    .trim()
    .toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  const searchableValue = [
    asset.token_id,
    asset.creator_wallet,
    asset.chain_id,
  ]
    .join(" ")
    .toLowerCase();

  return searchableValue.includes(
    normalizedSearch,
  );
}

function matchesFilter(
  asset: IndexedAsset,
  filter: ExploreFilter,
) {
  switch (filter) {
    case "protected":
      return !asset.allow_ai_training;

    case "ai-licensed":
      return Boolean(
        asset.allow_ai_training,
      );

    case "license-ready":
      return Boolean(
        asset.commercial_license_fee_wei,
      );

    default:
      return true;
  }
}

export default function ExplorePage() {
  const assets = useAssets();

  const [search, setSearch] =
    useState("");

  const [
    activeFilter,
    setActiveFilter,
  ] = useState<ExploreFilter>("all");

  const records = useMemo(
    () => assets.data ?? [],
    [assets.data],
  );

  const filteredAssets = useMemo(() => {
    return records.filter((asset) => {
      return (
        matchesSearch(
          asset,
          search,
        ) &&
        matchesFilter(
          asset,
          activeFilter,
        )
      );
    });
  }, [
    records,
    search,
    activeFilter,
  ]);

  const protectedCount =
    records.filter(
      (asset) =>
        !asset.allow_ai_training,
    ).length;

  const licensedCount =
    records.filter((asset) =>
      Boolean(
        asset.commercial_license_fee_wei,
      ),
    ).length;

  return (
    <main className="min-h-screen bg-sand text-ink">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-stone-200">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-48 -top-48 h-[32rem] w-[32rem] rounded-full bg-mint/70 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-5 pb-12 pt-14 md:px-8 md:pb-16 md:pt-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-coral">
                Explore Trovaya
              </p>

              <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                Original work,
                <span className="block text-leaf">
                  with intent attached.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-stone-600">
                Discover public protected
                previews with visible
                creator provenance,
                AI-training consent, and
                commercial licensing
                signals.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6 border-t border-stone-300 pt-5 lg:min-w-[360px] lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <GalleryMetric
                value={
                  assets.isLoading
                    ? "—"
                    : `${records.length}`
                }
                label="Works"
              />

              <GalleryMetric
                value={
                  assets.isLoading
                    ? "—"
                    : `${protectedCount}`
                }
                label="Protected"
              />

              <GalleryMetric
                value={
                  assets.isLoading
                    ? "—"
                    : `${licensedCount}`
                }
                label="Licensable"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-[76px] z-40 border-b border-stone-200/90 bg-sand/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 md:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
            >
              <circle
                cx="11"
                cy="11"
                r="6.5"
                stroke="currentColor"
                strokeWidth="1.7"
              />

              <path
                d="M16 16L20 20"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search creator, token, or chain..."
              className="h-12 w-full rounded-full border border-stone-200 bg-white pl-11 pr-5 text-sm text-ink outline-none transition placeholder:text-stone-400 focus:border-leaf focus:ring-2 focus:ring-leaf/10"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {filters.map(
              (filter) => {
                const active =
                  activeFilter ===
                  filter.id;

                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() =>
                      setActiveFilter(
                        filter.id,
                      )
                    }
                    className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold transition ${
                      active
                        ? "bg-leaf text-white"
                        : "border border-stone-200 bg-white text-stone-600 hover:border-leaf/40 hover:text-leaf"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              },
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-coral">
              Discover
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
              Protected creations
            </h2>

            <p className="mt-3 text-xs text-stone-500">
              Select a work to inspect
              its provenance, consent,
              and licensing details.
            </p>
          </div>

          {!assets.isLoading &&
            !assets.isError && (
              <p className="text-xs text-stone-500">
                Showing{" "}
                <strong className="font-semibold text-ink">
                  {
                    filteredAssets.length
                  }
                </strong>{" "}
                of {records.length}
              </p>
            )}
        </div>

        {assets.isLoading && (
          <LoadingGallery />
        )}

        {assets.isError && (
          <ErrorState />
        )}

        {!assets.isLoading &&
          !assets.isError &&
          records.length === 0 && (
            <EmptyState />
          )}

        {!assets.isLoading &&
          !assets.isError &&
          records.length > 0 &&
          filteredAssets.length ===
            0 && (
            <NoResults
              onReset={() => {
                setSearch("");
                setActiveFilter(
                  "all",
                );
              }}
            />
          )}

        {!assets.isLoading &&
          !assets.isError &&
          filteredAssets.length >
            0 && (
            <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredAssets.map(
                (asset) => (
                  <ArtworkCard
                    key={getAssetKey(
                      asset,
                    )}
                    asset={asset}
                  />
                ),
              )}
            </div>
          )}
      </section>

      <section className="border-t border-stone-200">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <div className="relative overflow-hidden rounded-[2rem] bg-leaf px-6 py-10 text-white md:px-10 md:py-12">
            <div
              aria-hidden="true"
              className="absolute -right-20 -top-32 h-80 w-80 rounded-full bg-emerald-300/10 blur-2xl"
            />

            <div className="relative grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
                  For creators
                </p>

                <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
                  Share what people
                  can see.
                  <span className="block text-emerald-200">
                    Keep control of
                    what it means.
                  </span>
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-7 text-emerald-100">
                  Establish provenance,
                  choose your AI consent,
                  define licensing terms,
                  and publish a protected
                  derivative instead of
                  exposing the private
                  original by default.
                </p>
              </div>

              <Link
                href="/#studio"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-leaf transition hover:bg-mint"
              >
                Protect a creation
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-stone-500 md:flex-row md:items-center md:justify-between md:px-8">
          <span>
            Trovaya — creator
            provenance, consent, and
            licensing.
          </span>

          <span>
            Experimental hackathon
            build.
          </span>
        </div>
      </footer>
    </main>
  );
}

function GalleryMetric({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div>
      <strong className="block text-2xl font-semibold tracking-[-0.04em] text-leaf">
        {value}
      </strong>

      <span className="mt-1 block text-[11px] text-stone-500">
        {label}
      </span>
    </div>
  );
}

function ArtworkCard({
  asset,
}: {
  asset: IndexedAsset;
}) {
  const gateway =
    process.env
      .NEXT_PUBLIC_IPFS_GATEWAY ??
    "https://gateway.pinata.cloud/ipfs";

  const hasRealPreview = Boolean(
    asset.public_poisoned_cid &&
      !asset.public_poisoned_cid.startsWith(
        "demo-",
      ),
  );

  const creator =
    shortenAddress(
      asset.creator_wallet,
    );

  const fee =
    getLicenseLabel(asset);

  const chain =
    getChainLabel(
      asset.chain_id,
    );

  const detailHref =
    `/artwork/${asset.chain_id}/${asset.token_id}`;

  return (
    <Link
      href={detailHref}
      aria-label={`View protected work ${asset.token_id}`}
      className="group block rounded-[1.6rem] outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-4 focus-visible:ring-offset-sand"
    >
      <article>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.6rem] border border-stone-200 bg-stone-100 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-stone-200/60">
          {hasRealPreview ? (
            <Image
              unoptimized
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              src={`${gateway}/${asset.public_poisoned_cid}`}
              alt={`Protected work #${asset.token_id}`}
              className="object-cover transition duration-700 group-hover:scale-[1.025]"
            />
          ) : (
            <div className="relative flex h-full flex-col justify-between overflow-hidden bg-gradient-to-br from-[#dff4ed] via-[#f7f6f1] to-[#ebe7dc] p-5">
              <div
                aria-hidden="true"
                className="absolute -right-12 -top-12 h-44 w-44 rounded-full border-[28px] border-leaf/5"
              />

              <div
                aria-hidden="true"
                className="absolute bottom-16 left-[-3rem] h-40 w-40 rotate-12 rounded-[2.5rem] bg-coral/10"
              />

              <div className="relative flex items-start justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-leaf">
                  Trovaya preview
                </span>

                <span className="grid h-9 w-9 place-items-center rounded-full bg-leaf text-xs font-bold text-white">
                  TV
                </span>
              </div>

              <div className="relative">
                <div className="mb-5 h-px w-14 bg-coral" />

                <strong className="block max-w-[13rem] text-2xl font-semibold leading-tight tracking-[-0.04em] text-leaf">
                  Protected public
                  derivative
                </strong>

                <span className="mt-3 block text-xs text-stone-500">
                  Preview not
                  persisted
                </span>
              </div>
            </div>
          )}

          <div className="absolute left-3 top-3">
            <span
              className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-semibold backdrop-blur-md ${
                asset.allow_ai_training
                  ? "bg-coral/90 text-white"
                  : "bg-leaf/90 text-white"
              }`}
            >
              {asset.allow_ai_training
                ? "AI training licensed"
                : "No AI training"}
            </span>
          </div>

          <div className="absolute bottom-3 right-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-[10px] font-medium text-white backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Provenance recorded
            </span>
          </div>

          <div className="absolute bottom-3 left-3 translate-y-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <span className="inline-flex items-center rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-semibold text-leaf shadow-sm backdrop-blur-md">
              View details →
            </span>
          </div>
        </div>

        <div className="px-1 pt-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold tracking-[-0.02em] text-ink transition group-hover:text-leaf">
                Protected work #
                {asset.token_id}
              </h3>

              <p className="mt-1 truncate text-xs text-stone-500">
                by{" "}
                <span className="font-medium text-stone-700">
                  {creator}
                </span>
              </p>
            </div>

            <span
              title="Creator provenance recorded"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mint text-xs font-bold text-leaf"
            >
              ✓
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between gap-4 border-t border-stone-200 pt-3">
            <div className="min-w-0">
              <span className="block text-[10px] uppercase tracking-[0.12em] text-stone-400">
                Commercial license
              </span>

              <strong className="mt-1 block truncate text-xs font-semibold text-leaf">
                {fee}
              </strong>
            </div>

            <span className="shrink-0 text-[10px] font-medium text-stone-400">
              {chain}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function LoadingGallery() {
  return (
    <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({
        length: 8,
      }).map((_, index) => (
        <div key={index}>
          <div className="aspect-[4/5] animate-pulse rounded-[1.6rem] bg-stone-200" />

          <div className="space-y-3 px-1 pt-4">
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-stone-200" />

            <div className="h-3 w-1/2 animate-pulse rounded-full bg-stone-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState() {
  return (
    <div className="rounded-[2rem] border border-red-200 bg-red-50 px-6 py-14 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-100 text-lg font-bold text-red-700">
        !
      </div>

      <h3 className="mt-5 text-xl font-semibold text-red-900">
        Gallery unavailable
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-red-700">
        Public indexed works could
        not be loaded. Creator
        protection actions remain
        separate from this gallery
        view.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-leaf text-sm font-bold text-white">
        TV
      </div>

      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-coral">
        Public gallery
      </p>

      <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
        The gallery is waiting
        for its first work.
      </h3>

      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-stone-500">
        Once a protected creation
        is indexed, its
        creator-controlled public
        preview can appear here.
      </p>

      <Link
        href="/#studio"
        className="mt-7 inline-flex min-h-11 items-center rounded-xl bg-leaf px-5 text-sm font-semibold text-white transition hover:bg-[#063d33]"
      >
        Protect the first work
      </Link>
    </div>
  );
}

function NoResults({
  onReset,
}: {
  onReset: () => void;
}) {
  return (
    <div className="rounded-[2rem] border border-stone-200 bg-white px-6 py-14 text-center">
      <h3 className="text-xl font-semibold">
        Nothing matches this
        view.
      </h3>

      <p className="mt-2 text-sm text-stone-500">
        Try another creator,
        token, chain, or consent
        filter.
      </p>

      <button
        type="button"
        onClick={onReset}
        className="mt-6 rounded-xl bg-leaf px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#063d33]"
      >
        Reset filters
      </button>
    </div>
  );
}