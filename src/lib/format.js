const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const angka = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

export const uang = (n) => rupiah.format(Number(n) || 0);
export const nomor = (n) => angka.format(Number(n) || 0);

export function uangRingkas(n) {
  const v = Math.abs(Number(n) || 0);
  const tanda = n < 0 ? "-" : "";
  if (v >= 1e9) return `${tanda}Rp ${(v / 1e9).toFixed(1).replace(".", ",")} M`;
  if (v >= 1e6) return `${tanda}Rp ${(v / 1e6).toFixed(1).replace(".", ",")} jt`;
  if (v >= 1e3) return `${tanda}Rp ${(v / 1e3).toFixed(0)} rb`;
  return rupiah.format(n);
}

export const periodeSekarang = () => new Date().toISOString().slice(0, 7);

export function labelPeriode(periode) {
  const [t, b] = periode.split("-");
  const bulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return `${bulan[Number(b) - 1]} ${t}`;
}

export function geserPeriode(periode, delta) {
  const [t, b] = periode.split("-").map(Number);
  const d = new Date(t, b - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function rentangPeriode(periode) {
  const [t, b] = periode.split("-").map(Number);
  const awal = `${periode}-01`;
  const akhirDate = new Date(t, b, 0);
  const akhir = `${periode}-${String(akhirDate.getDate()).padStart(2, "0")}`;
  return { awal, akhir };
}

export function tanggalPanjang(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function tanggalPendek(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export const hariIni = () => new Date().toISOString().slice(0, 10);

export const warnaTipe = (t) =>
  t === "income" ? "var(--teal)" : t === "expense" ? "var(--brick)" : "var(--muted)";

export const tandaTipe = (t) => (t === "income" ? "+" : t === "expense" ? "−" : "");
