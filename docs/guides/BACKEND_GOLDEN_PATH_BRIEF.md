RENCANA ALUR UTAMA BACKEND TROVAYA

Status: Draft untuk diskusi tim dan kebutuhan hackathon

1. TUJUAN DOKUMEN

Trovaya memiliki beberapa proses yang saling berhubungan. Proses tersebut meliputi unggah karya, pembuatan preview terlindungi, penyimpanan file asli, pencatatan transaksi, lisensi, pemeriksaan AI, dan pemberian akses ke file asli.

Dokumen ini dibuat sebagai penghubung komunikasi antara developer dan project manager. Dokumen ini tidak membahas kode secara detail. Fokusnya adalah menyamakan pemahaman tentang:

1. Urutan proses yang harus berhasil.
2. Fitur yang sudah tersedia.
3. Fitur yang masih berupa demo atau percobaan.
4. Risiko yang harus dijelaskan saat presentasi.
5. Bukti yang harus dikumpulkan sebelum sebuah proses dianggap selesai.

Rencana teknis yang lebih lengkap terdapat di dokumen BACKEND_GOLDEN_PATH_PLAN.md.

PENJELASAN ISTILAH GOLDEN PATH

Golden Path berarti jalur utama yang paling penting dan paling ideal bagi
pengguna. Dalam Trovaya, Golden Path adalah perjalanan lengkap dari creator
mengunggah karya sampai buyer membeli lisensi dan menerima akses yang sah ke
file asli.

Golden Path bukan berarti semua kemungkinan yang dapat terjadi dalam aplikasi.
Jalur ini digunakan sebagai standar pertama untuk memastikan bahwa bagian
terpenting produk dapat berjalan dari awal sampai akhir.

Jika Golden Path sudah berhasil, tim dapat mengembangkan jalur tambahan seperti
penanganan error, pembatalan transaksi, expired license, revoked access,
activity history, dan tampilan WebGL.

2. GAMBARAN PRODUK

Trovaya membantu creator mendaftarkan karya, membuat preview yang lebih aman untuk ditampilkan, menyimpan file asli secara terenkripsi, dan mencatat ketentuan lisensi.

Buyer dapat melihat preview, membeli lisensi, dan meminta akses ke file asli sesuai aturan yang berlaku.

Trovaya mencatat bukti dan persetujuan. Trovaya tidak otomatis membuktikan hak cipta, keaslian karya, identitas legal, atau jaminan bahwa karya tidak dapat disalin oleh sistem lain.

3. URUTAN PROSES UTAMA

1. Creator menghubungkan wallet.
2. Creator menyetujui proses yang akan dilakukan.
3. Creator dapat mengisi mock KYC jika diperlukan untuk demo.
4. Creator mengunggah karya.
5. Sistem membuat preview terlindungi dengan konfigurasi yang tetap.
6. Creator memeriksa preview, watermark, identitas, dan ketentuan lisensi.
7. File asli dienkripsi.
8. Preview, file terenkripsi, metadata, dan ketentuan lisensi disimpan.
9. Karya didaftarkan di blockchain.
10. Karya dibaca oleh indexer dan muncul di aplikasi.
11. Buyer membeli lisensi.
12. Buyer meminta akses ke file asli.
13. Sistem memeriksa hak akses.
14. File asli dikirim secara aman jika semua syarat terpenuhi.

Setiap tahap harus memiliki status yang mudah dipahami, seperti menunggu, berhasil, gagal, atau perlu dicoba kembali.

4. STATUS FITUR SAAT INI

Sudah memiliki dasar implementasi:

1. Creator dapat menghubungkan wallet.
2. Karya dapat diproses melalui Poison Engine.
3. Preview diberi label sebagai percobaan.
4. File asli dienkripsi sebelum disimpan.
5. Ketentuan lisensi dibuat dengan versi dan hash.
6. Karya dapat dicatat di blockchain testnet.
7. Indexer dapat membaca proses pendaftaran dan pembelian.
8. AI Reviewer dapat memberikan ringkasan evidence dan tanda peringatan.
9. Alur pembelian lisensi dan vault delivery sudah memiliki pemeriksaan akses.
10. Tampilan sudah memberi label demo, testnet, mock KYC, dan non-advisory.

Belum boleh dianggap sebagai layanan produksi:

1. KYC atau verifikasi identitas dunia nyata.
2. Jaminan bahwa karya tidak dapat disalin atau digunakan untuk pelatihan AI.
3. Transaksi mainnet atau layanan keuangan produksi.
4. Bukti bahwa token otomatis memindahkan hak cipta.
5. Riwayat aktivitas lengkap untuk semua jenis kegiatan.
6. Export histori transaksi yang sudah final.
7. Audit keamanan production oleh pihak luar.

5. LABEL YANG HARUS TETAP TERLIHAT

DEMO HACKATHON berarti fitur dibuat untuk demonstrasi dan validasi awal.

BSC TESTNET berarti transaksi terjadi di jaringan pengujian, bukan jaringan produksi.

MOCK atau NOT VERIFIED berarti identitas belum diverifikasi oleh pihak ketiga.

EXPERIMENTAL PREVIEW berarti preview masih berupa percobaan dan bukan jaminan perlindungan.

RULES-ONLY berarti hasil hanya berasal dari aturan sistem.

RULES PLUS AI berarti AI membantu membuat ringkasan, tetapi bukan sumber kebenaran dan bukan penasihat hukum atau finansial.

Label tersebut tidak boleh dihilangkan hanya agar demo terlihat lebih matang.

6. PEMBAGIAN PERAN TIM

Project manager memastikan urutan demo disepakati, definisi selesai tidak hanya berdasarkan tampilan, label demo tetap terlihat, dan setiap tahap memiliki bukti validasi.

