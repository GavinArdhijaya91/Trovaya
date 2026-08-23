"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { formatEther } from "viem";
import { useAssets, type IndexedAsset } from "@/hooks/use-assets";
import { useLicenseActions } from "@/hooks/use-license-actions";
import { OperationStatus } from "@/components/operation-status";
import { verifyLicenseTermsJson, type VersionedLicenseTerms } from "@/lib/license-terms";
import { decryptVaultFile, deliverContentKey } from "@/lib/vault-client";

export function AssetGallery() {
  const assets = useAssets();
  return <section className="mt-16" id="gallery">
    <p className="text-sm font-semibold text-leaf">GALERI PRATINJAU EKSPERIMENTAL</p>
    <h2 className="mt-2 text-3xl font-semibold">Temukan karya dengan izin yang jelas</h2>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Pratinjau publik memakai transformasi eksperimental. Label persistensi membedakan aset IPFS nyata dari identifier demo.</p>
    {assets.isLoading && <p className="mt-6 text-slate-500">Memuat karya…</p>}
    {assets.data?.length === 0 && <p className="mt-6 rounded-2xl bg-white p-6 text-slate-500">Belum ada karya terindeks. Indexer akan menampilkan karya setelah pendaftaran dikonfirmasi.</p>}
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{assets.data?.map((asset) => <AssetCard key={`${asset.chain_id}:${asset.token_id}`} asset={asset} />)}</div>
  </section>;
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
  const [deliveryState, setDeliveryState] = useState<"idle" | "pending" | "failed">("idle");
  const [deliveryError, setDeliveryError] = useState<string>();

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
      const delivered = await deliverContentKey({ walletAddress: account.address, tokenId: asset.token_id, signMessage: (message) => signer.signMessageAsync({ message }) });
      if (delivered.encryptedVaultCid.startsWith("demo-")) throw new Error("Encrypted original belum dipersist ke IPFS.");
      const response = await fetch(`${gateway}/${delivered.encryptedVaultCid}`);
      if (!response.ok) throw new Error("Encrypted original tidak dapat diambil dari IPFS.");
      const original = await decryptVaultFile(await response.arrayBuffer(), delivered.keyBase64);
      const url = URL.createObjectURL(original);
      const link = document.createElement("a");
      link.href = url;
      link.download = `trovaya-original-${asset.token_id}`;
      link.click();
      URL.revokeObjectURL(url);
      setDeliveryState("idle");
    } catch (caught) {
      setDeliveryState("failed");
      setDeliveryError(caught instanceof Error ? caught.message : "Original tidak dapat dikirim.");
    }
  }

  return <article className="overflow-hidden rounded-3xl bg-white shadow-soft">
    {cid && !isDemo ? <Image unoptimized width={600} height={600} src={`${gateway}/${cid}`} alt="Pratinjau karya eksperimental" className="aspect-square w-full object-cover" /> : <div className="grid aspect-square place-items-center bg-amber-50 p-6 text-center text-sm font-medium text-amber-800">MODE DEMO<br />Tidak dipersist ke IPFS</div>}
    <div className="p-5"><div className="mb-3 flex flex-wrap gap-2"><span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">EXPERIMENTAL PREVIEW</span><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${isDemo || !cid ? "bg-amber-100 text-amber-800" : "bg-mint text-leaf"}`}>{persistenceLabel}</span></div><div className="flex justify-between gap-3"><strong>Karya #{asset.token_id}</strong><span className="rounded-full bg-mint px-2 py-1 text-xs text-leaf">{asset.allow_ai_training ? "AI berlisensi" : "Tanpa pelatihan AI"}</span></div>
      {cid && !isDemo && <p className="mt-2 text-xs leading-5 text-slate-500">Referensi mengikuti format IPFS, tetapi status pin tidak diverifikasi ulang oleh galeri.</p>}
      <p className="mt-2 truncate text-xs text-slate-500">Kreator: {asset.creator_wallet}</p>
      <p className="mt-4 text-sm">Lisensi: <strong>{asset.commercial_license_fee_wei ? formatEther(BigInt(asset.commercial_license_fee_wei)) : "Belum tersedia"} {asset.commercial_license_fee_wei ? (asset.chain_id === 97 ? "BNB" : "ETH") : ""}</strong></p>
      {terms ? <div className="mt-3 rounded-xl bg-sand p-3 text-xs leading-5"><strong>Terms v{asset.license_terms_version} · terverifikasi</strong><p>Durasi: {terms.durationDays} hari · Wilayah: {terms.territory}</p><p>Penggunaan: {terms.permittedUse}</p><p>Eksklusif: {terms.exclusive ? "Ya" : "Tidak"} · Sublicensing: {terms.sublicensingAllowed ? "Diizinkan" : "Tidak"}</p><p>Pelatihan AI: {terms.allowAITraining ? "Diizinkan" : "Tidak"}</p><p className="mt-1 break-all text-slate-500">Hash: {asset.license_terms_hash}</p></div> : <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">{termsError ?? "Memverifikasi dokumen terms sebelum pembelian…"}</p>}
      <button onClick={buy} disabled={!license.isConfigured || !terms || !asset.license_terms_hash || !asset.license_terms_version || !["idle", "failed"].includes(license.purchaseState.phase)} className="mt-4 w-full rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{license.purchaseState.phase === "completed" ? "Lisensi tercatat" : "Setujui terms terverifikasi dan beli"}</button>
      <OperationStatus state={license.purchaseState} />
      {license.purchaseState.phase === "completed" && <><button onClick={authorizeVault} disabled={!license.isConfigured || !["idle", "failed"].includes(license.unlockState.phase)} className="mt-2 w-full rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{license.unlockState.phase === "completed" ? "Otorisasi vault tercatat" : "Catat otorisasi vault"}</button><p className="mt-2 text-xs leading-5 text-amber-700">Otorisasi on-chain tidak mengirim key. Delivery berikutnya berhenti saat akses kedaluwarsa atau direvoke, tetapi plaintext yang sudah diunduh tidak dapat ditarik kembali.</p></>}
      <OperationStatus state={license.unlockState} />
      {license.unlockState.phase === "completed" && <button onClick={downloadOriginal} disabled={deliveryState === "pending" || !account.address} className="mt-2 w-full rounded-xl bg-leaf px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{deliveryState === "pending" ? "Memverifikasi dan membungkus key…" : "Verifikasi wallet dan unduh original"}</button>}
      {deliveryError && <p role="alert" className="mt-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">{deliveryError}</p>}
    </div>
  </article>;
}
