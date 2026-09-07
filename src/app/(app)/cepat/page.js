"use client";
import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { Judul, Kartu, Memuat, Kosong, Panel, Label, Pilihan } from "@/components/ui";
import InputUang from "@/components/InputUang";
import { hitungJumlah } from "@/lib/hitung";
import { uang } from "@/lib/format";

const kosong = { label: "", tipe: "expense", jumlah: "", category_id: "", wallet_id: "", catatan: "" };

export default function TransaksiCepat() {
  const supabase = getSupabase();
  const [list, setList] = useState(null);
  const [kategori, setKategori] = useState([]);
  const [dompet, setDompet] = useState([]);
  const [form, setForm] = useState(null);

  const muat = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const [q, k, d] = await Promise.all([
      supabase.from("quick_txns").select("*").order("urutan").order("created_at"),
      supabase.from("categories").select("*").eq("user_id", user.id).order("nama"),
      supabase.from("wallets").select("id,nama").order("urutan"),
    ]);
    setList(q.data || []);
    setKategori(k.data || []);
    setDompet(d.data || []);
  }, [supabase]);

  useEffect(() => { muat(); }, [muat]);

  async function simpan(e) {
    e.preventDefault();
    const jumlah = hitungJumlah(form.jumlah);
    if (!form.label.trim() || !jumlah) return;
    const { data: { user } } = await supabase.auth.getUser();
    const baris = {
      user_id: user.id,
      label: form.label.trim(),
      tipe: form.tipe,
      jumlah,
      category_id: form.category_id || null,
      wallet_id: form.wallet_id || null,
      catatan: form.catatan || null,
    };
    if (form.id) await supabase.from("quick_txns").update(baris).eq("id", form.id);
    else await supabase.from("quick_txns").insert({ ...baris, urutan: (list?.length || 0) + 1 });
    setForm(null);
    muat();
  }

  async function hapus(id) {
    if (!confirm("Hapus transaksi cepat ini?")) return;
    await supabase.from("quick_txns").delete().eq("id", id);
    setForm(null);
    muat();
  }

  if (!list) return <Memuat jumlah={4} tinggi={56} />;

  const petaKat = Object.fromEntries(kategori.map((k) => [k.id, k]));
  const petaDom = Object.fromEntries(dompet.map((d) => [d.id, d]));
  const kategoriTerpakai = form ? kategori.filter((k) => k.tipe === form.tipe) : [];

  return (
    <div>
      <Judul
        anak="Transaksi cepat"
        keterangan="Tombol satu-ketuk di Beranda untuk pengeluaran rutin"
        aksi={<button className="btn" onClick={() => setForm({ ...kosong, wallet_id: dompet[0]?.id || "" })}>Tambah</button>}
      />

      {list.length === 0 ? (
        <Kosong
          judul="Belum ada transaksi cepat"
          ajakan="Misalnya “Kopi 25rb”, “Bensin 50rb”, “Parkir 5rb”. Bisa juga dibuat dari form catat transaksi."
          aksi={<button className="btn-utama" onClick={() => setForm({ ...kosong, wallet_id: dompet[0]?.id || "" })}>Buat</button>}
        />
      ) : (
        <div className="space-y-2">
          {list.map((q) => (
            <button key={q.id} onClick={() => setForm({ ...q, jumlah: String(Math.round(q.jumlah)) })}
              className="frame-flat flex w-full items-center gap-3 p-3 text-left press">
              <span className="text-xl">{petaKat[q.category_id]?.ikon || (q.tipe === "income" ? "➕" : "⚡")}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{q.label}</p>
                <p className="truncate text-xs text-muted">
                  {petaKat[q.category_id]?.nama || "Tanpa kategori"}
                  {petaDom[q.wallet_id] ? ` · ${petaDom[q.wallet_id].nama}` : ""}
                </p>
              </div>
              <span className="num font-medium" style={{ color: q.tipe === "income" ? "var(--teal)" : "var(--brick)" }}>
                {uang(q.jumlah)}
              </span>
            </button>
          ))}
        </div>
      )}

      <Panel buka={!!form} tutup={() => setForm(null)} judul={form?.id ? "Ubah transaksi cepat" : "Transaksi cepat baru"}>
        {form && (
          <form onSubmit={simpan} className="space-y-4">
            <Pilihan
              nilai={form.tipe}
              ubah={(v) => setForm({ ...form, tipe: v, category_id: "" })}
              opsi={[{ nilai: "expense", label: "Pengeluaran" }, { nilai: "income", label: "Pemasukan" }]}
            />
            <Label teks="Nama tombol">
              <input className="field" required value={form.label} placeholder="Kopi pagi"
                onChange={(e) => setForm({ ...form, label: e.target.value })} />
            </Label>
            <Label teks="Jumlah">
              <InputUang nilai={form.jumlah} ubah={(v) => setForm({ ...form, jumlah: v })} />
            </Label>
            <Label teks="Kategori">
              <div className="grid grid-cols-3 gap-2">
                {kategoriTerpakai.map((k) => (
                  <button key={k.id} type="button" onClick={() => setForm({ ...form, category_id: k.id })}
                    className={`border-2 border-line px-2 py-2 text-xs press ${form.category_id === k.id ? "chip-aktif" : "bg-raised"}`}>
                    <span className="block text-base">{k.ikon}</span>
                    {k.nama}
                  </button>
                ))}
              </div>
            </Label>
            <Label teks="Dompet">
              <select className="field" value={form.wallet_id}
                onChange={(e) => setForm({ ...form, wallet_id: e.target.value })}>
                <option value="">Pilih dompet</option>
                {dompet.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
              </select>
            </Label>
            <Label teks="Catatan (opsional)">
              <input className="field" value={form.catatan}
                onChange={(e) => setForm({ ...form, catatan: e.target.value })} placeholder="Kopi depan kantor" />
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
