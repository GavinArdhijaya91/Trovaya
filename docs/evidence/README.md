# Trovaya Protocol — Live Golden Path Evidence

Dokumentasi bukti verifikasi end-to-end (Golden Path) Trovaya Protocol pada **BNB Smart Chain Testnet (Chain ID 97)** untuk penilaian juri hackathon.

---

## 1. Ringkasan Eksekusi Live (Token ID #14)

| Parameter | Nilai On-Chain / IPFS | Verifikasi |
| :--- | :--- | :--- |
| **Network** | BNB Smart Chain Testnet | Chain ID: `97` |
| **Token ID** | **`14`** | ERC-721 On-Chain |
| **Kreator Wallet** | `0x45f0e3Ec2c806Af2502d72F3Ec87d42E9AF1c3dC` | Saldo gas funded |
| **Pembeli Wallet** | `0xb31a48309e3c7a47d991bbF55bb90c9787cf4E5c` | Wallet terpisah |
| **Trovaya IP NFT Contract** | `0x3dCA908025e6276285BbFfD584357aD06Ba7Db9F` | Bytecode & Role Verified |
| **Trovaya Vault Contract** | `0x4b47095929251ECb3E332B5b8048C466Ec5D3794` | Bytecode & Role Verified |

---

## 2. Transaksi Blockchain (Dapat Diverifikasi di BSCScan)

1. **Minting Transaksi (Kreator mendaftarkan karya & consent)**:
   - **Tx Hash**: [`0xb1ed6509f25be67d7a8f77da906b5c40fcaa775426329d75060524ee94c28c03`](https://testnet.bscscan.com/tx/0xb1ed6509f25be67d7a8f77da906b5c40fcaa775426329d75060524ee94c28c03)
   - Blok: `130332934` · Status: **Success**

2. **Pembelian Lisensi Komersial (Pembeli membeli lisensi)**:
   - **Tx Hash**: [`0xb1b142f94fdb9b5540a337fee8b392f1b2cd8f543d2fb3e49a21e8733e2fe2d0`](https://testnet.bscscan.com/tx/0xb1b142f94fdb9b5540a337fee8b392f1b2cd8f543d2fb3e49a21e8733e2fe2d0)
   - Blok: `130335971` · Status: **Success**

3. **Otorisasi Akses Vault (`unlockWithLicense`)**:
   - **Tx Hash**: [`0xe9da5011eaeb2c8b128f950a1c9fcbce5571db271380c3d4b1876fab614319ba`](https://testnet.bscscan.com/tx/0xe9da5011eaeb2c8b128f950a1c9fcbce5571db271380c3d4b1876fab614319ba)
   - Blok: `130335984` · Status: **Success**

---

## 3. Penyimpanan Permanen IPFS (Pinata Dedicated Gateway)

Semua file dan metadata tersimpan secara permanen dan dapat diakses publik 24/7 melalui Pinata Dedicated Gateway resmi:

1. **Metadata On-Chain JSON**:
   [https://rose-worthy-unicorn-283.mypinata.cloud/ipfs/QmNWoo5nQoAg8Fv5MyRwe6FoLYcNeA7MM54r7MGbRTts82](https://rose-worthy-unicorn-283.mypinata.cloud/ipfs/QmNWoo5nQoAg8Fv5MyRwe6FoLYcNeA7MM54r7MGbRTts82)
2. **Pratinjau Publik Terpoison (Python Pillow/NumPy)**:
   [https://rose-worthy-unicorn-283.mypinata.cloud/ipfs/QmVLdsjg1wgsdN9mACubW9JsN9FuHf8w9qnH9ANif8mUJ7](https://rose-worthy-unicorn-283.mypinata.cloud/ipfs/QmVLdsjg1wgsdN9mACubW9JsN9FuHf8w9qnH9ANif8mUJ7)
3. **Master File Terenkripsi (Ciphertext AES-GCM 256)**:
   [https://rose-worthy-unicorn-283.mypinata.cloud/ipfs/Qmdm9Yc9oCAUB8VPeHbbpKppqcSFh4kUqga68ALEVtTHYt](https://rose-worthy-unicorn-283.mypinata.cloud/ipfs/Qmdm9Yc9oCAUB8VPeHbbpKppqcSFh4kUqga68ALEVtTHYt)
4. **Ketentuan Lisensi V1 (License Terms JSON & Hash)**:
   [https://rose-worthy-unicorn-283.mypinata.cloud/ipfs/QmadUZPYdpz4L4cT6verXT1qKeSxRhXHzbA9ggYmVtWafL](https://rose-worthy-unicorn-283.mypinata.cloud/ipfs/QmadUZPYdpz4L4cT6verXT1qKeSxRhXHzbA9ggYmVtWafL)

---

## 4. Keamanan & Pengiriman Kunci (Key Delivery)

- **Uji Negatif (Unauthorized Access)**:
  Dompet tanpa lisensi yang mencoba meminta kunci melalui endpoint `/api/vault/keys/deliver` ditolak dengan **HTTP 403 Forbidden** (*"Lisensi dan otorisasi vault aktif diperlukan"*).
- **Uji Positif (Authorized Access)**:
  Dompet pembeli berlisensi menerima kunci konten yang dibungkus dengan algoritma **RSA-OAEP-256**, kemudian didekripsi di browser pembeli dengan AES-GCM 256.
- **Integritas File Asli**:
  SHA-256 file hasil dekripsi: `bd09d30fe22cebbc33b50026a9dcef221abef08afc9269d8e7856356eacc08fe`.

---

## 5. Perintah Validasi Mandiri untuk Juri

Untuk memvalidasi dokumen evidence ini secara mandiri menggunakan skrip repository resmi:

```bash
pnpm demo:evidence docs/evidence/golden-path.json
```

Hasil uji: **35/35 kriteria PASSED** tanpa kegagalan.
