"use client";
import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { Judul, Memuat, Panel, Label, Pilihan } from "@/components/ui";

const IKON = ["🍜","🛵","🛒","🧾","🩺","🎬","📚","📦","🏠","👕","🎁","💼","🏪","💰","➕","✈️","☕","🐈"];
const kosong = { nama: "", tipe: "expense", ikon: "📦" };

export default function Kategori() {
  const supabase = getSupabase();
  const [list, setList] = useState(null);
  const [form, setForm] = useState(null);

  const muat = useCallback(async () => {
    const { data } = await supabase.from("categories").select("*").order("tipe").order("nama");
    setList(data || []);
  }, [supabase]);

  useEffect(() => { muat(); }, [muat]);

  async function simpan(e) {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const baris = { user_id: user.id, nama: form.nama, tipe: form.tipe, ikon: form.ikon };
    if (form.id) await supabase.from("categories").update(baris).eq("id", form.id);
    else await supabase.from("categories").insert(baris);
    setForm(null);
    muat();
  }

  async function hapus(id) {
    if (!confirm("Hapus kategori ini? Transaksi lama jadi tanpa kategori.")) return;
    await supabase.from("categories").delete().eq("id", id);
    setForm(null);
    muat();
  }

  if (!list) return <Memuat jumlah={4} tinggi={48} />;

  const grup = [
    { tipe: "expense", judul: "Pengeluaran" },
    { tipe: "income", judul: "Pemasukan" },
  ];

  return (
    <div>
      <Judul anak="Kategori" keterangan="Kelompokkan transaksimu"
        aksi={<button className="btn" onClick={() => setForm({ ...kosong })}>Tambah</button>} />

      <div className="space-y-7">
        {grup.map((g) => (
          <section key={g.tipe}>
            <h2 className="mb-3 border-b-2 border-line pb-1 text-sm font-medium">{g.judul}</h2>
            <div className="grid grid-cols-2 gap-2">
              {list.filter((k) => k.tipe === g.tipe).map((k) => (
                <button key={k.id} onClick={() => setForm(k)}
                  className="frame-flat flex items-center gap-2 p-3 text-left text-sm press">
                  <span className="text-lg">{k.ikon}</span>
                  <span className="truncate">{k.nama}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Panel buka={!!form} tutup={() => setForm(null)} judul={form?.id ? "Ubah kategori" : "Kategori baru"}>
        {form && (
          <form onSubmit={simpan} className="space-y-4">
            <Label teks="Nama">
              <input className="field" required value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Kopi" />
            </Label>
            <Label teks="Jenis">
              <Pilihan nilai={form.tipe} ubah={(v) => setForm({ ...form, tipe: v })}
                opsi={[{ nilai: "expense", label: "Pengeluaran" }, { nilai: "income", label: "Pemasukan" }]} />
            </Label>
            <Label teks="Ikon">
              <div className="flex flex-wrap gap-2">
                {IKON.map((i) => (
                  <button key={i} type="button" onClick={() => setForm({ ...form, ikon: i })}
                    className={`chip text-lg ${form.ikon === i ? "chip-aktif" : ""}`}>{i}</button>
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
