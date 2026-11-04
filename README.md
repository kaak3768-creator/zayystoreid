# ZayyStore — pembayaran & pembelian otomatis (QRIS via Kipay) di Vercel 

## Alur otomatis
1. Pembeli pilih produk → keranjang → isi email (& username Minecraft bila perlu)
2. Server membuat transaksi di Kipay → tampil **QRIS + nominal + hitung mundur**
3. Pembeli bayar → Kipay kirim **webhook** → server verifikasi signature & cek ulang status ke Kipay
4. Produk **otomatis dikirim**: tampil di layar, dikirim ke email, dan admin dapat notifikasi Discord

Harga **selalu dihitung ulang di server** (`lib/catalog.js`), API key tidak pernah ke browser.

## Setup (±10 menit)

### 1. Deploy ke Vercel
Upload folder ini ke GitHub → Vercel → *Add New Project* → pilih repo (Framework: **Other**, tanpa build command).

### 2. Environment Variables (Vercel → Settings → Environment Variables)
| Nama | Isi |
|---|---|
| `KIPAY_API_KEY` | API key project Kipay (`apg_...`) |
| `KIPAY_WEBHOOK_SECRET` | secret `whsec_...` (lihat langkah 3) |
| `ORDER_SECRET` | teks acak panjang (`openssl rand -hex 32`) |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | otomatis terisi bila kamu tambah **Storage → Upstash Redis** (gratis) |
| `RESEND_API_KEY`, `MAIL_FROM` | opsional, email otomatis ke pembeli (resend.com) |
| `DISCORD_WEBHOOK_URL` | opsional, notifikasi pesanan ke Discord |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | login admin panel (ganti dari bawaan!) |

Setelah mengisi, **Redeploy**. Contoh lengkap ada di `.env.example`.

### 3. Webhook di dashboard Kipay
Dashboard Kipay → Projects → isi **Webhook URL**: `https://DOMAINMU.vercel.app/api/webhook`
Secret `whsec_...` hanya tampil **sekali** → salin ke `KIPAY_WEBHOOK_SECRET`. Klik tes webhook (`webhook.test`) — harus sukses.

### 4. Uji di Sandbox dulu
Pakai API key **sandbox** Kipay. Di popup QR akan muncul tombol **"Simulasikan pembayaran berhasil"** (hanya muncul di sandbox).
Setelah lancar, ganti `KIPAY_API_KEY` ke key production → tombol simulasi hilang otomatis.

## Admin Panel
1. Klik **Login** di toko, masuk dengan akun admin (bawaan `admin122@gmail.com` / `admin123`) → tombol **Admin Panel** muncul di samping tombol Keluar. **Ganti kredensial ini** lewat env `ADMIN_EMAIL` & `ADMIN_PASSWORD`.
2. Isi Admin Panel: **Produk** (foto, nama, harga, deskripsi, pesan setelah bayar), **List User**, **Riwayat Transaksi** (berhasil / pending / gagal + akun pembeli), **Aktivitas Akun** (terakhir buka web & total kunjungan).
3. Semua data (produk, akun, riwayat) disimpan di Upstash Redis → **Redis wajib** untuk fitur ini.
4. Password pengguna disimpan sebagai hash (scrypt), tidak bisa dilihat; admin bisa **Reset password** bila pengguna lupa.
5. Tombol "Simulasikan pembayaran berhasil" (sandbox) hanya muncul & hanya berfungsi untuk admin.
6. Kode promo: `COUPONS` di `lib/catalog.js`.

## Mode tanpa Redis
Produk, akun & Admin Panel **tidak berfungsi** (etalase kosong). **Redis wajib.**

## Uji lokal tanpa Kipay
`npm run dev` → http://localhost:3000 (Kipay & Redis palsu; QR hanya contoh, tidak bisa discan).
Uji dengan Kipay sungguhan: buat `.env.local` dari `.env.example`, lalu `npm run dev:real`.

## Struktur
```
api/checkout.js  buat pesanan + transaksi     api/webhook.js   terima webhook Kipay (verifikasi HMAC)
api/status.js    cek status + kirim produk    api/qr.js        proxy gambar QR (API key aman)
api/quote.js     hitung harga/promo           api/simulate.js  simulasi bayar (sandbox saja)
api/admin.js     API admin panel              api/auth.js      login/daftar/aktivitas
api/products.js  etalase produk               api/img.js       foto produk
lib/*            logika bersama               admin.html       halaman Admin Panel
checkout.js      UI checkout/QR/pesanan       script.js        keranjang & UI toko
```

