# Audit P0 — Golden Path End-to-End

**Status:** hasil audit langsung pada kode, commit `c09137b` (branch `feat/web-next-iteration`).
**Metode:** pembacaan kode + eksekusi gate lokal (`pnpm --filter @trovaya/web test`, build SDK).
**Otoritas:** `docs/MASTER_SPEC.md`, `docs/architecture/FRONTEND_INTEGRATION_CONTRACT.md`.
**Sumber kritik yang diverifikasi:** `docs/Evaluasi Proyek Trovaya V1.md` dan `docs/EVALUATION_ACTION_PLAN.md`.

---

## 1. Ringkasan eksekutif

Sistem jauh lebih matang daripada yang tersirat di dokumen evaluasi V1. Yang benar-benar
kurang bukan fitur, melainkan **konsistensi state antara rantai, index, dan UI**:

| Area | Kondisi terverifikasi |
| --- | --- |
| Kontrak (P0.2) | Kuat: fee wajib persis, anti pembelian ganda, terms hash+version dicocokkan, CEI pada credit/withdraw, expiry+revoke divalidasi. Jalur mock terlabel `MockZKHumanVerifier`. |
| Source of truth (P0.3) | Server sudah benar: delivery kunci membaca `hasCommercialLicense` + `hasVaultAccess` dari rantai (`apps/web/app/api/vault/keys/deliver/route.ts:21-25`). UI **belum** mengikuti aturan yang sama. |
| Indexer (P0.4) | Kuat: chunking, retry/backoff, reorg reconcile, confirmations, graceful shutdown (`services/event-indexer/src/index.ts`). |
| State transaksi (P0.5) | State machine ada (`packages/protocol-sdk/src/integration.ts`) tetapi fase `indexing` **tidak pernah diproduksi** oleh runtime. |
| Fresh wallet (P0.6) | Bukti E2E live tersedia (`docs/evidence/golden-path.json`, BSC Testnet token 14, Pinata, AES-GCM). Namun hanya berlaku dalam satu sesi tanpa reload. |
| Gate CI | **Gagal sebelum perbaikan ini**: `tsc --noEmit` error `TS2614` pada dashboard. |

Tiga temuan kritis yang ditemukan pada audit ini:

1. **F-01 (kritis)** — Hak akses pembeli hanya disimpan di state sesi React. Setelah reload,
   pembeli yang sudah membayar melihat tombol beli lagi dan tidak dapat mengunduh file asli.
2. **F-02 (kritis)** — Fase `indexing` hanya ada di dokumentasi dan type; UI menyatakan
   "Proses berhasil" tepat saat transaksi ditambang, sebelum record terbaca.
3. **F-03 (tinggi)** — Endpoint patungan memakai service-role key dan mempercayai
   `leader_wallet` dari body permintaan tanpa verifikasi tanda tangan.

---

## 2. Arsitektur aktual (terverifikasi di kode)

```text
Creator
  apps/web/components/protection-form.tsx
    -> services/poison-engine (POST /protect)      preview terproteksi (eksperimental)
    -> apps/web/lib/client-encryption.ts           AES-GCM kunci di browser
    -> apps/web/app/api/ipfs/pin/route.ts          Pinata (atau demo-* bila belum dikonfigurasi)
    -> apps/web/hooks/use-register-ip.ts           TrovayaIPNFT.mintIP (permissionless)
    -> apps/web/lib/vault-client.ts                /api/vault/challenge -> /api/vault/keys/register

Buyer
  apps/web/app/artwork/[chainId]/[tokenId]         detail lisensi + terms terverifikasi hash
    -> useLicenseActions.purchaseLicense           TrovayaIPNFT.purchaseCommercialLicense
    -> useLicenseActions.authorizeOriginal         TrovayaVault.unlockWithLicense
    -> lib/vault-client.deliverContentKey          /api/vault/keys/deliver  (baca rantai)
    -> lib/vault-client.decryptVaultFile           AES-GCM dekripsi lokal

Index (publik, lag di belakang rantai)
  services/event-indexer -> Postgres/Supabase -> apps/web/app/api/assets/route.ts -> useAssets()
```

