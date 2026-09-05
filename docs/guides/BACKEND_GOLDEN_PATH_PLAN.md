# Backend Golden Path Plan

Status: draft untuk validasi hackathon

Dokumen ini memfokuskan beberapa hari berikutnya pada reliability backend dan
alur demo utama. Pekerjaan frontend/WebGL berada di track terpisah.

## Tujuan

Membuktikan satu alur Trovaya yang dapat diulang:

```text
connect wallet -> creator consent -> optional mock KYC -> upload
     -> fixed protected preview -> watermark/identity metadata
     -> encrypt source -> persist -> review evidence -> mint -> index
     -> publish public preview -> purchase license -> vault delivery
```

Setiap capability yang belum production-grade harus tetap diberi label
experimental, demo, mock, atau rules-only.

## Label Transparansi Hackathon

Selama fitur production belum tersedia, UI dan evidence harus menampilkan label
yang mudah terlihat:

- Transaksi: `DEMO HACKATHON` dan `BSC Testnet`; jangan menyebutnya transaksi
  production atau mainnet.
- KYC/identitas: `mock/not_verified`; wallet ownership tidak sama dengan KYC
  dan tidak membuktikan keaslian karya.
- Protected preview: `EXPERIMENTAL PREVIEW`; jangan mengklaim jaminan anti-scraping.
- Persistence: `MODE DEMO` bila identifier bukan CID IPFS nyata.
- AI Reviewer: `rules-only` atau `rules + AI`, selalu dengan disclaimer
  non-advisory.

Label ini wajib muncul di Protection Studio, Workspace transaksi, profil trust,
public gallery, dan evidence artifact. Label dapat dihapus atau diganti hanya
setelah capability production memiliki acceptance evidence yang sesuai.

## KYC dan Identitas

KYC **belum menjadi bagian dari implementasi upload saat ini**. Yang tersedia
sekarang adalah wallet signing, metadata creator, dan dokumen desain mock-KYC.
Mock-KYC harus diposisikan sebagai trust signal terpisah, bukan bukti identitas
atau keaslian karya.

Workflow sementara:

1. Creator menghubungkan wallet dan mengonfirmasi consent.
2. Creator dapat mengisi mock-KYC; dokumen diberi watermark `SAMPLE/CONTOH`
  dan status tetap `mock/not_verified`.
3. Creator mengunggah karya dan mengonfirmasi ringkasan sebelum proses dimulai.
4. Poison Engine menghasilkan protected preview dengan konfigurasi tetap dan
  hash transformasi yang ditampilkan.
5. Sistem menambahkan watermark/status identitas pada metadata publik tanpa
  menaruh dokumen KYC atau PII ke blockchain/IPFS publik.

KYC production membutuhkan issuer, assurance level, expiry, revocation, appeal,
retention, dan privacy review. Wallet ownership, AI Reviewer, atau token NFT
tidak boleh dipresentasikan sebagai KYC.

## Urutan Pekerjaan

### Hari 1 - Baseline dan readiness

- Jalankan `pnpm demo:check:live`.
- Pastikan Poison Engine, AI Reviewer, Supabase, Pinata, RPC, dan indexer memakai
  deployment yang sama.
- Catat commit, contract addresses, deployment block, dan status service.
- Bekukan kontrak API yang akan dipakai frontend/WebGL.

Acceptance:

- Readiness lokal dan live lulus.
- Tidak ada secret yang masuk evidence atau log.
- URL dan chain configuration konsisten.

### Hari 2 - Protected preview dan persistence

- Uji upload file yang didukung.
- Verifikasi Poison Engine menghasilkan preview yang diberi label experimental.
- Bekukan parameter transformasi pada satu versi/configuration ID; jangan
  menerima perubahan intensitas setelah preview/hash dibuat.
- Tampilkan preview, watermark, identity status, dan consent summary untuk
  konfirmasi creator sebelum pinning dan mint.
- Verifikasi original dienkripsi sebelum persistence.
- Uji mode Pinata dan mode demo secara terpisah.
- Pastikan demo identifier tidak dipresentasikan sebagai CID IPFS.

Acceptance:

- Preview, encrypted source, metadata, dan license terms memiliki status yang
  dapat dibedakan.
- Parameter protected preview dan hash transformasi konsisten antara preview,
  metadata, dan evidence artifact.
- Mock-KYC hanya menghasilkan status `mock/not_verified` dan tidak mengunggah
  PII ke public storage.
- Failure Pinata tidak mengklaim persistence berhasil.
- Batas ukuran, format, dan latency tetap dipatuhi.

### Hari 3 - Mint dan indexing

- Mint dari fresh non-admin wallet di BSC testnet.
- Mint hanya setelah creator mengonfirmasi preview, identity status, consent,
  terms, fee, dan persistence summary.
- Pastikan token creator, terms hash/version, consent, fee, dan references cocok.
- Jalankan indexer dari deployment block.
- Verifikasi row gallery dan allowlist public tidak membocorkan vault/key/session.
- Uji restart, retry, confirmation, dan duplicate event.

