"use client";
import { useEffect, useState } from "react";
import { TEMA, terapkanTema, temaSekarang } from "@/lib/tema";

export default function PemilihTema() {
  const [aktif, setAktif] = useState(null);

  useEffect(() => { setAktif(temaSekarang()); }, []);

  return (
    <div className="grid grid-cols-2 gap-3">
      {TEMA.map((t) => {
        const dipilih = aktif === t.id;
        const tinta = t.terang ? "#201d1a" : "#f4f4f5";
        const samar = t.terang ? "#6b6559" : "rgba(244,244,245,.6)";
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setAktif(terapkanTema(t.id))}
            aria-pressed={dipilih}
            className="border-2 border-line p-3 text-left press"
            style={{
              background: t.swatch[0],
              boxShadow: "3px 3px 0 var(--shadow)",
              outline: dipilih ? "2px solid var(--ink)" : "none",
              outlineOffset: 3,
            }}
          >
            <div className="flex gap-1.5">
              {t.swatch.slice(1).map((c, i) => (
                <span
                  key={i}
                  className="h-5 w-5 border-2"
                  style={{ background: c, borderColor: t.swatch[0] }}
                />
              ))}
            </div>
            <p className="mt-2 text-sm font-semibold" style={{ color: tinta }}>
              {t.nama}
            </p>
            <p className="text-xs" style={{ color: samar }}>
              {dipilih ? "● Terpakai" : t.sub}
            </p>
          </button>
        );
      })}
    </div>
  );
}
