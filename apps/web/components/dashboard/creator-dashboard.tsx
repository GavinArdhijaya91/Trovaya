"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CustomConnectButton } from "@/components/custom-connect-button";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { ProtectionForm } from "@/components/protection-form";
import { useAssets } from "@/hooks/use-assets";
import { getClientContractAddresses } from "@/lib/contracts";
import { useLicenseProceeds } from "@/hooks/use-license-proceeds";
import { OperationStatus } from "@/components/operation-status";
import { AssetReviewer } from "@/components/asset-reviewer";
import type { AssetReviewInput } from "@/lib/reviewer-types";

type Tab = "overview" | "studio" | "assets" | "licenses" | "trust" | "reputation";

function buildReviewInput(asset: NonNullable<ReturnType<typeof useAssets>["data"]>[number]): AssetReviewInput {
  const isDemo = Boolean(asset.public_poisoned_cid?.startsWith("demo-"));
  return {
    token_id: asset.token_id,
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
}

const navItems: { id: Tab; label: string; icon: string; subtitle: string }[] = [
  { id: "overview",   label: "Dashboard",         icon: "▦",  subtitle: "Ringkasan & saldo" },
  { id: "assets",     label: "Aset Saya",         icon: "🎨", subtitle: "Katalog karya" },
  { id: "studio",     label: "Studio Proteksi",   icon: "🛡️", subtitle: "Upload & lisensi" },
  { id: "reputation", label: "Reputasi & Badge",  icon: "🏅", subtitle: "Status kredibilitas" },
  { id: "licenses",   label: "Aktivitas",         icon: "📑", subtitle: "Riwayat transaksi" },
  { id: "trust",      label: "Profil & KYC",      icon: "👤", subtitle: "Keamanan akun" },
];

export function CreatorDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const itemsPerPage = 6;

  const account = useAccount();
  const assets = useAssets();

  const records = assets.data ?? [];

  // Paginasi kembali ke halaman 1 saat tab atau jumlah karya berubah.
  // Penyesuaian dilakukan saat render (pola resmi React) supaya tidak ada
  // setState di dalam effect yang memicu render berantai dan gagal lint.
  const paginationKey = `${activeTab}:${records.length}`;
  const [pagination, setPagination] = useState({ key: paginationKey, page: 1 });
  if (pagination.key !== paginationKey) setPagination({ key: paginationKey, page: 1 });
  const currentPage = pagination.page;
  const setCurrentPage = (next: number | ((page: number) => number)) =>
    setPagination((current) => ({
      key: paginationKey,
      page: typeof next === "function" ? next(current.page) : next,
    }));

  const licensedForAI = records.filter((a) => a.allow_ai_training).length;
  const protectedFromAI = records.length - licensedForAI;
  const licenseReady = records.filter((a) => a.commercial_license_fee_wei).length;
  const contractsConfigured = Boolean(getClientContractAddresses());
  const proceeds = useLicenseProceeds();
  const shortAddress = account.address
    ? `${account.address.slice(0, 6)}…${account.address.slice(-4)}`
    : "Wallet Belum Terhubung";
  const chainLabel = process.env.NEXT_PUBLIC_CHAIN_ID === "97" ? "BNB" : "ETH";

  // Approximate IDR calculation for friendly visual representation
  const bnbAmount = parseFloat(formatEther(proceeds.amount || 0n));
  const estimatedIdr = (bnbAmount * 10000000).toLocaleString("id-ID");

  return (
    <div className="min-h-screen text-nusa-900" style={{ background: "#FDFCF7" }}>
      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* SIDEBAR — sample1 style: cream sidebar + active teal block */}
        <aside className="border-b border-nusa-200 bg-[#FDFCF7] lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:flex lg:flex-col">
          <div className="px-5 py-5 flex items-center gap-2.5 border-b border-nusa-200">
            <Image src="/trovaya-logo.svg" alt="Trovaya" width={28} height={28} />
            <div>
              <p className="text-sm font-bold tracking-tight text-teal-900 leading-none">
                Trovaya <span className="font-normal text-nusa-500 text-xs ml-1">IP PROTOCOL</span>
              </p>
               <p className="text-[11px] text-nusa-500">Trovaya Registry · Testnet</p>
            </div>
          </div>
          <div className="mx-3 mt-3 flex items-center justify-between rounded bg-nusa-100 px-3 py-1.5 text-[11px] font-bold text-nusa-600">
            <span className="text-teal-900">TROVAYA REGISTRY · TESTNET</span>
            <span className="text-teal-900">v2.4–BNB</span>
          </div>
          <nav aria-label="Menu Kreator" className="flex-1 p-3 space-y-1 overflow-y-auto mt-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-teal-900 text-white font-semibold shadow-sm"
                      : "text-nusa-700 hover:bg-white border border-transparent hover:border-nusa-200"
                  }`}
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  <span className="text-xs font-semibold">{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="p-3 border-t border-nusa-200 text-[11px] text-nusa-500 space-y-2">
            <p className="flex justify-between font-bold">
              NODE HEALTH <span className="text-teal-700">● Operational</span>
            </p>
            <p className="flex justify-between">
              Block Sync <span className="font-mono text-nusa-700">#38,912,401</span>
            </p>
            <p className="truncate font-mono text-[10px] leading-tight">{shortAddress}</p>

            <div className="pt-2 border-t border-nusa-200 space-y-1.5">
              <Link
                href="/marketplace"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-teal-900 px-3 py-2 text-xs font-bold text-white hover:bg-teal-800 transition"
              >
                <span>🏪</span>
                <span>Buka Marketplace</span>
              </Link>

              {account.address && (
                <Link
                  href={`/profile/${account.address}`}
                  className="flex items-center justify-center gap-1 text-[10px] font-semibold text-teal-800 hover:underline"
                >
                  <span>Lihat Profil Publik Saya ↗</span>
                </Link>
              )}
            </div>
          </div>
        </aside>

        {/* MAIN WORKSPACE CONTENT */}
        <main className="min-w-0 flex flex-col">
          {/* Top bar — search like sample1 */}
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-nusa-200 bg-white/90 backdrop-blur px-4 md:px-6">
            <div className="flex-1 max-w-xl flex items-center gap-2 rounded-lg bg-nusa-50 border border-nusa-200 px-3 py-2 text-sm text-nusa-500">
              <span>⌕</span>
               <input
                 placeholder="Cari aset IP, registrasi on-chain, sertifikat provenance..."
                 className="flex-1 bg-transparent outline-none text-xs placeholder:text-nusa-400"
               />
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-[11px] font-bold text-teal-900">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-700" /> BNB TESTNET
            </span>
            <span className="hidden lg:inline-flex items-center gap-1 rounded bg-nusa-50 border border-nusa-200 px-2 py-1 font-mono text-[11px] text-nusa-700">
              ⧉ {shortAddress.slice(0, 10)}…
            </span>
            <CustomConnectButton label="Masuk" accountStatus="avatar" chainStatus="icon" showBalance={false} />
          </header>

          {/* Tab Body Content — cream grid subtle */}
          <div className="relative p-6 md:p-6 max-w-7xl w-full mx-auto space-y-6">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.03]"
              aria-hidden="true"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #D3D1C7 1px, transparent 1px), linear-gradient(to bottom, #D3D1C7 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />

            {/* ════════════ 01. RINGKASAN FINANSIAL (OVERVIEW) ════════════ */}
            {activeTab === "overview" && (
              <div className="relative space-y-6">
                {/* Top stats — Total Karya + Saldo Lisensi in one white card */}
                <div className="rounded-xl border border-nusa-200 bg-white p-5 shadow-soft grid gap-6 md:grid-cols-[1fr_auto_1.2fr_auto] items-center">
                  <div className="border-r border-nusa-200 pr-6">
                    <p className="text-[11px] font-bold tracking-widest text-nusa-500 uppercase">Total Karya Terdaftar</p>
                    <div className="flex items-baseline gap-3 mt-1">
                      <span className="text-4xl font-extrabold text-nusa-900">{assets.isLoading ? "…" : records.length}</span>
                      <span className="rounded-full bg-teal-50 border border-teal-200 px-2.5 py-1 text-[11px] font-bold text-teal-800">
                        ↗ +2 bulan ini
                      </span>
                    </div>
                    <p className="text-xs text-nusa-500 mt-1">Token Standard ERC-721IP Terverifikasi</p>
                  </div>
                  <div className="hidden md:block w-px self-stretch bg-nusa-200" aria-hidden="true" />
                  <div>
                    <p className="text-[11px] font-bold tracking-widest text-nusa-500 uppercase">Saldo Lisensi (Dapat Ditarik)</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-extrabold text-nusa-900">Rp</span>
                      <span className="text-3xl font-extrabold text-nusa-900 font-mono">
                        {proceeds.isLoading ? "Memuat…" : estimatedIdr}
                      </span>
                    </div>
                    <p className="text-[11px] text-nusa-500 mt-1">
                      Smart Vault: ERC-2981 Settlement Pooling · ~{proceeds.isLoading ? "…" : formatEther(proceeds.amount)} {chainLabel}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void proceeds.withdraw().catch(() => undefined)}
                      disabled={
                        !account.address ||
                        !proceeds.isConfigured ||
                        proceeds.amount === 0n ||
                        proceeds.state.phase === "awaiting_wallet" ||
                        proceeds.state.phase === "confirming"
                      }
                      className="rounded-lg bg-teal-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-40"
                    >
                      ◧ Tarik Dana
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("studio")}
                      className="rounded-lg bg-teal-50 border border-teal-200 px-5 py-2 text-xs font-bold text-teal-900 hover:bg-teal-100"
                    >
                      ⊕ Daftarkan Karya Baru
                    </button>
                    <OperationStatus state={proceeds.state} />
                  </div>
                </div>

                {/* 4 Economic & Protection Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="interactive-card rounded-2xl border border-nusa-200 bg-white p-5 shadow-soft hover:shadow-soft-md hover:border-teal-200">
                    <div className="flex justify-between items-center text-xs font-semibold text-nusa-500">
                      <span>Total Karya Terlindungi</span>
                      <span className="text-xl">🖼️</span>
                    </div>
                    <p className="text-3xl font-extrabold text-teal-900 font-mono mt-2">
                      {assets.isLoading ? "..." : records.length}
                    </p>
                    <p className="text-xs text-nusa-500 mt-1">Aset terdaftar di blockchain</p>
                  </div>

                  <div className="interactive-card rounded-2xl border border-nusa-200 bg-white p-5 shadow-soft hover:shadow-soft-md hover:border-teal-200">
                    <div className="flex justify-between items-center text-xs font-semibold text-nusa-500">
                      <span>Lisensi Siap Jual</span>
                      <span className="text-xl">🏷️</span>
                    </div>
                    <p className="text-3xl font-extrabold text-teal-900 font-mono mt-2">
                      {assets.isLoading ? "..." : licenseReady}
                    </p>
                    <p className="text-xs text-nusa-500 mt-1">Dengan biaya komersial aktif</p>
                  </div>

                  <div className="interactive-card rounded-2xl border border-nusa-200 bg-white p-5 shadow-soft hover:shadow-soft-md hover:border-coral-200">
                    <div className="flex justify-between items-center text-xs font-semibold text-nusa-500">
                      <span>Izin AI Diberikan</span>
                      <span className="text-xl">🤖</span>
                    </div>
                    <p className="text-3xl font-extrabold text-coral font-mono mt-2">
                      {assets.isLoading ? "..." : licensedForAI}
                    </p>
                    <p className="text-xs text-nusa-500 mt-1">Karya berlisensi model AI</p>
                  </div>

                  <div className="interactive-card rounded-2xl border border-nusa-200 bg-white p-5 shadow-soft hover:shadow-soft-md hover:border-teal-200">
                    <div className="flex justify-between items-center text-xs font-semibold text-nusa-500">
                      <span>Preview Terproteksi</span>
                      <span className="text-xl">🔒</span>
                    </div>
                    <p className="text-3xl font-extrabold text-teal-900 font-mono mt-2">
                      {assets.isLoading ? "..." : protectedFromAI}
                    </p>
                    <p className="text-xs text-nusa-500 mt-1">Hanya pratinjau noise</p>
                  </div>
                </div>

                {/* Two Column Section: Consent Status & Quick Asset List */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* AI Consent Ratio Card */}
                  <div className="rounded-3xl border border-nusa-200 bg-white p-6 shadow-soft">
                    <h3 className="font-bold text-nusa-900 text-base">Distribusi Kebijakan AI Training</h3>
                    <p className="text-xs text-nusa-500 mt-1">
                      Persentase karya yang Anda izinkan vs tolak untuk pelatihan kecerdasan buatan.
                    </p>

                    <div className="mt-5 flex h-4 overflow-hidden rounded-full bg-nusa-100">
                      {records.length > 0 ? (
                        <>
                          <div className="bg-teal-900" style={{ width: `${(protectedFromAI / records.length) * 100}%` }} />
                          <div className="bg-coral" style={{ width: `${(licensedForAI / records.length) * 100}%` }} />
                        </>
                      ) : (
                        <div className="w-full bg-nusa-200" />
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs font-medium">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-teal-900" />
                        Tolak AI: {protectedFromAI} Karya
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-coral" />
                        Izinkan AI: {licensedForAI} Karya
                      </span>
                    </div>
                  </div>

                  {/* Quick Asset List */}
                  <div className="rounded-3xl border border-nusa-200 bg-white p-6 shadow-soft">
                    <div className="flex items-center justify-between pb-3 border-b border-nusa-100">
                      <h3 className="font-bold text-nusa-900 text-base">Karya Terdaftar Terkini</h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab("assets")}
                        className="text-xs font-bold text-teal-800 hover:underline"
                      >
                        Buka Semua →
                      </button>
                    </div>

                    {records.length === 0 ? (
                      <div className="py-8 text-center text-xs text-nusa-400">Belum ada karya yang terdaftar.</div>
                    ) : (
                      <div className="mt-3 space-y-2.5">
                        {records.slice(0, 3).map((a) => (
                          <div
                            key={`${a.chain_id}:${a.token_id}`}
                            className="flex items-center justify-between p-3 rounded-2xl bg-nusa-50 text-xs"
                          >
                            <span className="font-bold text-nusa-900">Karya #{a.token_id}</span>
                            <span className={a.allow_ai_training ? "text-coral font-semibold" : "text-teal-900 font-semibold"}>
                              {a.allow_ai_training ? "✓ Izin AI" : "✕ Tanpa AI"}
                            </span>
                            <span className="font-bold text-nusa-800">
                              {a.commercial_license_fee_wei
                                ? `${formatEther(BigInt(a.commercial_license_fee_wei))} BNB`
                                : "Gratis"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ════════════ 02. LINDUNGI KARYA BARU (STUDIO) ════════════ */}
            {activeTab === "studio" && (
              <div className="space-y-6">
                <div className="border-b border-nusa-200 pb-5">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                    Formulir Pendaftaran
                  </span>
                  <h1 className="text-3xl font-extrabold text-nusa-900 tracking-tight mt-3">
                    Lindungi & Daftarkan Desain Anda
                  </h1>
                  <p className="text-sm text-nusa-600 mt-1">
                    Upload file desain Anda. Sistem akan membuat preview terproteksi eksperimental dan menyimpan file resolusi tinggi di dalam Vault terenkripsi.
                  </p>
                </div>

                <div className="max-w-3xl">
                  <ProtectionForm />
                </div>
              </div>
            )}

            {/* ════════════ 03. GALERI KARYA SAYA (ASSETS) — Responsive Grid Gallery ════════════ */}
            {activeTab === "assets" && (
              <div className="relative space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-nusa-200 pb-4">
                  <div className="max-w-2xl">
                    <h1 className="text-2xl font-extrabold text-nusa-900 tracking-tight">Koleksi Karya Saya</h1>
                    <p className="text-xs text-nusa-500 mt-1">
                      Terpasang di Ledger BNB · Menampilkan {records.length} sertifikat IP terverifikasi
                    </p>
                  </div>
                  <div className="flex gap-1 rounded-lg bg-nusa-100 p-1 text-[11px] font-bold">
                    <span className="rounded bg-white border border-nusa-200 px-3 py-1 text-teal-900 shadow-sm">
                      Semua ({records.length})
                    </span>
                    <span className="px-3 py-1 text-nusa-600">Aktif Berlisensi ({licensedForAI})</span>
                    <span className="px-3 py-1 text-nusa-600">Belum Terjual ({protectedFromAI})</span>
                  </div>
                </div>

                {records.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-nusa-200 bg-white p-10 text-center">
                    <p className="font-bold text-nusa-900">Belum ada karya yang terdaftar.</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("studio")}
                      className="mt-3 rounded-lg bg-teal-900 px-5 py-2 text-xs font-bold text-white"
                    >
                      Buka Formulir Pendaftaran
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {records.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((asset) => (
                        <div
                          key={`${asset.chain_id}:${asset.token_id}`}
                          className="group relative rounded-2xl border border-nusa-200 bg-white overflow-hidden shadow-soft hover:shadow-md transition-all hover:border-teal-200"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden bg-nusa-100 border-b border-nusa-200">
                            <div
                              className="absolute inset-0 grid place-items-center text-[11px] font-bold text-nusa-500"
                              style={{ backgroundImage: "radial-gradient(circle, #D3D1C7 1.5px, transparent 1.5px)", backgroundSize: "10px 10px" }}
                            >
                              🔒 Pratinjau Terlindungi
                            </div>
                            <span className="absolute bottom-2 right-2 rounded bg-nusa-900 text-white text-[10px] px-1.5 py-0.5 font-medium">
                              PREVIEW EKSPERIMENTAL
                            </span>
                          </div>
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-bold text-nusa-900 text-sm leading-tight">Karya #{asset.token_id}</h3>
                              <span className="shrink-0 rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                                ● 2 Lisensi Terjual
                              </span>
                            </div>
                            <p className="mt-1.5 font-mono text-[10px] text-nusa-500 truncate">
                              Hash: {String(asset.license_terms_hash ?? "").slice(0, 16)}…
                            </p>
                            <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
                              <div className="flex flex-col">
                                <span className="text-nusa-400 uppercase text-[9px] font-bold tracking-wider">Royalti</span>
                                <span className="font-bold text-nusa-900">10% Sekunder</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-nusa-400 uppercase text-[9px] font-bold tracking-wider">AI Consent</span>
                                <span className={`font-bold ${asset.allow_ai_training ? "text-emerald-700" : "text-danger"}`}>
                                  {asset.allow_ai_training ? "Diizinkan" : "Dilarang"}
                                </span>
                              </div>
                            </div>
                            <div className="mt-5 flex gap-2">
                              <button className="flex-1 rounded-lg bg-nusa-50 border border-nusa-200 px-2 py-2 text-[11px] font-semibold text-nusa-700 hover:bg-white transition-colors">
                                🛡️ Detail
                              </button>
                              <button className="flex-1 rounded-lg bg-nusa-50 border border-nusa-200 px-2 py-2 text-[11px] font-semibold text-nusa-700 hover:bg-white transition-colors">
                                🔓 Vault
                              </button>
                            </div>
                            <div className="mt-4 pt-4 border-t border-nusa-100">
                              <AssetReviewer input={buildReviewInput(asset)} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {records.length > itemsPerPage && (
                      <div className="flex items-center justify-center gap-4 pt-4">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="rounded-lg border border-nusa-200 px-4 py-2 text-xs font-bold text-nusa-700 hover:bg-white disabled:opacity-30 transition-colors"
                        >
                          Sebelumnya
                        </button>
                        <span className="text-xs font-medium text-nusa-500">
                          Halaman {currentPage} dari {Math.ceil(records.length / itemsPerPage)}
                        </span>
                        <button
                          onClick={() => setCurrentPage((p) => p + 1)}
                          disabled={currentPage >= Math.ceil(records.length / itemsPerPage)}
                          className="rounded-lg border border-nusa-200 px-4 py-2 text-xs font-bold text-nusa-700 hover:bg-white disabled:opacity-30 transition-colors"
                        >
                          Berikutnya
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ════════════ 04. PENJUALAN & LISENSI (LICENSES) ════════════ */}
            {activeTab === "licenses" && (
              <div className="space-y-6">
                <div className="border-b border-nusa-200 pb-5">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                    Laporan Keuangan
                  </span>
                  <h1 className="text-3xl font-extrabold text-nusa-900 tracking-tight mt-3">
                    Riwayat Lisensi & Penjualan
                  </h1>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
                  <strong>DEMO HACKATHON TRANSAKSI TESTNET.</strong> Catatan lisensi,
                  royalti, withdrawal, dan vault di workspace ini belum merupakan
                  layanan produksi atau nasihat hukum/finansial.
                </div>

                <div className="rounded-3xl border border-nusa-200 bg-white p-8 text-center shadow-soft">
                  <span className="text-3xl block mb-2">📄</span>
                  <p className="font-bold text-nusa-900">Riwayat Penjualan Lisensi</p>
                  <p className="text-xs text-nusa-500 mt-1 max-w-md mx-auto leading-relaxed">
                    Setiap kali ada pembeli yang membeli lisensi komersial karya Anda, catatan pembayaran on-chain akan otomatis tampil di sini.
                  </p>
                </div>
              </div>
            )}

            {/* ════════════ 05. PROFIL KEAMANAN (TRUST) ════════════ */}
            {activeTab === "trust" && (
              <div className="space-y-6">
                <div className="border-b border-nusa-200 pb-5">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                    Keamanan & Kepatuhan
                  </span>
                  <h1 className="text-3xl font-extrabold text-nusa-900 tracking-tight mt-3">
                    Status Keamanan Akun
                  </h1>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-3xl border border-nusa-200 bg-white p-6 shadow-soft space-y-3 text-xs">
                    <p className="font-bold text-sm text-nusa-900">Pemeriksaan Keamanan</p>
                    <div className="flex justify-between py-2.5 border-b border-nusa-100">
                      <span className="text-nusa-600">Koneksi Dompet Web3:</span>
                      <span className="font-bold text-emerald-700">{account.isConnected ? "✓ Terhubung" : "Belum Terhubung"}</span>
                    </div>
                    <div className="flex justify-between py-2.5 border-b border-nusa-100">
                      <span className="text-nusa-600">Jaringan Blockchain:</span>
                      <span className="font-bold text-teal-900">{contractsConfigured ? "BNB Smart Chain Testnet" : "Mode Demo"}</span>
                    </div>
                    <div className="flex justify-between py-2.5 border-b border-nusa-100">
                      <span className="text-nusa-600">Verifikasi Dokumen UMKM:</span>
                      <span className="font-bold text-amber-700">Contoh / Sample Verifikasi</span>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 shadow-soft">
                    <p className="font-bold text-sm text-nusa-900">Catatan Penting AI & Hukum</p>
                    <p className="text-xs text-nusa-600 mt-2 mb-4 leading-relaxed">
                      Sesuai panduan PRD dan regulasi kepatuhan 2026, Trovaya menyajikan analisis data untuk tujuan edukasi. Trovaya membantu mencatat bukti klaim hak cipta, namun bukan pengganti lembaga peradilan atau penasihat hukum.
                    </p>
                    <AiDisclaimer />
                    <p className="mt-4 rounded-xl border border-amber-300 bg-amber-100 p-3 text-xs font-semibold leading-5 text-amber-900">
                      KYC saat ini hanya mock/not verified untuk kebutuhan demo.
                      Trovaya belum melakukan verifikasi identitas produksi.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════ 06. REPUTASI & BADGE (BARU) ════════════ */}
            {activeTab === "reputation" && (
              <div className="space-y-6">
                <div className="border-b border-nusa-200 pb-5">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                    Kredibilitas Protokol
                  </span>
                  <h1 className="text-3xl font-extrabold text-nusa-900 tracking-tight mt-3">
                    Reputasi & Lencana Kreator
                  </h1>
                  <p className="text-xs text-nusa-500 mt-1">
                    Bukti rekam jejak integritas hak cipta dan lisensi on-chain yang transparan.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Badge 1: Wallet Linked */}
                  <div
                    className={`rounded-3xl border p-5 shadow-soft transition ${
                      account.isConnected ? "border-emerald-200 bg-white" : "border-stone-200 bg-stone-50/70 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🔗</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          account.isConnected ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"
                        }`}
                      >
                        {account.isConnected ? "Aktif" : "Belum"}
                      </span>
                    </div>
                    <h3 className="mt-4 font-bold text-sm text-nusa-900">Wallet Terhubung</h3>
                    <p className="mt-1 text-xs text-nusa-600 leading-relaxed">
                      Identitas dompet Web3 telah terhubung ke node jaringan blockchain.
                    </p>
                  </div>

                  {/* Badge 2: On-chain Publisher */}
                  <div
                    className={`rounded-3xl border p-5 shadow-soft transition ${
                      records.length > 0 ? "border-emerald-200 bg-white" : "border-stone-200 bg-stone-50/70 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🎨</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          records.length > 0 ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"
                        }`}
                      >
                        {records.length > 0 ? `${records.length} Karya` : "0 Karya"}
                      </span>
                    </div>
                    <h3 className="mt-4 font-bold text-sm text-nusa-900">Penerbit IP On-Chain</h3>
                    <p className="mt-1 text-xs text-nusa-600 leading-relaxed">
                      Telah mencetak karya dengan hash metadata dan vault permanen di blockchain.
                    </p>
                  </div>

                  {/* Badge 3: Anti-Scraping Pioneer */}
                  <div
                    className={`rounded-3xl border p-5 shadow-soft transition ${
                      protectedFromAI > 0 ? "border-emerald-200 bg-white" : "border-stone-200 bg-stone-50/70 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🛡️</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          protectedFromAI > 0 ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"
                        }`}
                      >
                        {protectedFromAI > 0 ? "Aktif" : "Belum"}
                      </span>
                    </div>
                    <h3 className="mt-4 font-bold text-sm text-nusa-900">Pelindung Anti-AI</h3>
                    <p className="mt-1 text-xs text-nusa-600 leading-relaxed">
                      Menggunakan preview terproteksi eksperimental dan menampilkan preferensi pelatihan AI dari creator.
                    </p>
                  </div>

                  {/* Badge 4: SBT Coming Soon */}
                  <div className="rounded-3xl border border-dashed border-stone-300 bg-white/60 p-5 shadow-soft">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🏅</span>
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                        Riset v2
                      </span>
                    </div>
                    <h3 className="mt-4 font-bold text-sm text-nusa-900">Soulbound Token (SBT)</h3>
                    <p className="mt-1 text-xs text-nusa-600 leading-relaxed">
                       Lencana reputasi non-transferable on-chain yang terikat dengan identitas terverifikasi.
                    </p>
                  </div>
                </div>

                {/* Public Profile CTA Banner */}
                {account.address && (
                  <div className="rounded-3xl border border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-base text-teal-900">Halaman Profil Publik Kreator Anda</h3>
                      <p className="text-xs text-teal-700 mt-0.5">
                        Bagikan tautan profil publik ini kepada calon pembeli lisensi dan kurator.
                      </p>
                    </div>
                    <Link
                      href={`/profile/${account.address}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-teal-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition shrink-0"
                    >
                      <span>Buka Halaman Profil</span>
                      <span>↗</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}