Acceptance:

- Token dapat ditemukan kembali oleh indexer.
- Data on-chain dan Supabase konsisten.
- Public gallery hanya menerima field yang memang public.

### Hari 4 - License dan vault delivery

- Beli license memakai terms hash/version yang tepat.
- Verifikasi withdrawal credit creator.
- Uji authorization dan secure key delivery.
- Uji unauthorized, expired, revoked, dan replayed challenge.
- Pastikan browser menerima ciphertext/wrapped key, bukan master key atau plaintext
  dari service.
- Bentuk transaction receipt terstruktur setelah purchase, authorization, dan
  delivery; simpan referensi transaction hash, token ID, terms hash/version,
  buyer/creator address yang sudah dipendekkan, fee, chain, dan timestamp.

Acceptance:

- Buyer berizin dapat mendekripsi file yang benar.
- Buyer tanpa izin ditolak.
- Expiry dan revocation menolak delivery baru.
- Evidence tidak memuat key, signature, nonce, atau plaintext.

### Receipt dan export histori transaksi

Pengguna perlu dapat meninjau histori pembelian dan mengunduh bukti transaksi.
Sumber kebenaran tetap receipt on-chain dan event indexer; PDF/CSV hanya format
turunan untuk dibaca atau dianalisis.

Rencana implementasi bertahap:

1. **Transaction history:** tampilkan purchase, license terms accepted, vault
   authorization, delivery status, dan withdrawal dengan status pending,
   confirmed, atau failed.
2. **Canonical receipt:** bentuk JSON versioned yang berisi chain ID, token ID,
   transaction hash, block number, event type, fee, terms hash/version, status,
   timestamp, dan label `DEMO HACKATHON`/`BSC Testnet`.
3. **CSV export:** sediakan export untuk analisis histori, tanpa raw KYC,
   content key, signature, nonce, session token, atau plaintext source.
4. **Printable PDF:** buat PDF dari canonical receipt untuk kebutuhan arsip
   pengguna. PDF menampilkan disclaimer bahwa ini bukti pencatatan transaksi,
   bukan sertifikat hak cipta, KYC, atau nasihat hukum/finansial.

Acceptance:

- Receipt hanya dibuat dari data yang tervalidasi oleh indexer atau response
  transaksi yang confirmed.
- Pending/failed transaction tidak boleh tampil sebagai pembelian sukses.
- Receipt dapat diverifikasi kembali memakai chain ID, contract address, token
  ID, transaction hash, terms hash/version, dan block explorer link.
- Export tidak membocorkan data private dan tetap mempertahankan label demo,
  testnet, mock-KYC, serta non-advisory.
- PDF dan CSV tidak menjadi input authoritative untuk vault delivery atau
  keputusan akses.

### Activity log dan identitas wallet

History sebaiknya berbentuk activity log ala SaaS, bukan hanya daftar invoice.
Setiap baris menjelaskan siapa melakukan apa, terhadap asset mana, kapan, dan
apa statusnya.

Event minimum yang perlu ditampilkan:

- `IPMinted`: creator mendaftarkan asset.
- `LicensePurchased`: buyer membeli license dari creator.
- `LicenseTermsAccepted`: buyer menerima terms hash/version tertentu.
- `ProceedsWithdrawn`: creator menarik proceeds ke recipient.
- `VaultAccessGranted`: buyer atau creator mendapat grant vault.
- `VaultAccessRevoked`: grant vault dicabut.
- `ReviewRequested`/`ReviewCompleted`: AI Reviewer menghasilkan audit,
  tanpa menyimpan prompt rahasia atau content key.
- `PersistenceCompleted`/`PersistenceFailed`: preview, encrypted source,
  terms, atau metadata berhasil/gagal dipersist.

Identitas penjual dan pembeli untuk demo menggunakan wallet address sebagai
identitas pseudonymous. UI menampilkan bentuk pendek seperti
`0x12ab...89ef`, dengan tombol salin dan link block explorer; address lengkap
tetap tersedia hanya bila pengguna memang memintanya. Jangan menjadikan wallet
address sebagai KYC, nama legal, atau bukti identitas dunia nyata.

Status activity harus membedakan `pending`, `confirmed`, `failed`, `expired`,
dan `revoked`. Event yang belum confirmed tidak boleh disebut transaksi sukses.
Indexer perlu menyimpan chain ID, contract address, transaction hash, block
number/hash, log index, actor wallet, counterparty wallet bila public, token ID,
event type, status, dan timestamp untuk deduplikasi serta reorg recovery.

Gap implementasi saat ini: indexer baru memproyeksikan event mint dan purchase;
withdrawal, vault access, terms acceptance, persistence, dan reviewer activity
belum menjadi activity stream terpadu. Implementasikan projection terpisah yang
allowlisted dan jangan mencampurkan raw KYC, session, key, signature, nonce,
atau plaintext ke history publik.

### Matriks akses buyer dan seller

