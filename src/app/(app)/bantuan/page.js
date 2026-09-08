import { Judul } from "@/components/ui";

export const metadata = { title: "Bantuan — Duit Kita" };

const BANTUAN = [
  {
    grup: "Mulai",
    item: [
      {
        q: "Apa itu Duit Kita?",
        a: "Buku kas pribadi/keluarga di ponsel: catat pemasukan & pengeluaran, atur anggaran bulanan, kejar target tabungan. Datamu tersimpan di database Supabase milikmu sendiri dan terisolasi per akun.",
      },
      {
        q: "Cara mencatat transaksi pertama",
        langkah: [
          "Ketuk tombol bulat + di kanan bawah.",
          "Pilih jenis: Pengeluaran, Pemasukan, atau Pindah dana.",
          "Isi jumlah, pilih kategori dan dompet.",
          "Ketuk Simpan.",
        ],
      },
      {
        q: "Mengenal navigasi",
        a: "Bar bawah: Beranda (ringkasan), Transaksi (daftar lengkap), Anggaran, dan Lainnya (semua menu lain: Laporan, Langganan, Transaksi cepat, Dompet, Kategori, Target, Profil). Tombol + selalu ada untuk mencatat cepat.",
      },
    ],
  },
  {
    grup: "Mencatat transaksi",
    item: [
      {
        q: "Beda Pengeluaran, Pemasukan, dan Pindah dana",
        a: "Pengeluaran = uang keluar. Pemasukan = uang masuk. Pindah dana = memindah saldo antar dompetmu sendiri; tidak dihitung sebagai untung atau rugi, hanya memindahkan saldo.",
      },
      {
        q: "Kalkulator di kolom jumlah",
        a: "Ketik langsung ekspresi seperti 15000+3200+50000, atau pakai tombol + − × di bawah kolom. Hasilnya muncul otomatis (= Rp 68.200). Titik dan koma dianggap pemisah ribuan dan diabaikan.",
      },
      {
        q: "Mengubah atau menghapus transaksi",
        a: "Buka Transaksi, ketuk barisnya, ubah lalu Simpan — atau ketuk Hapus. Di dompet bersama, transaksi tetap tercatat atas nama orang yang pertama mencatatnya walau diubah anggota lain.",
      },
      {
        q: "Mencari dan menyaring",
        a: "Di halaman Transaksi ada kotak pencarian (catatan atau nama kategori), deretan chip filter jenis, dan tombol Sebelumnya/Berikutnya untuk berpindah bulan.",
      },
    ],
  },
  {
    grup: "Dompet",
    item: [
      {
        q: "Menambah dompet",
        a: "Lainnya → Dompet → Tambah. Beri nama, pilih jenis (tunai, bank, e-wallet, kartu, investasi), isi saldo awal, pilih warna.",
      },
      {
        q: "Saldo dompet dihitung dari mana?",
        a: "Saldo awal + pemasukan − pengeluaran, lalu disesuaikan dengan pindah dana masuk/keluar. Dihitung otomatis — kamu tidak perlu menyetel saldo sekarang secara manual.",
      },
      {
        q: "Memindahkan uang antar dompet",
        a: "Ketuk +, pilih Pindah dana, tentukan dompet asal dan tujuan, isi jumlah.",
      },
      {
        q: "Menyembunyikan nominal saldo",
        a: "Di Beranda ketuk tombol Lihat/Sembunyikan pada kartu saldo; di halaman Dompet ketuk tulisan “Total …”. Bawaannya tersembunyi (Rp ••••••). Setelan ini per-perangkat.",
      },
    ],
  },
  {
    grup: "Dompet bersama (keluarga)",
    item: [
      {
        q: "Berbagi satu dompet dengan pasangan/keluarga",
        langkah: [
          "Pemilik: Dompet → pilih dompet → Buat kode undangan.",
          "Bagikan kode (berlaku 7 hari, sekali pakai).",
          "Orang kedua: Dompet → Gabung → masukkan kode.",
        ],
        a: "Maksimal 2 orang per dompet.",
      },
      {
        q: "Siapa bisa melakukan apa",
        a: "Kedua anggota bisa mencatat, mengubah, dan menghapus transaksi serta melihat saldo. Setelan dompet (nama, jenis, saldo awal) hanya bisa diubah pemiliknya. Anggota bisa keluar kapan saja lewat panel dompet.",
      },
      {
        q: "Melihat aktivitas anggota lain",
        a: "Kalau kamu punya dompet bersama, di Beranda muncul bagian “Aktivitas keluarga” berisi catatan terbaru anggota lain, misalnya “Rina catat Belanja · 2 jam lalu · Rp 150.000”. Di daftar Transaksi dan Beranda juga ada label “oleh <nama>”.",
      },
    ],
  },
  {
    grup: "Anggaran, target & laporan",
    item: [
      {
        q: "Menetapkan anggaran bulanan per kategori",
        a: "Buka Anggaran, ketuk kategori, isi batas belanja. Bilah progres jadi kuning saat lewat 80% dan merah saat lewat 100%. Kartu di atas menampilkan sisa anggaran seluruh bulan.",
      },
      {
        q: "Membuat anggaran dengan cepat",
        a: "Ketuk “Buat/Atur anggaran” — semua kategori tampil di satu layar, tinggal isi angkanya. Tombol “Isi dari belanja bulan lalu” mengisi semuanya sekaligus dari realisasi bulan lalu; tiap baris juga menampilkan angka bulan lalu yang bisa dipakai sekali ketuk.",
      },
      {
        q: "Anggaran bersama (berdua)",
        a: "Kalau punya dompet bersama, di halaman Anggaran ada chip “Pribadi / 🤝 nama dompet”. Pilih dompet bersama untuk anggaran yang dilihat & diubah kedua anggota. Terpakainya dihitung dari semua transaksi di dompet itu (dari siapa pun), dicocokkan lewat nama kategori.",
      },
      {
        q: "Target tabungan",
        a: "Lainnya → Target tabungan → Tambah. Isi nama, jumlah target, dan ikon. Tambahkan uang lewat tombol “Setor dana” pada tiap target.",
      },
      {
        q: "Membaca Laporan",
        a: "Lainnya → Laporan: diagram lingkaran pengeluaran per kategori dan diagram batang pemasukan vs pengeluaran 6 bulan terakhir. Gunakan Sebelumnya/Berikutnya untuk ganti bulan.",
      },
    ],
  },
  {
    grup: "Langganan & transaksi cepat",
    item: [
      {
        q: "Transaksi cepat (sekali ketuk)",
        a: "Buat template di Lainnya → Transaksi cepat → Tambah (misalnya “Kopi 25rb”), atau centang “Simpan juga sebagai transaksi cepat” saat mencatat transaksi. Template muncul sebagai tombol di Beranda; sekali ketuk langsung tercatat dengan tanggal hari ini.",
      },
      {
        q: "Langganan / tagihan berulang",
        a: "Lainnya → Langganan → Tambah untuk Netflix, listrik, cicilan, iuran. Pilih siklus (mingguan, bulanan, tahunan) dan tanggalnya.",
      },
      {
        q: "Otomatis atau minta konfirmasi?",
        a: "Kalau dicentang “Catat otomatis”, transaksi langsung tercatat saat Beranda dibuka (termasuk yang terlewat). Tanpa centang, muncul kartu “Langganan jatuh tempo” di Beranda dengan tombol Catat atau Lewati.",
      },
      {
        q: "Apa itu “komitmen bulanan”?",
        a: "Total semua langganan pengeluaran yang aktif, disetarakan ke nilai per bulan (mingguan dikali 52⁄12, tahunan dibagi 12). Tampil di bagian atas halaman Langganan.",
      },
    ],
  },
  {
    grup: "Tampilan & keamanan",
    item: [
      {
        q: "Mengganti tema",
        a: "Profil → Tema tampilan. Ada 7: Kertas, Malam, Futuristik, Go Green, Senja, Samudra, Grand Line. Masing-masing mengubah warna, bentuk, font, dan pola latar. Pilihan tersimpan di perangkat ini.",
      },
      {
        q: "Mengaktifkan kunci PIN",
        a: "Profil → Kunci PIN → Aktifkan kunci PIN. Buat 6 angka. Aplikasi mengunci diri sendiri setelah kira-kira 90 detik tidak dipakai, atau setelah ditutup ke background lalu dibuka lagi.",
      },
      {
        q: "Lupa PIN",
        a: "Di layar kunci ketuk “Lupa PIN?”, lalu masukkan kata sandi akunmu. PIN akan dihapus dan kamu bisa memasang PIN baru dari Profil.",
      },
      {
        q: "Seaman apa PIN-nya?",
        a: "PIN diacak (hash SHA-256 + garam) di ponsel sebelum dikirim; server tidak pernah menyimpan PIN aslinya. Ini kunci layar untuk mencegah orang lain mengintip, bukan enkripsi data — keamanan utama tetap pada login akun dan Row Level Security.",
      },
    ],
  },
  {
    grup: "Data & pemasangan",
    item: [
      {
        q: "Memasang ke layar utama iPhone",
        a: "Buka aplikasi di Safari, ketuk tombol Bagikan, pilih “Add to Home Screen”. Setelah itu aplikasi terbuka layar penuh tanpa address bar, seperti aplikasi biasa.",
      },
      {
        q: "Mengekspor data",
        a: "Profil → Unduh CSV. Berisi semua transaksi (tanggal, jenis, jumlah, kategori, dompet, catatan) dan bisa dibuka di Excel atau Google Sheets.",
      },
      {
        q: "Di mana data saya disimpan?",
        a: "Di database Supabase milikmu sendiri. Setiap akun terisolasi lewat Row Level Security, jadi pengguna lain tidak bisa melihat datamu meski mengetahui kunci publik aplikasi.",
      },
      {
        q: "Mengganti nama panggilan",
        a: "Profil → Nama panggilan → Simpan nama. Nama ini yang muncul di sapaan Beranda dan sebagai label “oleh <nama>” di dompet bersama.",
      },
    ],
  },
];

export default function Bantuan() {
  return (
    <div className="space-y-7">
      <Judul anak="Bantuan" keterangan="Semua fitur dan cara pakainya" />

      {BANTUAN.map((g) => (
        <section key={g.grup}>
          <h2 className="mb-2 border-b-2 border-line pb-1 text-sm font-medium">{g.grup}</h2>
          <div className="space-y-2">
            {g.item.map((it) => (
              <details key={it.q} className="group frame-flat p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium marker:content-[''] [&::-webkit-details-marker]:hidden">
                  <span>{it.q}</span>
                  <span className="shrink-0 text-muted transition-transform group-open:rotate-45">+</span>
                </summary>
                {it.a && <p className="mt-2 text-sm text-muted">{it.a}</p>}
                {it.langkah && (
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">
                    {it.langkah.map((l, i) => <li key={i}>{l}</li>)}
                  </ol>
                )}
              </details>
            ))}
          </div>
        </section>
      ))}

      <p className="pt-2 text-center text-xs text-muted">
        Masih bingung? Coba fiturnya langsung — semua bisa diubah atau dihapus lagi.
      </p>
    </div>
  );
}
