import Link from "next/link";
import Image from "next/image";
import { AssetGallery } from "@/components/asset-gallery";
import { IntroExperience } from "@/components/intro-experience";
import { WalletConnectedBanner } from "@/components/wallet-connected-banner";
import { BnbNetworkBadge } from "@/components/bnb-network-badge";
import { NewsletterForm } from "@/components/newsletter-form";
import { HelpTip } from "@/components/help-tip";
import { FaqAccordion } from "@/components/faq-accordion";
import { SmoothScrollProvider } from "@/components/smooth-scroll";
import { CustomConnectButton } from "@/components/custom-connect-button";

const masalah = [
  {
    icon: "🕸️",
    title: "Scraping tanpa izin",
    desc: "Karya di-upload ke medsos langsung diambil dataset AI tanpa persetujuan atau kompensasi. Kreator seperti Sarah kehilangan kendali.",
  },
  {
    icon: "🪞",
    title: "Paradoks transparansi IPFS",
    desc: "IPFS publik = transparan tapi sekaligus mengekspos file asli resolusi tinggi. Tanpa vault terenkripsi, transparansi jadi bumerang.",
  },
  {
    icon: "🧱",
    title: "Friksi Web3 untuk UMKM",
    desc: "Pak Budi paham batik, bukan gas fee. Istilah mint, sign, smart contract bikin onboarding terasa seperti ujian, bukan seperti aplikasi investasi biasa.",
  },
];

const pillars = [
  {
    kicker: "Pilar 1: Access",
    title: "Akses yang familiar",
    desc: "Masuk lewat wallet atau email OTP, tanpa jargon. Biaya transaksi dijelaskan sebagai biaya jaringan yang ringan di BSC Testnet.",
    href: "/dashboard",
  },
  {
    kicker: "Pilar 2: Own & Protect",
    title: "Miliki dan lindungi",
    desc: "Upload menjadi preview terpoison eksperimental untuk publik, lalu file asli terenkripsi di Vault. Lisensi on-chain mencatat provenance dan konsen.",
    href: "#cara-kerja",
  },

  {
    kicker: "Pilar 3: Understand",
    title: "Pahami, bukan dianjurkan",
    desc: "AI hanya menyajikan data verifikasi dan ringkasan edukatif. Tidak ada sinyal beli atau jual. Semua insight berlabel edukatif, bukan saran finansial atau hukum.",
    href: "#batasan",
  },
];

const comparisonRows = [
  { feature: "Perlindungan preview", trovaya: "Preview terpoison (violet badge), scraper lihat noise", biasa: "Tampil polos, mudah di-scrape", watermark: "Watermark bisa di-crop" },
  { feature: "Bukti konsen", trovaya: "Registrasi hash plus allowAITraining on-chain", biasa: "Hanya ToS platform", watermark: "Tidak ada bukti on-chain" },
  { feature: "Kontrol akses file asli", trovaya: "Vault terenkripsi, butuh otorisasi terpisah", biasa: "File asli ikut ter-publish", watermark: "File asli tetap terekspos" },
  { feature: "Royalti otomatis", trovaya: "ERC-2981, tarik manual ke wallet (BSC Testnet)", biasa: "Potongan platform 30-50%", watermark: "Tidak ada royalti" },
];

const steps = [
  { n: "01", title: "Upload karya", desc: "Pilih file PNG/JPG/WebP maks 15 MB.", maturity: "-" },
  { n: "02", title: "Protected Preview", desc: "Poison Engine buat versi terdistorsi untuk publik.", maturity: "Experimental" },
  { n: "03", title: "Encrypt & Mint", desc: "File asli dienkripsi di perangkat → simpan ke IPFS → registrasi hash di BSC Testnet.", maturity: "BSC Testnet" },
  { n: "04", title: "Beli Lisensi", desc: "Pembeli bayar biaya lisensi komersial (BNB Testnet).", maturity: "BSC Testnet" },
  { n: "05", title: "Vault Authorization", desc: "Otorisasi on-chain ≠ kunci dikirim. Kunci dibungkus vault setelah otorisasi.", maturity: "Terpisah" },
];

