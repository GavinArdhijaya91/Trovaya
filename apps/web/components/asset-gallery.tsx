"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { formatEther } from "viem";
import { useAssets, type IndexedAsset } from "@/hooks/use-assets";
import { useLicenseActions } from "@/hooks/use-license-actions";
import { OperationStatus } from "@/components/operation-status";
import { verifyLicenseTermsJson, type VersionedLicenseTerms } from "@/lib/license-terms";
import { decryptVaultFile, deliverContentKey } from "@/lib/vault-client";
import { AssetReviewer } from "@/components/asset-reviewer";
import type { AssetReviewInput } from "@/lib/reviewer-types";

export function AssetGallery() {
  const assets = useAssets();
  return (
    <section className="mt-16" id="gallery">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold tracking-wider text-teal-700 uppercase">Galeri karya terproteksi</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-nusa-900">Eksplorasi karya terdaftar & terlindungi</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-nusa-600">
            Karya publik ditampilkan melalui preview terproteksi eksperimental. File asli kualitas penuh tetap terenkripsi di Vault dan tersedia setelah lisensi serta otorisasi terpisah.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-4 py-2 text-xs font-bold text-teal-900">
          <span className="inline-block h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
          On-chain provenance · BSC Testnet
        </div>
      </div>
      <div className="batik-divider mt-4" />
      <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
        <strong>DEMO HACKATHON:</strong> transaksi dan status identitas di galeri
        ini hanya untuk pengujian testnet. KYC belum diverifikasi secara produksi.
      </p>

      {assets.isLoading && (
        <div className="mt-8 rounded-2xl border border-nusa-200 bg-white p-12 text-center shadow-soft">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-nusa-600">Memuat karya terindeks dari jaringan…</p>
        </div>
      )}

      {assets.data?.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-nusa-200 bg-white p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 border border-teal-200 text-xl">🛡️</div>
          <h3 className="mt-4 text-lg font-bold text-nusa-900">Belum ada karya terindeks</h3>
          <p className="mt-2 text-sm text-nusa-600 max-w-md mx-auto">
            Daftarkan karya pertama Anda melalui Studio Proteksi. Event indexer akan memvalidasi transaksi on-chain dan menampilkannya di sini.
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {assets.data?.map((asset) => (
          <AssetCard key={`${asset.chain_id}:${asset.token_id}`} asset={asset} />
        ))}
      </div>
    </section>
  );
}

function AssetCard({ asset }: { asset: IndexedAsset }) {
  const license = useLicenseActions();
  const account = useAccount();
  const signer = useSignMessage();
  const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? "https://gateway.pinata.cloud/ipfs";
  const cid = asset.public_poisoned_cid;
  const isDemo = Boolean(cid?.startsWith("demo-"));
  const persistenceLabel = isDemo ? "DEMO ID · NOT IPFS" : cid ? "IPFS REFERENCE" : "NO PUBLIC REFERENCE";
  const [terms, setTerms] = useState<VersionedLicenseTerms>();
  const [termsError, setTermsError] = useState<string>();
  const [originalExtension, setOriginalExtension] = useState("png");
  const [qualityInfo, setQualityInfo] = useState<{
    width: number;
    height: number;
    aspectRatio: number;
    megapixels: number;
    sizeBytes: number;
    tier: string;
  }>();
  const [reviewInput, setReviewInput] = useState<AssetReviewInput>();
  const [deliveryState, setDeliveryState] = useState<"idle" | "pending" | "failed">("idle");
  const [deliveryError, setDeliveryError] = useState<string>();
  const [forceUnblurPreview, setForceUnblurPreview] = useState(false);

  const isUnlocked = license.unlockState.phase === "completed";
  const isPurchased = license.purchaseState.phase === "completed";

  useEffect(() => {
    let active = true;
    const reset = () => {
      if (!active) return;
      setTerms(undefined);
      setTermsError(undefined);
    };
    queueMicrotask(reset);
    if (!asset.license_terms_uri || !asset.license_terms_hash) {
      return () => { active = false; };
    }
    if (!asset.license_terms_uri.startsWith("ipfs://")) {
      queueMicrotask(() => {
        if (active) setTermsError("Terms demo belum dipersist ke IPFS.");
      });
      return () => { active = false; };
    }
    const controller = new AbortController();
    void fetch(`${gateway}/${asset.license_terms_uri.slice(7)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Dokumen terms tidak dapat dimuat.");
        return response.text();
      })
      .then((json) => {
        if (active) setTerms(verifyLicenseTermsJson(json, asset.license_terms_hash!));
      })
      .catch((caught: unknown) => {
        if (!(caught instanceof DOMException && caught.name === "AbortError")) {
          if (active) setTermsError(caught instanceof Error ? caught.message : "Terms gagal diverifikasi.");
        }
      });
    return () => { active = false; controller.abort(); };
  }, [asset.license_terms_hash, asset.license_terms_uri, gateway]);

  useEffect(() => {
    let active = true;
    if (!asset.token_uri?.startsWith("ipfs://")) return () => { active = false; };
    const controller = new AbortController();
    void fetch(`${gateway}/${asset.token_uri.slice(7)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Metadata karya tidak dapat dimuat.");
        return response.json() as Promise<{
          originalFile?: { extension?: string };
          encryptedVaultCid?: string;
          licenseTermsURI?: string;
          qualityPolicy?: {
            resolution?: { width?: number; height?: number };
            aspectRatio?: number;
            megapixels?: number;
            sizeBytes?: number;
            tier?: string;
          };
        }>;
      })
      .then((metadata) => {
        const extension = metadata.originalFile?.extension?.toLowerCase();
        if (active && extension && ["png", "jpg", "webp"].includes(extension)) setOriginalExtension(extension);
        const policy = metadata.qualityPolicy;
        if (
          active && policy?.resolution?.width && policy.resolution.height && policy.aspectRatio &&
          policy.megapixels !== undefined && policy.sizeBytes !== undefined && policy.tier
        ) {
          setQualityInfo({
            width: policy.resolution.width,
            height: policy.resolution.height,
            aspectRatio: policy.aspectRatio,
            megapixels: policy.megapixels,
            sizeBytes: policy.sizeBytes,
            tier: policy.tier,
          });
        }
        if (active) {
          setReviewInput({
            token_id: asset.token_id,
            persistence_mode: isDemo ? "demo" : cid ? "pinata" : "unknown",
            public_preview_cid: Boolean(cid && !isDemo),
            encrypted_vault_cid: Boolean(metadata.encryptedVaultCid),
            license_terms_cid: Boolean(metadata.licenseTermsURI?.startsWith("ipfs://")),
            preview_protection: "experimental",
            creator_identity: "not_verified",
            original_resolution: policy?.resolution?.width && policy.resolution.height
              ? { width: policy.resolution.width, height: policy.resolution.height }
              : undefined,
            original_size_bytes: policy?.sizeBytes,
            original_extension: extension && ["png", "jpg", "webp"].includes(extension)
              ? extension as "png" | "jpg" | "webp"
              : undefined,
            license: {
              terms_hash_verified: Boolean(asset.license_terms_hash && asset.license_terms_uri?.startsWith("ipfs://")),
              duration_days: asset.license_duration_seconds
                ? Math.max(1, Math.round(Number(asset.license_duration_seconds) / 86400))
                : undefined,
              allow_ai_training: asset.allow_ai_training,
            },
          });
        }
      })
      .catch(() => undefined);
    return () => { active = false; controller.abort(); };
  }, [
    asset.allow_ai_training,
    asset.license_duration_seconds,
    asset.license_terms_hash,
    asset.license_terms_uri,
    asset.token_id,
    asset.token_uri,
    cid,
    gateway,
    isDemo,
  ]);

  async function buy() {
    if (!asset.commercial_license_fee_wei || !asset.license_terms_hash || !asset.license_terms_version || !terms) return;
    await license.purchaseLicense(asset.token_id, asset.commercial_license_fee_wei, asset.license_terms_hash as `0x${string}`, asset.license_terms_version);
  }

  async function authorizeVault() {
    await license.authorizeOriginal(asset.token_id);
  }

  async function downloadOriginal() {
    if (!account.address) return;
    setDeliveryState("pending");
    setDeliveryError(undefined);
    try {
      const delivered = await deliverContentKey({
        walletAddress: account.address,
        tokenId: asset.token_id,
        signMessage: (message) => signer.signMessageAsync({ message })
      });
      if (delivered.encryptedVaultCid.startsWith("demo-")) {
        throw new Error("Encrypted original berstatus demo dan belum dipersist ke IPFS.");
      }
      const response = await fetch(`${gateway}/${delivered.encryptedVaultCid}`);
      if (!response.ok) throw new Error("Encrypted original tidak dapat diambil dari gateway IPFS.");
      const original = await decryptVaultFile(await response.arrayBuffer(), delivered.keyBase64);
      const url = URL.createObjectURL(original);
      const link = document.createElement("a");
      link.href = url;
      link.download = `trovaya-original-token-${asset.token_id}.${originalExtension}`;
      link.click();
      URL.revokeObjectURL(url);
      setDeliveryState("idle");
    } catch (caught) {
      setDeliveryState("failed");
      setDeliveryError(caught instanceof Error ? caught.message : "Original tidak dapat dikirim.");
    }
  }

  return (
    <article className="group overflow-hidden rounded-2xl border border-nusa-200 bg-white shadow-soft transition-all duration-300 hover:shadow-soft-md hover:border-teal-200">
      {/* Visual — preview terpoison, subtle batik overlay */}
      <div className="relative aspect-square w-full overflow-hidden bg-nusa-900">
        {cid && !isDemo ? (
          <>
            <Image
              unoptimized
              width={600}
              height={600}
              src={`${gateway}/${cid}`}
              alt={`Pratinjau karya terproteksi #${asset.token_id}`}
              className={`h-full w-full object-cover transition-all duration-500 ${
                isUnlocked || forceUnblurPreview ? "filter-none" : "filter blur-md scale-105"
              }`}
            />
            {/* Anti-Scraping Overlay Watermark when locked */}
            {!isUnlocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-6 text-center text-white backdrop-blur-[2px] transition-opacity">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-2xl shadow-lg">
                  🔒
                </div>
                <p className="mt-3 text-sm font-semibold tracking-wide uppercase text-amber-300">
                  Pratinjau Terproteksi
                </p>
                <p className="mt-1 text-xs text-white/90 leading-relaxed max-w-[240px]">
                  Preview terproteksi aktif. Detail resolusi tinggi tetap terkunci di Vault.
                </p>
                <button
                  type="button"
                  onClick={() => setForceUnblurPreview((prev) => !prev)}
                  className="mt-3 rounded-full bg-white/20 border border-white/30 px-3 py-1 text-[11px] font-medium text-white hover:bg-white/30 transition-colors"
                >
                  {forceUnblurPreview ? "Tampilkan Preview Terproteksi" : "Lihat Transformasi Preview"}
                </button>
              </div>
            )}
            {isUnlocked && (
              <div className="absolute top-3 right-3 rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md shadow-md flex items-center gap-1.5">
                <span>🔓</span> Lisensi Terbuka
              </div>
            )}
          </>
        ) : (
          <div className="grid h-full w-full place-items-center bg-amber-50/90 p-6 text-center text-sm font-medium text-amber-800">
            <div>
              <span className="text-3xl block mb-2">🧪</span>
              <strong className="block text-base">MODE DEMO</strong>
              <p className="text-xs text-amber-700 mt-1">Identifikasi pratinjau lokal non-IPFS</p>
            </div>
          </div>
        )}
      </div>

      {/* Details & Licensing Panel */}
      <div className="p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-800 tracking-wide">
            EXPERIMENTAL PREVIEW
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide border ${
              isDemo || !cid ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-teal-50 text-teal-900 border-teal-200"
            }`}
          >
            {persistenceLabel}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-nusa-900">Karya #{asset.token_id}</h3>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              asset.allow_ai_training
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-coral-soft text-coral-dark border border-coral-200"
            }`}
          >
            {asset.allow_ai_training ? "✓ AI Berlisensi" : "✕ Tanpa Pelatihan AI"}
          </span>
        </div>

        <p className="mt-2 truncate text-xs text-nusa-500 font-mono">
          Kreator: {asset.creator_wallet}
        </p>

        {qualityInfo && (
          <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50 p-3 text-[11px] text-nusa-700">
            <p className="font-bold text-teal-900">Spesifikasi original berlisensi</p>
            <p className="mt-1">
              {qualityInfo.width}×{qualityInfo.height}px · {qualityInfo.megapixels} MP · rasio {qualityInfo.aspectRatio}:1
            </p>
            <p className="mt-1">{formatBytes(qualityInfo.sizeBytes)} · tier {qualityInfo.tier}</p>
          </div>
        )}

        {reviewInput && <AssetReviewer input={reviewInput} />}

        <div className="mt-4 rounded-xl bg-nusa-50 p-3.5 border border-nusa-200">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-nusa-600">Biaya lisensi komersial</span>
            <span className="text-base font-bold text-nusa-900">
              {asset.commercial_license_fee_wei ? formatEther(BigInt(asset.commercial_license_fee_wei)) : "0.00"}{" "}
              <span className="text-xs font-semibold text-slate-500">{asset.chain_id === 97 ? "tBNB" : "ETH"}</span>
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            + Biaya Jaringan ikut estimasi dompet.{" "}
            <Link href={`/artwork/${asset.chain_id}/${asset.token_id}`} className="font-semibold text-leaf hover:underline">
              Lihat rincian
            </Link>
          </p>

          {terms ? (
            <div className="mt-2.5 border-t border-slate-200/60 pt-2 text-[11px] leading-relaxed text-slate-700">
              <p>
                <span className="font-semibold">Durasi:</span> {terms.durationDays} hari ·{" "}
                <span className="font-semibold">Wilayah:</span> {terms.territory}
              </p>
              <p className="truncate">
                <span className="font-semibold">Penggunaan:</span> {terms.permittedUse}
              </p>
              <p className="mt-1 font-mono text-[10px] text-slate-400 truncate">
                Hash: {asset.license_terms_hash}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-amber-800">
              {termsError ?? "Memverifikasi integritas dokumen lisensi on-chain…"}
            </p>
          )}
        </div>

        {/* Primary Action Flow */}
        <div className="mt-4 space-y-2">
          {!isPurchased && (
            <button
              onClick={buy}
              disabled={
                !license.isConfigured ||
                !terms ||
                !asset.license_terms_hash ||
                !asset.license_terms_version ||
                !["idle", "failed"].includes(license.purchaseState.phase)
              }
              className="w-full rounded-xl bg-teal-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {license.purchaseState.phase === "confirming"
                ? "Memproses di Blockchain…"
                : "Beli Lisensi & Buka Proteksi"}
            </button>
          )}

          <OperationStatus state={license.purchaseState} />

          {isPurchased && !isUnlocked && (
            <div className="space-y-2">
              <button
                onClick={authorizeVault}
                disabled={!license.isConfigured || !["idle", "failed"].includes(license.unlockState.phase)}
                className="w-full rounded-xl bg-nusa-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-black disabled:opacity-50 transition-colors"
              >
                {license.unlockState.phase === "confirming"
                  ? "Mencatat Otorisasi…"
                  : "Catat Otorisasi Vault"}
              </button>
              <p className="text-[11px] leading-relaxed text-amber-700 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/50">
                Otorisasi on-chain memvalidasi hak akses. Kunci dekripsi akan dibungkus secara aman oleh vault server.
              </p>
            </div>
          )}

          <OperationStatus state={license.unlockState} />

          {isUnlocked && (
            <button
              onClick={downloadOriginal}
              disabled={deliveryState === "pending" || !account.address}
              className="w-full rounded-xl bg-teal-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {deliveryState === "pending" ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Membuka Kunci & Mendekripsi…
                </>
              ) : (
                <>
                  <span>📥</span> Unduh File Asli Kualitas Penuh
                </>
              )}
            </button>
          )}

          {deliveryError && (
            <p role="alert" className="rounded-xl bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
              {deliveryError}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}
