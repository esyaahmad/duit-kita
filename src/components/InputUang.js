"use client";
import { useRef } from "react";
import { bersihkanHitung, tampilJumlah, adaHitung, hitungJumlah } from "@/lib/hitung";
import { uang } from "@/lib/format";

// Kolom nominal besar dengan kalkulator bawaan.
// `nilai` & `ubah` bekerja pada string mentah (boleh berisi + - * / ).
// Angka final = hitungJumlah(nilai).
export default function InputUang({ nilai, ubah, autoFocus = false, placeholder = "0" }) {
  const ref = useRef(null);
  const hasil = hitungJumlah(nilai);
  const raw = String(nilai ?? "");

  const tambahOp = (op) => {
    const t = raw.trim();
    if (!t) return;
    if (/[+\-*/]$/.test(t)) ubah(t.slice(0, -1) + op);
    else ubah(t + op);
    ref.current?.focus();
  };

  return (
    <div>
      <div className="flex items-center border-2 border-line bg-raised">
        <span className="px-3 text-muted num">Rp</span>
        <input
          ref={ref}
          inputMode="decimal"
          className="w-full bg-transparent px-1 py-3 text-2xl num outline-none"
          value={tampilJumlah(nilai)}
          onChange={(e) => ubah(bersihkanHitung(e.target.value))}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
        />
      </div>

      <div className="mt-1.5 flex items-center gap-1.5">
        {["+", "−", "×"].map((sym) => (
          <button
            key={sym}
            type="button"
            onClick={() => tambahOp(sym === "−" ? "-" : sym === "×" ? "*" : "+")}
            className="chip num px-3 py-1"
          >
            {sym}
          </button>
        ))}
        <button
          type="button"
          onClick={() => ubah(raw.slice(0, -1))}
          className="chip px-3 py-1"
          aria-label="Hapus satu karakter"
        >
          ⌫
        </button>
        {adaHitung(nilai) && (
          <span className="ml-auto text-sm text-muted num">= {uang(hasil)}</span>
        )}
      </div>
    </div>
  );
}
