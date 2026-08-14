"use client";

import Image from "next/image";
import { formatEther } from "viem";
import { useAssets, type IndexedAsset } from "@/hooks/use-assets";
import { useLicenseActions } from "@/hooks/use-license-actions";
import { OperationStatus } from "@/components/operation-status";

export function AssetGallery() {
  const assets = useAssets();
  return <section className="mt-16" id="gallery">
    <p className="text-sm font-semibold text-leaf">GALERI KARYA TERLINDUNGI</p>
    <h2 className="mt-2 text-3xl font-semibold">Temukan karya dengan izin yang jelas</h2>
    {assets.isLoading && <p className="mt-6 text-slate-500">Memuat karya…</p>}
    {assets.data?.length === 0 && <p className="mt-6 rounded-2xl bg-white p-6 text-slate-500">Belum ada karya terindeks. Indexer akan menampilkan karya setelah pendaftaran dikonfirmasi.</p>}
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{assets.data?.map((asset) => <AssetCard key={`${asset.chain_id}:${asset.token_id}`} asset={asset} />)}</div>
  </section>;
}

function AssetCard({ asset }: { asset: IndexedAsset }) {
  const license = useLicenseActions();
  const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? "https://gateway.pinata.cloud/ipfs";
  const cid = asset.public_poisoned_cid;
  const isDemo = cid?.startsWith("demo-");

  async function buy() {
    if (!asset.commercial_license_fee_wei) return;
    await license.purchaseLicense(asset.token_id, asset.commercial_license_fee_wei);
  }
  async function authorizeVault() {
    await license.authorizeOriginal(asset.token_id);
  }

  return <article className="overflow-hidden rounded-3xl bg-white shadow-soft">
    {cid && !isDemo ? <Image unoptimized width={600} height={600} src={`${gateway}/${cid}`} alt="Pratinjau karya terlindungi" className="aspect-square w-full object-cover" /> : <div className="grid aspect-square place-items-center bg-mint p-6 text-center text-sm text-leaf">Pratinjau demo tersimpan secara lokal</div>}
    <div className="p-5"><div className="flex justify-between gap-3"><strong>Karya #{asset.token_id}</strong><span className="rounded-full bg-mint px-2 py-1 text-xs text-leaf">{asset.allow_ai_training ? "AI berlisensi" : "Tanpa pelatihan AI"}</span></div>
      <p className="mt-2 truncate text-xs text-slate-500">Kreator: {asset.creator_wallet}</p>
      <p className="mt-4 text-sm">Lisensi: <strong>{asset.commercial_license_fee_wei ? formatEther(BigInt(asset.commercial_license_fee_wei)) : "—"} {asset.chain_id === 97 ? "BNB" : "ETH"}</strong></p>
      <button onClick={buy} disabled={!license.isConfigured || !["idle", "failed"].includes(license.purchaseState.phase)} className="mt-4 w-full rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{license.purchaseState.phase === "completed" ? "Lisensi tercatat" : "Beli lisensi komersial"}</button>
      <OperationStatus state={license.purchaseState} />
      {license.purchaseState.phase === "completed" && <button onClick={authorizeVault} disabled={!license.isConfigured || !["idle", "failed"].includes(license.unlockState.phase)} className="mt-2 w-full rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{license.unlockState.phase === "completed" ? "Akses original diizinkan" : "Buka akses original"}</button>}
      <OperationStatus state={license.unlockState} />
    </div>
  </article>;
}
