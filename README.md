# Duit Kita

Aplikasi web keuangan pribadi, dirancang untuk layar ponsel. Dibuat dengan
Next.js 14 (App Router) + Supabase, gratis di-hosting di Vercel.

## Isi aplikasi

| Halaman | Fungsi |
|---|---|
| Beranda | Total saldo, ringkasan masuk/keluar bulan ini, anggaran terketat, target, transaksi terakhir |
| Transaksi | Daftar per hari, cari, filter jenis, pindah bulan, tambah/ubah/hapus |
| Anggaran | Batas belanja per kategori per bulan (pribadi & bersama), atur semua sekaligus |
| Laporan | Diagram lingkaran pengeluaran per kategori + batang masuk/keluar 6 bulan |
| Dompet | Tunai, bank, e-wallet, kartu, investasi — saldo dihitung otomatis |
| Kategori | Kategori pemasukan & pengeluaran dengan ikon |
| Target | Target tabungan dengan setoran bertahap |
| Langganan | Tagihan & transaksi berulang (mingguan/bulanan/tahunan), komitmen bulanan |
| Transaksi cepat | Template 1-ketuk yang muncul di Beranda |
| Profil | Nama, pemilih tema, kunci PIN, ekspor CSV, keluar |

Fitur lain: pencatatan pindah dana antar dompet, 7 tema tampilan
(Kertas, Malam, Futuristik, Go Green, Senja, Samudra, Grand Line) lewat
Profil, PWA (bisa dipasang ke home screen), dan Row Level Security sehingga
data tiap akun terisolasi di database.

### Kalkulator di kolom jumlah

Semua kolom nominal menerima ekspresi: ketik `15000+3200+50000` atau pakai
tombol `+ − ×` di bawah kolom. Hasilnya tampil langsung (`= Rp 68.200`).

### Transaksi cepat