Penting untuk dipahami tim: **indexer bukan jalur kritis pembeli.** Pengiriman kunci
memverifikasi lisensi dan otorisasi langsung ke rantai, sehingga pembelian tetap sah dan
dapat diakses walaupun indexer mati. Indexer hanya menentukan *penemuan* karya
(gallery, explore, marketplace, detail lewat daftar) dan pelaporan aktivitas.

---

## 3. Golden Path final (P0.1)

**Creator**

```text
Upload + kualitas aset (asset-quality)
  -> Protected Preview  (poison-engine, label "eksperimental", bukan adversarial)
  -> Encrypt Original   (AES-GCM di browser; kunci tidak pernah dikirim ke server mentah)
  -> Store              (Pinata / label demo-* bila belum dikonfigurasi)
  -> Register/Mint      (mintIP -> event IPMinted)
  -> Set License        (fee, terms hash+version, durasi, royalty ERC-2981, consent AI)
  -> Index tersedia     (indexer -> database -> /api/assets)
  -> Register content key (challenge bertanda tangan -> vault menyimpan kunci terbungkus)
```

**Buyer**

```text
View Preview      (preview terproteksi; label persistensi jujur)
  -> Purchase License (purchaseCommercialLicense, fee harus sama persis)
  -> On-chain Authorization (unlockWithLicense; menghitung expiry dari purchasedAt)
  -> Vault Verification (server membaca rantai; audit tercatat)
  -> Access Original    (kunci dibungkus RSA-OAEP-256, file didekripsi di klien)
```

## 4. Checklist E2E (output P0.1)

Cara pakai: satu wallet creator dan satu wallet buyer **baru**. Setiap langkah harus
menampilkan salah satu state: `idle -> awaiting_wallet -> submitted -> confirming -> indexing
-> completed`, atau `failed` dengan alasan yang bisa ditindaklanjuti.

### Creator

| # | Langkah | Bukti keberhasilan | Status gate |
| --- | --- | --- | --- |
| C1 | Connect wallet di jaringan utama yang dikonfigurasi | Banner jaringan tidak menampilkan peringatan salah jaringan | Manual |
| C2 | Upload gambar dan lihat hasil preview terproteksi | Copy "eksperimental" terlihat, hash transformasi tampil | Manual |
| C3 | Enkripsi original | File terenkripsi terkirim ke pin; tidak ada kunci mentah keluar dari browser | Manual |
| C4 | Mint | `IPMinted` terparsing, OperationStatus berpindah ke "Memperbarui data karya" lalu "Proses berhasil" | Otomatis: `tests/operation-status.component.test.tsx` |
| C5 | Index muncul | `/api/assets` memuat token; bila indexer mati, fallback rantai BSC tetap menampilkan | Otomatis (fallback) + manual |
| C6 | Registrasi content key | Status "Content key sudah dibungkus oleh secure vault" | Manual |
| C7 | Reload halaman setelah C4–C6 | Karya tetap ada di dashboard dan tidak ada langkah yang diminta ulang | Manual |

### Buyer

| # | Langkah | Bukti keberhasilan | Status gate |
| --- | --- | --- | --- |
| B1 | Buka `/artwork/<chainId>/<tokenId>` dari wallet baru | Langkah 1/2/3 tampil abu-abu; tidak ada klaim akses | Manual |
| B2 | Verifikasi terms | Hash terms cocok dengan `license_terms_hash` on-chain | Otomatis: `tests/license-terms.test.ts` |
| B3 | Beli lisensi | Fee di UI == fee di popup wallet; state transaksi lengkap | Otomatis: `deriveTransactionState` |
| B4 | Otorisasi vault | `unlockWithLicense` sukses; langkah 2 menjadi aktif | Manual |
| B5 | Unduh original | Kunci dibungkus RSA-OAEP-256, file didekripsi lokal, sha256 cocok | Manual + `docs/evidence/golden-path.json` |
| B6 | **Reload setelah B4/B5** | Wallet masih dikenali punya lisensi + akses; tombol unduh tetap ada | Otomatis: `tests/asset-access.test.ts` |
| B7 | Coba beli ulang | Tombol beli nonaktif dengan label "Lisensi sudah tercatat untuk wallet ini" | Manual |
| B8 | Wallet tanpa lisensi mencoba unduh | Server menolak dengan pesan actionable (`403 Lisensi dan otorisasi vault aktif diperlukan.`) | Manual, audit table `vault_delivery_audit` |