## Catatan keamanan
- Status "lunas" hanya dipercaya dari API Kipay (server-to-server), tidak pernah dari browser.
- Webhook ditolak bila signature salah / timestamp > 5 menit; pengiriman idempotent (tidak dobel).
- Pembeli harus membayar **nominal persis** (ada kode unik 3 digit dari Kipay).
- Jangan commit `.env` ke GitHub.

## Fitur tambahan
- **Paket bundling**: Admin Panel → form produk → centang "Paket bundling" (2–6 produk biasa). Kartu otomatis menampilkan isi paket, harga coret, dan "Hemat Rp …".
- **Kode promo**: diatur di `lib/catalog.js` (bagian `COUPONS`). Saat ini hanya `ZAYYXZELLMC` (diskon 15%, tanpa batas waktu). Tambahkan `until: Date.parse("2026-12-31T23:59:59+07:00")` bila ingin ada batas akhir.
- **Banner "baru saja membeli"**: menampilkan pembelian NYATA yang sudah lunas (nama disamarkan, mis. `bu***`), muncul tiap 1 menit bergantian. Pesanan sandbox tidak ditampilkan di toko sungguhan. Bila belum ada pembelian, banner tidak muncul.
- Produk bawaan (Server 1GB/2GB/3GB + paket) dibuat otomatis SEKALI saat toko pertama dibuka; setelah itu bebas diubah/dihapus dari Admin Panel.

## Fitur tambahan terbaru (plus.js / plus.css, fx.js / fx.css)
Pencarian langsung (tekan `/`), favorit ♥, tombol ke atas + progress scroll, tombol salin kode voucher, animasi keranjang, konfeti saat bayar sukses, efek kilau & partikel, tag OG untuk preview link. Hapus `plus.*` / `fx.*` beserta barisnya di index.html bila tidak ingin dipakai.
Putaran ke-3 (more.js / more.css): running text promo, FAQ, urutkan produk, animasi terbang ke keranjang.
Putaran ke-4 (boost.js / boost.css): navigasi bawah HP, bagikan produk (?p=id), skeleton loading, efek suara opsional, judul tab, pengingat voucher.
Putaran ke-5 (nova.js / nova.css): teks hero mengetik otomatis, section "Kenapa ZayyStore", animasi muncul saat scroll, sorotan cahaya mengikuti kursor di kartu produk, "Terakhir kamu lihat" (tersimpan di browser), filter harga (<25rb / 25–50rb / >50rb) di samping urutkan, rekomendasi "Mungkin kamu suka" di keranjang, dan perbaikan HP: navigasi bawah tidak lagi menutupi tombol bayar. Hapus `nova.*` beserta barisnya di index.html (dan blok `<section id="kenapa">` + `<p class="nova-type">`) bila tidak ingin dipakai.
Putaran ke-6 (nova2.js / nova2.css): kartu "Belanja jadi gampang" berwarna-warni (6 warna gradasi, ikon melayang, nomor besar, kilau saat disentuh), tombol mode malam/siang 🌙☀️ di header (tersimpan di browser), pita ajakan "Siap upgrade Minecraft-mu?", label "Hampir habis — sisa N" bila stok ≤ 5, efek pixel ala Minecraft saat klik tombol, dan parallax halus di hero. Hapus `nova2.*` beserta barisnya di index.html (dan blok bertanda `nova2`, tombol `#novaTheme`) bila tidak ingin dipakai.
Putaran ke-7 (nova3.js / nova3.css): sapaan sesuai jam + titik hijau "order otomatis aktif" di hero, penunjuk gulir, header mengecil saat di-scroll, kartu produk muncul bergantian, langkah "Cara belanja" menyala bergantian, kolom cari di FAQ, dan gelombang sebelum footer. Strip statistik (jumlah produk/kategori) sudah dihapus sesuai permintaan. Hapus `nova3.*` beserta barisnya di index.html (+ `#novaHello`, `.nova-scroll`, `.nova-wave`) bila tidak ingin dipakai.
Putaran ke-8 (nova4.js / nova4.css + manifest.webmanifest + sw.js): kategori berwarna "Mau cari apa hari ini?" (jumlah produk nyata; klik = buka kategori & gulir ke produk), bar keranjang mini yang muncul saat ada isi keranjang, zoom foto produk (klik foto), tombol "📲 Pasang aplikasi" di footer (muncul otomatis bila browser mengizinkan; hanya jalan di https/Vercel), dan pintasan keyboard: `C` keranjang, `N` mode malam, `?` bantuan. Hapus `nova4.*`, `manifest.webmanifest`, `sw.js` beserta barisnya di index.html (+ section `#kategori`) bila tidak ingin dipakai.
