"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatEther } from "viem";
import { useAccount, useSignMessage } from "wagmi";

import { OperationStatus } from "@/components/operation-status";
import { CoPurchaseCard } from "@/components/co-purchase-card";
import { PurchaseCostBreakdown } from "@/components/purchase-cost-breakdown";
import { usePurchaseQuote } from "@/hooks/use-purchase-quote";
import { SiteHeader } from "@/components/site-header";
import { AssetReviewer } from "@/components/asset-reviewer";
import type { AssetReviewInput } from "@/lib/reviewer-types";
import {
  useAssets,
  type IndexedAsset,
} from "@/hooks/use-assets";
import { useLicenseActions } from "@/hooks/use-license-actions";
import {
  verifyLicenseTermsJson,
  type VersionedLicenseTerms,
} from "@/lib/license-terms";
import {
  readCircleIdLocal,
  recordCirclePurchase,
} from "@/lib/co-purchase";
import {
  decryptVaultFile,
  deliverContentKey,
} from "@/lib/vault-client";

function shortenAddress(address: string) {
  if (!address) {
    return "Unknown creator";
  }

  if (address.length <= 14) {
    return address;
  }

  return `${address.slice(0, 7)}…${address.slice(-5)}`;
}

function getChainLabel(chainId: number) {
  switch (chainId) {
    case 97:
      return "BSC Testnet";

    case 56:
      return "BNB Chain";

    case 1:
      return "Ethereum";

    case 11155111:
      return "Sepolia";

    default:
      return `Chain ${chainId}`;
  }
}

function getCurrency(chainId: number) {
  return chainId === 97 || chainId === 56
    ? "BNB"
    : "ETH";
}

function getLicensePrice(asset: IndexedAsset) {
  if (!asset.commercial_license_fee_wei) {
    return "Not currently listed";
  }

  try {
    return `${formatEther(
      BigInt(asset.commercial_license_fee_wei),
    )} ${getCurrency(asset.chain_id)}`;
  } catch {
    return "License available";
  }
}