Role bisnis berikut harus dibedakan dari role administrasi smart contract:

| Actor | Boleh | Tidak boleh |
| --- | --- | --- |
| Seller/creator | Membuat asset, menetapkan consent/terms/fee, menerima proceeds, meminta withdrawal, dan mencabut grant vault sesuai aturan | Mengakses wallet buyer, secret buyer, atau mengklaim KYC production |
| Buyer/licensee | Membeli license dengan terms hash/version yang cocok, menerima receipt, meminta vault unlock, dan mengunduh source setelah authorization | Mengubah terms asset, mengubah creator, mencabut akses, atau mengambil source tanpa grant |
| Contract admin | Mengelola role protocol, pause/unpause, dan konfigurasi verifier sesuai contract rules | Mengubah receipt immutable atau membaca private key/content key |
| Indexer/system | Memproyeksikan event confirmed, status, dan activity history | Menjadi actor transaksi, memberi akses vault, atau menggantikan signature wallet |

Aturan penting: wallet address seller/buyer adalah identitas pseudonymous untuk
activity log, bukan role permanen dan bukan KYC. Role harus ditentukan dari
hubungan actor terhadap `tokenId`, receipt license, ownership/creator metadata,
dan event chain yang sudah confirmed. UI boleh menampilkan label `Seller`,
`Buyer`, `Creator`, atau `System` hanya jika hubungan tersebut dapat dibuktikan
dari data yang tervalidasi.

Acceptance role/access:

- Buyer tanpa `hasCommercialLicense` tidak dapat memanggil jalur license vault
  delivery.
- Buyer dengan license yang expired atau revoked ditolak untuk delivery baru.
- Seller/creator dapat revoke grant sesuai aturan, tetapi tidak dapat membaca
  secret buyer.
- Admin/pauser/minter tidak otomatis menjadi seller atau buyer.
- Activity history menampilkan actor, counterparty, role context, dan status
  tanpa membocorkan material private.

### Hari 5 - AI Reviewer dan demo evidence

- Kirim evidence public asset ke AI Reviewer.
- Verifikasi rules-only fallback saat provider AI tidak tersedia.
- Verifikasi `rules+ai` saat OpenRouter tersedia.
- Pastikan output selalu non-advisory dan tidak mengklaim authenticity/legal proof.
- Generate golden-path evidence artifact dan validasi dengan script repository.

Acceptance:

- Reviewer live reachable.
- Fallback rules-only tetap menghasilkan flags.
- AI summary tidak mengubah rules engine sebagai sumber authoritative.
- Evidence artifact dapat divalidasi tanpa secret.

### Keamanan transaksi dan data

- Mint, purchase, vault unlock, dan withdrawal harus menampilkan chain, target,
  token ID, fee, terms hash/version, dan destination sebelum signature.
- Setiap wallet challenge harus single-use, memiliki expiry, dan diikat ke
  operasi serta token ID yang tepat.
- Jangan menaruh private key, seed phrase, raw KYC, OTP, master key, content key,
  plaintext source, atau session token di evidence, metadata publik, atau logs.
- IPFS/public metadata hanya berisi protected preview dan allowlisted provenance;
  encrypted vault reference bukan bukti bahwa plaintext dapat diakses.
- Retry harus idempotent atau dapat dideteksi agar tidak menggandakan mint,
  purchase, pinning, atau key registration.

## Kontrak Frontend/WebGL

Frontend hanya perlu bergantung pada kontrak berikut:

- Asset metadata: token ID, preview reference, persistence status, license terms,
  consent, dan vault status.
- Reviewer request: `AssetReviewInput`.
- Reviewer result: `summary`, `evidence`, `flags`, `source`, `ai_available`, dan
  `disclaimer`.
- License state: terms verified, purchase state, authorization state, delivery
  state, expiry, dan revocation.
- Identity state: wallet verified, mock-KYC status, issuer/assurance label,
  expiry, dan revocation. Raw KYC documents are never part of this contract.

WebGL boleh mengganti tampilan dan preview interaction tanpa mengubah rules
engine, indexer schema, contract semantics, atau reviewer response contract.

## Definition of Done

- Satu fresh-wallet run berhasil dari upload sampai clean-source delivery.
- Semua service failure path memiliki fallback atau error yang jelas.
- `pnpm demo:check:live`, lint, test, dan build lulus.
- Golden-path evidence tervalidasi.
- Histori transaksi menampilkan receipt confirmed dan export CSV/printable PDF
  tidak membocorkan data private.
- Tidak ada klaim bahwa protected preview menjamin anti-scraping.
- Tidak ada secret, plaintext source, atau private vault material di public output.
- Label demo/testnet/mock-KYC terlihat pada UI dan evidence sebelum demo dimulai.

## Di Luar Scope Sementara

- WebGL redesign.
- Soulbound badge.
- Social publishing.
- Dune/analytics dashboard.
- Fractional funding.
- Real KYC/identity provider.
- Adversarial protection claim tanpa benchmark reproducible.
