// Waktu relatif singkat: "baru saja", "5 mnt lalu", "2 jam lalu",
// "kemarin", "3 hari lalu", lalu jatuh ke tanggal pendek.
import { tanggalPendek } from "@/lib/format";

export function waktuLalu(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const detik = (Date.now() - d.getTime()) / 1000;

  if (detik < 45) return "baru saja";
  if (detik < 3600) return `${Math.round(detik / 60)} mnt lalu`;
  if (detik < 21600) return `${Math.round(detik / 3600)} jam lalu`;

  const hariIni = new Date();
  const nol = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const selisihHari = Math.round((nol(hariIni) - nol(d)) / 86400000);

  if (selisihHari <= 0) return `${Math.round(detik / 3600)} jam lalu`;
  if (selisihHari === 1) return "kemarin";
  if (selisihHari < 7) return `${selisihHari} hari lalu`;
  return tanggalPendek(d.toISOString().slice(0, 10));
}
