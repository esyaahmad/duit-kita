# Duit Kita

Aplikasi web keuangan pribadi, dirancang untuk layar ponsel. Dibuat dengan
Next.js 14 (App Router) + Supabase, gratis di-hosting di Vercel.

## Isi aplikasi

| Halaman | Fungsi |
|---|---|
| Beranda | Total saldo, ringkasan masuk/keluar bulan ini, anggaran terketat, target, transaksi terakhir |
| Transaksi | Daftar per hari, cari, filter jenis, pindah bulan, tambah/ubah/hapus |
| Anggaran | Batas belanja per kategori per bulan, bilah progres, salin dari bulan lalu |
| Laporan | Diagram lingkaran pengeluaran per kategori + batang masuk/keluar 6 bulan |
| Dompet | Tunai, bank, e-wallet, kartu, investasi — saldo dihitung otomatis |
| Kategori | Kategori pemasukan & pengeluaran dengan ikon |
| Target | Target tabungan dengan setoran bertahap |
| Profil | Nama, tema gelap, ekspor CSV, keluar |

Fitur lain: pencatatan pindah dana antar dompet, tema terang/gelap, PWA
(bisa dipasang ke home screen), dan Row Level Security sehingga data tiap
akun terisolasi di database.

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

## Menyesuaikan tampilan

Semua warna ada sebagai CSS variable di bagian atas `src/app/globals.css`
(`--paper`, `--ink`, `--teal`, `--mustard`, `--brick`). Ganti nilainya dan
seluruh aplikasi ikut berubah, termasuk mode gelap.
