"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useAccount, useSignMessage } from "wagmi";
import { useRegisterIP } from "@/hooks/use-register-ip";
import { encryptOriginal } from "@/lib/client-encryption";
import { pinFile, pinJson } from "@/lib/ipfs-api";
import { contentUri, resolvePersistenceMode, type PersistenceMode } from "@/lib/persistence-mode";
import { createLicenseTerms } from "@/lib/license-terms";
import { registerContentKey } from "@/lib/vault-client";
import { protectImage, type PoisonResult } from "@/lib/poison-api";
import { OperationStatus } from "@/components/operation-status";
import { inspectAssetFile, type AssetQualityMetadata } from "@/lib/asset-quality";

export function ProtectionForm() {
  const [file, setFile] = useState<File>();
  const [quality, setQuality] = useState<AssetQualityMetadata>();
  const [intensity, setIntensity] = useState(0.35);
  const [allowAITraining, setAllowAITraining] = useState(false);
  const [licenseFee, setLicenseFee] = useState("0.01");
  const [durationDays, setDurationDays] = useState(365);
  const [territory, setTerritory] = useState("Global");
  const [permittedUse, setPermittedUse] = useState("Penggunaan komersial non-eksklusif");
  const [sublicensingAllowed, setSublicensingAllowed] = useState(false);
  const [result, setResult] = useState<PoisonResult>();
  const [persistenceMode, setPersistenceMode] = useState<PersistenceMode>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const registration = useRegisterIP();
  const account = useAccount();
  const signer = useSignMessage();
  const [keyDeliveryStatus, setKeyDeliveryStatus] = useState<"idle" | "registering" | "registered" | "unavailable">("idle");
  const [pendingKey, setPendingKey] = useState<{ tokenId: string; keyBase64: string }>();

  const [keyError, setKeyError] = useState<string>();
  async function completeKeyRegistration(key: { tokenId: string; keyBase64: string }) {
    if (!account.address) throw new Error("Wallet creator tidak lagi terhubung.");
    setKeyDeliveryStatus("registering");
    setKeyError(undefined);
    try {
      await registerContentKey({ walletAddress: account.address, tokenId: key.tokenId, contentKey: key.keyBase64, signMessage: (message) => signer.signMessageAsync({ message }) });
      setPendingKey(undefined);
      setKeyDeliveryStatus("registered");
    } catch (caught) {
      const msg = caught instanceof Error ? caught.message : String(caught);
      setKeyError(msg);
      console.error("[vault] registerContentKey failed:", msg);
      setKeyDeliveryStatus("unavailable");
      throw caught;
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setIsLoading(true);
    setError(undefined);
    setPersistenceMode(undefined);
    setKeyDeliveryStatus("idle");
    setPendingKey(undefined);
    try {
      const assetQuality = await inspectAssetFile(file);
      setQuality(assetQuality);
      const protectedImage = await protectImage(file, intensity);
      setResult(protectedImage);
      const [publicPin, encrypted] = await Promise.all([
        pinFile(dataUrlToBlob(protectedImage.poisoned_image_base64), `protected-${file.name}.png`),
        encryptOriginal(file),
      ]);
      const vaultPin = await pinFile(encrypted.encryptedBlob, `${file.name}.encrypted`);
      const terms = createLicenseTerms({ durationDays, territory, permittedUse, exclusive: false, sublicensingAllowed, allowAITraining });
      const termsPin = await pinFile(new Blob([terms.json], { type: "application/json" }), `${file.name}.license-v1.json`);
      const metadataPin = await pinJson({
        name: file.name,
        description: "Karya terdaftar melalui Trovaya dengan pratinjau proteksi eksperimental.",
        image: contentUri(publicPin),
        protectionMode: protectedImage.protection_mode,
        persistenceMode: resolvePersistenceMode([publicPin, vaultPin]),
        allowAITraining,
        qualityPolicy: {
          version: assetQuality.policyVersion,
          tier: assetQuality.tier,
          resolution: { width: assetQuality.width, height: assetQuality.height },
          aspectRatio: assetQuality.aspectRatio,
          megapixels: assetQuality.megapixels,
          sizeBytes: assetQuality.sizeBytes,
          mimeType: assetQuality.mimeType,
          fileExtension: assetQuality.fileExtension,
        },
        originalFile: {
          name: assetQuality.originalFileName,
          mimeType: assetQuality.mimeType,
          extension: assetQuality.fileExtension,
        },
        publicPoisonedCid: publicPin.cid,
        encryptedVaultCid: vaultPin.cid,
        licenseTermsURI: contentUri(termsPin),
        licenseTermsHash: terms.hash,
        licenseTermsVersion: terms.document.version,
        licenseDurationSeconds: terms.document.durationDays * 24 * 60 * 60,
      }, `${file.name}.metadata.json`);
      const finalPersistenceMode = resolvePersistenceMode([publicPin, vaultPin, termsPin, metadataPin]);
      setPersistenceMode(finalPersistenceMode);
      const minted = await registration.register({
        tokenUri: contentUri(metadataPin),
        allowAITraining,
        licenseFee,
        publicPoisonedCid: publicPin.cid,
        encryptedVaultCid: vaultPin.cid,
        royaltyBps: 500,
        licenseTermsUri: contentUri(termsPin),
        licenseTermsHash: terms.hash,
        licenseTermsVersion: terms.document.version,
        licenseDurationSeconds: terms.document.durationDays * 24 * 60 * 60,
      });
      if (account.address) {
        const key = { tokenId: minted.tokenId, keyBase64: encrypted.keyBase64 };
        setPendingKey(key);
        try {
          await completeKeyRegistration(key);
        } catch {
          // The short-lived key stays only in this mounted page for an explicit retry.
        }
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Pendaftaran belum dapat diselesaikan.");
    } finally {
      setIsLoading(false);
    }
  }

  return <form onSubmit={submit} className="rounded-3xl bg-white p-6 shadow-soft md:p-8">
    <div className="mb-6 flex items-center justify-between">
      <div><p className="text-sm font-semibold text-leaf">STUDIO PROTEKSI</p><h2 className="mt-1 text-2xl font-semibold">Daftarkan karya terlindungi</h2></div>
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">EXPERIMENTAL PREVIEW</span>
    </div>
    <div className="mb-6 grid gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900 sm:grid-cols-2">
      <p><strong>DEMO HACKATHON:</strong> transaksi memakai BSC Testnet dan belum merupakan layanan produksi.</p>
      <p><strong>IDENTITAS:</strong> KYC belum diverifikasi. Status creator dan karya tidak membuktikan keaslian atau hak cipta.</p>
    </div>
    <label className="block rounded-2xl border-2 border-dashed border-emerald-200 bg-mint/30 p-8 text-center">
      <span className="block font-medium">Pilih karya atau gambar produk</span>
      <span className="mt-1 block text-sm text-slate-500">PNG, JPG, atau WebP · maksimal 15 MiB · 512–8192 px · rasio 0,5–2:1</span>
      <input className="mt-4 block w-full text-sm" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setFile(event.target.files?.[0])} />
    </label>
    <label className="mt-6 block text-sm font-medium">Kekuatan proteksi: {Math.round(intensity * 100)}%
      <input className="mt-3 w-full accent-emerald-700" type="range" min="0" max="1" step="0.05" value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} />
    </label>
    <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
      Transformasi piksel ini adalah eksperimen demo, bukan Glaze/Nightshade dan belum terbukti mencegah scraping atau pelatihan AI.
    </p>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium">Biaya lisensi komersial
        <input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2" type="number" min="0.000001" step="0.001" value={licenseFee} onChange={(event) => setLicenseFee(event.target.value)} />
      </label>
      <label className="flex items-center gap-3 rounded-xl bg-sand px-4 py-3 text-sm font-medium"><input type="checkbox" checked={allowAITraining} onChange={(event) => setAllowAITraining(event.target.checked)} />Izinkan pelatihan AI berlisensi</label>
    </div>
    <fieldset className="mt-4 rounded-2xl border border-slate-200 p-4">
      <legend className="px-2 text-sm font-semibold">Persyaratan lisensi v1</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Durasi (hari)<input type="number" min="1" max="3650" value={durationDays} onChange={(event) => setDurationDays(Number(event.target.value))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" required /></label>
        <label className="text-sm">Wilayah<input value={territory} onChange={(event) => setTerritory(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" required /></label>
      </div>
      <label className="mt-3 block text-sm">Penggunaan/media yang diizinkan<input value={permittedUse} onChange={(event) => setPermittedUse(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" required /></label>
      <p className="mt-3 text-xs text-slate-600">Tipe: komersial · non-eksklusif · versi 1</p>
      <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={sublicensingAllowed} onChange={(event) => setSublicensingAllowed(event.target.checked)} />Izinkan sublicensing</label>
    </fieldset>
    <button className="mt-6 w-full rounded-xl bg-ink px-5 py-3 font-semibold text-white disabled:opacity-50" disabled={!file || isLoading || registration.isPending} type="submit">
      {isLoading || registration.isPending ? "Memproses pendaftaran…" : "Lindungi dan daftarkan karya"}
    </button>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <OperationStatus state={registration.state} />
    {registration.isConfirmed && <p className="mt-3 font-semibold text-leaf">Catatan provenance dan consent berhasil didaftarkan. Ini bukan penetapan hak cipta oleh Trovaya.</p>}
    {keyDeliveryStatus === "registering" && <p className="mt-3 rounded-xl bg-mint p-3 text-xs text-leaf">Menunggu signature creator untuk menyimpan content key secara terenkripsi…</p>}
    {keyDeliveryStatus === "registered" && <p className="mt-3 rounded-xl bg-mint p-3 text-xs text-leaf">Content key sudah dibungkus oleh secure vault dan dihapus dari state halaman.</p>}
    {keyDeliveryStatus === "unavailable" && pendingKey && <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
      <p>Pendaftaran on-chain berhasil, tetapi content key belum tersimpan. Key hanya berada di memori halaman ini; jangan tutup atau muat ulang sebelum retry berhasil.</p>
      {keyError && <p className="mt-2 rounded bg-white p-2 font-mono text-[11px] text-red-700 border border-amber-200">Detail: {keyError}</p>}
      <button type="button" onClick={() => void completeKeyRegistration(pendingKey).catch(() => undefined)} className="mt-2 rounded-lg bg-amber-800 px-3 py-2 font-semibold text-white">Retry secure key registration</button>
    </div>}
    {persistenceMode && <div className={`mt-4 rounded-xl p-3 text-sm ${persistenceMode === "pinata" ? "bg-mint text-leaf" : "bg-amber-50 text-amber-800"}`}>
      <strong>{persistenceMode === "pinata" ? "IPFS / Pinata tersimpan" : "MODE DEMO — belum tersimpan ke IPFS"}</strong>
      <p className="mt-1 text-xs leading-5">
        {persistenceMode === "pinata"
          ? "Pratinjau, original terenkripsi, dan metadata menerima referensi IPFS nyata."
          : "Identifier demo hanya untuk alur lokal dan tidak boleh digunakan sebagai bukti persistensi atau CID IPFS."}
      </p>
    </div>}
    {result && <div className="mt-6 grid gap-4 rounded-2xl bg-sand p-4 sm:grid-cols-[120px_1fr]">
      <Image unoptimized width={120} height={120} src={result.poisoned_image_base64} alt="Pratinjau eksperimental" className="aspect-square w-full rounded-xl object-cover" />
      <div className="min-w-0 self-center"><p className="font-semibold text-leaf">Pratinjau eksperimental siap</p><p className="mt-1 text-xs text-slate-600">Transformasi deterministik; efektivitas adversarial tidak diklaim.</p><p className="mt-1 truncate text-xs text-slate-500">Hash transformasi: {result.perturbation_hash}</p></div>
    </div>}
    {quality && <p className="mt-4 rounded-xl bg-mint p-3 text-xs leading-5 text-leaf">Quality policy v{quality.policyVersion}: {quality.width}×{quality.height}px · {quality.megapixels} MP · tier {quality.tier} · .{quality.fileExtension}</p>}
  </form>;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, encoded] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] ?? "application/octet-stream";
  const binary = atob(encoded);
  return new Blob([Uint8Array.from(binary, (character) => character.charCodeAt(0))], { type: mime });
}