Buat template di **Lainnya → Transaksi cepat** (atau centang "Simpan juga
sebagai transaksi cepat" saat mencatat). Template muncul sebagai tombol
di Beranda — sekali ketuk langsung tercatat dengan tanggal hari ini.

### Langganan & transaksi berulang

**Lainnya → Langganan**: Netflix, listrik, cicilan, iuran. Atur siklus
(mingguan/bulanan/tahunan) dan tanggalnya. Yang **otomatis** langsung
tercatat saat Beranda dibuka; sisanya muncul sebagai kartu "Langganan jatuh
tempo" dengan tombol **Catat / Lewati**. Total "komitmen bulanan" dihitung
otomatis (mingguan × 52⁄12, tahunan ÷ 12).

### Aktivitas keluarga

Di Beranda, bila kamu punya dompet bersama, muncul daftar aktivitas terbaru
anggota lain: **"Rina catat Belanja · 2 jam lalu · Rp 150.000"**.

### Kunci PIN

**Profil → Kunci PIN**: 6 angka. Aplikasi mengunci diri setelah ±90 detik
tidak dipakai atau setelah di-background lalu dibuka lagi. PIN di-hash
(SHA-256 + garam acak) di HP; server tak pernah menyimpan PIN asli.
"Lupa PIN?" menghapus PIN setelah verifikasi kata sandi akun.

### Dompet bersama (catatan keluarga)

Dua orang bisa berbagi satu dompet untuk mencatat pengeluaran bersama:

1. Pemilik dompet buka **Dompet → pilih dompet → Buat kode undangan**.
2. Kode 6 karakter itu dibagikan (berlaku 7 hari, sekali pakai).
3. Orang kedua buka **Dompet → Gabung**, masukkan kode.

Setelah gabung, keduanya bisa mencatat, mengubah, dan menghapus transaksi di
dompet itu; saldo dihitung dari semua transaksi siapa pun. Di halaman
Transaksi dan Beranda muncul label **"oleh &lt;nama&gt;"** untuk catatan dari
anggota lain. Setelan dompet (nama, jenis, saldo awal) tetap hanya bisa
diubah pemiliknya. Anggota bisa keluar kapan saja lewat panel dompet.

### Anggaran bersama

Di halaman **Anggaran**, kalau kamu punya dompet bersama muncul chip
**Pribadi / 🤝 &lt;nama dompet&gt;** di atas. Pilih dompet bersama untuk
mengatur anggaran yang **dilihat & diubah kedua anggota**. Terpakainya
dihitung dari semua transaksi di dompet itu (dari siapa pun), dicocokkan
berdasarkan **nama kategori** — jadi kategori "Makan & minum" milik masing-masing
tetap dijumlahkan jadi satu.

Pembuatannya dibuat cepat: tombol **Buat/Atur anggaran** membuka satu layar
berisi semua kategori sekaligus — tinggal isi angkanya. Ada tombol **"Isi
dari belanja bulan lalu"** (mengisi semua sekaligus dari realisasi bulan lalu)
dan tiap baris menampilkan angka bulan lalu yang bisa dipakai sekali ketuk.

> Butuh `supabase/anggaran-bersama.sql` (jalankan sekali untuk database lama;
> perlu `dompet-bersama.sql` lebih dulu). Instalasi baru sudah lengkap dari
> `schema.sql`.

> Fitur ini butuh tabel & kebijakan tambahan. Kalau database-mu **sudah
> jalan** sebelum fitur ini ada, jalankan `supabase/dompet-bersama.sql` di
> SQL Editor sekali. Instalasi baru sudah otomatis lengkap dari
> `supabase/schema.sql`.

> **Transaksi cepat, Langganan, Kunci PIN** juga butuh tabel/kolom baru —
> untuk database lama jalankan `supabase/fitur-lanjutan.sql` sekali.

---

# Cara deploy gratis

## 1. Siapkan Supabase

1. Buka https://supabase.com, daftar, lalu **New project**.
   - Region terdekat: **Southeast Asia (Singapore)**.
   - Catat **Database Password** (tidak dipakai aplikasi, tapi simpan saja).
2. Tunggu project selesai dibuat (± 2 menit).
3. Masuk ke menu **SQL Editor** → **New query**.
4. Salin seluruh isi `supabase/schema.sql` dari project ini, tempel, lalu **Run**.
   Tabel, kebijakan RLS, view saldo, dan data awal akan terbentuk.
5. Masuk ke **Authentication → Sign In / Providers → Email**.
   - Pastikan **Enable email provider** aktif.
   - Untuk pemakaian pribadi, matikan **Confirm email** supaya bisa langsung
     masuk setelah daftar tanpa perlu setel SMTP.
6. Masuk ke **Project Settings → API** (atau **API Keys**), salin dua nilai:
   - **Project URL** → jadi `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → jadi `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> Kunci `anon` memang aman dipasang di sisi browser. Yang melindungi data
> adalah Row Level Security di `schema.sql`, bukan kerahasiaan kunci ini.
> Jangan pernah memakai `service_role` key di aplikasi.

## 2. Jalankan dulu di komputer (opsional tapi disarankan)

```bash
npm install
cp .env.example .env.local     # lalu isi kedua nilai dari langkah 1
npm run dev
```

Buka http://localhost:3000 — buat akun, coba catat transaksi.

## 3. Naikkan ke GitHub

```bash
git init
git add .
git commit -m "Duit Kita"
git branch -M main
git remote add origin https://github.com/USERNAME/duit-kita.git
git push -u origin main
```

## 4. Deploy ke Vercel

1. Buka https://vercel.com, masuk dengan akun GitHub.
2. **Add New → Project**, pilih repo `duit-kita`, klik **Import**.
3. Framework terdeteksi otomatis sebagai Next.js — biarkan semua default.
4. Buka bagian **Environment Variables**, tambahkan dua variabel:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL dari Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key dari Supabase |

5. Klik **Deploy**. Selesai dalam 1–2 menit, kamu dapat alamat
   `https://duit-kita-xxxx.vercel.app`.

## 5. Hubungkan balik ke Supabase

Supaya tautan konfirmasi email dan reset kata sandi mengarah ke domain
Vercel, buka **Supabase → Authentication → URL Configuration**:

- **Site URL**: `https://duit-kita-xxxx.vercel.app`
- **Redirect URLs**: tambahkan `https://duit-kita-xxxx.vercel.app/auth/callback`

## 6. Pasang di ponsel

Buka alamat Vercel di Chrome/Safari ponsel → menu → **Add to Home Screen**.
Aplikasi akan terbuka layar penuh tanpa address bar.

---

## Catatan tentang paket gratis

- **Vercel Hobby**: gratis untuk penggunaan non-komersial, cukup untuk aplikasi
  pribadi seperti ini.
- **Supabase Free**: 500 MB database, 50.000 pengguna aktif bulanan. Project
  gratis akan dijeda kalau tidak ada aktivitas selama ± 1 minggu — cukup buka
  dashboard Supabase untuk mengaktifkannya lagi. Kalau kamu memakai aplikasinya
  rutin, ini tidak pernah terjadi.

## Struktur project

```
src/
  app/
    (app)/           halaman setelah login, memakai navigasi bawah
    login/           masuk & daftar
    auth/callback/   penukaran kode OAuth/konfirmasi email
    layout.js        font, tema, metadata PWA
    globals.css      token warna retro + kelas .frame/.btn/.field
  components/        ui.js, NavBawah.js, FormTransaksi.js
  lib/               format rupiah & tanggal, klien Supabase
  middleware.js      penjaga rute — belum login dilempar ke /login
supabase/schema.sql  seluruh skema database
```

## Tema & tampilan

Setiap tema di `src/app/globals.css` menimpa satu blok `:root[data-tema="…"]`
yang berisi **bukan cuma warna**, tapi juga token bentuk & rasa:

| Token | Contoh isi |
|---|---|
| `--paper … --brick`, `--on-accent` | palet warna |
| `--radius`, `--bw` | sudut membulat, tebal garis tepi |
| `--sx/--sy/--sblur/--sspread` | bayangan (blok keras vs blur lembut vs glow) |
| `--press` | jarak geser saat tombol ditekan |
| `--font-ui`, `--font-display`, `--font-num` | font antarmuka, judul, angka |
| `--display-transform`, `--display-spacing` | HURUF BESAR / spasi judul |
| `--ikon-w` | tebal garis ikon SVG (`src/components/Ikon.js`) |
| `--bg-image/-size/-repeat` | pola latar (grid, dedaunan, semburat) |

Komponen (`.frame`, `.btn`, `.chip`, `.field`, `.nav-*`, `.fab`, `.panel-sheet`)
memakai token itu, ditambah aturan `:root[data-tema="x"] .frame { … }` untuk
sentuhan khusus (garis aksen neon, garis pindai, kartu membulat, dll).

Menambah tema: satu blok di `globals.css` + satu entri di `src/lib/tema.js`
(plus warna bilah status di `META_WARNA` dan skrip pra-paint di `layout.js`).

Pratinjau cepat tanpa mengubah setelan: buka mana saja dengan `?tema=futuristik`
(atau `hijau`, `senja`, `samudra`, `grandline`, `malam`, `kertas`).

### Memakai gambarmu sendiri di tema Grand Line

Semua gambar di tema ini **digambar sendiri sebagai SVG**, jadi bebas dipakai:

- **pola latar** (di `--bg-image`): tengkorak & tulang bersilang, pedang
  bersilang, jangkar, kemudi kapal, mata angin, peti harta, pulau kelapa,
  ombak, topi jerami — di-*tile* 220px.
- **mural cakrawala** (di `body::before`, dipatri ke dasar layar): kapal
  bajak laut berlayar, dua pulau harta berpohon kelapa, matahari, ombak,
  tengkorak di layar utama.

Kalau kamu punya berkas gambar yang **boleh kamu pakai**, taruh di `public/`
lalu ganti sumbernya: untuk pola, lapis pertama `--bg-image`; untuk mural,
`url(...)` di `:root[data-tema="grandline"] body::before`.

```css
--bg-image:
  url("/pola-bajak-laut.png"),   /* ganti lapis ini */
  radial-gradient(...), radial-gradient(...), radial-gradient(...);
--bg-size: 220px 220px, 100% 100%, 100% 100%, 100% 100%;
```

Catatan: gambar karakter anime/manga umumnya berhak cipta penerbitnya —
pastikan kamu memang berhak memakainya sebelum menaruhnya di aplikasi yang
dipublikasikan.
