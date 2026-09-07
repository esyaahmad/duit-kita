"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { Judul, Kartu, Label, Memuat } from "@/components/ui";
import PemilihTema from "@/components/PemilihTema";
import AturPin from "@/components/AturPin";

export default function Profil() {
  const supabase = getSupabase();
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [siap, setSiap] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setEmail(user?.email || "");
      const { data } = await supabase.from("profiles").select("nama").eq("id", user.id).maybeSingle();
      setNama(data?.nama || "");
      setSiap(true);
    })();
  }, [supabase]);

  async function simpanNama() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("profiles").upsert({ id: user.id, nama });
    setStatus("Nama tersimpan.");
    setTimeout(() => setStatus(null), 2500);
  }

  async function ekspor() {
    const [{ data: trx }, { data: kat }, { data: dom }] = await Promise.all([
      supabase.from("transactions").select("*").order("tanggal"),
      supabase.from("categories").select("id,nama"),
      supabase.from("wallets").select("id,nama"),
    ]);
    const k = Object.fromEntries((kat || []).map((x) => [x.id, x.nama]));
    const d = Object.fromEntries((dom || []).map((x) => [x.id, x.nama]));
    const baris = [
      ["tanggal", "tipe", "jumlah", "kategori", "dompet", "dompet_tujuan", "catatan"],
      ...(trx || []).map((t) => [
        t.tanggal, t.tipe, Math.round(t.jumlah),
        k[t.category_id] || "", d[t.wallet_id] || "", d[t.wallet_tujuan_id] || "",
        (t.catatan || "").replace(/"/g, "'"),
      ]),
    ];
    const csv = baris.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `duit-kita-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function keluar() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (!siap) return <Memuat jumlah={3} />;

  return (
    <div className="space-y-5">
      <Judul anak="Profil" keterangan={email} />

      <Kartu className="space-y-3">
        <Label teks="Nama panggilan">
          <input className="field" value={nama} onChange={(e) => setNama(e.target.value)} />
        </Label>
        <button className="btn-utama w-full" onClick={simpanNama}>Simpan nama</button>
        {status && <p className="text-sm text-muted">{status}</p>}
      </Kartu>

      <Kartu className="space-y-3">
        <div>
          <p className="font-medium">Tema tampilan</p>
          <p className="text-xs text-muted">Ganti gaya warna seluruh aplikasi. Tersimpan di perangkat ini.</p>
        </div>
        <PemilihTema />
      </Kartu>

      <AturPin />

      <Kartu className="space-y-3">
        <div>
          <p className="font-medium">Ekspor data</p>
          <p className="text-xs text-muted">Unduh semua transaksi sebagai CSV untuk dibuka di Excel.</p>
        </div>
        <button className="btn w-full" onClick={ekspor}>Unduh CSV</button>
      </Kartu>

      <button className="btn w-full" onClick={keluar}>Keluar dari akun</button>
    </div>
  );
}