const personas = [
  { name: "Pak Budi", role: "Pemilik UMKM batik, skenario ilustratif", quote: "Saya mau motif batik saya tetap terlihat cantik di katalog, tapi tidak diambil bot AI diam-diam. Trovaya kasih preview yang indah, file asli tetap di vault." },
  { name: "Sarah", role: "Ilustrator digital, skenario ilustratif", quote: "Akhirnya saya bisa tentukan: karya ini boleh atau tidak untuk training AI. Lisensi jelas, hash-nya bisa dicek, royalti masuk wallet langsung." },
  { name: "Alex", role: "Developer AI etis, skenario ilustratif", quote: "Saya butuh dataset yang izinnya transparan. Di Trovaya saya cek allowAITraining dan hash terms sebelum pakai karya untuk training." },
];

const faqs = [
  { q: "Apakah gambar saya benar-benar aman dari AI scraper?", a: "Tidak ada jaminan mutlak. Perlindungan preview kami adalah transformasi eksperimental terukur. Scraper melihat noise, manusia tetap melihat bentuk. Namun belum memiliki benchmark tereproduksi dan bukan setara Glaze atau Nightshade. Keamanan penuh tetap butuh kontrol akses vault plus lisensi." },
  { q: "Apa bedanya lisensi dibeli vs akses vault diberikan?", a: "Dua status terpisah. Lisensi dibeli berarti transaksi on-chain tercatat. Akses vault berarti otorisasi plus pengiriman kunci terenkripsi oleh vault server. UI menampilkan keduanya sebagai langkah berbeda di stepper." },
  { q: "Apakah registrasi on-chain berarti hak cipta otomatis?", a: "Bukan. On-chain record adalah bukti provenance dan konsen yang bisa diverifikasi, bukan pernyataan hak cipta atau penegakan hukum otomatis." },
  { q: "Biaya transaksi mahal?", a: "Di BSC Testnet biaya transaksi sangat ringan (disebut juga gas fee di jaringan blockchain, dijelaskan via tooltip di dashboard). Penarikan royalti adalah aksi eksplisit, bukan auto-transfer." },
  { q: "Data di landing page ini real?", a: "Angka di stats strip jika ada adalah data testnet atau demo dan diberi label eksplisit. Jangan menganggapnya sebagai metrik produksi." },
];