Aturan yang tidak boleh dilanggar selama demo:
1. Tidak ada status sukses sebelum rantai mengonfirmasi.
2. Tidak ada klaim "siap dipakai" sebelum index melaporkan record terbaca (atau fallback rantai membuktikannya).
3. Tidak ada fallback yang memalsukan transaksi atau status on-chain.

---

## 5. Status P0.1–P0.6

| Item | Status | Catatan |
| --- | --- | --- |
| P0.1 Golden path | **Selesai** | Bagian 3 dan 4 dokumen ini. |
| P0.2 Audit kontrak | **Sebagian** | Invariant kunci hold; sisa: bukti tulis manual + mock terlabel. Lihat F-07, F-08. |
| P0.3 Source of truth | **Diperbaiki di pass ini** | Server sudah benar; UI sekarang membaca entitlement dari rantai (F-01). |
| P0.4 Chain → Indexer → DB | **Sebagian** | Indexer kuat; UI sekarang memvalidasi keterbacaan index dan menyegarkan query setelah mutasi (F-02, F-04). |
| P0.5 State transaksi | **Selesai** | `indexing` sekarang benar-benar diproduksi dan diuji (F-02). |
| P0.6 Fresh wallet E2E | **Perlu satu run ulang** | Bukti lama ada di `docs/evidence/golden-path.json`; jalankan ulang setelah perubahan ini dan perbarui buktinya. |

## 6. Temuan terverifikasi

Severity: kritis = memutus golden path atau membuat klaim tidak benar; tinggi = risiko
kepercayaan/keamanan; sedang = konsistensi; rendah = catatan.

| ID | Sev | Temuan | Bukti | Status |
| --- | --- | --- | --- | --- |
| F-01 | Kritis | Entitlement pembeli hanya hidup di state sesi React. Setelah reload, pembeli yang sudah membayar melihat tombol beli lagi, `LicenseAlreadyPurchased` revert saat diklik, dan tombol unduh tidak pernah dirender. | `asset-gallery.tsx:89-90` (sebelum), `artwork/.../page.tsx:747,755,829,866` (sebelum); hanya route server yang membaca rantai (`api/vault/keys/deliver/route.ts:21-25`) | **Diperbaiki** |
| F-02 | Kritis | Fase `indexing` ada di type, pesan, dan tiga dokumen, tetapi `deriveTransactionState` tidak pernah menghasilkannya. UI menyatakan "Proses berhasil" saat receipt ditambang, bukan saat record terbaca. | `protocol-sdk/src/integration.ts` (type + `operationMessages.indexing`), `docs/INTEGRATION.md:90`, `docs/architecture/FRONTEND_INTEGRATION_CONTRACT.md:29`, `docs/guides/FRONTEND_CONTRIBUTION_GUIDE.md:77` | **Diperbaiki** |
| F-03 | Tinggi | `/api/co-purchase` (POST dan PATCH) memakai service-role key dan mempercayai `leader_wallet` dari body permintaan. Tanpa verifikasi tanda tangan, siapa pun dapat membuat grup atas nama wallet lain atau menandai grup `PURCHASED` dengan tx hash sembarang: database bisa mengklaim "sukses" tanpa dasar on-chain yang diverifikasi. | `api/co-purchase/route.ts:66,149,158,173,198-204`; `lib/co-purchase.ts:117-130` | **Terbuka** |
| F-04 | Tinggi | Tidak ada penyegaran data setelah mutasi. Query aset tanpa invalidation/interval, dan halaman detail menemukan aset hanya dari daftar, sehingga ada jendela "not found" setelah mint/publish. | `hooks/use-assets.ts:67-82` (sebelum), resolusi aset di `artwork/.../page.tsx:103-115` | **Diperbaiki** |
| F-05 | Sedang | Fallback pemindaian rantai di-hardcode ke BSC Testnet (chain viem + `chain_id: 97`) sedangkan alamat kontrak bersifat chain-agnostic dan SDK mendukung 84532/421614. Salah konfigurasi rantai akan membaca alamat yang benar di rantai yang salah. | `hooks/use-assets.ts:5,18-26,47-48` (sebelum) vs `lib/contracts.ts` dan `packages/protocol-sdk/src/chains.ts` | **Diperbaiki** |
| F-06 | Sedang | Gate CI merah: `tsc --noEmit` gagal karena halaman dashboard mengimpor `CreatorDashboard` sementara komponennya mengekspor default `DashboardPage`. | `app/dashboard/page.tsx:1` vs `components/dashboard/creator-dashboard.tsx:50` (sebelum) | **Diperbaiki** |
| F-07 | Sedang | `pnpm lint` gagal: `react-hooks/set-state-in-effect` pada reset paginasi dashboard. | `components/dashboard/creator-dashboard.tsx:59-61` (sebelum) | **Diperbaiki** |
| F-08 | Sedang | `purchaseCommercialLicenseWithToken` menerima ERC-20 apa pun tanpa allowlist atau sumber harga; fee dibandingkan pada unit token sehingga token tak bernilai dapat dianggap pembayaran lisensi yang sah. | `contracts/TrovayaIPNFT.sol:142-152,163` | Terbuka (golden path memakai BNB, jadi tidak memblokir demo) |
| F-09 | Sedang | `unlockWithHumanProof` memberi akses 1 hari tanpa lisensi; aman hanya karena verifier saat ini adalah `MockZKHumanVerifier` yang dikelola owner. | `contracts/TrovayaVault.sol:50-60`; `contracts/mocks/MockZKHumanVerifier.sol` | Terbuka (jangan aktifkan verifier non-mock sebelum `docs/TRUST_AND_IDENTITY.md` dieksekusi) |
| F-10 | Rendah | Kritik "cabut `SUPABASE_SERVICE_ROLE_KEY` dari route publik" hanya sebagian benar. Vault dan patungan memang memerlukan privilege server (RLS tidak boleh membuka tulis). Yang kurang adalah verifikasi pemanggil (lihat F-03), bukan penghapusan kunci. Khusus `api/health`, fallback ke service-role tidak perlu. | `api/health/route.ts:5`; `lib/vault/config.ts:18-24`; `api/co-purchase/route.ts:66,149` | Terbuka |
| F-11 | Rendah | Lag index realistis: `INDEXER_CONFIRMATIONS=6` ditambah poll 5 detik pada BSC (~3 detik/blok) berarti record publik muncul sekitar 18-25 detik setelah transaksi. Copy produk harus memakai ekspektasi ini. | `services/event-indexer/src/index.ts:12-15` | Terdokumentasi |
| F-12 | Rendah | Fitur P5 (patungan, badge/reputasi) sudah tampil di UI utama sebelum golden path stabil. | `components/co-purchase-card.tsx`, nav dashboard tab "Reputasi & Badge" | Keputusan produk |

