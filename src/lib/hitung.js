// Kalkulator kolom jumlah: "15000+3200+50000" -> 68200.
// Parser kecil untuk + - * / dan tanda kurung. Titik/koma dianggap
// pemisah ribuan (nominal IDR selalu bulat) dan diabaikan.

export function hitungJumlah(input) {
  const s = String(input ?? "").replace(/[.,\s]/g, "");
  if (!s) return 0;
  if (/^\d+$/.test(s)) return Number(s);
  if (!/^[\d+\-*/()]+$/.test(s)) {
    const d = s.replace(/[^\d]/g, "");
    return d ? Number(d) : 0;
  }

  const toks = s.match(/\d+|[+\-*/()]/g) || [];
  let i = 0;
  const lihat = () => toks[i];
  const ambil = () => toks[i++];

  function ekspresi() {
    let v = suku();
    while (lihat() === "+" || lihat() === "-") {
      const op = ambil();
      const r = suku();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }
  function suku() {
    let v = faktor();
    while (lihat() === "*" || lihat() === "/") {
      const op = ambil();
      const r = faktor();
      v = op === "*" ? v * r : r === 0 ? 0 : v / r;
    }
    return v;
  }
  function faktor() {
    if (lihat() === "(") {
      ambil();
      const v = ekspresi();
      if (lihat() === ")") ambil();
      return v;
    }
    if (lihat() === "-") {
      ambil();
      return -faktor();
    }
    const t = ambil();
    return /^\d+$/.test(t || "") ? Number(t) : 0;
  }

  try {
    const v = ekspresi();
    return Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0;
  } catch {
    const d = s.replace(/[^\d]/g, "");
    return d ? Number(d) : 0;
  }
}

// true kalau teks memuat operator hitung (untuk menampilkan hasil live)
export const adaHitung = (t) => /\d[+\-*/]/.test(String(t ?? ""));

// Bersihkan input mentah: hanya izinkan digit, operator, kurung, pemisah.
export const bersihkanHitung = (t) =>
  String(t ?? "").replace(/[^\d+\-*/().,\s]/g, "").slice(0, 40);

// Tampilan: kelompokkan ribuan kalau tak ada operator; kalau ada, apa adanya.
export function tampilJumlah(t) {
  const s = String(t ?? "");
  if (!s) return "";
  if (adaHitung(s) || /[+\-*/()]/.test(s)) return s;
  const n = Number(s.replace(/[^\d]/g, ""));
  return n ? n.toLocaleString("id-ID") : "";
}
