"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { hashPin, perluBuka, tandaiTerbuka, segarkanAktivitas } from "@/lib/pin";

const FLAG = "pin-aktif";
const PANJANG = 6;

export default function KunciApp() {
  const supabase = getSupabase();
  const router = useRouter();
  const [status, setStatus] = useState("cek"); // cek | terbuka | terkunci
  const [pinDb, setPinDb] = useState(null);
  const [entri, setEntri] = useState("");
  const [salah, setSalah] = useState(false);
  const [lupa, setLupa] = useState(false);
  const [sandi, setSandi] = useState("");
  const [galat, setGalat] = useState(null);
  const sudahCek = useRef(false);

  // hint sinkron dari localStorage → kunci secepatnya
  useEffect(() => {
    let flag = "0";
    try { flag = localStorage.getItem(FLAG) || "0"; } catch (e) {}
    setStatus(flag === "1" && perluBuka() ? "terkunci" : "terbuka");
  }, []);

  // ambil hash & garam dari server sekali
  useEffect(() => {
    if (sudahCek.current) return;
    sudahCek.current = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles").select("pin_hash,pin_salt").eq("id", user.id).maybeSingle();
      if (data?.pin_hash && data?.pin_salt) {
        setPinDb({ hash: data.pin_hash, salt: data.pin_salt, email: user.email });
        try { localStorage.setItem(FLAG, "1"); } catch (e) {}
        setStatus((s) => (perluBuka() ? "terkunci" : s === "cek" ? "terbuka" : s));
      } else {
        try { localStorage.setItem(FLAG, "0"); } catch (e) {}
        setStatus("terbuka");
      }
    })();
  }, [supabase]);

  // auto-kunci: cek berkala + saat app kembali fokus; segarkan saat ada interaksi
  useEffect(() => {
    const evalKunci = () => {
      try {
        if (localStorage.getItem(FLAG) === "1" && perluBuka()) setStatus("terkunci");
      } catch (e) {}
    };
    const segar = () => segarkanAktivitas();
    const vis = () => { if (document.visibilityState === "visible") evalKunci(); };
    const iv = setInterval(evalKunci, 15000);
    document.addEventListener("visibilitychange", vis);
    window.addEventListener("focus", vis);
    window.addEventListener("pointerdown", segar, { passive: true });
    window.addEventListener("keydown", segar, { passive: true });
    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("focus", vis);
      window.removeEventListener("pointerdown", segar);
      window.removeEventListener("keydown", segar);
    };
  }, []);

  const coba = useCallback(async (nilai) => {
    if (!pinDb) return;
    const h = await hashPin(nilai, pinDb.salt);
    if (h === pinDb.hash) {
      tandaiTerbuka();
      setEntri("");
      setSalah(false);
      setStatus("terbuka");
    } else {
      setSalah(true);
      setTimeout(() => { setEntri(""); setSalah(false); }, 400);
    }
  }, [pinDb]);

  const tekan = useCallback((d) => {
    setEntri((e) => {
      if (e.length >= PANJANG) return e;
      const next = e + d;
      if (next.length === PANJANG) coba(next);
      return next;
    });
  }, [coba]);

  const hapus = useCallback(() => setEntri((e) => e.slice(0, -1)), []);

  // keyboard fisik
  useEffect(() => {
    if (status !== "terkunci" || lupa) return;
    const onKey = (ev) => {
      if (/^[0-9]$/.test(ev.key)) tekan(ev.key);
      else if (ev.key === "Backspace") hapus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, lupa, tekan, hapus]);

  async function resetLewatSandi(e) {
    e.preventDefault();
    setGalat(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: pinDb?.email || "",
      password: sandi,
    });
    if (error) return setGalat("Kata sandi salah.");
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("profiles").update({ pin_hash: null, pin_salt: null }).eq("id", user.id);
    try { localStorage.setItem(FLAG, "0"); } catch (e) {}
    tandaiTerbuka();
    setStatus("terbuka");
  }

  async function keluar() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (status !== "terkunci") return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-8"
      style={{ background: "var(--paper)" }}
    >
      {lupa ? (
        <form onSubmit={resetLewatSandi} className="w-full max-w-xs space-y-4">
          <h1 className="text-xl font-semibold">Lupa PIN</h1>
          <p className="text-sm text-muted">
            Masukkan kata sandi akunmu untuk menghapus PIN. Kamu bisa pasang PIN baru dari Profil.
          </p>
          <input
            type="password"
            className="field"
            placeholder="Kata sandi"
            value={sandi}
            onChange={(e) => setSandi(e.target.value)}
            autoFocus
          />
          {galat && <p className="text-sm" style={{ color: "var(--brick)" }}>{galat}</p>}
          <button className="btn-utama w-full">Hapus PIN</button>
          <button type="button" className="btn w-full" onClick={() => setLupa(false)}>Kembali</button>
          <button type="button" className="w-full text-sm text-muted underline" onClick={keluar}>
            Keluar dari akun
          </button>
        </form>
      ) : (
        <>
          <div className="mb-2 text-3xl">🔒</div>
          <h1 className="mb-1 text-xl font-semibold">Masukkan PIN</h1>
          <p className="mb-6 text-sm text-muted">Duit Kita terkunci</p>

          <div className="mb-8 flex gap-3">
            {Array.from({ length: PANJANG }).map((_, i) => (
              <span
                key={i}
                className="h-3.5 w-3.5 border-2 border-line"
                style={{
                  borderRadius: 999,
                  background: salah
                    ? "var(--brick)"
                    : i < entri.length
                    ? "var(--ink)"
                    : "transparent",
                }}
              />
            ))}
          </div>

          <div className="grid w-full max-w-[260px] grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => tekan(String(n))}
                className="frame flex h-16 items-center justify-center text-2xl num press"
              >
                {n}
              </button>
            ))}
            <span />
            <button
              type="button"
              onClick={() => tekan("0")}
              className="frame flex h-16 items-center justify-center text-2xl num press"
            >
              0
            </button>
            <button
              type="button"
              onClick={hapus}
              className="flex h-16 items-center justify-center text-xl press"
              aria-label="Hapus"
            >
              ⌫
            </button>
          </div>

          <button
            type="button"
            className="mt-8 text-sm text-muted underline"
            onClick={() => { setLupa(true); setGalat(null); setSandi(""); }}
          >
            Lupa PIN?
          </button>
        </>
      )}
    </div>
  );
}
