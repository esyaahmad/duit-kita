"use client";
import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { Judul, Kartu, Memuat, Panel, Label } from "@/components/ui";
import { uang } from "@/lib/format";

const JENIS = [
  { n: "cash", l: "Tunai" }, { n: "bank", l: "Rekening bank" },
  { n: "ewallet", l: "E-wallet" }, { n: "kartu", l: "Kartu kredit" },
  { n: "investasi", l: "Investasi" },
];
const WARNA = ["#0F6E63", "#D9A21B", "#B5462B", "#4C6E9F", "#7A6A9B", "#5C8A3A"];
const kosong = { nama: "", jenis: "cash", saldo_awal: "", warna: "#0F6E63" };

export default function Dompet() {
  const supabase = getSupabase();
  const [list, setList] = useState(null);
  const [form, setForm] = useState(null);

  const muat = useCallback(async () => {
    const { data } = await supabase.from("wallet_balances").select("*").order("urutan");
    setList(data || []);
  }, [supabase]);

  useEffect(() => { muat(); }, [muat]);

  async function simpan(e) {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const baris = {
      user_id: user.id,
      nama: form.nama,
      jenis: form.jenis,
      warna: form.warna,
      saldo_awal: Number(String(form.saldo_awal).replace(/\D/g, "")) || 0,
    };
    if (form.id) await supabase.from("wallets").update(baris).eq("id", form.id);
    else await supabase.from("wallets").insert({ ...baris, urutan: (list?.length || 0) + 1 });
    setForm(null);
    muat();
  }

  async function hapus(id) {
    if (!confirm("Hapus dompet ini? Transaksinya tetap ada tapi kehilangan dompet.")) return;
    await supabase.from("wallets").delete().eq("id", id);
    setForm(null);
    muat();
  }

  if (!list) return <Memuat jumlah={3} />;

  const total = list.reduce((s, d) => s + Number(d.saldo), 0);

  return (
    <div>
      <Judul anak="Dompet" keterangan={`Total ${uang(total)}`}
        aksi={<button className="btn" onClick={() => setForm({ ...kosong })}>Tambah</button>} />

      <div className="space-y-3">
        {list.map((d) => (
          <button key={d.id} className="w-full text-left press"
            onClick={() => setForm({ ...d, saldo_awal: String(Math.round(d.saldo_awal)) })}>
            <Kartu className="flex items-center gap-3">
              <span className="h-10 w-3 border-2 border-line" style={{ background: d.warna }} />
              <div className="flex-1">
                <p className="font-medium">{d.nama}</p>
                <p className="text-xs text-muted">{JENIS.find((j) => j.n === d.jenis)?.l}</p>
              </div>
              <span className="num font-medium">{uang(d.saldo)}</span>
            </Kartu>
          </button>
        ))}
      </div>

      <Panel buka={!!form} tutup={() => setForm(null)} judul={form?.id ? "Ubah dompet" : "Dompet baru"}>
        {form && (
          <form onSubmit={simpan} className="space-y-4">
            <Label teks="Nama dompet">
              <input className="field" required value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="BCA" />
            </Label>
            <Label teks="Jenis">
              <select className="field" value={form.jenis}
                onChange={(e) => setForm({ ...form, jenis: e.target.value })}>
                {JENIS.map((j) => <option key={j.n} value={j.n}>{j.l}</option>)}
              </select>
            </Label>
            <Label teks="Saldo awal">
              <input inputMode="numeric" className="field num"
                value={form.saldo_awal ? Number(form.saldo_awal).toLocaleString("id-ID") : ""}
                onChange={(e) => setForm({ ...form, saldo_awal: e.target.value.replace(/\D/g, "") })} />
            </Label>
            <Label teks="Warna">
              <div className="flex gap-2">
                {WARNA.map((w) => (
                  <button key={w} type="button" onClick={() => setForm({ ...form, warna: w })}
                    className="h-9 w-9 border-2 border-line press"
                    style={{ background: w, outline: form.warna === w ? "2px solid var(--ink)" : "none", outlineOffset: 2 }} />
                ))}
              </div>
            </Label>
            <div className="flex gap-2">
              {form.id && <button type="button" className="btn" onClick={() => hapus(form.id)}>Hapus</button>}
              <button className="btn-utama flex-1">Simpan</button>
            </div>
          </form>
        )}
      </Panel>
    </div>
  );
}
