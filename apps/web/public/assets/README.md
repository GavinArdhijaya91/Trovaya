# Frontend Assets

Folder ini untuk kontribusi aset frontend Trovaya.

## Aturan
- Simpan gambar publik di `apps/web/public/assets/`
- Akses di komponen via `/assets/nama-file.jpg` (bukan import)
- Jaga ukuran file: maksimal 500KB per gambar, kompres sebelum commit
- Nama file: kebab-case, contoh `flower-photo.jpg`, `batik-motif-01.webp`
- Jangan commit file `.env.local`, build output, atau data pribadi
- Sertakan sumber/lisensi jika pakai aset eksternal

## Contoh pakai
```tsx
import Image from "next/image";
<Image src="/assets/flower-photo.jpg" alt="Bunga untuk demo poison engine" width={800} height={600} />
```

## File demo
- `flower-photo.jpg` — taruh file kamu di sini untuk mengganti foto poison engine di hero landing page (`components/hero-poison-demo.tsx:17`). Jika file belum ada, komponen akan fallback ke gradient placeholder.

## Checklist sebelum PR
- [ ] File terkompres dan bernama kebab-case
- [ ] `pnpm lint && pnpm test && pnpm --filter @trovaya/web build` lolos
- [ ] Tidak ada secret atau asset berlisensi terlarang