Yang sudah benar dan harus dijaga (jangan "diperbaiki" tanpa alasan):

- Delivery kunci memverifikasi **rantai, bukan database** (`api/vault/keys/deliver/route.ts:21-25`), dengan audit `vault_delivery_audit` untuk diterima maupun ditolak.
- `unlockWithLicense` menghitung expiry dari waktu pembelian dan menolak akses setelah `revokeAccess` (`TrovayaVault.sol:63-80,91-105`).
- Pembelian tidak bisa diulang dan fee harus sama persis; terms hash dan versi dicocokkan (`TrovayaIPNFT.sol:161-166`).
- Proceeds dikreditkan sebelum pemanggilan eksternal dan di-nol-kan sebelum transfer (`TrovayaIPNFT.sol:176-198`).
- Indexer menangani reorg, chunking, retry/backoff, dan shutdown rapi (`services/event-indexer/src/index.ts`).

## 7. Verifikasi kritik `docs/Evaluasi Proyek Trovaya V1.md`

| Klaim kritik | Status terhadap kode saat ini | Bukti |
| --- | --- | --- |
| Adversarial protection hanya noise RGB, bukan Glaze/Nightshade | **Valid sebagai deskripsi, sudah ditangani sebagai label.** Transformasi kini vektor NumPy + blur eksperimental, dan kode menyatakan sendiri "NOT benchmarked adversarial protection". | `services/poison-engine/app/perturbation.py:18-24,49-58` |
| ZK-Access Gate hanya interface tanpa circuit | **Valid.** `IZKHumanVerifier` diimplementasikan oleh `MockZKHumanVerifier` (owner-managed). Harus tetap disebut mock. | `contracts/interfaces/IZKHumanVerifier.sol`, `contracts/mocks/MockZKHumanVerifier.sol` |
| KYC hanya watermark "SAMPLE" | **Valid.** Tidak ada verifikasi identitas nyata; desain normatif ada di `docs/TRUST_AND_IDENTITY.md` tanpa provider. | `services/poison-engine/app/watermark.py` |
| CID IPFS palsu (`Qm{digest[:44]}`) | **Sudah tidak valid.** Placeholder CID berbentuk CID sudah dihapus; hanya Pinata yang menghasilkan CID asli, mode tanpa konfigurasi memakai prefiks eksplisit `demo-*`. | grep `Qm{`/`mock_cid` → 0 hasil; `lib/ipfs-api.ts`, `lib/persistence-mode.ts` |
| Minting revert untuk user biasa | **Sudah tidak valid.** `mintIP` permissionless dan selalu `msg.sender`; `mintIPFor` tetap role-gated. | `contracts/TrovayaIPNFT.sol:58-92` |
| `threading.Lock` memblokir service async | **Sudah tidak valid.** Limiter memakai `asyncio.Lock` dengan `async with`. | `services/poison-engine/app/rate_limit.py:4,24,28` |
| Nested loop Python lambat | **Sudah tidak valid.** Operasi vektor NumPy, dimensi dibatasi 4096×4096. | `services/poison-engine/app/perturbation.py:9-11,61-71` |
| Indexer tanpa chunking/retry/reorg handling | **Sudah tidak valid.** Ada chunking, `withRetry`, reconcile reorg + full replay, `confirmations`, shutdown SIGINT/SIGTERM. | `services/event-indexer/src/index.ts:12-18,35-60,136-139`; `sync-utils.ts` |
| Vault tanpa revoke/expiry | **Sudah tidak valid.** `revokeAccess` (creator atau admin) dan `expiresAt` ditegakkan di `hasVaultAccess`. | `contracts/TrovayaVault.sol:91-105` |
| Python tidak masuk gate CI | **Masih valid sebagian.** CI memasang dependency Python dan `pip check`, tetapi belum menjalankan `ruff`/`pytest`. | `.github/workflows/ci.yml:40-57` |
| Cabut `SUPABASE_SERVICE_ROLE_KEY` dari route publik | **Sebagian valid.** Lihat F-03 dan F-10: yang perlu diperbaiki adalah verifikasi pemanggil. | `api/co-purchase/route.ts` |
| Ganti mock CID, tunda fitur P5, audit Slither | Mock CID selesai; Slither sudah tercermin pada komentar `slither-disable` dan commit `a27da42`; fitur P5 masih tampil (F-12). | `packages/contracts/contracts/*.sol` |

