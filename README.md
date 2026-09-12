# Novel Publisher Studio — Versi Modular

Struktur:
- `index.html` — struktur UI saja
- `css/style.css` — seluruh styling
- `js/app.js` — event handling dan orkestrasi aplikasi
- `js/utils.js` — helper DOM dan clipboard
- `js/html-cleaner.js` — logika pembersihan HTML
- `js/text-splitter.js` — logika pemecah teks novel
- `js/toc-maker.js` — formatter dan generator TOC Blogger

## Cara menjalankan

Buka `index.html` melalui browser modern.

Karena aplikasi menggunakan ES Modules (`type="module"`), beberapa browser/konfigurasi lokal dapat membatasi module jika dibuka langsung dari `file://`.
Jika terjadi masalah, jalankan folder ini melalui server lokal sederhana, misalnya:

```bash
python -m http.server
```

Lalu buka alamat localhost yang diberikan browser.

## Catatan

Logika utama dari versi asli dipertahankan:
1. HTML Cleaner
2. Novel Text Splitter
3. Post & TOC Maker

Inline `onclick` juga dihilangkan. Semua interaksi sekarang ditangani secara terpusat melalui `data-action` dan event delegation.
