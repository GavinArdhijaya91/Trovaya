"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { ProtectionForm } from "@/components/protection-form";
import { useAssets } from "@/hooks/use-assets";
import { getClientContractAddresses } from "@/lib/contracts";
import { useLicenseProceeds } from "@/hooks/use-license-proceeds";
import { OperationStatus } from "@/components/operation-status";
import { BnbTestnetBadge } from "@/components/bnb-network-badge";
import { AssetReviewer } from "@/components/asset-reviewer";
import type { AssetReviewInput } from "@/lib/reviewer-types";

type Tab = "overview" | "studio" | "assets" | "licenses" | "trust";

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
  { id: "overview",  label: "Ringkasan Finansial", icon: "📊", subtitle: "Saldo royalti & metrik karya" },
  { id: "studio",   label: "Lindungi Karya Baru",  icon: "🛡️", subtitle: "Upload gambar & tetapkan lisensi" },
  { id: "assets",   label: "Galeri Karya Saya",    icon: "🎨", subtitle: "Katalog aset terlindungi" },
  { id: "licenses", label: "Penjualan & Lisensi",  icon: "💰", subtitle: "Riwayat pembayaran pembeli" },
  { id: "trust",    label: "Profil Keamanan",      icon: "🔒", subtitle: "Status wallet & kepatuhan AI" },
];

