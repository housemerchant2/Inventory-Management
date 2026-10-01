# Smart Inventory PWA

Aplikasi manajemen inventaris multi-brand (React + Vite + Tailwind) yang sudah:
- **Terhubung ke Supabase** sebagai backend database (dengan fallback data demo).
- **Siap deploy ke Vercel**.
- **Menjadi PWA** (Progressive Web App) dengan service worker + offline queue.

## Struktur

```
index.html                  # entry HTML (root, sesuai konvensi Vite)
src/
  main.tsx                  # bootstrap React + registrasi Service Worker (virtual:pwa-register)
  App.tsx                   # routing halaman
  context/AppContext.tsx    # state global; sync CRUD ke Supabase bila kredensial tersedia
  lib/supabase.ts           # klien Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
  lib/offlineQueue.ts       # antrean transaksi saat offline (localStorage) + flush ke Supabase
  data/mockData.ts          # data demo (dipakai bila Supabase belum dikonfigurasi)
public/
  manifest.webmanifest      # manifest PWA
  icon-192.png / icon-512.png  # ikon placeholder — ganti dengan desain asli
supabase/schema.sql         # skema tabel users/brands/items/transactions + RLS
vercel.json                 # konfigurasi build & header PWA untuk Vercel
vite.config.ts              # vite-plugin-pwa (generateSW, autoUpdate)
.env.example                # template variabel lingkungan
```

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env        # isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY
npm run dev
```

Tanpa `.env`, aplikasi berjalan dalam **mode demo** memakai `mockData.ts`.

## Menghubungkan ke Supabase

1. Buat project di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, jalankan isi `supabase/schema.sql`.
3. Ambil **Project URL** dan **anon public key** dari *Project Settings → API*, isi ke `.env` (atau Environment Variables di Vercel):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Reload aplikasi — data user/brand/item/transaksi kini dimuat & disimpan via Supabase.

> Catatan: policy RLS pada schema bersifat terbuka agar mudah dipakai tanpa auth. Ketatkan sebelum produksi (mis. dengan Supabase Auth).

## Menjadi PWA

- `vite-plugin-pwa` menghasilkan `sw.js` (Workbox, mode `generateSW`, `autoUpdate`) yang meng-cache seluruh aset build sehingga aplikasi dapat dibuka offline dan dapat di-install ke homescreen.
- Transaksi yang dibuat saat offline masuk antrean (`localStorage`) dan otomatis dikirim ke Supabase ketika koneksi pulih (lihat `src/lib/offlineQueue.ts`).
- Verifikasi: `npm run build && npm run preview`, lalu buka DevTools → Application → Manifest/Service Workers. Chrome akan menampilkan prompt *Install app*.
- Ganti `public/icon-192.png` dan `icon-512.png` dengan ikon asli (minimal 192px & 512px, format PNG).

## Deploy ke Vercel

**Opsi A — Dashboard:** Import repo ini di vercel.com. Framework terdeteksi *Vite* (lihat `vercel.json`). Tambahkan Environment Variables `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` (Production), lalu Deploy.

**Opsi B — CLI:**
```bash
npm i -g vercel
vercel link
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
npm run deploy   # = vercel --prod
```

HTTPS otomatis disediakan Vercel — syarat wajib PWA terpenuhi.

## Skrip

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Build produksi + service worker PWA |
| `npm run preview` | Pratinjau hasil build (menguji SW/offline) |
| `npm run typecheck` | Pemeriksaan tipe TypeScript |
| `npm run deploy` | Deploy produksi ke Vercel |