Kesimpulan: dokumen evaluasi V1 sudah **kedaluwarsa pada sebagian besar temuan teknis** (CID, minting,
lock, loop, indexer, vault), tetapi **masih tepat pada dua hal**: (a) klaim fitur andalan
(protection/ZK/KYC) harus tetap berlabel mock/eksperimental, dan (b) disiplin "jangan tambah fitur
sebelum alur inti stabil" — yang justru dilanggar oleh F-01/F-02/F-04 karena alur inti pun belum
konsisten.

---

## 8. Verifikasi audit eksternal (transkrip)

Transkrip analisis sebelumnya benar pada peta besar (monorepo, peran poison-engine/indexer/vault,
kekhawatiran ketergantungan indexer dan "symmetry of truth") tetapi tidak akurat pada diagnosis:

| Klaim transkrip | Koreksi terverifikasi |
| --- | --- |
| "Frontend kemungkinan besar memakai optimistic update; belum ada state machine yang rigid" | Tidak ada optimistic update. Masalah sebenarnya bukan state machine yang belum ada — state machine **sudah ada** di `protocol-sdk/src/integration.ts` — melainkan **fase `indexing` tidak pernah diproduksi** (F-02). |
| "Frontend menyatakan sukses hanya karena tombol berhasil diklik" | Tidak tepat. Sukses diambil dari `useWaitForTransactionReceipt` (receipt ditambang), bukan dari klik. Kesalahannya lebih halus: berhenti satu langkah sebelum "terbaca". |
| "Jika indexer delay, user melihat Pending/Not Found meski transaksi sukses" | Benar dan terverifikasi, dengan mitigasi yang sudah ada tetapi tidak terlihat: `useAssets()` punya fallback pemindaian rantai (`use-assets.ts:15-65`). |
| "Vault server bisa tidak sinkron dengan `hasVaultAccess`" | Tidak terjadi: route delivery membaca rantai secara langsung, bukan membaca database. |
| "Ada risiko mismatch `commercialLicenseFee` antara UI dan kontrak" | Sudah dimitigasi: `usePurchaseQuote` membaca fee dan gas langsung dari rantai dan UI membandingkannya dengan nilai hasil index. |
| "Buat skrip Fresh Wallet E2E" | Sudah ada jalur bukti: `scripts/test-vault-delivery.mjs`, `scripts/check-demo-readiness.mjs`, `scripts/validate-demo-evidence.mjs`, dan `docs/evidence/golden-path.json` (token 14, BSC Testnet). |

