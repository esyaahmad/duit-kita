"use client";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { Kartu, Panel, Label } from "@/components/ui";
import { acakGaram, hashPin, tandaiTerbuka } from "@/lib/pin";

const FLAG = "pin-aktif";
const PjInput = (props) => (
  <input
    type="password"
    inputMode="numeric"
    pattern="[0-9]*"
    maxLength={6}
    className="field num text-center text-2xl tracking-[0.4em]"
    placeholder="••••••"
    {...props}
  />
);

export default function AturPin() {
  const supabase = getSupabase();
  const [ada, setAda] = useState(null); // null=memuat, bool
  const [salt, setSalt] = useState(null);
  const [hash, setHash] = useState(null);
  const [mode, setMode] = useState(null); // 'pasang' | 'ganti' | 'matikan'
  const [lama, setLama] = useState("");
  const [baru, setBaru] = useState("");
  const [ulang, setUlang] = useState("");
  const [galat, setGalat] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from("profiles")
        .select("pin_hash,pin_salt").eq("id", user.id).maybeSingle();
      setAda(!!data?.pin_hash);
      setSalt(data?.pin_salt || null);
      setHash(data?.pin_hash || null);
    })();
  }, [supabase]);

  function tutup() {
    setMode(null); setLama(""); setBaru(""); setUlang(""); setGalat(null);
  }

  async function simpan(e) {
    e.preventDefault();
    setGalat(null);
    const { data: { user } } = await supabase.auth.getUser();

    if (mode === "ganti" || mode === "matikan") {
      if (!salt || (await hashPin(lama, salt)) !== hash)
        return setGalat("PIN lama salah.");
    }
    if (mode === "matikan") {
      await supabase.from("profiles").update({ pin_hash: null, pin_salt: null }).eq("id", user.id);
      try { localStorage.setItem(FLAG, "0"); } catch (e) {}
      setAda(false); setHash(null); setSalt(null);
      return tutup();
    }
    if (!/^\d{6}$/.test(baru)) return setGalat("PIN harus 6 angka.");
    if (baru !== ulang) return setGalat("PIN baru tidak sama.");

    const g = acakGaram();
    const h = await hashPin(baru, g);
    const { error } = await supabase.from("profiles")
      .update({ pin_hash: h, pin_salt: g }).eq("id", user.id);
    if (error) return setGalat(error.message);
    try { localStorage.setItem(FLAG, "1"); } catch (e) {}
    tandaiTerbuka();
    setAda(true); setHash(h); setSalt(g);
    tutup();
  }

  if (ada === null) return null;

  return (
    <>
      <Kartu className="space-y-3">
        <div>
          <p className="font-medium">Kunci PIN</p>
          <p className="text-xs text-muted">
            {ada
              ? "Aktif. Aplikasi minta PIN setelah beberapa saat tidak dipakai."
              : "Kunci aplikasi dengan 6 angka. Berguna kalau HP dipinjam."}
          </p>
        </div>
        {ada ? (
          <div className="flex gap-2">
            <button className="btn flex-1" onClick={() => setMode("ganti")}>Ganti PIN</button>
            <button className="btn" onClick={() => setMode("matikan")}>Matikan</button>
          </div>
        ) : (
          <button className="btn-utama w-full" onClick={() => setMode("pasang")}>Aktifkan kunci PIN</button>
        )}
      </Kartu>

      <Panel
        buka={!!mode}
        tutup={tutup}
        judul={mode === "pasang" ? "Pasang PIN" : mode === "ganti" ? "Ganti PIN" : "Matikan PIN"}
      >
        <form onSubmit={simpan} className="space-y-4">
          {(mode === "ganti" || mode === "matikan") && (
            <Label teks="PIN sekarang">
              <PjInput value={lama} onChange={(e) => setLama(e.target.value.replace(/\D/g, ""))} autoFocus />
            </Label>
          )}
          {mode !== "matikan" && (
            <>
              <Label teks="PIN baru (6 angka)">
                <PjInput value={baru} onChange={(e) => setBaru(e.target.value.replace(/\D/g, ""))}
                  autoFocus={mode === "pasang"} />
              </Label>
              <Label teks="Ulangi PIN baru">
                <PjInput value={ulang} onChange={(e) => setUlang(e.target.value.replace(/\D/g, ""))} />
              </Label>
            </>
          )}
          {galat && <p className="text-sm" style={{ color: "var(--brick)" }}>{galat}</p>}
          <button className="btn-utama w-full">
            {mode === "matikan" ? "Matikan PIN" : "Simpan PIN"}
          </button>
        </form>
      </Panel>
    </>
  );
}
