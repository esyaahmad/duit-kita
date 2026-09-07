// Logika jatuh tempo untuk langganan / transaksi berulang.
import { hariIni } from "@/lib/format";

const HARI_NAMA = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN_NAMA = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

const iso = (d) => d.toISOString().slice(0, 10);
const dari = (s) => new Date(s + "T00:00:00");
const akhirBulan = (th, bl) => new Date(th, bl + 1, 0).getDate();

// Semua tanggal jatuh tempo sebuah aturan sejak terakhir dibuat s/d hari ini.
// Dibatasi maksimal `maks` supaya tak membludak kalau lama tak dibuka.
export function jatuhTempo(rec, sampai = hariIni(), maks = 18) {
  if (!rec.aktif) return [];
  const batas = dari(sampai);
  const mulai = dari(rec.mulai);
  const sesudah = rec.terakhir_dibuat ? dari(rec.terakhir_dibuat) : null;
  const lolos = (d) =>
    d >= mulai && d <= batas && (!sesudah || d > sesudah);

  const hasil = [];

  if (rec.siklus === "mingguan") {
    const target = ((rec.hari % 7) + 7) % 7;
    const d = new Date(batas);
    d.setDate(d.getDate() - ((d.getDay() - target + 7) % 7)); // kejadian <= batas
    while (hasil.length < maks && d >= mulai) {
      if (lolos(d)) hasil.push(iso(d));
      d.setDate(d.getDate() - 7);
    }
  } else if (rec.siklus === "tahunan") {
    const bl = (rec.bulan || 1) - 1;
    for (let th = batas.getFullYear(); th >= mulai.getFullYear() && hasil.length < maks; th--) {
      const hr = Math.min(rec.hari || 1, akhirBulan(th, bl));
      const d = new Date(th, bl, hr);
      if (lolos(d)) hasil.push(iso(d));
    }
  } else {
    // bulanan
    const kursor = new Date(batas.getFullYear(), batas.getMonth(), 1);
    while (hasil.length < maks && kursor >= new Date(mulai.getFullYear(), mulai.getMonth(), 1)) {
      const hr = Math.min(rec.hari || 1, akhirBulan(kursor.getFullYear(), kursor.getMonth()));
      const d = new Date(kursor.getFullYear(), kursor.getMonth(), hr);
      if (lolos(d)) hasil.push(iso(d));
      kursor.setMonth(kursor.getMonth() - 1);
    }
  }

  return hasil.sort();
}

// Perkiraan tanggal jatuh tempo berikutnya (untuk ditampilkan di daftar).
export function berikutnya(rec, dariTgl = hariIni()) {
  const awal = dari(dariTgl);
  if (rec.siklus === "mingguan") {
    const target = ((rec.hari % 7) + 7) % 7;
    const d = new Date(awal);
    d.setDate(d.getDate() + ((target - d.getDay() + 7) % 7));
    return iso(d);
  }
  if (rec.siklus === "tahunan") {
    const bl = (rec.bulan || 1) - 1;
    let th = awal.getFullYear();
    let hr = Math.min(rec.hari || 1, akhirBulan(th, bl));
    if (new Date(th, bl, hr) < awal) th++;
    hr = Math.min(rec.hari || 1, akhirBulan(th, bl));
    return iso(new Date(th, bl, hr));
  }
  let th = awal.getFullYear();
  let bl = awal.getMonth();
  let hr = Math.min(rec.hari || 1, akhirBulan(th, bl));
  if (new Date(th, bl, hr) < awal) {
    bl++;
    if (bl > 11) { bl = 0; th++; }
    hr = Math.min(rec.hari || 1, akhirBulan(th, bl));
  }
  return iso(new Date(th, bl, hr));
}

// Nominal disetarakan ke per-bulan (untuk total "komitmen bulanan").
export function perBulan(rec) {
  const n = Number(rec.jumlah) || 0;
  if (rec.siklus === "mingguan") return (n * 52) / 12;
  if (rec.siklus === "tahunan") return n / 12;
  return n;
}

export function labelSiklus(rec) {
  if (rec.siklus === "mingguan") return `Tiap ${HARI_NAMA[((rec.hari % 7) + 7) % 7]}`;
  if (rec.siklus === "tahunan")
    return `Tiap ${rec.hari} ${BULAN_NAMA[(rec.bulan || 1) - 1]}`;
  return `Tiap tanggal ${rec.hari}`;
}

export { HARI_NAMA, BULAN_NAMA };