export default function ArtworkDetailPage() {
  const params = useParams<{
    chainId: string;
    tokenId: string;
  }>();

  const assets = useAssets();
  const license = useLicenseActions();
  const account = useAccount();
  const signer = useSignMessage();

  const records = useMemo(
    () => assets.data ?? [],
    [assets.data],
  );

  const asset = useMemo(() => {
    return records.find(
      (record) =>
        String(record.chain_id) ===
          params.chainId &&
        String(record.token_id) ===
          params.tokenId,
    );
  }, [
    records,
    params.chainId,
    params.tokenId,
  ]);

  const reviewInput = useMemo<AssetReviewInput | null>(() => {
    if (!asset) return null;
    const isDemo = Boolean(asset.public_poisoned_cid?.startsWith("demo-"));
    return {
      token_id: String(asset.token_id),
      persistence_mode: isDemo ? "demo" : asset.public_poisoned_cid ? "pinata" : "unknown",
      public_preview_cid: Boolean(asset.public_poisoned_cid && !isDemo),
      encrypted_vault_cid: false,
      license_terms_cid: Boolean(asset.license_terms_uri?.startsWith("ipfs://")),
      preview_protection: "experimental",
      creator_identity: "unknown",
      license: {
        terms_hash_verified: Boolean(asset.license_terms_hash && asset.license_terms_uri?.startsWith("ipfs://")),
        duration_days: asset.license_duration_seconds
          ? Math.max(1, Math.round(Number(asset.license_duration_seconds) / 86400))
          : undefined,
        allow_ai_training: asset.allow_ai_training,
      },
    };
  }, [asset]);

  const gateway =
    process.env
      .NEXT_PUBLIC_IPFS_GATEWAY ??
    "https://gateway.pinata.cloud/ipfs";

  const [terms, setTerms] =
    useState<VersionedLicenseTerms>();

  const [termsError, setTermsError] =
    useState<string>();

  const [deliveryState, setDeliveryState] =
    useState<
      "idle" | "pending" | "failed"
    >("idle");

  const [deliveryError, setDeliveryError] =
    useState<string>();

  const licenseTermsUri =
    asset?.license_terms_uri;

  const licenseTermsHash =
    asset?.license_terms_hash;

  useEffect(() => {
    let active = true;

    const reset = () => {
      if (!active) {
        return;
      }

      setTerms(undefined);
      setTermsError(undefined);
    };

    queueMicrotask(reset);

    if (
      !licenseTermsUri ||
      !licenseTermsHash
    ) {
      return () => {
        active = false;
      };
    }

    if (
      !licenseTermsUri.startsWith(
        "ipfs://",
      )
    ) {
      queueMicrotask(() => {
        if (active) {
          setTermsError(
            "License terms have not been persisted to IPFS.",
          );
        }
      });

      return () => {
        active = false;
      };
    }

    const controller =
      new AbortController();

    void fetch(
      `${gateway}/${licenseTermsUri.slice(
        7,
      )}`,
      {
        signal: controller.signal,
      },
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            "License terms could not be loaded.",
          );
        }

        return response.text();
      })
      .then((json) => {
        if (!active) {
          return;
        }

        setTerms(
          verifyLicenseTermsJson(
            json,
            licenseTermsHash,
          ),
        );
      })
      .catch((caught: unknown) => {
        if (
          caught instanceof DOMException &&
          caught.name === "AbortError"
        ) {
          return;
        }

        if (active) {
          setTermsError(
            caught instanceof Error
              ? caught.message
              : "License terms could not be verified.",
          );
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    gateway,
    licenseTermsHash,
    licenseTermsUri,
  ]);

  const quote = usePurchaseQuote(
    asset?.token_id,
    asset?.commercial_license_fee_wei ?? undefined,
    account.address,
    (asset?.license_terms_hash as `0x${string}` | undefined) ?? undefined,
    asset?.license_terms_version ?? undefined,
  );

  const [circleRecord, setCircleRecord] = useState<"idle" | "recorded" | "failed">("idle");
  const recordAttemptedFor = useRef<string | null>(null);

  // Alur patungan end-to-end: purchase ketua sukses -> catat tx ke grup -> PURCHASED.
  useEffect(() => {
    const txHash = license.purchaseState.transactionHash;
    if (license.purchaseState.phase !== "completed" || !txHash || !account.address || !asset) return;
    const circleId = readCircleIdLocal(asset.chain_id, asset.token_id);
    if (!circleId || recordAttemptedFor.current === txHash) return;
    recordAttemptedFor.current = txHash;
    recordCirclePurchase(circleId, account.address, txHash).then(
      () => setCircleRecord("recorded"),
      () => {
        recordAttemptedFor.current = null;
        setCircleRecord("failed");
      },
    );
  }, [license.purchaseState.phase, license.purchaseState.transactionHash, account.address, asset]);

  async function buyLicense() {
    if (
      !asset ||
      !asset.commercial_license_fee_wei ||
      !asset.license_terms_hash ||
      !asset.license_terms_version ||
      !terms
    ) {
      return;
    }

    // Hardening: kontrak menuntut msg.value EXACT == fee on-chain.
    // Bila indexer basi, pakai harga rantai agar tidak revert InvalidLicenseFee.
    const feeWei =
      quote.chainFeeWei && quote.matches === false
        ? quote.chainFeeWei
        : asset.commercial_license_fee_wei;

    await license.purchaseLicense(
      asset.token_id,
      feeWei,
      asset.license_terms_hash as `0x${string}`,
      asset.license_terms_version,
    );
  }

  async function authorizeVault() {
    if (!asset) {
      return;
    }

    await license.authorizeOriginal(
      asset.token_id,
    );
  }

  async function downloadOriginal() {
    if (
      !asset ||
      !account.address
    ) {
      return;
    }

    setDeliveryState("pending");
    setDeliveryError(undefined);

    try {
      const delivered =
        await deliverContentKey({
          walletAddress:
            account.address,
          tokenId: asset.token_id,
          signMessage: (message) =>
            signer.signMessageAsync({
              message,
            }),
        });

      if (
        delivered.encryptedVaultCid.startsWith(
          "demo-",
        )
      ) {
        throw new Error(
          "Encrypted original has not been persisted to IPFS.",
        );
      }

      const response = await fetch(
        `${gateway}/${delivered.encryptedVaultCid}`,
      );

      if (!response.ok) {
        throw new Error(
          "Encrypted original could not be retrieved.",
        );
      }

      const original =
        await decryptVaultFile(
          await response.arrayBuffer(),
          delivered.keyBase64,
        );

      const url =
        URL.createObjectURL(original);

      const link =
        document.createElement("a");

      link.href = url;
      link.download = `trovaya-original-${asset.token_id}`;
      link.click();

      URL.revokeObjectURL(url);

      setDeliveryState("idle");
    } catch (caught) {
      setDeliveryState("failed");

      setDeliveryError(
        caught instanceof Error
          ? caught.message
          : "Original could not be delivered.",
      );
    }
  }

  if (assets.isLoading) {
    return (
      <main className="min-h-screen bg-sand text-ink">
        <SiteHeader />

        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
          <div className="grid animate-pulse gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="aspect-[4/5] rounded-[2rem] bg-stone-200" />

            <div className="space-y-5">
              <div className="h-4 w-32 rounded-full bg-stone-200" />
              <div className="h-12 w-3/4 rounded-xl bg-stone-200" />
              <div className="h-5 w-1/2 rounded-full bg-stone-200" />

              <div className="mt-8 h-64 rounded-[2rem] bg-stone-200" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (assets.isError) {
    return (
      <main className="min-h-screen bg-sand text-ink">
        <SiteHeader />

        <div className="mx-auto max-w-3xl px-5 py-24 text-center md:px-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-100 text-xl font-bold text-red-700">
            !
          </div>

          <h1 className="mt-6 text-3xl font-semibold">
            Artwork unavailable
          </h1>

          <p className="mt-3 text-sm leading-7 text-stone-500">
            Trovaya could not load the
            public gallery data required
            for this work.
          </p>

          <Link
            href="/explore"
            className="mt-7 inline-flex rounded-xl bg-leaf px-5 py-3 text-sm font-semibold text-white"
          >
            Back to Explore
          </Link>
        </div>
      </main>
    );
  }

  if (!asset) {
    return (
      <main className="min-h-screen bg-sand text-ink">
        <SiteHeader />

        <div className="mx-auto max-w-3xl px-5 py-24 text-center md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-coral">
            Artwork not found
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">
            This protected work is not
            in the current public index.
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-stone-500">
            The work may not exist,
            may not be public, or may
            fall outside the current
            indexed gallery window.
          </p>

          <Link
            href="/explore"
            className="mt-7 inline-flex rounded-xl bg-leaf px-5 py-3 text-sm font-semibold text-white"
          >
            Explore public works
          </Link>
        </div>
      </main>
    );
  }

  const cid =
    asset.public_poisoned_cid;

  const isDemo = Boolean(
    cid?.startsWith("demo-"),
  );

  const hasPreview =
    Boolean(cid) && !isDemo;

  const creator =
    shortenAddress(
      asset.creator_wallet,
    );

  const chain =
    getChainLabel(asset.chain_id);

  const price =
    getLicensePrice(asset);

  return (
    <main className="min-h-screen bg-sand text-ink">
      <SiteHeader />

      <section className="border-b border-stone-200">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 transition hover:text-leaf"
          >
            <span aria-hidden="true">
              ←
            </span>
            Back to Explore
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-10 md:px-8 md:py-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-start">
        <div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-100">
            {hasPreview ? (
              <Image
                unoptimized
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                src={`${gateway}/${cid}`}
                alt={`Protected work #${asset.token_id}`}
                className="object-cover"
              />
            ) : (
              <div className="relative flex h-full flex-col justify-between overflow-hidden bg-gradient-to-br from-mint via-[#faf9f5] to-[#e7e2d7] p-7">
                <div
                  aria-hidden="true"
                  className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[48px] border-leaf/5"
                />

                <div
                  aria-hidden="true"
                  className="absolute -bottom-16 -left-16 h-64 w-64 rotate-12 rounded-[4rem] bg-coral/10"
                />

                <div className="relative flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-leaf">
                    Trovaya protected preview
                  </span>

                  <span className="grid h-12 w-12 place-items-center rounded-full bg-leaf text-sm font-bold text-white">
                    TV
                  </span>
                </div>

                <div className="relative max-w-lg">
                  <div className="mb-6 h-px w-16 bg-coral" />

                  <h2 className="text-4xl font-semibold tracking-[-0.05em] text-leaf md:text-5xl">
                    Protected public
                    derivative.
                  </h2>

                  <p className="mt-5 max-w-md text-sm leading-7 text-stone-500">
                    The original remains
                    separate from this
                    public gallery
                    representation.
                  </p>
                </div>
              </div>
            )}

            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              <span
                className={`rounded-full px-3 py-2 text-[10px] font-semibold text-white backdrop-blur-md ${
                  asset.allow_ai_training
                    ? "bg-coral/90"
                    : "bg-leaf/90"
                }`}
              >
                {asset.allow_ai_training
                  ? "AI training licensed"
                  : "No AI training"}
              </span>

              <span className="rounded-full bg-black/60 px-3 py-2 text-[10px] font-semibold text-white backdrop-blur-md">
                Provenance recorded
              </span>
            </div>
          </div>

          <p className="mt-4 text-xs leading-6 text-stone-400">
            This view represents a
            creator-controlled public
            preview. Trovaya does not
            claim that publicly visible
            media can be made absolutely
            impossible to scrape.
          </p>
        </div>

        <div className="lg:sticky lg:top-28">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-coral">
            Protected creation
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] md:text-5xl">
            Protected work #
            {asset.token_id}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={`/profile/${asset.creator_wallet}`}
              title="View creator public profile"
              className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-medium text-stone-600 transition hover:bg-mint/40 hover:text-leaf"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-mint text-[10px] font-bold text-leaf">
                ✓
              </span>

              {creator}
            </Link>

            <span className="rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-500">
              {chain}
            </span>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <InfoCard
              label="Creator provenance"
              value="Recorded"
            />

            <InfoCard
              label="AI training"
              value={
                asset.allow_ai_training
                  ? "Licensed"
                  : "Not permitted"
              }
            />

            <InfoCard
              label="Commercial license"
              value={price}
            />

            <InfoCard
              label="Network"
              value={chain}
            />
          </div>

          <section className="mt-8 rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-leaf">
              Commercial licensing
            </p>

            <div className="mt-4 flex items-end justify-between gap-5">
              <div>
                <span className="text-xs text-stone-400">
                  Current terms
                </span>

                <strong className="mt-1 block text-2xl tracking-[-0.03em] text-ink">
                  {price}
                </strong>
              </div>

              {asset.license_terms_version && (
                <span className="rounded-full bg-mint px-3 py-1.5 text-[10px] font-semibold text-leaf">
                  Terms v
                  {asset.license_terms_version}
                </span>
              )}
            </div>

            {terms ? (
              <div className="mt-6 grid gap-3 rounded-[1.25rem] bg-sand p-4 text-xs">
                <TermRow
                  label="Duration"
                  value={`${terms.durationDays} days`}
                />

                <TermRow
                  label="Territory"
                  value={terms.territory}
                />

                <TermRow
                  label="Permitted use"
                  value={terms.permittedUse}
                />

                <TermRow
                  label="Exclusive"
                  value={
                    terms.exclusive
                      ? "Yes"
                      : "No"
                  }
                />

                <TermRow
                  label="Sublicensing"
                  value={
                    terms.sublicensingAllowed
                      ? "Allowed"
                      : "Not allowed"
                  }
                />

                <TermRow
                  label="AI training"
                  value={
                    terms.allowAITraining
                      ? "Allowed"
                      : "Not allowed"
                  }
                />

                <div className="border-t border-stone-200 pt-3">
                  <span className="block text-[10px] uppercase tracking-[0.12em] text-stone-400">
                    Verified terms hash
                  </span>

                  <code className="mt-1 block break-all text-[10px] leading-5 text-stone-500">
                    {asset.license_terms_hash}
                  </code>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-xl bg-amber-50 p-4 text-xs leading-6 text-amber-800">
                {termsError ??
                  "Verifying the license document before purchase…"}
              </div>
            )}

            <PurchaseCostBreakdown quote={quote} currency={getCurrency(asset.chain_id)} />

            <button
              type="button"
              onClick={buyLicense}
              disabled={
                !license.isConfigured ||
                !terms ||
                !asset.license_terms_hash ||
                !asset.license_terms_version ||
                ![
                  "idle",
                  "failed",
                ].includes(
                  license.purchaseState.phase,
                )
              }
              className="mt-6 w-full rounded-xl bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:bg-coral-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {license.purchaseState.phase ===
              "completed"
                ? "License recorded"
                : "Accept verified terms and purchase"}
            </button>

            <OperationStatus
              state={
                license.purchaseState
              }
            />

            <CoPurchaseCard
              chainId={asset.chain_id}
              tokenId={asset.token_id}
              feeWei={asset.commercial_license_fee_wei ?? undefined}
              currency={getCurrency(asset.chain_id)}
              quote={quote}
              onLeaderPurchase={buyLicense}
            />
            {circleRecord === "recorded" && (
              <p role="status" className="mt-2 rounded-xl bg-teal-50 p-3 text-xs font-medium text-teal-900">
                Pembayaran ketua tercatat — grup patungan lunas on-chain. Tagih iuran teman off-chain.
              </p>
            )}
            {circleRecord === "failed" && (
              <p role="alert" className="mt-2 rounded-xl bg-amber-50 p-3 text-xs font-medium text-amber-800">
                Lisensi terbayar, tapi bukti grup belum tercatat — muat ulang halaman untuk mencoba lagi.
              </p>
            )}

            {license.purchaseState.phase ===
              "completed" && (
              <>
                <button
                  type="button"
                  onClick={
                    authorizeVault
                  }
                  disabled={
                    !license.isConfigured ||
                    ![
                      "idle",
                      "failed",
                    ].includes(
                      license.unlockState
                        .phase,
                    )
                  }
                  className="mt-3 w-full rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {license.unlockState
                    .phase ===
                  "completed"
                    ? "Vault authorization recorded"
                    : "Authorize original access"}
                </button>

                <p className="mt-3 text-[11px] leading-5 text-amber-700">
                  On-chain authorization
                  does not itself deliver
                  the decryption key.
                  Access can expire or be
                  revoked before future
                  delivery, but plaintext
                  already downloaded
                  cannot be remotely
                  withdrawn.
                </p>
              </>
            )}

            <OperationStatus
              state={license.unlockState}
            />

            {license.unlockState.phase ===
              "completed" && (
              <button
                type="button"
                onClick={
                  downloadOriginal
                }
                disabled={
                  deliveryState ===
                    "pending" ||
                  !account.address
                }
                className="mt-3 w-full rounded-xl bg-leaf px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deliveryState ===
                "pending"
                  ? "Verifying wallet and wrapping key…"
                  : "Verify wallet and download original"}
              </button>
            )}

            {deliveryError && (
              <p
                role="alert"
                className="mt-3 rounded-xl bg-red-50 p-4 text-xs leading-6 text-red-700"
              >
                {deliveryError}
              </p>
            )}
          </section>

          <section className="mt-4 rounded-[1.5rem] border border-stone-200 bg-white p-5">
            <p className="text-xs font-semibold text-ink">
              Public reference
            </p>

            <div className="mt-4 space-y-3">
              <DataRow
                label="Token ID"
                value={String(
                  asset.token_id,
                )}
              />

              <DataRow
                label="Chain ID"
                value={String(
                  asset.chain_id,
                )}
              />

              <DataRow
                label="Creator wallet"
                value={
                  asset.creator_wallet
                }
              />

              <DataRow
                label="Preview status"
                value={
                  isDemo
                    ? "Demo reference"
                    : cid
                      ? "IPFS reference"
                      : "No public reference"
                }
              />
            </div>
          </section>

          {reviewInput && (
            <AssetReviewer input={reviewInput} />
          )}
        </div>
      </section>

      <footer className="mt-10 border-t border-stone-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-stone-500 md:flex-row md:items-center md:justify-between md:px-8">
          <span>
            Trovaya — creator
            provenance, consent, and
            licensing.
          </span>

          <Link
            href="/explore"
            className="font-semibold text-leaf"
          >
            Discover more works →
          </Link>
        </div>
      </footer>
    </main>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-stone-200 bg-white p-4">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
        {label}
      </span>

      <strong className="mt-2 block text-sm font-semibold text-leaf">
        {value}
      </strong>
    </div>
  );
}

function TermRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <span className="text-stone-500">
        {label}
      </span>

      <strong className="max-w-[60%] text-right font-semibold text-ink">
        {value}
      </strong>
    </div>
  );
}

function DataRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-t border-stone-100 pt-3 first:border-t-0 first:pt-0">
      <span className="block text-[10px] uppercase tracking-[0.12em] text-stone-400">
        {label}
      </span>

      <span className="mt-1 block break-all text-xs leading-5 text-stone-600">
        {value}
      </span>
    </div>
  );
}