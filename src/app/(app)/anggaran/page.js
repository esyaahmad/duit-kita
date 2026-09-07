"use client";
import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { Judul, Kartu, Memuat, Kosong, Panel, Label, Bilah } from "@/components/ui";
import InputUang from "@/components/InputUang";
import { hitungJumlah } from "@/lib/hitung";
import {
  uang, uangRingkas, periodeSekarang, labelPeriode, geserPeriode, rentangPeriode,
} from "@/lib/format";

export default function Anggaran() {
  const supabase = getSupabase();
  const [periode, setPeriode] = useState(periodeSekarang());
  const [data, setData] = useState(null);
  const [edit, setEdit] = useState(null);
  const [nilai, setNilai] = useState("");

  const muat = useCallback(async () => {
    const { awal, akhir } = rentangPeriode(periode);
    const { data: { user } } = await supabase.auth.getUser();
    const [kat, ang, trx] = await Promise.all([
      supabase.from("categories").select("*").eq("user_id", user.id).eq("tipe", "expense").order("nama"),
      supabase.from("budgets").select("*").eq("periode", periode),
      supabase.from("transactions").select("category_id,jumlah").eq("tipe", "expense")
        .gte("tanggal", awal).lte("tanggal", akhir),
    ]);
    setData({ kategori: kat.data || [], anggaran: ang.data || [], transaksi: trx.data || [] });
  }, [periode, supabase]);

  useEffect(() => { muat(); }, [muat]);

  async function simpan() {
    const jumlah = hitungJumlah(nilai);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!jumlah) {
      await supabase.from("budgets").delete().eq("user_id", user.id)
        .eq("category_id", edit.id).eq("periode", periode);
    } else {
      await supabase.from("budgets").upsert(
        { user_id: user.id, category_id: edit.id, periode, jumlah },
        { onConflict: "user_id,category_id,periode" }
      );
    }
    setEdit(null);
    muat();
  }

  async function salinBulanLalu() {
    const lalu = geserPeriode(periode, -1);
    const { data: lama } = await supabase.from("budgets").select("category_id,jumlah").eq("periode", lalu);
    if (!lama?.length) return alert("Bulan sebelumnya belum punya anggaran.");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("budgets").upsert(
      lama.map((b) => ({ ...b, user_id: user.id, periode })),
      { onConflict: "user_id,category_id,periode" }
    );
    muat();
  }

  if (!data) return <Memuat jumlah={5} />;

  const petaAnggaran = Object.fromEntries(data.anggaran.map((a) => [a.category_id, a]));
  const terpakaiPer = data.transaksi.reduce((acc, t) => {
    acc[t.category_id] = (acc[t.category_id] || 0) + Number(t.jumlah);
    return acc;
  }, {});

  const totalAnggaran = data.anggaran.reduce((s, a) => s + Number(a.jumlah), 0);
  const totalTerpakai = data.anggaran.reduce((s, a) => s + (terpakaiPer[a.category_id] || 0), 0);
  const sisa = totalAnggaran - totalTerpakai;

  const berAnggaran = data.kategori.filter((k) => petaAnggaran[k.id]);
  const belum = data.kategori.filter((k) => !petaAnggaran[k.id]);

  return (
    <div>
      <Judul anak="Anggaran" keterangan="Batas belanja per kategori tiap bulan" />

      <div className="mb-5 flex items-center justify-between">
        <button onClick={() => setPeriode(geserPeriode(periode, -1))} className="chip">Sebelumnya</button>
        <span className="text-sm font-medium">{labelPeriode(periode)}</span>
        <button onClick={() => setPeriode(geserPeriode(periode, 1))} className="chip">Berikutnya</button>
      </div>

      <div className="frame mb-6 p-5"
        style={{ background: sisa < 0 ? "var(--brick)" : "var(--surface)", color: sisa < 0 ? "var(--paper)" : "var(--ink)" }}>
        <p className="text-sm opacity-80">{sisa < 0 ? "Melebihi anggaran" : "Sisa anggaran bulan ini"}</p>
        <p className="mt-1 text-4xl font-semibold num">{uang(Math.abs(sisa))}</p>
        <p className="mt-2 text-sm opacity-80 num">
          Terpakai {uangRingkas(totalTerpakai)} dari {uangRingkas(totalAnggaran)}
        </p>
      </div>

      {berAnggaran.length === 0 ? (
        <Kosong judul="Belum ada anggaran bulan ini"
          ajakan="Tetapkan batas untuk kategori yang paling sering menguras dompet."
          aksi={<button className="btn" onClick={salinBulanLalu}>Salin dari bulan lalu</button>} />
      ) : (
        <div className="space-y-3">
          {berAnggaran.map((k) => {
            const a = petaAnggaran[k.id];
            const terpakai = terpakaiPer[k.id] || 0;
            const persen = (terpakai / Number(a.jumlah)) * 100;
            return (
              <button key={k.id} className="w-full text-left press"
                onClick={() => { setEdit(k); setNilai(String(Math.round(a.jumlah))); }}>
                <Kartu className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>{k.ikon} {k.nama}</span>
                    <span className="num text-sm">{Math.round(persen)}%</span>
                  </div>
                  <Bilah persen={persen}
                    warna={persen > 100 ? "var(--brick)" : persen > 80 ? "var(--mustard)" : "var(--teal)"} />
                  <p className="text-xs text-muted num">
                    {uang(terpakai)} dari {uang(a.jumlah)} · sisa {uang(Number(a.jumlah) - terpakai)}
                  </p>
                </Kartu>
              </button>
            );
          })}
        </div>
      )}

      {belum.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Belum dianggarkan</h2>
          <div className="flex flex-wrap gap-2">
            {belum.map((k) => (
              <button key={k.id} className="chip"
                onClick={() => { setEdit(k); setNilai(""); }}>
                {k.ikon} {k.nama}
              </button>
            ))}
          </div>
        </section>
      )}

      <Panel buka={!!edit} tutup={() => setEdit(null)} judul={`Anggaran ${edit?.nama || ""}`}>
        <div className="space-y-4">
          <Label teks={`Batas untuk ${labelPeriode(periode)}`}>
            <InputUang nilai={nilai} ubah={setNilai} autoFocus />
          </Label>
          <p className="text-xs text-muted">Kosongkan lalu simpan untuk menghapus anggaran ini.</p>
          <button className="btn-utama w-full" onClick={simpan}>Simpan</button>
        </div>
      </Panel>
    </div>
  );
}