Pelajaran yang penting untuk tim: audit yang menyimpulkan "belum ada state machine" menghasilkan
perintah kerja yang salah (menulis ulang lapisan yang sudah bagus). Audit yang menyimpulkan
"state machine tidak lengkap pada satu fase" menghasilkan perbaikan beberapa baris yang bisa diuji.

## 9. Perubahan pada pass ini

Semua perubahan bersifat aditif atau memperbaiki perilaku yang sudah tidak benar. Tidak ada
perubahan pada ABI kontrak, skema database, atau alur pembayaran.

| File | Perubahan | Alasan |
| --- | --- | --- |
| `packages/protocol-sdk/src/integration.ts` | Field opsional `isIndexing` pada `TransactionSignals`; cabang yang menghasilkan fase `indexing` sebelum `completed` | Menutup F-02 tanpa mematahkan konsumen lama (kontrak integrasi mengizinkan field opsional aditif) |
| `apps/web/lib/asset-access.ts` (baru) | `resolveEntitlement()` — aturan union rantai + sesi | Menutup F-01 dan membuat aturan source of truth dapat diuji sebagai unit murni |
| `apps/web/hooks/use-asset-access.ts` (baru) | `hasCommercialLicense` dan `hasVaultAccess` dibaca langsung dari rantai untuk satu wallet | Rantai menjadi sumber kebenaran entitlement di UI |
| `apps/web/components/asset-gallery.tsx` | `isPurchased`/`isUnlocked` dari entitlement; refetch akses sekali per tx hash | Pembeli yang reload tetap dikenali |
| `apps/web/app/artwork/[chainId]/[tokenId]/page.tsx` | Gate lisensi/vault/unduh memakai entitlement; tombol beli nonaktif bila sudah punya lisensi; polling index berbatas 30 detik dengan copy "Memperbarui index" | Menutup F-01 dan memberi state "sedang diindeks" yang jujur |
| `apps/web/hooks/use-assets.ts` | Guard rantai untuk fallback (F-05); opsi `refetchInterval` | Fallback tidak lagi membaca rantai yang salah; halaman detail bisa menunggu index |
| `apps/web/hooks/use-register-ip.ts` | Mengumumkan fase `indexing` selama menunggu record terbaca, lalu invalidasi query `["assets"]`; mengembalikan `indexed` | Sukses hanya setelah record terbaca (atau timeout yang jujur) |
| `apps/web/hooks/use-license-actions.ts` | Invalidasi query `["assets"]` setelah pembelian/otorisasi terkonfirmasi | Data daftar tidak lagi dianggap segar sebelum konfirmasi |
| `apps/web/lib/index-wait.ts` (baru) | `waitForIndexedToken()` berbatas, tidak pernah melempar | Penantian index yang dapat diuji dan tidak memblokir alur |
| `apps/web/components/dashboard/creator-dashboard.tsx` | Export `CreatorDashboard` (F-06); reset paginasi tanpa `setState` di dalam effect (F-07) | Mengembalikan gate `tsc` dan `lint` menjadi hijau |
| `apps/web/tests/asset-access.test.ts`, `apps/web/tests/index-wait.test.ts` (baru), `apps/web/tests/operation-status.component.test.tsx` | 7 test node baru dan 2 test komponen baru | Bukti otomatis untuk F-01 dan F-02 |

