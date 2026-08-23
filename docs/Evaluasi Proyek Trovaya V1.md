# Evaluasi Proyek: Trovaya Protocol

**Disusun dari rangkuman 7 review AI** (GLM Z.AI, Kimi, DeepSeek, Qwen, Grok, dan dua analisis lanjutan Kimi & Z.AI dengan akses kode lebih dalam)
**Repo:** `GavinArdhijaya91/Trovaya`
**Tujuan dokumen:** menyatukan poin-poin yang berulang di banyak review (berarti kemungkinan besar valid) dan poin unik dari masing-masing reviewer, sebagai bahan evaluasi dan roadmap perbaikan.

---

## 1. Ringkasan Eksekutif

Trovaya adalah protokol **"consent-first IP protection & fair-trade"** berbasis Web3 untuk kreator digital dan UMKM lokal. Alurnya: kreator upload karya → sistem membuat *protected preview* (perturbation/"poisoning" ala Glaze-Nightshade) → original dienkripsi → data & konsensus AI-training dicatat on-chain (ERC-721 + ERC-2981) → lisensi komersial dijual → akses vault dikontrol lewat verifikasi (mock ZK).

**Konsensus dari semua reviewer:** proyek ini **jauh di atas rata-rata submission hackathon** dari sisi struktur monorepo, dokumentasi (MASTER_SPEC, PRD, ARCHITECTURE, dsb.), dan kedisiplinan engineering (CI/CD, conventional commits, multi-chain deployment). Namun, **fitur inti (poisoning, ZK verifier, KYC, IPFS) sebagian besar masih mock/simulasi**, dan ada beberapa bug yang berpotensi membuat demo gagal total.

**Skor kumulatif (dari reviewer yang memberi skor numerik):** rata-rata di kisaran **31/60 – 6/10**, dikategorikan "cukup/di bawah rata-rata untuk level kompetitif", meski arsitektur dan dokumentasi dinilai kuat.

---

## 2. Penilaian Ide & Konsep

### Sisi positif (disepakati banyak reviewer)
- Masalah yang diangkat **nyata dan relevan**: AI scraping karya kreator/UMKM tanpa consent.
- Kombinasi *consent AI-training + on-chain provenance + licensing transparan* adalah framing yang kuat untuk pitch/demo.
- Fokus ke UMKM lokal (watermark "SAMPLE/CONTOH", bahasa Indonesia di UI) menunjukkan pemahaman target pasar.

### Kritik yang berulang
- **"Web2.5 Syndrome"** — beberapa reviewer (GLM Z.AI, Qwen) mempertanyakan apakah proyek ini benar-benar butuh Web3, atau hanya CRUD app biasa yang ditempeli wallet connect.
- **Value proposition ambigu**: consent on-chain hanya berupa flag boolean, tidak ada *enforceability* hukum — perusahaan AI besar tetap bisa berdalih fair use.
- **Over-engineered untuk target pasar**: UMKM butuh solusi simpel, tapi diberi monorepo + 3 chain testnet + Python service + indexer + IPFS. Friksi wallet/gas fee tetap ada meski sudah diabstraksi.
- **Over-scoping**: sudah membahas Soulbound Badge, Insights Gateway, Dune, Farcaster, fractional funding pool — padahal fitur inti (protection, licensing, key delivery) belum solid ("build the future while the present is incomplete").

**Skor ide dari reviewer yang memberi angka:** 6/10 — "bagus di pitch deck, lemah di realitas".

---

## 3. Temuan Kritis: Fitur "Mock" yang Diklaim Sebagai Fitur Inti

Ini adalah temuan paling konsisten di seluruh review — hampir semua AI menyoroti hal yang sama:

| Fitur yang diklaim | Realita di kode | Sumber |
|---|---|---|
| Adversarial protection (Glaze/Nightshade-like) | Hanya noise RGB sederhana (`perturbation.py`, `amplitude = intensity * 12`), bukan adversarial example berbasis model ML | Kimi, Qwen, Grok, Z.AI |
| ZK-Access Gate | `IZKHumanVerifier` hanya interface tanpa implementasi circuit — "architecture theater" | Kimi, Z.AI |
| KYC verification | Hanya watermark teks "SAMPLE" di gambar, bukan verifikasi identitas nyata | Kimi |
| Public IPFS CID | String palsu (`f"Qm{digest[:44]}"`), bukan CID IPFS asli | Kimi, Qwen, Grok, Z.AI |

**Rekomendasi bersama:** jangan gunakan istilah "poisoning", "ZK", atau "KYC" di pitch/README kecuali implementasinya benar-benar ada — reviewer yang paham Web3 akan langsung menyadarinya dan itu merugikan penilaian. Lebih baik jujur menyebutnya "simulasi/demo pipeline".

