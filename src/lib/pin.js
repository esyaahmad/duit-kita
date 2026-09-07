// Kunci PIN aplikasi. PIN di-hash (SHA-256, dengan garam acak per akun)
// di sisi klien; yang tersimpan di database hanya hash + garam.
// Ini kunci kenyamanan di HP, bukan enkripsi data.

const KUNCI_SESI = "app-terbuka";       // sessionStorage: sesi ini sudah lolos PIN
const KUNCI_WAKTU = "app-terbuka-pada"; // ms terakhir aktif
const AUTO_KUNCI_MS = 90_000;           // kunci lagi bila lama tak aktif / di-background

export function acakGaram() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export async function hashPin(pin, garam) {
  const data = new TextEncoder().encode(`${garam}:${pin}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export function tandaiTerbuka() {
  try {
    sessionStorage.setItem(KUNCI_SESI, "1");
    sessionStorage.setItem(KUNCI_WAKTU, String(Date.now()));
  } catch (e) {}
}

export function segarkanAktivitas() {
  try {
    if (sessionStorage.getItem(KUNCI_SESI) === "1")
      sessionStorage.setItem(KUNCI_WAKTU, String(Date.now()));
  } catch (e) {}
}

export function kunciSekarang() {
  try {
    sessionStorage.removeItem(KUNCI_SESI);
    sessionStorage.removeItem(KUNCI_WAKTU);
  } catch (e) {}
}

// true = perlu minta PIN
export function perluBuka() {
  try {
    if (sessionStorage.getItem(KUNCI_SESI) !== "1") return true;
    const t = Number(sessionStorage.getItem(KUNCI_WAKTU) || 0);
    return Date.now() - t > AUTO_KUNCI_MS;
  } catch (e) {
    return true;
  }
}

export { AUTO_KUNCI_MS };