Hasil gate lokal setelah perubahan:

```text
pnpm --filter @trovaya/web lint    -> lolos (eslint --max-warnings=0)
pnpm --filter @trovaya/web test    -> node: 38/38 lulus, vitest: 4/4 lulus, tsc: bersih
pnpm --filter @trovaya/protocol-sdk build -> sukses (dist menyertakan cabang indexing)
```

Sebelum perubahan, `pnpm test` **gagal** pada `tsc` (F-06) dan `pnpm lint` **gagal** (F-07).

---

## 10. Sisa pekerjaan berprioritas

### P0 lanjutan (sebelum dianggap selesai)

1. **F-03 — verifikasi pemanggil pada `/api/co-purchase`.** Ulangi pola vault: challenge
   bertanda tangan per wallet, lalu POST/PATCH hanya menerima aksi yang tanda tangannya cocok
   dengan `leader_wallet`, dan status `PURCHASED` hanya boleh ditulis bila hash transaksi
   benar-benar memuat `LicensePurchased` untuk token itu. Sampai itu ada, jangan tampilkan
   patungan sebagai bukti on-chain.
2. **Run ulang Fresh Wallet E2E (P0.6)** setelah perubahan ini, lalu perbarui
   `docs/evidence/golden-path.json` dan jalankan `pnpm demo:evidence` + `pnpm protection:evidence`.
   Skenario baru yang wajib diuji: reload setelah B4/B5, dan mencoba beli ulang.
3. **Uji indexer mati saat demo.** Matikan indexer, pastikan gallery tetap menampilkan karya
   lewat fallback rantai dan pesan "Memperbarui index" muncul di halaman detail tanpa berbohong.
4. **Bersihkan artefak repo** (`apps/web/AGENTS.md`, `apps/web/CLAUDE.md`, `hf-reviewer/`,
   `trovaya-ai-reviewer/`, `web3-investment-platform/`, `apps/web/public/assets/*.png`) dari
   status untracked agar tidak ada aplikasi kedua atau aset uji yang ikut ter-deploy.

### P1 (UX clarity)

5. Terjemahkan `phase` menjadi kalimat hasil (P1.2): "License purchase processing → License
   active ✓ → View blockchain proof". Saat ini copy masih teknis ("Nomor bukti", "Memperbarui
   data karya") dan belum ada tautan bukti explorer.
6. UX vault negatif (P1.3): bedakan eksplisit "belum punya lisensi", "lisensi kedaluwarsa",
   "otorisasi belum dicatat", "akses dicabut" — semuanya bisa disimpulkan dari
   `getAccessGrant` (`grantedAt`, `expiresAt`, `revokedAt`) dan sudah tersedia on-chain.
7. Audit istilah (P4.2) pada copy yang tersisa: pastikan tidak ada klaim "AI-proof", "KYC",
   atau "verified identity" tanpa label demo.

### P2 (posisi produk)

8. Putuskan secara sadar apakah patungan dan badge tetap tampil selama P0 belum tuntas (F-12).
9. Jadikan ketiga skrip bukti (`demo:check`, `demo:evidence`, `protection:evidence`) sebagai
   langkah wajib sebelum pitch, bukan opsional.

### P3 (observability)

10. Permukaan UI untuk `/api/health` (status indexer `live`/`awaiting_first_sync` dan cursor
    block) agar tim tidak perlu membuka terminal saat demo.
11. Tambahkan kolom `request_id` pada log route server agar satu transaksi dapat ditelusuri dari
    tx hash ke keputusan server.

## 11. Definisi selesai untuk P0

P0 dianggap selesai ketika, pada satu rantai utama:

1. Wallet baru menyelesaikan seluruh checklist Bagian 4 tanpa intervensi manual yang tidak
   seharusnya dilakukan user.
2. Setiap langkah menampilkan state yang dapat dibedakan: idle, menunggu wallet, dikirim,
   konfirmasi, indexing, selesai, atau gagal dengan alasan yang bisa ditindaklanjuti.
3. Tidak ada satu pun layar yang menyatakan sukses untuk state yang tidak dapat dibuktikan
   di rantai atau di index.
4. `pnpm lint`, `pnpm test`, dan `pnpm build` hijau, dan bukti E2E tersimpan serta lolos
   `pnpm demo:evidence`.




