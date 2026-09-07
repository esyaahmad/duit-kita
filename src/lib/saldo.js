"use client";
import { useCallback, useEffect, useState } from "react";

const KUNCI = "saldoTampil";
const PERISTIWA = "saldo-tampil-ubah";

export const SALDO_SAMAR = "••••••";

// Tampilkan/sembunyikan nominal saldo dompet. Default: SEMBUNYI.
// Tersimpan di perangkat (localStorage) dan tersinkron antar komponen
// di tab yang sama lewat CustomEvent.
export function useSaldoTampil() {
  const [tampil, setTampil] = useState(false);

  useEffect(() => {
    const baca = () => {
      try { setTampil(localStorage.getItem(KUNCI) === "1"); } catch (e) {}
    };
    baca();
    window.addEventListener(PERISTIWA, baca);
    window.addEventListener("storage", baca);
    return () => {
      window.removeEventListener(PERISTIWA, baca);
      window.removeEventListener("storage", baca);
    };
  }, []);

  const ubah = useCallback((paksa) => {
    setTampil((prev) => {
      const next = typeof paksa === "boolean" ? paksa : !prev;
      try { localStorage.setItem(KUNCI, next ? "1" : "0"); } catch (e) {}
      window.dispatchEvent(new CustomEvent(PERISTIWA));
      return next;
    });
  }, []);

  return [tampil, ubah];
}