Project manager juga mencatat perubahan scope dan memastikan keputusan bisnis, legal, serta privasi tidak dianggap selesai hanya karena kode sudah dibuat.

Developer memastikan data berasal dari sumber yang benar, transaksi gagal tidak ditampilkan sebagai transaksi sukses, dan file private, key, KYC, serta session tidak bocor.

Developer juga memastikan pengulangan proses tidak menggandakan transaksi, wallet buyer dan seller dapat dibedakan, error mudah dipahami, dan API tetap stabil untuk frontend atau WebGL.

Hal yang harus disepakati bersama:

1. Apakah tahap tersebut sudah dapat didemokan?
2. Bukti apa yang menunjukkan tahap tersebut berhasil?
3. Apa yang terjadi jika salah satu service gagal?
4. Label apa yang harus terlihat oleh pengguna?
5. Apakah fitur tersebut masuk scope hackathon atau ditunda?
6. Bagian mana yang boleh diubah oleh frontend atau WebGL?

7. FOKUS VALIDASI

Alur creator

Creator harus dapat mengunggah karya, melihat preview, menyetujui metadata dan lisensi, lalu mendaftarkan karya.

Bukti yang diperlukan adalah preview, hash transformasi, metadata, status penyimpanan, transaction hash, dan token ID.

Alur buyer

Buyer harus dapat melihat karya, membaca ketentuan lisensi, membeli lisensi, dan meminta akses ke vault.

Bukti yang diperlukan adalah wallet buyer, hash dan versi terms, biaya, status transaksi, status izin, dan hasil pengiriman file.

Alur histori

Workspace harus dapat menampilkan siapa melakukan apa, terhadap karya mana, kapan dilakukan, dan apa hasilnya.

Wallet address dapat digunakan sebagai identitas samaran, misalnya 0x12ab...89ef. Wallet address bukan KYC dan bukan nama legal.

Alur kegagalan

Tim harus dapat menunjukkan perilaku aplikasi ketika Poison Engine tidak tersedia, Pinata gagal, transaksi ditolak, indexer terlambat, AI Reviewer tidak tersedia, lisensi kedaluwarsa, atau akses vault ditolak.

Sistem yang baik tidak menyembunyikan kegagalan. Sistem harus memberikan status yang jelas dan tidak mengklaim pekerjaan yang belum terjadi.

8. HISTORI DAN ACTIVITY LOG

History sebaiknya menyerupai catatan aktivitas pada aplikasi SaaS, bukan hanya invoice.

Contoh catatan:

Creator 0x12ab...89ef mendaftarkan Asset 12. Status: berhasil.

Buyer 0x78cd...45aa membeli lisensi Asset 12. Status: berhasil.

Buyer 0x78cd...45aa meminta akses vault Asset 12. Status: menunggu.

Vault memberikan akses Asset 12 sampai tanggal tertentu. Status: berhasil.

Creator 0x12ab...89ef menarik hasil lisensi. Status: berhasil.

Status harus membedakan menunggu, berhasil, gagal, kedaluwarsa, dan dicabut. Sumber kebenaran tetap blockchain dan data indexer yang sudah dikonfirmasi.

9. PERTANYAAN UNTUK DISKUSI TIM

1. Apakah mock KYC cukup untuk demo, atau perlu dibuat sebagai halaman terpisah?
2. Apakah preview memakai satu konfigurasi tetap selama hackathon?
3. Data apa yang harus tampil di history creator dan buyer?
4. Apakah CSV cukup, atau perlu juga menyediakan PDF?
5. Berapa lama waktu tunggu yang masih dianggap wajar untuk indexer dan vault?
6. Bagaimana aplikasi memberi tahu pengguna bahwa transaksi masih menunggu?
7. Fitur apa yang wajib untuk penilaian hackathon dan apa yang ditunda?
8. Bagian mana yang akan diganti oleh frontend atau WebGL tanpa mengubah backend?

10. SYARAT DEMO DIANGGAP SIAP

Alur demo dapat disebut siap jika:

1. Creator baru berhasil mendaftarkan satu karya.
2. Preview, metadata, dan ketentuan lisensi dapat diperiksa.
3. Buyer berhasil membeli lisensi menggunakan wallet yang berbeda.
4. History menunjukkan creator, buyer, karya, biaya, transaction hash, dan status.
5. Vault delivery hanya berhasil untuk pengguna yang memiliki hak akses.
6. AI Reviewer menghasilkan hasil non-advisory atau fallback rules-only.
7. Semua label demo, testnet, mock, dan experimental terlihat.
8. Kegagalan tidak menghasilkan informasi yang menyesatkan.
9. Tidak ada private key, KYC mentah, content key, OTP, session token, atau file asli di output publik.
10. Developer dan project manager menyetujui bukti yang dikumpulkan.

11. HAL YANG TIDAK BOLEH DISIMPULKAN

1. Wallet address bukan verifikasi identitas legal.
2. Token bukan otomatis sertifikat hak cipta.
3. Preview terlindungi bukan jaminan anti-scraping.
4. AI Reviewer bukan penasihat hukum, finansial, atau penentu keaslian.
5. Transaksi testnet bukan transaksi produksi.
6. Vault authorization bukan berarti semua orang dapat mengakses file asli.

12. DOKUMEN TERKAIT

BACKEND_GOLDEN_PATH_PLAN.md berisi rencana teknis dan kriteria penerimaan.

TRUST_AND_IDENTITY.md berisi batasan identity, account, dan mock KYC.

MASTER_SPEC.md berisi spesifikasi produk dan kebijakan klaim.

INTEGRATION.md berisi panduan integrasi service dan deployment.