export default function Home() {
  return (
    <SmoothScrollProvider>
      <div className="min-h-screen text-nusa-900" style={{ background: "#FDFCF7" }}>
      <IntroExperience />
      <WalletConnectedBanner />

      {/* NAV — sample2 compact, solid white, no translucency clash */}
      <header className="sticky top-0 z-40 h-16 border-b border-nusa-200 bg-white">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <Image src="/trovaya-logo.svg" alt="Trovaya logo" width={28} height={28} priority />
              <span className="text-lg font-bold tracking-tight text-teal-900 leading-none">Trovaya<span className="text-coral">.</span> <span className="ml-1 hidden sm:inline text-[10px] font-medium tracking-widest text-nusa-400">IP PROTOCOL</span></span>
            </Link>
            <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-nusa-600">
              <a href="#cara-kerja" className="hover:text-teal-900 transition-colors">Cara Kerja</a>
              <a href="#galeri" className="hover:text-teal-900 transition-colors">Marketplace</a>
              <a href="#batasan" className="hover:text-teal-900 transition-colors">Edukasi</a>
            </nav>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200 px-3 py-1.5 text-[11px] font-bold text-teal-900 leading-none">● BNB TESTNET</span>
            <Link href="/dashboard" className="inline-flex items-center justify-center rounded-lg bg-teal-900 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 transition-colors">Masuk</Link>
            <CustomConnectButton label="" accountStatus="avatar" chainStatus="icon" showBalance={false} />
          </div>
        </div>
      </header>

      {/* 1. HERO: sample2 — grid cream + dual preview card */}
      <section className="relative overflow-hidden border-b border-nusa-200 bg-[#FDFCF7] pt-12 md:pt-16 pb-14 md:pb-16">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden="true" style={{ backgroundImage: "linear-gradient(to right, #D3D1C7 1px, transparent 1px), linear-gradient(to bottom, #D3D1C7 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="mx-auto max-w-7xl px-5 md:px-8 relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-nusa-200 px-3.5 py-1.5 text-[11px] font-bold tracking-widest text-nusa-600">
              <span className="h-2 w-2 rounded-full bg-teal-700" /> PROTOKOL REGISTRASI & LISENSI IP DIGITAL
            </div>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-[3.6rem] font-extrabold tracking-tight text-nusa-900 leading-[1.08]">
              Karyamu Jadi Token.<br /> Aksesnya Kamu yang Atur.
            </h1>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/dashboard" className="interactive-btn inline-flex items-center gap-2 rounded-lg bg-teal-900 px-7 py-3 text-sm font-bold text-white shadow-soft hover:bg-teal-700">Daftarkan Karya Saya <span aria-hidden>→</span></Link>
              <a href="#cara-kerja" className="interactive-btn inline-flex items-center gap-2 rounded-lg border border-nusa-200 bg-white px-6 py-3 text-sm font-bold text-nusa-900 hover:bg-nusa-50">Lihat Alur Kerja <span aria-hidden>↗</span></a>
            </div>
            <p className="mt-3 text-xs text-nusa-500">Bukti provenance & konsen di BSC Testnet · <span className="rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 font-bold text-amber-800">Edukatif, bukan saran finansial/hukum</span></p>
          </div>

          {/* Dual preview card — presis seperti sample2, tanpa bentrok negative margin */}
          <div className="mx-auto mt-10 max-w-5xl rounded-2xl border border-nusa-200 bg-white p-4 sm:p-6 shadow-soft-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-nusa-50 border border-nusa-100 px-4 py-3 text-[11px]">
              <div className="flex items-center gap-4 font-semibold text-nusa-600">
                <span className="uppercase tracking-widest">Asset Protocol</span>
                <span className="font-mono text-nusa-900">TRV-ID-2025-0894</span>
                <span className="hidden sm:inline text-nusa-300">•</span>
                <span className="hidden sm:inline font-medium">Standard ERC-721IP • BNB Chain Ledger</span>
              </div>
              <span className="inline-flex items-center gap-1.5 font-semibold text-teal-900"><span className="grid h-5 w-5 place-items-center rounded-full bg-teal-50 border border-teal-200 text-[10px]">✓</span> DJKI Verified Registry</span>
            </div>
            <div className="relative mt-4 grid gap-4 md:grid-cols-2">
              {/* Left: Pratinjau Publik */}
              <div className="rounded-xl border border-nusa-200 bg-[#FAF9F5] p-3">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-nusa-200 px-2.5 py-1 text-nusa-700">🔒 PRATINJAU PUBLIK</span>
                  <span className="text-nusa-500 font-medium">Layer 01: Scramble Glaze</span>
                </div>
                <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-lg bg-nusa-100 border border-nusa-200">
                  <Image src="/assets/flower-photo.jpg" alt="Pratinjau terproteksi" fill className="object-cover opacity-90" sizes="50vw" />
                  <div className="absolute inset-0 backdrop-blur-[12px] bg-teal-900/10" />
                  <div className="absolute inset-0 opacity-20 parang-watermark" aria-hidden="true" />
                  <div className="absolute inset-0 grid place-items-center p-4">
                    <div className="rounded-xl bg-white/90 backdrop-blur border border-nusa-200 px-4 py-3 text-center shadow-soft">
                      <div className="mx-auto grid h-8 w-8 place-items-center rounded-lg bg-white border border-nusa-200 shadow-sm">🛡️</div>
                      <p className="mt-2 text-[11px] font-bold tracking-widest text-nusa-700">AI POISONING GLAZE</p>
                      <p className="text-[11px] font-medium text-nusa-500">SHA-256 Preview</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex justify-between text-[11px] font-medium">
                  <span className="text-nusa-600">Status: Terkunci • Resolusi Rendah</span>
                  <span className="text-danger font-semibold">● Watermark Aktif</span>
                </div>
              </div>
              {/* Center connector — absolute, tidak pakai negative margin */}
              <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 md:flex">
                <span className="rounded-full bg-teal-900 px-3.5 py-1.5 text-[11px] font-bold text-white shadow-soft-md border border-teal-700">TOKEN LISENSI →</span>
              </div>
              {/* Right: Akses Token Aktif */}
              <div className="rounded-xl border border-nusa-200 bg-[#FAF9F5] p-3">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200 px-2.5 py-1 text-teal-900">🔓 AKSES TOKEN AKTIF</span>
                  <span className="text-nusa-500 font-medium">Vault Validated #9102</span>
                </div>
                <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-lg bg-white border border-nusa-200">
                  <Image src="/assets/flower-photo.jpg" alt="Original master clear" fill className="object-cover" sizes="50vw" />
                  <div className="absolute right-2 top-2 rounded-md bg-white border border-nusa-200 px-2.5 py-1 text-[11px] font-bold text-nusa-700 shadow-soft flex items-center gap-1.5"><span className="grid h-3.5 w-3.5 place-items-center rounded-full border border-teal-600 text-[8px]">✓</span> Original 4K Master</div>
                </div>
                <div className="mt-3 flex justify-between text-[11px] font-medium">
                  <span className="text-nusa-600">Status: Vault Terbuka • IPFS CID Decrypted</span>
                  <span className="text-teal-700 font-semibold">● Lisensi Penuh</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3 text-xs leading-relaxed border-t border-nusa-200/60 pt-8">
            <div className="flex gap-3"><span className="grid h-7 w-7 place-items-center rounded bg-teal-50 border border-teal-200 text-teal-900 shrink-0">🏛</span><div><p className="font-bold text-nusa-900">Bukti Kepemilikan On-Chain</p><p className="text-nusa-600 mt-1">Pencatatan kepemilikan definitif bersertifikasi di BNB Chain ledger yang sah secara yuridis.</p></div></div>
            <div className="flex gap-3"><span className="grid h-7 w-7 place-items-center rounded bg-teal-50 border border-teal-200 text-teal-900 shrink-0">🛡️</span><div><p className="font-bold text-nusa-900">Preview Aman dari AI Scraping</p><p className="text-nusa-600 mt-1">Teknologi watermarking dan perturbasi neural memproteksi karya dari pencurian model generatif.</p></div></div>
            <div className="flex gap-3"><span className="grid h-7 w-7 place-items-center rounded bg-teal-50 border border-teal-200 text-teal-900 shrink-0">📄</span><div><p className="font-bold text-nusa-900">Lisensi Transparan</p><p className="text-nusa-600 mt-1">Hak komersial, derivatif, dan royalti diatur otomatis via smart contract berstandar global.</p></div></div>
          </div>
        </div>
      </section>

      {/* 2. MASALAH: 3 kartu PRD 2.1 — dengan batik divider */}
      <section id="masalah" className="py-16 md:py-20 border-b border-nusa-200 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 batik-parang opacity-40" aria-hidden="true" />
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">Masalah nyata</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-nusa-900">Kenapa karya butuh perlindungan baru</h2>
            <p className="mt-3 text-sm text-nusa-600">Tiga pola yang kami temui dari UMKM & kreator, diadaptasi dari PixelWhisk problem-cards, isi sepenuhnya Trovaya.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {masalah.map((m) => (
              <div key={m.title} className="rounded-2xl border border-nusa-200 bg-white p-6 shadow-soft">
                <span className="text-3xl">{m.icon}</span>
                <h3 className="mt-3 text-lg font-bold text-nusa-900">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-nusa-600">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. 3-PILLAR */}
      <section id="pilar" className="py-16 md:py-20 border-b border-nusa-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">Solusi 3 pilar, MASTER_SPEC §2</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-nusa-900">Access · Own & Protect · Understand</h2>
            <p className="mt-2 text-sm text-nusa-600">Tiga pilar saja, tidak ditambah. Setiap pilar = satu janji yang bisa diverifikasi.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {pillars.map((p) => (
              <Link key={p.title} href={p.href} className="interactive-card rounded-2xl border border-nusa-200 bg-nusa-50/50 p-6 shadow-soft hover:shadow-soft-md hover:bg-white">
                <p className="text-xs font-bold tracking-wider text-teal-700 uppercase">{p.kicker}</p>
                <h3 className="mt-2 text-lg font-bold text-nusa-900">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-nusa-600">{p.desc}</p>
                <span className="mt-4 inline-flex text-xs font-bold text-teal-900">Pelajari →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. TABEL PERBANDINGAN */}
      <section id="perbandingan" className="py-16 md:py-20 border-b border-nusa-200">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">Perbandingan jujur</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-nusa-900">Trovaya vs cara lama</h2>
            <p className="mt-2 text-sm text-nusa-600">Baris sesuai skill: Perlindungan preview · Bukti konsen · Kontrol akses · Royalti otomatis</p>
          </div>
          <div className="mt-10 overflow-hidden rounded-2xl border border-nusa-200 shadow-soft bg-white">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-nusa-50 text-xs font-semibold uppercase tracking-wider text-nusa-600 border-b border-nusa-200">
                  <th className="p-4">Fitur</th>
                  <th className="p-4 bg-teal-900 text-white">Trovaya Protocol</th>
                  <th className="p-4">Upload biasa ke medsos/IPFS publik</th>
                  <th className="p-4">Watermark manual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nusa-100">
                {comparisonRows.map((r) => (
                  <tr key={r.feature} className="hover:bg-nusa-50/50">
                    <td className="p-4 font-bold text-nusa-900">{r.feature}</td>
                    <td className="p-4 font-semibold text-teal-900 bg-teal-50/40 border-x border-teal-100">✓ {r.trovaya}</td>
                    <td className="p-4 text-xs text-nusa-600">{r.biasa}</td>
                    <td className="p-4 text-xs text-nusa-600">{r.watermark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. STEPPER GOLDEN-PATH */}
      <section id="cara-kerja" className="py-16 md:py-20 border-b border-nusa-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">Golden path P0, BSC Testnet</span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-nusa-900">Dari upload ke vault dalam 5 langkah</h2>
              <p className="mt-2 text-sm text-nusa-600">Progress terlihat. Lisensi dibeli dan vault diotorisasi adalah dua status terpisah.</p>
            </div>
            <span className="rounded-full bg-white border border-nusa-200 px-3 py-1 text-xs font-bold text-nusa-700">Jaringan: BSC Testnet <HelpTip>Jaringan blockchain untuk registrasi hash, bukan mainnet produksi</HelpTip></span>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-5">
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-2xl border border-nusa-200 bg-nusa-50/50 p-5">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-teal-900 text-white text-xs font-bold">{s.n}</span>
                  <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">{s.maturity}</span>
                </div>
                <h3 className="mt-3 text-sm font-bold text-nusa-900">{s.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-nusa-600">{s.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-nusa-500">Simpan Karya ke Buku Besar Digital <HelpTip>mint NFT / registrasi on-chain</HelpTip> · Tanda Tangan Persetujuan <HelpTip>wallet signature / EIP-712</HelpTip> · Biaya Transaksi <HelpTip>disebut juga gas fee</HelpTip></p>
        </div>
      </section>

      {/* 6. BATASAN KAMI */}
      <section id="batasan" className="py-16 md:py-20 border-b border-nusa-200 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 parang-watermark opacity-30" aria-hidden="true" />
        <div className="mx-auto max-w-7xl px-5 md:px-8 relative">
          <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50/60 p-8 shadow-soft">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-white border border-amber-200 px-3 py-1 rounded-full">Batasan Kami, kejujuran eksplisit</span>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-nusa-900">Yang belum kami janjikan</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-nusa-700 list-disc pl-5">
              <li><strong>Preview terpoison = eksperimental</strong>, bukan Glaze/Nightshade. Transformasi terukur, belum ada benchmark tereproduksi.</li>
              <li><strong>Mock KYC ber-watermark SAMPLE/CONTOH</strong>, bukan verifikasi identitas asli, tidak bisa dihilangkan saat hover/zoom.</li>
              <li><strong>On-chain record ≠ bukti hukum otomatis.</strong> Hanya bukti provenance & konsen yang bisa diverifikasi.</li>
              <li><strong>Otorisasi vault ≠ kunci dikirim.</strong> Kunci dibungkus vault server setelah otorisasi tercatat.</li>
              <li>Semua transaksi di <strong>BSC Testnet</strong>, bukan mainnet produksi.</li>
            </ul>
            <p className="mt-4 text-xs text-nusa-600">Nada kami transparan, protektif, tidak berlebihan, sesuai PRD §9 risiko High jika over-promising.</p>
          </div>
        </div>
      </section>

      {/* 7. GALERI */}
      <section id="galeri" className="py-16 md:py-20 border-b border-nusa-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white border border-nusa-200 px-3 py-1 text-xs font-medium text-nusa-700">Galeri, asimetris per state <HelpTip>Setiap karya punya state berbeda: Public/Poisoned · Licensed/Clear · Vault-Locked</HelpTip></div>
          <AssetGallery />
          <p className="mt-4 text-xs text-nusa-500">Setiap kartu auditor wajib berlabel: <span className="rounded bg-amber-100 border border-amber-200 px-2 py-0.5 text-amber-800 font-bold">Edukatif, bukan saran finansial/hukum</span>, tidak ada sinyal beli/jual.</p>
        </div>
      </section>

      {/* 8. PERSONA SPOTLIGHT */}
      <section className="py-16 md:py-20 border-b border-nusa-200">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">Persona, skenario ilustratif</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-nusa-900">Bukan testimoni asli</h2>
            <p className="mt-2 text-sm text-nusa-600">Kutipan bergaya persona, jelas diberi label ilustratif, bukan nama klien palsu.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {personas.map((p) => (
              <div key={p.name} className="rounded-2xl border border-nusa-200 bg-white p-6 shadow-soft">
                <p className="text-sm leading-relaxed text-nusa-700 italic">“{p.quote}”</p>
                <p className="mt-4 text-sm font-bold text-nusa-900">{p.name}</p>
                <p className="text-xs text-nusa-500">{p.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FAQ */}
      <section className="py-16 md:py-20 border-b border-nusa-200 bg-white">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">FAQ</span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-nusa-900">Pertanyaan yang sering ditanyakan</h2>
          <div className="mt-8">
            <FaqAccordion faqs={faqs} />
          </div>
        </div>
      </section>

      {/* 10. CTA PENUTUP — rapi, tidak overlap footer */}
      <section className="bg-[#FDFCF7] border-t border-nusa-200 py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-5 md:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-teal-900 border border-teal-800 p-8 sm:p-10 md:p-12 text-white shadow-soft-lg">
            <div className="pointer-events-none absolute inset-0 pw-grid-dark opacity-40" aria-hidden="true" />
            <div className="relative text-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">Mulai lindungi karyamu hari ini</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-teal-100">Daftar di BSC Testnet, preview terpoison, vault terenkripsi, royalti ERC-2981.</p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link href="/dashboard" className="interactive-btn inline-flex items-center justify-center rounded-xl bg-white px-7 py-3 text-sm font-bold text-teal-900 shadow-soft-md hover:bg-nusa-50">Buka Workspace Kreator →</Link>
                <a href="#cara-kerja" className="interactive-btn inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/15">Lihat cara kerja</a>
              </div>
              <div className="mx-auto mt-8 max-w-xl border-t border-white/10 pt-7">
                <p className="text-xs font-semibold tracking-widest text-teal-200 uppercase">Tetap update edukasi IP bukan spam</p>
                <NewsletterForm />
                <p className="mt-2 text-[11px] text-teal-200/70">Dengan berlangganan Anda menyetujui pembaruan edukatif. Bukan saran finansial/hukum.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-nusa-200 pt-12 pb-12 text-nusa-900">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="grid gap-10 md:grid-cols-12 lg:gap-12 pb-12 border-b border-nusa-200">
            <div className="md:col-span-4 space-y-4">
              <Link href="/" className="flex items-center gap-2.5">
                <Image src="/trovaya-logo.svg" alt="Trovaya logo" width={32} height={32} />
                <span className="text-2xl font-bold tracking-tight text-teal-900">Trovaya<span className="text-coral">.</span></span>
              </Link>
              <p className="text-sm leading-relaxed text-nusa-600 max-w-sm">Infrastruktur bukti provenance & konsen di BSC Testnet, bukan pengganti putusan peradilan hukum.</p>
              <div className="flex items-center gap-3 pt-2"><BnbNetworkBadge size="sm" variant="outline" showPulse /></div>
            </div>
            <div className="md:col-span-3 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-900">Ekosistem</p>
              <ul className="space-y-2 text-sm text-nusa-600 font-medium">
                <li><Link href="/dashboard" className="hover:text-teal-900">Workspace Kreator</Link></li>
                <li><a href="#galeri" className="hover:text-teal-900">Katalog Lisensi Publik</a></li>
                <li><a href="#batasan" className="hover:text-teal-900">Batasan Kami</a></li>
                <li><a href="#cara-kerja" className="hover:text-teal-900">Cara Kerja Golden Path</a></li>
              </ul>
            </div>
            <div className="md:col-span-2 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-900">Dukungan</p>
              <ul className="space-y-2 text-sm text-nusa-600 font-medium">
                <li><a href="#masalah" className="hover:text-teal-900">Masalah & Solusi</a></li>
                <li><Link href="/dashboard" className="hover:text-teal-900">Cara Tarik Saldo BNB</Link></li>
                <li><a href="#perbandingan" className="hover:text-teal-900">Kebijakan AI Training</a></li>
                <li><Link href="/dashboard" className="hover:text-teal-900">Status BSC Testnet</Link></li>
              </ul>
            </div>
            <div className="md:col-span-3 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-900">Transparansi</p>
              <ul className="space-y-2 text-sm text-nusa-600 font-medium">
                <li><Link href="/dashboard" className="hover:text-teal-900">Disclaimer Edukasi AI</Link></li>
                <li><span className="text-nusa-500 text-xs block">ERC-721 IPNFT & Royalti ERC-2981 permanen di BNB Chain Testnet.</span></li>
                <li className="pt-2"><span className="inline-flex rounded-lg bg-nusa-100 px-3 py-1.5 text-xs text-nusa-700 font-medium">🇮🇩 Dibuat untuk Hackathon Binance & BNB</span></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-nusa-500">
            <p>© 2026 Trovaya Protocol.</p>
            <p className="text-center sm:text-right">Mencatat bukti kepemilikan dan izin pakai, bukan pengganti putusan peradilan hukum. <span className="rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-amber-800 font-bold ml-1">Edukatif, bukan saran finansial/hukum</span></p>
          </div>
        </div>
      </footer>
      </div>
    </SmoothScrollProvider>
  );
}