---

## 4. Bug & Error Kritis (Berpotensi Merusak Demo)

| Bug | Lokasi | Dampak | Keparahan |
|---|---|---|---|
| Minting mungkin *revert* untuk user biasa | `TrovayaIPNFT.sol` — `mintIP`/`mintIPFor` dibatasi `onlyRole(MINTER_ROLE)`, tapi frontend memanggilnya langsung dari wallet user | Alur inti "Connect → Upload → Mint" gagal total untuk siapa pun selain deployer | **Fatal (Qwen)** |
| `threading.Lock` dipakai di dalam `async def` (FastAPI) | `rate_limit.py` | Memblokir seluruh event loop Uvicorn | **High (Kimi)** |
| Perturbation pakai nested loop Python murni, bukan NumPy | `perturbation.py` | Gambar 4K bisa makan 15–30 detik → HTTP timeout | **High (Qwen)** |
| Dependency versi tidak valid: `dotenv ^17.4.2` | `package.json` (indexer, contracts) | `npm/pnpm install` gagal (versi 17 belum ada) | **Critical (Kimi lanjutan)** |
| Typo `httpx2` | `pyproject.toml` | `pip install` gagal | **Medium–Critical (semua reviewer)** |
| Next.js 16 (canary) + eslint-config-next 15 | `apps/web/package.json` | Ketidakcocokan versi, risiko instabilitas saat demo | **High (Kimi, Qwen)** |
| Payment forwarding pakai raw `.call{value}` tanpa withdrawal pattern | `purchaseCommercialLicense` | Dana bisa terkunci jika penerima adalah contract yang menolak ETH | **Medium (Z.AI)** |
| `setInterval` polling indexer tanpa backoff/circuit breaker | `event-indexer/src/index.ts` | Flood log & risiko race condition saat restart, tidak ada handling chain reorg | **Medium (Z.AI, GLM)** |
| `SUPABASE_SERVICE_ROLE_KEY` dipakai di API route publik | `apps/web/app/api/assets/route.ts` | Siapa pun bisa membaca seluruh data — risiko keamanan besar | **High (Z.AI)** |
| `turbo.json`: `lint` bergantung pada `build`; `__pycache__` masuk `outputs` | `turbo.json` | Memperlambat CI tanpa alasan; cache kotor | **Low** |

---

## 5. Analisis per Modul

### A. Smart Contract (Solidity)
**Positif:** menggunakan OpenZeppelin 5.2.0 (terbaru), pola AccessControl/Pausable/ReentrancyGuard/ERC-2981 sudah sesuai standar; ada test coverage dasar untuk IPNFT.

**Kritik:**
- `ReentrancyGuard` dipasang berlebihan di fungsi yang tidak butuh (`pause`, `unpause`), sementara fungsi lain butuh perhatian lebih pada pola Checks-Effects-Interactions.
- Tidak ada mekanisme **revoke/expiry** untuk akses vault — sekali diberi akses, permanen.
- `commercialLicenseFee` bersifat immutable setelah mint; tidak ada cara bagi kreator mengubah harga tanpa mint ulang.
- Tidak ada batas atas untuk `commercialLicenseFee`, dan lisensi tidak punya *terms* (durasi, teritori, eksklusivitas).
- Tidak ada mint self-service yang aman (disarankan EIP-712 signature) sebagai alternatif dari role-gated minting.
- Belum ada rencana audit formal (Slither/MythX/Echidna disebut oleh beberapa reviewer sebagai langkah minimum).

### B. Poison Engine (Python/FastAPI)
**Positif:** validasi input baik (content-type, size limit 15MB, `MAX_IMAGE_PIXELS` untuk cegah decompression bomb), error handling dengan HTTP status code yang sesuai, perturbation deterministik (SHA-256 seed) sehingga reproducible.

**Kritik:**
- Rate limiter in-memory (`threading.Lock` + `deque`) — tidak scalable untuk multi-instance dan berisiko blocking event loop.
- Algoritma perturbation tidak memberikan proteksi nyata terhadap AI scraping (lihat Bagian 3).
- `ImageFont.load_default()` berisiko gagal di environment Docker minimal (Alpine) tanpa fallback.

### C. Frontend (Next.js/React)
**Positif:** stack modern (Wagmi + Viem + RainbowKit, TypeScript strict mode, Tailwind).

**Kritik:**
- Next.js 16 canary dipasangkan dengan `eslint-config-next` versi 15 — rawan konflik.
- TypeScript target `ES2017` dianggap terlalu rendah untuk stack modern ini.
- Tidak ada test framework di frontend (hanya `tsc --noEmit`).
- Tidak ada error tracking (Sentry/LogRocket) atau analytics.
- Dependency `@x402/core` dkk. dinilai niche dengan maintainership rendah — risiko jika ada breaking change mendekati demo.

