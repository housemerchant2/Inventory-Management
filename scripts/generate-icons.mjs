// Membuat ikon PWA sederhana (PNG solid + emoji tidak bisa; gunakan placeholder biru).
// Ganti public/icon-192.png & icon-512.png dengan desain asli sebelum produksi.
import { writeFileSync } from 'node:fs';

// PNG 1x1 pixel biru (#2563eb) — browser akan me-resize; cukup untuk validasi manifest.
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNtYWDqZ2BgAGr/Av/7kTWLAAAAAElFTkSuQmCC',
  'base64'
);
writeFileSync('public/icon-192.png', png);
writeFileSync('public/icon-512.png', png);
console.log('Ikon placeholder dibuat: public/icon-192.png, public/icon-512.png');
