"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRegisterIP } from "@/hooks/use-register-ip";
import { encryptOriginal } from "@/lib/client-encryption";
import { pinFile, pinJson } from "@/lib/ipfs-api";
import { protectImage, type PoisonResult } from "@/lib/poison-api";

export function ProtectionForm() {
  const [file, setFile] = useState<File>();
  const [intensity, setIntensity] = useState(0.35);
  const [allowAITraining, setAllowAITraining] = useState(false);
  const [licenseFee, setLicenseFee] = useState("0.01");
  const [result, setResult] = useState<PoisonResult>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const registration = useRegisterIP();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setIsLoading(true);
    setError(undefined);
    try {
      const protectedImage = await protectImage(file, intensity);
      setResult(protectedImage);
      const [publicPin, encrypted] = await Promise.all([
        pinFile(dataUrlToBlob(protectedImage.poisoned_image_base64), `protected-${file.name}.png`),
        encryptOriginal(file),
      ]);
      const vaultPin = await pinFile(encrypted.encryptedBlob, `${file.name}.encrypted`);
      const metadataPin = await pinJson({
        name: file.name,
        description: "Karya terdaftar dan dilindungi melalui Trovaya.",
        image: `ipfs://${publicPin.cid}`,
        allowAITraining,
        publicPoisonedCid: publicPin.cid,
        encryptedVaultCid: vaultPin.cid,
      }, `${file.name}.metadata.json`);
      sessionStorage.setItem(`trovaya:vault-key:${vaultPin.cid}`, encrypted.keyBase64);
      await registration.register({
        tokenUri: `ipfs://${metadataPin.cid}`,
        allowAITraining,
        licenseFee,
        publicPoisonedCid: publicPin.cid,
        encryptedVaultCid: vaultPin.cid,
        royaltyBps: 500,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Pendaftaran belum dapat diselesaikan.");
    } finally {
      setIsLoading(false);
    }
  }

  return <form onSubmit={submit} className="rounded-3xl bg-white p-6 shadow-soft md:p-8">
    <div className="mb-6 flex items-center justify-between">
      <div><p className="text-sm font-semibold text-leaf">STUDIO PROTEKSI</p><h2 className="mt-1 text-2xl font-semibold">Daftarkan karya terlindungi</h2></div>
      <span className="rounded-full bg-mint px-3 py-1 text-xs font-medium text-leaf">Original dienkripsi</span>
    </div>
    <label className="block rounded-2xl border-2 border-dashed border-emerald-200 bg-mint/30 p-8 text-center">
      <span className="block font-medium">Pilih karya atau gambar produk</span>
      <span className="mt-1 block text-sm text-slate-500">PNG, JPG, atau WebP · maksimal 15 MB</span>
      <input className="mt-4 block w-full text-sm" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setFile(event.target.files?.[0])} />
    </label>
    <label className="mt-6 block text-sm font-medium">Kekuatan proteksi: {Math.round(intensity * 100)}%
      <input className="mt-3 w-full accent-emerald-700" type="range" min="0" max="1" step="0.05" value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} />
    </label>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium">Biaya lisensi komersial
        <input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2" type="number" min="0.000001" step="0.001" value={licenseFee} onChange={(event) => setLicenseFee(event.target.value)} />
      </label>
      <label className="flex items-center gap-3 rounded-xl bg-sand px-4 py-3 text-sm font-medium"><input type="checkbox" checked={allowAITraining} onChange={(event) => setAllowAITraining(event.target.checked)} />Izinkan pelatihan AI berlisensi</label>
    </div>
    <button className="mt-6 w-full rounded-xl bg-ink px-5 py-3 font-semibold text-white disabled:opacity-50" disabled={!file || isLoading || registration.isPending} type="submit">
      {isLoading || registration.isPending ? "Memproses pendaftaran…" : "Lindungi dan daftarkan karya"}
    </button>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {registration.error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">Akun belum memiliki izin operator pendaftaran atau transaksi ditolak.</p>}
    {registration.hash && <p className="mt-4 break-all rounded-xl bg-mint p-3 text-xs text-leaf">Bukti pendaftaran: {registration.hash}</p>}
    {registration.isConfirmed && <p className="mt-3 font-semibold text-leaf">Pendaftaran Hak Cipta Digital berhasil.</p>}
    {result && <div className="mt-6 grid gap-4 rounded-2xl bg-sand p-4 sm:grid-cols-[120px_1fr]">
      <Image unoptimized width={120} height={120} src={result.poisoned_image_base64} alt="Pratinjau terlindungi" className="aspect-square w-full rounded-xl object-cover" />
      <div className="min-w-0 self-center"><p className="font-semibold text-leaf">Pratinjau terlindungi siap</p><p className="mt-1 truncate text-xs text-slate-500">Bukti: {result.perturbation_hash}</p></div>
    </div>}
  </form>;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, encoded] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] ?? "application/octet-stream";
  const binary = atob(encoded);
  return new Blob([Uint8Array.from(binary, (character) => character.charCodeAt(0))], { type: mime });
}
