<p align="center">
  <img src="apps/web/public/trovaya-logo.svg" alt="Logo Trovaya" width="72" />
</p>

<h1 align="center">Trovaya</h1>

<p align="center">
  <strong>Bagikan karyamu ke publik, tanpa memberikan file aslinya.</strong><br />
  Infrastruktur lisensi dan vault untuk kreator Indonesia di era AI.
</p>

---

## Masalah yang kami selesaikan

Bayangkan Anda seorang ilustrator atau pemilik UMKM. Anda memajang karya terbaik di internet agar dikenal orang — tapi di saat yang sama, karya itu bisa diambil diam-diam untuk melatih model AI, tanpa izin dan tanpa kompensasi sepeser pun.

Inilah dilema kreator hari ini: **ingin terlihat, tapi takut diambil.** Pilihan yang ada selama ini tidak memuaskan — mengunci karya berarti tidak ada yang melihat, memajang karya berarti merelakan semuanya.

Trovaya menawarkan jalan ketiga.

## Apa itu Trovaya?

Trovaya adalah protokol pencatatan dan lisensi karya digital di atas BNB Chain. Gagasan intinya sederhana dan bisa dijelaskan dalam satu kalimat:

> **Yang dilihat publik hanyalah preview. File asli yang bersih tersimpan aman di vault, dan hanya terbuka untuk pembeli lisensi yang sah.**

Setiap karya yang didaftarkan mendapat tiga hal: preview publik yang terproteksi, file master yang terenkripsi, dan catatan lisensi yang transparan di blockchain — termasuk pilihan eksplisit apakah karya boleh dipakai untuk melatih AI atau tidak.

## Cara kerja — lima langkah, tanpa jargon

1. **Upload karya.** Kreator mengunggah file gambar seperti biasa, lewat aplikasi web yang familier.
2. **Preview untuk publik.** Sistem membuat versi preview yang indah namun terproteksi untuk dilihat semua orang.
3. **File asli masuk vault.** File resolusi penuh dienkripsi dan disimpan aman. Tidak ikut ter-publish.
4. **Atur izin lisensi.** Kreator menentukan harga lisensi dan apakah karya boleh dipakai untuk training AI — tercatat on-chain, bisa diverifikasi siapa pun.
5. **Jual dan terima royalti.** Pembeli membayar lisensi, royalti mengalir langsung ke wallet kreator. Ada juga fitur **patungan (Trovaya Family)**: 3–5 orang bisa berbagi satu lisensi bersama.

## Tiga janji yang bisa diverifikasi

- **Akses yang familier.** Masuk lewat wallet atau email, tanpa perlu paham istilah blockchain.
- **Miliki dan lindungi.** Bukti kepemilikan tercatat di BNB Chain; file asli tidak pernah terekspos.
- **Pahami, bukan dianjurkan.** Semua insight AI di aplikasi berlabel edukatif — bukan saran finansial atau hukum.

## Yang perlu Anda tahu (kami jujur soal batasan)

Presentasi yang baik tidak melebih-lebihkan. Beberapa hal penting:

- Preview terproteksi adalah **eksperimen**, bukan pertahanan anti-scraping yang terbukti.
- Catatan on-chain adalah **bukti kepemilikan dan izin**, bukan putusan pengadilan hak cipta.
- Aplikasi berjalan di **BSC Testnet** — lingkungan uji, bukan mainnet produksi.
- Verifikasi identitas (KYC) saat ini masih **mock berlabel SAMPLE** untuk demo.

## Teknologi di balik layar

| Bagian | Teknologi | Peran |
| --- | --- | --- |
| Aplikasi web (`apps/web`) | Next.js, Tailwind | Workspace kreator, marketplace, integrasi wallet |
| Poison engine (`services/poison-engine`) | FastAPI, Python | Pembuatan preview terproteksi |
| Event indexer (`services/event-indexer`) | Node.js, PostgreSQL | Membaca event blockchain ke database |
| Smart contract (`packages/contracts`) | Solidity (ERC-721, ERC-2981) | Registrasi karya, lisensi, royalti, vault, patungan |
| Protocol SDK (`packages/protocol-sdk`) | TypeScript | Penghubung kontrak dan frontend |

## Menjalankan demo secara lokal

**Prasyarat:** Node.js 22, pnpm 9.15.4, Python 3.11+, Git.

```powershell
corepack enable
corepack install --global pnpm@9.15.4
pnpm.cmd install --frozen-lockfile
pnpm.cmd build
Copy-Item apps/web/.env.example apps/web/.env.local
pnpm.cmd demo:check
```

Lalu jalankan:

1. **Frontend** — `pnpm.cmd dev:web`, buka `http://localhost:3000`
2. **Poison engine** —
   ```powershell
   cd services/poison-engine
   python -m venv .venv
   .\.venv\Scripts\python.exe -m pip install -e ".[dev]"
   cd ../..
   pnpm.cmd dev:poison
   ```
3. **Indexer** (opsional) — `pnpm.cmd dev:indexer`

## Dokumen pendalaman

- [MASTER_SPEC.md](docs/MASTER_SPEC.md) — acuan teknis produk
- [PRD.md](docs/PRD.md) — prioritas, persona, dan user journey
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — batasan sistem dan desain
- [CONTRACT_ARCHITECTURE.md](docs/CONTRACT_ARCHITECTURE.md) — desain smart contract
- [DESIGN.md](docs/DESIGN.md) — identitas brand dan sistem visual
- [LOCAL_DEVELOPMENT.md](docs/guides/LOCAL_DEVELOPMENT.md) — panduan setup lokal

---

*Dibuat dengan teliti untuk kreator Indonesia — Hackathon x Web3, 2026.*
