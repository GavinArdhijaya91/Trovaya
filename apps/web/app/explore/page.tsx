"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatEther } from "viem";

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

function getLicenseLabel(asset: IndexedAsset) {
  if (!asset.commercial_license_fee_wei) {
    return "Terms pending";
  }

  try {
    const amount = formatEther(
      BigInt(asset.commercial_license_fee_wei),
    );

    const currency =
      asset.chain_id === 97 ? "BNB" : "ETH";

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

  const [activeFilter, setActiveFilter] =
    useState<ExploreFilter>("all");

  const records = useMemo(
    () => assets.data ?? [],
    [assets.data],
  );

  const filteredAssets = useMemo(() => {
    return records.filter((asset) => {
      return (
        matchesSearch(asset, search) &&
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
      <ExploreHeader />

      <section className="border-b border-stone-200">
        <div className="mx-auto max-w-7xl px-5 pb-12 pt-12 md:px-8 md:pb-16 md:pt-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
            <div>
              <span className="inline-flex rounded-full bg-mint px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-leaf">
                Discover Trovaya
              </span>

              <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                Discover work.
                <br />
                Respect the creator.
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-stone-600 md:text-base">
                Explore protected public
                previews with clear creator
                provenance, AI consent, and
                commercial licensing terms.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard
                value={
                  assets.isLoading
                    ? "—"
                    : `${records.length}`
                }
                label="Indexed works"
              />

              <StatCard
                value={
                  assets.isLoading
                    ? "—"
                    : `${protectedCount}`
                }
                label="No AI training"
              />

              <StatCard
                value={
                  assets.isLoading
                    ? "—"
                    : `${licensedCount}`
                }
                label="License ready"
              />

              <div className="rounded-2xl bg-leaf p-4 text-white">
                <span className="text-xs text-emerald-100">
                  Creator?
                </span>

                <Link
                  href="/#studio"
                  className="mt-2 block text-sm font-semibold"
                >
                  Protect your work →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-20 border-b border-stone-200 bg-sand/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
            >
              ⌕
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search token or creator..."
              className="h-12 w-full rounded-2xl border border-stone-200 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-stone-400 focus:border-leaf"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {filters.map((filter) => {
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
                      : "border border-stone-200 bg-white text-stone-600 hover:border-leaf hover:text-leaf"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-coral">
              Public gallery
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              Protected works
            </h2>
          </div>

          {!assets.isLoading &&
            !assets.isError && (
              <p className="text-xs text-stone-500">
                Showing{" "}
                <strong className="text-ink">
                  {filteredAssets.length}
                </strong>{" "}
                of {records.length} works
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
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        <div className="mx-auto max-w-7xl px-5 py-14 md:px-8">
          <div className="overflow-hidden rounded-[2rem] bg-leaf p-7 text-white md:p-10">
            <div className="grid gap-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
                  For creators
                </p>

                <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight">
                  Share the preview.
                  Keep control of the
                  original.
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-100">
                  Register provenance,
                  choose AI consent and
                  publish an experimental
                  protected preview through
                  Trovaya.
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
    </main>
  );
}

function ExploreHeader() {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-5 px-5 md:px-8">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-leaf"
        >
          Trovaya
          <span className="text-coral">
            .
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm md:flex">
          <Link
            href="/"
            className="text-stone-600 transition hover:text-leaf"
          >
            Home
          </Link>

          <Link
            href="/explore"
            className="font-semibold text-leaf"
          >
            Explore
          </Link>

          <Link
            href="/dashboard"
            className="text-stone-600 transition hover:text-leaf"
          >
            Dashboard
          </Link>
        </nav>

        <Link
          href="/#studio"
          className="inline-flex min-h-10 items-center rounded-xl bg-coral px-4 text-xs font-semibold text-white transition hover:bg-coral-dark sm:text-sm"
        >
          Protect a work
        </Link>
      </div>
    </header>
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

  return (
    <article className="group overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-200/60">
      <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
        {hasRealPreview ? (
          <Image
            unoptimized
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            src={`${gateway}/${asset.public_poisoned_cid}`}
            alt={`Protected work #${asset.token_id}`}
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-mint via-white to-stone-100 p-6 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-leaf text-lg font-bold text-white shadow-lg">
              TV
            </span>

            <strong className="mt-5 text-sm text-leaf">
              Protected preview
            </strong>

            <span className="mt-1 text-xs text-stone-500">
              Preview not persisted
            </span>
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-black/65 px-3 py-1.5 text-[10px] font-semibold text-white backdrop-blur-md">
            Experimental preview
          </span>
        </div>

        <div className="absolute bottom-3 left-3">
          <span
            className={`rounded-full px-3 py-1.5 text-[10px] font-bold backdrop-blur-md ${
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
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">
              Protected work #
              {asset.token_id}
            </h3>

            <p className="mt-1 truncate text-xs text-stone-500">
              by {creator}
            </p>
          </div>

          <span
            title="Creator provenance recorded"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mint text-xs text-leaf"
          >
            ✓
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-stone-100 pt-4">
          <div>
            <span className="block text-[10px] uppercase tracking-[0.1em] text-stone-400">
              License
            </span>

            <strong className="mt-1 block text-xs text-leaf">
              {fee}
            </strong>
          </div>

          <span className="rounded-full bg-stone-100 px-2.5 py-1.5 text-[10px] font-semibold text-stone-500">
            Chain {asset.chain_id}
          </span>
        </div>
      </div>
    </article>
  );
}

function StatCard({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <strong className="block text-2xl tracking-tight text-leaf">
        {value}
      </strong>

      <span className="mt-1 block text-xs text-stone-500">
        {label}
      </span>
    </div>
  );
}

function LoadingGallery() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({
        length: 8,
      }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white"
        >
          <div className="aspect-[4/5] animate-pulse bg-stone-200" />

          <div className="space-y-3 p-4">
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
    <div className="rounded-[2rem] border border-red-200 bg-red-50 px-6 py-12 text-center">
      <span className="text-3xl">
        ⚠
      </span>

      <h3 className="mt-4 text-lg font-semibold text-red-800">
        Gallery unavailable
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-red-700">
        Indexed public works could
        not be loaded. Protection
        actions remain separate from
        this gallery view.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[2rem] border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-mint text-xl font-bold text-leaf">
        TV
      </div>

      <h3 className="mt-5 text-xl font-semibold">
        The gallery is waiting for
        its first work.
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">
        Once a protected creation is
        indexed, its public preview
        can appear here.
      </p>

      <Link
        href="/#studio"
        className="mt-6 inline-flex rounded-xl bg-leaf px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
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
      <h3 className="text-lg font-semibold">
        No matching works
      </h3>

      <p className="mt-2 text-sm text-stone-500">
        Try another creator, token,
        or consent filter.
      </p>

      <button
        type="button"
        onClick={onReset}
        className="mt-5 rounded-xl bg-leaf px-5 py-2.5 text-sm font-semibold text-white"
      >
        Reset filters
      </button>
    </div>
  );
}