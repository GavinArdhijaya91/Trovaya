# Backend Golden Path Plan

Status: draft untuk validasi hackathon

Dokumen ini memfokuskan beberapa hari berikutnya pada reliability backend dan
alur demo utama. Pekerjaan frontend/WebGL berada di track terpisah.

## Tujuan

Membuktikan satu alur Trovaya yang dapat diulang:

```text
upload -> protected preview -> encrypt source -> persist -> mint -> index
       -> review evidence -> purchase license -> vault delivery
```

Setiap capability yang belum production-grade harus tetap diberi label
experimental, demo, mock, atau rules-only.

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
- Verifikasi original dienkripsi sebelum persistence.
- Uji mode Pinata dan mode demo secara terpisah.
- Pastikan demo identifier tidak dipresentasikan sebagai CID IPFS.

Acceptance:

- Preview, encrypted source, metadata, dan license terms memiliki status yang
  dapat dibedakan.
- Failure Pinata tidak mengklaim persistence berhasil.
- Batas ukuran, format, dan latency tetap dipatuhi.

### Hari 3 - Mint dan indexing

- Mint dari fresh non-admin wallet di BSC testnet.
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

Acceptance:

- Buyer berizin dapat mendekripsi file yang benar.
- Buyer tanpa izin ditolak.
- Expiry dan revocation menolak delivery baru.
- Evidence tidak memuat key, signature, nonce, atau plaintext.

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

## Kontrak Frontend/WebGL

Frontend hanya perlu bergantung pada kontrak berikut:

- Asset metadata: token ID, preview reference, persistence status, license terms,
  consent, dan vault status.
- Reviewer request: `AssetReviewInput`.
- Reviewer result: `summary`, `evidence`, `flags`, `source`, `ai_available`, dan
  `disclaimer`.
- License state: terms verified, purchase state, authorization state, delivery
  state, expiry, dan revocation.

WebGL boleh mengganti tampilan dan preview interaction tanpa mengubah rules
engine, indexer schema, contract semantics, atau reviewer response contract.

## Definition of Done

- Satu fresh-wallet run berhasil dari upload sampai clean-source delivery.
- Semua service failure path memiliki fallback atau error yang jelas.
- `pnpm demo:check:live`, lint, test, dan build lulus.
- Golden-path evidence tervalidasi.
- Tidak ada klaim bahwa protected preview menjamin anti-scraping.
- Tidak ada secret, plaintext source, atau private vault material di public output.

## Di Luar Scope Sementara

- WebGL redesign.
- Soulbound badge.
- Social publishing.
- Dune/analytics dashboard.
- Fractional funding.
- Real KYC/identity provider.
- Adversarial protection claim tanpa benchmark reproducible.