export function CreatorDashboard(){
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const account = useAccount();
  const assets = useAssets();
  const records = assets.data ?? [];
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
    <div className="min-h-screen text-nusa-900 lg:grid lg:grid-cols-[280px_minmax(0,1fr)]" style={{ background: "#F1EFE8" }}>

      {/* SIDEBAR NAVIGATION (USER-FRIENDLY & ECONOMY FOCUSED) */}
      <aside className="border-b border-nusa-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:flex lg:flex-col shadow-sm">
        
        {/* Workspace Brand Head */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-nusa-100">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/trovaya-logo.svg" alt="Trovaya" width={28} height={28} />
            <span className="text-xl font-bold tracking-tight text-teal-900 font-sans">
              Trovaya<span className="text-coral">.</span>
            </span>
          </Link>
          <BnbTestnetBadge />
        </div>

        {/* User Account Card */}
        <div className="p-4 border-b border-nusa-100 bg-teal-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-teal-900 text-white grid place-items-center text-sm font-bold shadow-md">
              {account.address ? account.address.slice(2, 4).toUpperCase() : "👋"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-nusa-500">Akun Kreator</p>
              <p className="truncate text-xs font-bold text-nusa-900 font-mono mt-0.5">{shortAddress}</p>
            </div>
          </div>
          {account.isConnected && (
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-100/60 px-2.5 py-1 rounded-lg">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>Terhubung ke Jaringan BNB Chain</span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav aria-label="Menu Kreator" className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`interactive-tab w-full flex items-start gap-3 rounded-2xl p-3 text-left transition-all ${
                  isActive
                    ? "bg-teal-900 text-white shadow-soft-md"
                    : "text-nusa-700 hover:bg-nusa-100/80 hover:text-nusa-900"
                }`}
              >
                <span className="text-lg leading-none mt-0.5">{item.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold leading-tight">{item.label}</p>
                  <p className={`text-[11px] truncate mt-0.5 ${isActive ? "text-teal-200" : "text-nusa-500"}`}>
                    {item.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Help & Support Card */}
        <div className="p-4 m-3 rounded-2xl bg-nusa-50 border border-nusa-200 text-xs text-nusa-600">
          <p className="font-bold text-nusa-900">🛡️ Jaminan Keamanan Vault</p>
          <p className="mt-1 text-[11px] leading-relaxed text-nusa-500">
            Karya asli dienkripsi langsung di perangkat Anda sebelum diunggah.
          </p>
        </div>
      </aside>

      {/* MAIN WORKSPACE CONTENT */}
      <main className="min-w-0 flex flex-col">
        
        {/* Top App Header */}
        <header className="flex h-16 items-center justify-between border-b border-nusa-200 bg-white px-6 md:px-8">
          <div className="flex items-center gap-2 text-sm font-bold text-nusa-900">
            <span>{navItems.find((n) => n.id === activeTab)?.icon}</span>
            <span>{navItems.find((n) => n.id === activeTab)?.label}</span>
          </div>

          <div className="flex items-center gap-3">
            {activeTab !== "studio" && (
              <button
                type="button"
                onClick={() => setActiveTab("studio")}
                className="interactive-btn hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-teal-900 px-4 py-2 text-xs font-bold text-white shadow-soft-md hover:bg-teal-800"
              >
                <span>+</span> Lindungi Karya Baru
              </button>
            )}
            <ConnectButton
              label="Hubungkan Wallet"
              accountStatus="avatar"
              chainStatus="icon"
              showBalance={false}
            />
          </div>
        </header>

        {/* Tab Body Content */}
        <div className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">

          {/* ════════════ 01. RINGKASAN FINANSIAL (OVERVIEW) ════════════ */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              
              {/* Header Title & Action */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-nusa-200 pb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                    Dompet & Pendapatan Lisensi
                  </span>
                  <h1 className="text-3xl font-extrabold text-nusa-900 tracking-tight mt-3">
                    Ringkasan Royalti & Hak Cipta
                  </h1>
                  <p className="text-sm text-nusa-600 mt-1">
                    Semua transaksi lisensi komersial dikreditkan otomatis ke dompet Anda melalui smart contract BNB Chain.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("studio")}
                  className="interactive-btn rounded-xl bg-teal-900 px-5 py-2.5 text-xs font-bold text-white shadow-soft-md hover:bg-teal-800"
                >
                  + Upload Desain Baru
                </button>
              </div>

              {/* Highlight Financial Box (Real Balance & Withdraw) */}
              <div className="rounded-3xl border border-nusa-200 bg-white p-7 shadow-soft">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-800 uppercase tracking-wider">
                      <span>💰</span> Saldo Hasil Lisensi Tersedia
                    </div>
                    <div className="mt-3 flex items-baseline gap-3">
                      <span className="text-4xl font-extrabold text-nusa-900 font-mono">
                        {proceeds.isLoading ? "Memuat…" : formatEther(proceeds.amount)}
                      </span>
                      <span className="text-base font-bold text-teal-700">{chainLabel}</span>
                      <span className="text-sm text-nusa-500 font-medium">
                        (Estimasi ≈ Rp {estimatedIdr})
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-nusa-500 max-w-lg leading-relaxed">
                      Dana penjualan lisensi disimpan secara aman di kontrak pintar. Anda dapat menariknya ke dompet kapan saja tanpa potongan biaya platform tersembunyi.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void proceeds.withdraw().catch(() => undefined)}
                      disabled={!account.address || !proceeds.isConfigured || proceeds.amount === 0n || proceeds.state.phase === "awaiting_wallet" || proceeds.state.phase === "confirming"}
                      className="interactive-btn rounded-xl bg-teal-900 px-7 py-3 text-xs font-bold text-white shadow-soft-md disabled:opacity-40 hover:bg-teal-800"
                    >
                      Tarik Dana ke Dompet
                    </button>
                    <OperationStatus state={proceeds.state} />
                  </div>
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
                    <span>AI Scraper Diblokir</span>
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
                    <div className="py-8 text-center text-xs text-nusa-400">
                      Belum ada karya yang terdaftar.
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2.5">
                      {records.slice(0, 3).map((a) => (
                        <div key={`${a.chain_id}:${a.token_id}`} className="flex items-center justify-between p-3 rounded-2xl bg-nusa-50 text-xs">
                          <span className="font-bold text-nusa-900">Karya #{a.token_id}</span>
                          <span className={a.allow_ai_training ? "text-coral font-semibold" : "text-teal-900 font-semibold"}>
                            {a.allow_ai_training ? "✓ Izin AI" : "✕ Tanpa AI"}
                          </span>
                          <span className="font-bold text-nusa-800">
                            {a.commercial_license_fee_wei ? `${formatEther(BigInt(a.commercial_license_fee_wei))} BNB` : "Gratis"}
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
                  Upload file desain Anda. Sistem kami akan membuatkan preview anti-scraping dan mengunci file resolusi tinggi di dalam Vault terenkripsi.
                </p>
              </div>

              <div className="max-w-3xl">
                <ProtectionForm />
              </div>
            </div>
          )}

          {/* ════════════ 03. GALERI KARYA SAYA (ASSETS) ════════════ */}
          {activeTab === "assets" && (
            <div className="space-y-6">
              <div className="border-b border-nusa-200 pb-5 flex justify-between items-end">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                    Koleksi Saya
                  </span>
                  <h1 className="text-3xl font-extrabold text-nusa-900 tracking-tight mt-3">
                    Katalog Karya Terdaftar
                  </h1>
                </div>
                <span className="text-xs text-nusa-500 font-medium">
                  Total: {records.length} Karya
                </span>
              </div>

              {records.length === 0 ? (
                <div className="rounded-3xl border-2 border-dashed border-nusa-300 bg-white p-12 text-center">
                  <p className="font-bold text-base text-nusa-900">Belum ada karya yang terdaftar.</p>
                  <p className="text-xs text-nusa-500 mt-1">Mulai upload karya pertama Anda sekarang.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("studio")}
                    className="mt-4 rounded-xl bg-teal-900 px-5 py-2.5 text-xs font-bold text-white shadow-soft-md"
                  >
                    Buka Formulir Pendaftaran
                  </button>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {records.map((asset) => (
                    <div key={`${asset.chain_id}:${asset.token_id}`} className="rounded-3xl border border-nusa-200 bg-white p-5 shadow-soft">
                      <div className="flex items-center justify-between pb-3 border-b border-nusa-100">
                        <span className="font-bold text-sm text-nusa-900">Karya #{asset.token_id}</span>
                        <span className="text-[11px] bg-teal-100 text-teal-900 px-2.5 py-0.5 rounded-full font-bold">Terdaftar</span>
                      </div>
                      <div className="mt-4 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-nusa-500">Izin AI:</span>
                          <span className="font-semibold">{asset.allow_ai_training ? "Diizinkan" : "Ditolak"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-nusa-500">Biaya Lisensi:</span>
                          <span className="font-mono font-bold text-teal-900 text-sm">
                            {asset.commercial_license_fee_wei ? `${formatEther(BigInt(asset.commercial_license_fee_wei))} BNB` : "Gratis"}
                          </span>
                        </div>
                      </div>
                      <AssetReviewer input={buildReviewInput(asset)} />
                    </div>
                  ))}
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
                <strong>DEMO HACKATHON — TRANSAKSI TESTNET.</strong> Catatan lisensi,
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

        </div>
      </main>
    </div>
  );
}
