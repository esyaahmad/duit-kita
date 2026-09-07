// Daftar tema tampilan. Tiap tema hanya menukar sekumpulan CSS variable
// yang didefinisikan di globals.css lewat atribut data-tema pada <html>.
// swatch = [latar, primer, sekunder, bahaya] — dipakai untuk pratinjau.

export const TEMA = [
  { id: "kertas",     nama: "Kertas",     sub: "Retro, sudut tajam",       terang: true,
    swatch: ["#ede7d9", "#0f6e63", "#d9a21b", "#b5462b"] },
  { id: "malam",      nama: "Malam",      sub: "Retro gelap",              terang: false,
    swatch: ["#201e19", "#46b9a8", "#e7bc5c", "#de7b58"] },
  { id: "futuristik", nama: "Futuristik", sub: "HUD, grid, neon, huruf tegak", terang: false,
    swatch: ["#0d1322", "#26e0f2", "#b667ff", "#ff3d78"] },
  { id: "hijau",      nama: "Go Green",   sub: "Membulat, lembut, dedaunan", terang: true,
    swatch: ["#e9f2e0", "#2f9e44", "#f08c00", "#c0392b"] },
  { id: "senja",      nama: "Senja",      sub: "Plum, judul serif",        terang: false,
    swatch: ["#241a35", "#c084fc", "#fb923c", "#fb7185"] },
  { id: "samudra",    nama: "Samudra",    sub: "Biru tenang, membulat",    terang: true,
    swatch: ["#e7f1f5", "#0c8599", "#4dabf7", "#e8590c"] },
];

export const TEMA_DEFAULT = "kertas";

// Warna bilah status browser / PWA per tema (samakan dengan --paper di globals.css).
export const META_WARNA = {
  kertas: "#ede7d9", malam: "#171613", futuristik: "#070a12",
  hijau: "#e9f2e0", senja: "#1a1327", samudra: "#e7f1f5",
};

const VALID = new Set(TEMA.map((t) => t.id));

// Terjemahkan nilai lama ("gelap"/"terang") ke id tema baru.
export function normalisasiTema(v) {
  if (v === "gelap") return "malam";
  if (v === "terang") return "kertas";
  return VALID.has(v) ? v : null;
}

export function terapkanTema(id) {
  const tema = normalisasiTema(id) || TEMA_DEFAULT;
  const html = document.documentElement;
  html.setAttribute("data-tema", tema);
  try { localStorage.setItem("tema", tema); } catch (e) {}
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", META_WARNA[tema] || META_WARNA[TEMA_DEFAULT]);
  return tema;
}

export function temaSekarang() {
  if (typeof document === "undefined") return TEMA_DEFAULT;
  return document.documentElement.getAttribute("data-tema") || TEMA_DEFAULT;
}
