"use client";
import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { Judul, Kartu, Memuat, Kosong, Panel, Label, Pilihan } from "@/components/ui";
import InputUang from "@/components/InputUang";
import { hitungJumlah } from "@/lib/hitung";
import { uang, uangRingkas, tanggalPendek } from "@/lib/format";
import { berikutnya, perBulan, labelSiklus, HARI_NAMA, BULAN_NAMA } from "@/lib/berulang";

const kosong = {
  nama: "", tipe: "expense", jumlah: "", category_id: "", wallet_id: "",
  catatan: "", siklus: "bulanan", hari: 1, bulan: 1, otomatis: false, aktif: true,
};

export default function Langganan() {
  const supabase = getSupabase();
  const [list, setList] = useState(null);
  const [kategori, setKategori] = useState([]);
  const [dompet, setDompet] = useState([]);
  const [form, setForm] = useState(null);

  const muat = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const [r, k, d] = await Promise.all([
      supabase.from("recurring").select("*").order("created_at"),
      supabase.from("categories").select("*").eq("user_id", user.id).order("nama"),
      supabase.from("wallets").select("id,nama").order("urutan"),
    ]);
    setList(r.data || []);
    setKategori(k.data || []);
    setDompet(d.data || []);
  }, [supabase]);

  useEffect(() => { muat(); }, [muat]);

  async function simpan(e) {
    e.preventDefault();
    const jumlah = hitungJumlah(form.jumlah);
    if (!form.nama.trim() || !jumlah) return;
    const { data: { user } } = await supabase.auth.getUser();
    const baris = {
      user_id: user.id,
      nama: form.nama.trim(),
      tipe: form.tipe,
      jumlah,
      category_id: form.category_id || null,
      wallet_id: form.wallet_id || null,
      catatan: form.catatan || null,
      siklus: form.siklus,
      hari: Number(form.hari) || 1,
      bulan: form.siklus === "tahunan" ? Number(form.bulan) || 1 : null,
      otomatis: !!form.otomatis,
      aktif: !!form.aktif,
    };
    if (form.id) await supabase.from("recurring").update(baris).eq("id", form.id);
    else await supabase.from("recurring").insert({ ...baris, mulai: new Date().toISOString().slice(0, 10) });
    setForm(null);
    muat();
  }

  async function hapus(id) {
    if (!confirm("Hapus langganan ini? Transaksi yang sudah tercatat tetap ada.")) return;
    await supabase.from("recurring").delete().eq("id", id);
    setForm(null);
    muat();
  }

  if (!list) return <Memuat jumlah={4} tinggi={72} />;

  const petaKat = Object.fromEntries(kategori.map((k) => [k.id, k]));
  const aktif = list.filter((r) => r.aktif);
  const komitmen = aktif.filter((r) => r.tipe === "expense").reduce((s, r) => s + perBulan(r), 0);
  const pemasukan = aktif.filter((r) => r.tipe === "income").reduce((s, r) => s + perBulan(r), 0);
  const kategoriTerpakai = form ? kategori.filter((k) => k.tipe === form.tipe) : [];

  return (
    <div>
      <Judul
        anak="Langganan"
        keterangan="Tagihan & transaksi berulang"
        aksi={<button className="btn" onClick={() => setForm({ ...kosong, wallet_id: dompet[0]?.id || "" })}>Tambah</button>}
      />

      {aktif.length > 0 && (
        <div className="frame mb-5 p-4">
          <p className="text-sm text-muted">Komitmen pengeluaran / bulan</p>
          <p className="num text-3xl font-semibold" style={{ color: "var(--brick)" }}>{uang(komitmen)}</p>
          {pemasukan > 0 && (
            <p className="mt-1 text-xs text-muted num">Pemasukan rutin {uangRingkas(pemasukan)} / bulan</p>
          )}
        </div>
      )}

      {list.length === 0 ? (
        <Kosong
          judul="Belum ada langganan"
          ajakan="Catat Netflix, listrik, cicilan, iuran RT — biar muncul otomatis di tanggalnya."
          aksi={<button className="btn-utama" onClick={() => setForm({ ...kosong, wallet_id: dompet[0]?.id || "" })}>Tambah langganan</button>}
        />
      ) : (
        <div className="space-y-2">
          {list.map((r) => (
            <button key={r.id} onClick={() => setForm({ ...r, jumlah: String(Math.round(r.jumlah)), bulan: r.bulan || 1 })}
              className="frame-flat flex w-full items-center gap-3 p-3 text-left press"
              style={{ opacity: r.aktif ? 1 : 0.5 }}>
              <span className="text-xl">{petaKat[r.category_id]?.ikon || (r.tipe === "income" ? "➕" : "🔁")}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.nama}</p>
                <p className="truncate text-xs text-muted">
                  {labelSiklus(r)}
                  {r.aktif ? ` · berikutnya ${tanggalPendek(berikutnya(r))}` : " · nonaktif"}
                  {r.otomatis ? " · otomatis" : ""}
                </p>
              </div>
              <span className="num font-medium" style={{ color: r.tipe === "income" ? "var(--teal)" : "var(--brick)" }}>
                {uangRingkas(r.jumlah)}
              </span>
            </button>
          ))}
        </div>
      )}

      <Panel buka={!!form} tutup={() => setForm(null)} judul={form?.id ? "Ubah langganan" : "Langganan baru"}>
        {form && (
          <form onSubmit={simpan} className="space-y-4">
            <Pilihan
              nilai={form.tipe}
              ubah={(v) => setForm({ ...form, tipe: v, category_id: "" })}
              opsi={[{ nilai: "expense", label: "Pengeluaran" }, { nilai: "income", label: "Pemasukan" }]}
            />
            <Label teks="Nama">
              <input className="field" required value={form.nama} placeholder="Netflix"
                onChange={(e) => setForm({ ...form, nama: e.target.value })} />
            </Label>
            <Label teks="Jumlah">
              <InputUang nilai={form.jumlah} ubah={(v) => setForm({ ...form, jumlah: v })} />
            </Label>

            <Label teks="Siklus">
              <Pilihan
                nilai={form.siklus}
                ubah={(v) => setForm({ ...form, siklus: v })}
                opsi={[
                  { nilai: "mingguan", label: "Mingguan" },
                  { nilai: "bulanan", label: "Bulanan" },
                  { nilai: "tahunan", label: "Tahunan" },
                ]}
              />
            </Label>

            {form.siklus === "mingguan" ? (
              <Label teks="Hari">
                <select className="field" value={form.hari}
                  onChange={(e) => setForm({ ...form, hari: Number(e.target.value) })}>
                  {HARI_NAMA.map((h, i) => <option key={i} value={i}>{h}</option>)}
                </select>
              </Label>
            ) : (
              <div className={form.siklus === "tahunan" ? "grid grid-cols-2 gap-3" : ""}>
                <Label teks="Tanggal">
                  <select className="field" value={form.hari}
                    onChange={(e) => setForm({ ...form, hari: Number(e.target.value) })}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </Label>
                {form.siklus === "tahunan" && (
                  <Label teks="Bulan">
                    <select className="field" value={form.bulan}
                      onChange={(e) => setForm({ ...form, bulan: Number(e.target.value) })}>
                      {BULAN_NAMA.map((b, i) => <option key={i} value={i + 1}>{b}</option>)}
                    </select>
                  </Label>
                )}
              </div>
            )}

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

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4" checked={form.otomatis}
                onChange={(e) => setForm({ ...form, otomatis: e.target.checked })} />
              Catat otomatis (tanpa konfirmasi)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4" checked={form.aktif}
                onChange={(e) => setForm({ ...form, aktif: e.target.checked })} />
              Aktif
            </label>

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
