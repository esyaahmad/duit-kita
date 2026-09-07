"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";

export default function Login() {
  const router = useRouter();
  const supabase = getSupabase();
  const [mode, setMode] = useState("masuk");
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [nama, setNama] = useState("");
  const [pesan, setPesan] = useState(null);
  const [sibuk, setSibuk] = useState(false);

  async function kirim(e) {
    e.preventDefault();
    setPesan(null);
    setSibuk(true);

    if (mode === "masuk") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: sandi,
      });
      if (error) setPesan(terjemahkan(error.message));
      else {
        router.push("/dashboard");
        router.refresh();
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: sandi,
        options: {
          data: { nama },
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      });
      if (error) setPesan(terjemahkan(error.message));
      else if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setPesan("Akun dibuat. Cek email untuk konfirmasi, lalu masuk.");
      }
    }
    setSibuk(false);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8">
        <div
          className="mb-5 inline-block border-2 border-line px-3 py-1 text-sm num"
          style={{ background: "var(--mustard)", color: "var(--on-accent)" }}
        >
          buku kas pribadi
        </div>
        <h1 className="text-4xl font-semibold leading-none">Duit Kita</h1>
        <p className="mt-3 max-w-xs text-muted">
          Catat ke mana uangmu pergi, atur anggaran bulanan, dan kejar target
          tabungan — semuanya dari ponsel.
        </p>
      </div>

      <div className="mb-5 flex gap-2">
        <button
          onClick={() => setMode("masuk")}
          className={`chip flex-1 ${mode === "masuk" ? "chip-aktif" : ""}`}
        >
          Masuk
        </button>
        <button
          onClick={() => setMode("daftar")}
          className={`chip flex-1 ${mode === "daftar" ? "chip-aktif" : ""}`}
        >
          Buat akun
        </button>
      </div>

      <form onSubmit={kirim} className="frame space-y-4 p-5">
        {mode === "daftar" && (
          <label className="block">
            <span className="mb-1.5 block text-sm text-muted">Nama panggilan</span>
            <input
              className="field"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Rina"
              required
            />
          </label>
        )}

        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">Email</span>
          <input
            type="email"
            className="field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            autoComplete="email"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">Kata sandi</span>
          <input
            type="password"
            className="field"
            value={sandi}
            onChange={(e) => setSandi(e.target.value)}
            placeholder="minimal 6 karakter"
            minLength={6}
            autoComplete={mode === "masuk" ? "current-password" : "new-password"}
            required
          />
        </label>

        {pesan && (
          <p
            className="border-2 border-line px-3 py-2 text-sm"
            style={{ background: "color-mix(in srgb, var(--mustard) 35%, transparent)" }}
          >
            {pesan}
          </p>
        )}

        <button className="btn-utama w-full" disabled={sibuk}>
          {sibuk ? "Sebentar…" : mode === "masuk" ? "Masuk" : "Buat akun"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-muted">
        Datamu tersimpan di database Supabase milikmu sendiri.
      </p>
    </div>
  );
}

function terjemahkan(pesan = "") {
  const p = pesan.toLowerCase();
  if (p.includes("invalid login")) return "Email atau kata sandi salah.";
  if (p.includes("already registered")) return "Email ini sudah terdaftar. Coba masuk.";
  if (p.includes("password should be")) return "Kata sandi minimal 6 karakter.";
  if (p.includes("email not confirmed")) return "Email belum dikonfirmasi. Cek kotak masukmu.";
  return pesan;
}
