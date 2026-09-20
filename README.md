# 🛡️ Trovaya Protocol

**Trovaya** adalah protokol perlindungan Kekayaan Intelektual (IP) berbasis *consent-first* dan *fair-trade* yang dirancang untuk kreator digital dan UMKM lokal. Kami menggabungkan teknologi *protected public preview*, enkripsi file original, konsen pelatihan AI yang eksplisit, *on-chain provenance*, dan lisensi komersial yang transparan.

## 🚀 Mengapa Trovaya? (Value Proposition)

Kreator digital seringkali kehilangan kontrol atas karyanya saat dipublikasikan secara online, terutama dengan maraknya scraping AI tanpa izin. Trovaya hadir untuk:
- **Melindungi Karya**: Memberikan preview yang terproteksi secara eksperimental sebelum akses penuh diberikan.
- **Kedaulatan Data**: Enkripsi file original sehingga hanya pemegang lisensi sah yang bisa mengaksesnya.
- **Etika AI**: Mekanisme konsen eksplisit untuk pelatihan AI yang tercatat secara on-chain.
- **Transparansi**: Provenans dan riwayat lisensi yang tidak dapat dimanipulasi di blockchain.
- **Fleksibilitas Pembayaran**: Mendukung berbagai metode pembayaran (BNB, USDT, PAXG, XAUT) untuk memudahkan kreator dan pembeli.

## 🛠️ Arsitektur Sistem (Tech Stack)

Trovaya dibangun menggunakan arsitektur monorepo untuk efisiensi pengembangan:

| Komponen | Teknologi | Tanggung Jawab |
| --- | --- | --- |
| **Web App** (`apps/web`) | Next.js, Tailwind | Pengalaman kreator, dashboard, & integrasi wallet |
| **Poison Engine** (`services/poison-engine`) | FastAPI, Python | Proteksi gambar & watermarking KYC mock |
| **Event Indexer** (`services/event-indexer`) | Node.js, PostgreSQL | Indexing event blockchain & migrasi data |
| **Smart Contracts** (`packages/contracts`) | Solidity (ERC-721, ERC-2981) | Lisensi, vault, & manajemen kepemilikan IP |
| **Trovaya Family** (`packages/contracts`) | Solidity | Mekanisme urunan lisensi kolektif (shared licensing) |
| **Protocol SDK** (`packages/protocol-sdk`) | TypeScript | Integrasi typed ABI antara kontrak & frontend |

## 🔄 Alur Pengguna (User Journey)

```text
Koneksi Wallet ➔ Upload Karya ➔ Generate Protected Preview ➔ Enkripsi File Original ➔ Set Konsen AI & Provenans ➔ Publikasikan Karya ➔ Pembelian Lisensi (Individu / Urunan Family) ➔ Akses Vault Terenkripsi
```

## ⚡ Panduan Memulai (Quick Start)

### Prasyarat
- Node.js 22, pnpm 9.15.4, Python 3.11+, dan Git.

### Instalasi Cepat (Windows PowerShell)
```powershell
corepack enable
corepack install --global pnpm@9.15.4
pnpm.cmd install --frozen-lockfile
pnpm.cmd build
Copy-Item apps/web/.env.example apps/web/.env.local
pnpm.cmd demo:check
```

### Menjalankan Aplikasi
1. **Frontend**: `pnpm.cmd dev:web` (Akses: `http://localhost:3000`)
2. **Poison Engine**: 
   ```powershell
   cd services/poison-engine
   python -m venv .venv
   .\.venv\Scripts\python.exe -m pip install -e ".[dev]"
   cd ../..
   pnpm.cmd dev:poison
   ```
3. **Indexer** (Opsional): `pnpm.cmd dev:indexer`

## 📖 Dokumentasi Lengkap

Untuk detail teknis lebih mendalam, silakan rujuk dokumen berikut:
- [MASTER_SPEC.md](docs/MASTER_SPEC.md) - Otoritas teknis produk
- [PRD.md](docs/PRD.md) - Prioritas, persona, dan user journey
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Batasan sistem dan desain
- [CONTRACT_ARCHITECTURE.md](docs/CONTRACT_ARCHITECTURE.md) - Desain smart contract
- [DESIGN.md](docs/DESIGN.md) - Identitas brand dan sistem visual
- [LOCAL_DEVELOPMENT.md](docs/guides/LOCAL_DEVELOPMENT.md) - Panduan setup lingkungan lokal

## ⚠️ Catatan Implementasi (Current Boundaries)
- **Mock KYC**: Menggunakan watermark `SAMPLE` (untuk kebutuhan demo).
- **Trovaya Family**: Fitur urunan lisensi kolektif (3-5 orang) untuk akses bersama, mempermudah akses bagi komunitas kecil.
- **Gas Efficiency**: Optimasi biaya transaksi dilakukan melalui strategi *non-invasive* dan integrasi kontrak proxy untuk mengurangi beban storage on-chain.
- **Key Delivery**: Sistem pengiriman kunci aman sudah diimplementasikan namun memerlukan konfigurasi rahasia (secrets) tambahan untuk produksi.
- **AI Audit**: Output audit AI bersifat edukatif dan bukan merupakan saran hukum.

---
*Dikembangkan untuk Hackathon x Web3*