### D. Event Indexer
**Positif:** menggunakan `viem` (lebih modern dari ethers.js) dan driver `postgres` native.

**Kritik:**
- Polling `setInterval(sync, 5000)` tanpa backoff, tanpa graceful shutdown, dan tanpa handling untuk chain reorg — berisiko data orphan/duplikat.
- Query `getLogs` dari `fromBlock` ke `latest` tanpa *chunking* — bisa ditolak RPC provider jika range terlalu besar (limit umum ~10.000 block).
- Belum ada tool migrasi schema (Prisma/Drizzle/node-pg-migrate) — migrasi manual rawan human error.

### E. DevOps / CI
- Python (poison-engine) hanya di-*install* di CI, **tidak dijalankan lint/test-nya** (`ruff`, `pytest` belum masuk gate) — gap besar dibanding JS yang sudah punya lint→test→build.
- `.env.example` sebaiknya diisi placeholder eksplisit ("never_push_this"), bukan dikosongkan, agar tidak berisiko ada yang lupa mengisi key funded ke repo publik.

---

## 6. Rekomendasi Perbaikan — Berdasarkan Prioritas

### 🔴 Prioritas Tinggi (harus selesai sebelum demo/submission)
1. Perbaiki alur **minting** agar tidak revert untuk user biasa — buat permissionless sementara, atau bangun relayer/gasless minting.
2. Ganti `threading.Lock` → `asyncio.Lock` di rate limiter poison-engine.
3. Perbaiki dependency yang salah: `dotenv ^17.4.2` → versi stabil terbaru yang valid, `httpx2` → `httpx`.
4. Stabilkan versi Next.js (turun ke 15.x stable) dan samakan `eslint-config-next`.
5. Ganti nested loop Python di `perturbation.py` dengan operasi vektor NumPy/PIL `ImageMath`.
6. Cabut `SUPABASE_SERVICE_ROLE_KEY` dari API route publik; gunakan anon key + RLS atau validasi sesi/JWT.

### 🟡 Prioritas Menengah (sebelum ke tahap produksi)
7. Tambahkan mekanisme revoke/expiry pada akses vault; tambahkan fungsi update fee lisensi dengan pembatasan wajar (cap harga).
8. Terapkan *chunking* pada `getLogs` di indexer, tambahkan retry + backoff, dan tangani chain reorg.
9. Ganti mock CID dengan integrasi IPFS nyata (Pinata/NFT.Storage), atau beri label eksplisit `mock_` selama belum siap.
10. Tambahkan lint & test Python (`ruff`, `pytest`) ke pipeline CI.
11. Perjelas di README/UI bagian mana yang on-chain vs off-chain, dan bagian mana yang masih simulasi (poisoning, ZK, KYC) — transparansi dinilai lebih tinggi daripada berpura-pura sudah lengkap.

### 🟢 Prioritas Jangka Panjang
12. Jika ingin proteksi AI yang benar-benar efektif, integrasikan implementasi Glaze/Nightshade open-source atau model surrogate (mis. ResNet/CLIP-based), bukan noise RGB sederhana.
13. Bangun sistem key-delivery yang nyata untuk vault (mis. threshold encryption atau Lit Protocol) — ini adalah inti dari klaim "encrypted originals" dan saat ini belum ada.
14. Pertimbangkan indexing service pihak ketiga (The Graph/Goldsky) daripada polling manual.
15. Tunda fitur tambahan (Soulbound Badge, social distribution, dsb.) sampai alur inti (upload → protect → mint → license → download) benar-benar stabil end-to-end di testnet.
16. Lakukan audit keamanan minimal otomatis (Slither) sebagai bagian dari CI sebelum mempertimbangkan mainnet.

---

## 7. Kesimpulan

Secara konsisten, para reviewer menilai Trovaya sebagai proyek dengan **fondasi arsitektur dan dokumentasi yang kuat, di atas rata-rata proyek hackathon** — tapi **substansi teknis dari fitur andalannya (proteksi AI, ZK, KYC) masih berupa simulasi/placeholder**, dan ada beberapa bug konkret (dependency, minting flow, async blocking) yang berisiko membuat demo gagal jika tidak diperbaiki lebih dulu.

**Pesan inti dari seluruh review:** lebih baik memiliki **satu fitur yang benar-benar berfungsi penuh dan bulletproof** (misalnya alur licensing NFT yang solid) daripada lima fitur yang setengah jalan dan penuh mock. Jangan tambah cakupan baru sebelum alur inti stabil, dan selalu jujur di dokumentasi tentang batasan implementasi saat ini — itu jauh lebih dihargai juri/reviewer daripada klaim yang tidak sesuai kode.