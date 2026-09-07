# Client Logo Assets

Semua logo klien disimpan di `public/client-logo/` sebagai `1.png` – `11.png`.

## Struktur

| Lokasi | Kegunaan |
|---|---|
| `public/client-logo/{1..11}.png` | Master asli (jangan diubah, dipakai sebagai sumber) |
| `public/client-logo/optimized/{id}.webp` | Versi hasil optimasi yang **ditampilkan di website** (halaman beranda) |

## Cara Optimasi

Logo ditampilkan di marquee "Klien Kami" dengan tinggi visual identik agar rapi dan seimbang. Master PNG punya padding transparan yang berbeda-beda, jadi setiap logo **di-trim** (padding transparan dibuang), disamakan tingginya menjadi 72px, lalu dikonversi ke WebP:

```bash
magick public/client-logo/1.png -trim +repage -resize 'x72<' -resize 'x72' -quality 82 public/client-logo/optimized/1.webp
```

Ulangi untuk setiap nomor logo.

## Menambah / Mengganti Logo

1. Simpan master baru sebagai `public/client-logo/{nomor}.png` (atau ganti file yang ada).
2. Jalankan perintah optimasi di atas untuk nomor tersebut.
3. Cek dimensi hasilnya: `magick identify public/client-logo/optimized/{nomor}.webp`.
4. Perbarui array `CLIENT_LOGOS` di `resources/js/Pages/Guest/Welcome.jsx` — entri `{ id, w, h }` harus sesuai dimensi hasil `magick identify` (agar browser mereserve ruang dengan benar).
5. Build: `npm run build`.

## Catatan Tampilan

- Semua sel marquee berukuran sama (`--client-cell` × 112px); logo dibatasi `max-width: 168px` / `max-height: 56px` dengan `object-fit: contain`, jadi berapa pun rasio aslinya ukuran optiknya konsisten.
- Logo tampil grayscale 55% dan berwarna penuh saat hover.
- Marquee loop otomatis, berhenti saat hover/focus, dan berubah menjadi baris yang bisa digeser untuk `prefers-reduced-motion`.
