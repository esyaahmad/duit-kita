"use client";
import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { Judul, Kartu, Memuat, Kosong, Panel, Label, Bilah } from "@/components/ui";
import { uang, uangRingkas } from "@/lib/format";

const kosongForm = { nama: "", target: "", terkumpul: "", target_tanggal: "", ikon: "🎯" };
const IKON = ["🎯", "🏠", "🛵", "✈️", "💍", "📱", "🎓", "🚑"];

export default function Target() {
  const supabase = getSupabase();
  const [list, setList] = useState(null);
  const [form, setForm] = useState(null);
  const [tambahDana, setTambahDana] = useState(null);
  const [nominal, setNominal] = useState("");

  const muat = useCallback(async () => {
    const { data } = await supabase.from("goals").select("*").order("created_at");
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
      ikon: form.ikon,
      target: Number(String(form.target).replace(/\D/g, "")) || 0,
      terkumpul: Number(String(form.terkumpul).replace(/\D/g, "")) || 0,
      target_tanggal: form.target_tanggal || null,
    };
    if (!baris.nama || !baris.target) return;
    if (form.id) await supabase.from("goals").update(baris).eq("id", form.id);
    else await supabase.from("goals").insert(baris);
    setForm(null);
    muat();
  }

  async function hapus(id) {
    if (!confirm("Hapus target ini?")) return;
    await supabase.from("goals").delete().eq("id", id);
    setForm(null);
    muat();
  }

  async function setor() {
    const n = Number(String(nominal).replace(/\D/g, ""));
    if (!n) return;
    await supabase.from("goals")
      .update({ terkumpul: Number(tambahDana.terkumpul) + n })
      .eq("id", tambahDana.id);
    setTambahDana(null);
    setNominal("");
    muat();
  }

  if (!list) return <Memuat jumlah={3} tinggi={100} />;

  return (
    <div>
      <Judul
        anak="Target tabungan"
        keterangan="Kumpulkan dana untuk rencana besarmu"
        aksi={<button className="btn" onClick={() => setForm({ ...kosongForm })}>Tambah</button>}
      />

      {list.length === 0 ? (
        <Kosong judul="Belum ada target" ajakan="Misalnya dana darurat, motor baru, atau liburan."
          aksi={<button className="btn-utama" onClick={() => setForm({ ...kosongForm })}>Buat target</button>} />
      ) : (
        <div className="space-y-3">
          {list.map((g) => {
            const persen = (Number(g.terkumpul) / Number(g.target)) * 100;
            const selesai = persen >= 100;
            return (
              <Kartu key={g.id} className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{g.ikon}</span>
                  <div className="flex-1">
                    <p className="font-medium">{g.nama}</p>
                    <p className="text-xs text-muted num">
                      {uang(g.terkumpul)} dari {uang(g.target)}
                      {g.target_tanggal ? ` · sampai ${g.target_tanggal}` : ""}
                    </p>
                  </div>
                  <span className="num text-sm">{Math.round(persen)}%</span>
                </div>
                <Bilah persen={persen} warna={selesai ? "var(--teal)" : "var(--mustard)"} />
                <div className="flex gap-2">
                  <button className="chip flex-1" onClick={() => { setTambahDana(g); setNominal(""); }}>
                    Setor dana
                  </button>
                  <button className="chip" onClick={() => setForm({
                    ...g,
                    target: String(Math.round(g.target)),
                    terkumpul: String(Math.round(g.terkumpul)),
                    target_tanggal: g.target_tanggal || "",
                  })}>
                    Ubah
                  </button>
                </div>
              </Kartu>
            );
          })}
        </div>
      )}

      <Panel buka={!!form} tutup={() => setForm(null)} judul={form?.id ? "Ubah target" : "Target baru"}>
        {form && (
          <form onSubmit={simpan} className="space-y-4">
            <Label teks="Nama target">
              <input className="field" value={form.nama} required
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Dana darurat" />
            </Label>
            <Label teks="Ikon">
              <div className="flex flex-wrap gap-2">
                {IKON.map((i) => (
                  <button key={i} type="button" onClick={() => setForm({ ...form, ikon: i })}
                    className={`chip text-lg ${form.ikon === i ? "chip-aktif" : ""}`}>{i}</button>
                ))}
              </div>
            </Label>
            <Label teks="Jumlah target">
              <input inputMode="numeric" className="field num"
                value={form.target ? Number(form.target).toLocaleString("id-ID") : ""}
                onChange={(e) => setForm({ ...form, target: e.target.value.replace(/\D/g, "") })} />
            </Label>
            <Label teks="Sudah terkumpul">
              <input inputMode="numeric" className="field num"
                value={form.terkumpul ? Number(form.terkumpul).toLocaleString("id-ID") : ""}
                onChange={(e) => setForm({ ...form, terkumpul: e.target.value.replace(/\D/g, "") })} />
            </Label>
            <Label teks="Target tanggal (opsional)">
              <input type="date" className="field num" value={form.target_tanggal}
                onChange={(e) => setForm({ ...form, target_tanggal: e.target.value })} />
            </Label>
            <div className="flex gap-2">
              {form.id && (
                <button type="button" className="btn" onClick={() => hapus(form.id)}>Hapus</button>
              )}
              <button className="btn-utama flex-1">Simpan</button>
            </div>
          </form>
        )}
      </Panel>

      <Panel buka={!!tambahDana} tutup={() => setTambahDana(null)} judul={`Setor ke ${tambahDana?.nama || ""}`}>
        <div className="space-y-4">
          <Label teks="Nominal setoran">
            <div className="flex items-center border-2 border-line bg-raised">
              <span className="px-3 text-muted num">Rp</span>
              <input inputMode="numeric" autoFocus
                className="w-full bg-transparent px-1 py-3 text-2xl num outline-none"
                value={nominal ? Number(nominal).toLocaleString("id-ID") : ""}
                onChange={(e) => setNominal(e.target.value.replace(/\D/g, ""))} placeholder="0" />
            </div>
          </Label>
          <p className="text-xs text-muted num">
            Terkumpul sekarang {uangRingkas(tambahDana?.terkumpul || 0)}
          </p>
          <button className="btn-utama w-full" onClick={setor}>Tambahkan</button>
        </div>
      </Panel>
    </div>
  );
}
