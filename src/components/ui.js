"use client";
import { useEffect } from "react";

export function Judul({ anak, aksi, keterangan }) {
  return (
    <header className="mb-5 flex items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold leading-tight">{anak}</h1>
        {keterangan && (
          <p className="mt-0.5 text-sm text-muted">{keterangan}</p>
        )}
      </div>
      {aksi}
    </header>
  );
}

export function Kartu({ className = "", children, datar = false }) {
  return (
    <div className={`${datar ? "frame-flat" : "frame"} p-4 ${className}`}>
      {children}
    </div>
  );
}

export function Kosong({ judul, ajakan, aksi }) {
  return (
    <div className="frame-flat border-dashed p-8 text-center">
      <p className="font-medium">{judul}</p>
      {ajakan && <p className="mt-1 text-sm text-muted">{ajakan}</p>}
      {aksi && <div className="mt-4 flex justify-center">{aksi}</div>}
    </div>
  );
}

export function Memuat({ tinggi = 72, jumlah = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: jumlah }).map((_, i) => (
        <div
          key={i}
          className="frame-flat animate-pulse opacity-40"
          style={{ height: tinggi }}
        />
      ))}
    </div>
  );
}

/** Panel yang muncul dari bawah layar — dipakai untuk semua form. */
export function Panel({ buka, tutup, judul, children }) {
  useEffect(() => {
    if (!buka) return;
    const asal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e) => e.key === "Escape" && tutup();
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = asal;
      window.removeEventListener("keydown", esc);
    };
  }, [buka, tutup]);

  if (!buka) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        aria-label="Tutup"
        onClick={tutup}
        className="absolute inset-0 bg-black/45"
      />
      <div className="panel-sheet relative max-h-[92vh] w-full overflow-y-auto p-5 sm:max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{judul}</h2>
          <button onClick={tutup} className="chip" type="button">
            Tutup
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Label({ teks, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-muted">{teks}</span>
      {children}
    </label>
  );
}

export function Pilihan({ nilai, ubah, opsi }) {
  return (
    <div className="flex flex-wrap gap-2">
      {opsi.map((o) => (
        <button
          key={o.nilai}
          type="button"
          onClick={() => ubah(o.nilai)}
          className={`chip ${nilai === o.nilai ? "chip-aktif" : ""}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Bilah({ persen, warna = "var(--teal)" }) {
  const p = Math.max(0, Math.min(100, persen));
  return (
    <div className="h-3 w-full border-2 border-line bg-raised">
      <div className="h-full" style={{ width: `${p}%`, background: warna }} />
    </div>
  );
}
