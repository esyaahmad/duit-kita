"use client";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { Panel, Label, Pilihan } from "./ui";
import { hariIni } from "@/lib/format";

const kosong = {
  tipe: "expense",
  jumlah: "",
  category_id: "",
  wallet_id: "",
  wallet_tujuan_id: "",
  catatan: "",
  tanggal: hariIni(),
};

export default function FormTransaksi({ buka, tutup, dompet, kategori, awal, selesai }) {
  const supabase = getSupabase();
  const [f, setF] = useState(kosong);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState(null);

  useEffect(() => {
    if (!buka) return;
    if (awal) {
      setF({
        tipe: awal.tipe,
        jumlah: String(Math.round(awal.jumlah)),
        category_id: awal.category_id || "",
        wallet_id: awal.wallet_id || "",
        wallet_tujuan_id: awal.wallet_tujuan_id || "",
        catatan: awal.catatan || "",
        tanggal: awal.tanggal,
      });
    } else {
      setF({ ...kosong, wallet_id: dompet[0]?.id || "" });
    }
    setGalat(null);
  }, [buka, awal, dompet]);

  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const kategoriTerpakai = kategori.filter((k) => k.tipe === f.tipe);

  async function simpan(e) {
    e.preventDefault();
    const jumlah = Number(String(f.jumlah).replace(/\D/g, ""));
    if (!jumlah) return setGalat("Isi jumlahnya dulu.");
    if (!f.wallet_id) return setGalat("Pilih dompet sumber.");
    if (f.tipe === "transfer" && !f.wallet_tujuan_id)
      return setGalat("Pilih dompet tujuan.");
    if (f.tipe === "transfer" && f.wallet_id === f.wallet_tujuan_id)
      return setGalat("Dompet asal dan tujuan tidak boleh sama.");

    setSibuk(true);
    setGalat(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const baris = {
      tipe: f.tipe,
      jumlah,
      tanggal: f.tanggal,
      catatan: f.catatan || null,
      wallet_id: f.wallet_id,
      wallet_tujuan_id: f.tipe === "transfer" ? f.wallet_tujuan_id : null,
      category_id: f.tipe === "transfer" ? null : f.category_id || null,
    };

    // Saat mengubah, jangan sentuh user_id — di dompet bersama transaksi
    // tetap tercatat atas nama orang yang pertama mencatatnya.
    const { error } = awal
      ? await supabase.from("transactions").update(baris).eq("id", awal.id)
      : await supabase.from("transactions").insert({ ...baris, user_id: user.id });

    setSibuk(false);
    if (error) return setGalat(error.message);
    selesai();
    tutup();
  }

  async function hapus() {
    if (!confirm("Hapus transaksi ini?")) return;
    setSibuk(true);
    await supabase.from("transactions").delete().eq("id", awal.id);
    setSibuk(false);
    selesai();
    tutup();
  }

  return (
    <Panel buka={buka} tutup={tutup} judul={awal ? "Ubah transaksi" : "Catat transaksi"}>
      <form onSubmit={simpan} className="space-y-4">
        <Pilihan
          nilai={f.tipe}
          ubah={(v) => setF((s) => ({ ...s, tipe: v, category_id: "" }))}
          opsi={[
            { nilai: "expense", label: "Pengeluaran" },
            { nilai: "income", label: "Pemasukan" },
            { nilai: "transfer", label: "Pindah dana" },
          ]}
        />

        <Label teks="Jumlah">
          <div className="flex items-center border-2 border-line bg-raised">
            <span className="px-3 text-muted num">Rp</span>
            <input
              inputMode="numeric"
              className="w-full bg-transparent px-1 py-3 text-2xl num outline-none"
              value={f.jumlah ? Number(f.jumlah).toLocaleString("id-ID") : ""}
              onChange={(e) => set("jumlah")(e.target.value.replace(/\D/g, ""))}
              placeholder="0"
              autoFocus
            />
          </div>
        </Label>

        {f.tipe !== "transfer" && (
          <Label teks="Kategori">
            <div className="grid grid-cols-3 gap-2">
              {kategoriTerpakai.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => set("category_id")(k.id)}
                  className={`border-2 border-line px-2 py-2 text-xs press ${
                    f.category_id === k.id ? "chip-aktif" : "bg-raised"
                  }`}
                >
                  <span className="block text-base">{k.ikon}</span>
                  {k.nama}
                </button>
              ))}
            </div>
          </Label>
        )}

        <Label teks={f.tipe === "transfer" ? "Dari dompet" : "Dompet"}>
          <select
            className="field"
            value={f.wallet_id}
            onChange={(e) => set("wallet_id")(e.target.value)}
          >
            <option value="">Pilih dompet</option>
            {dompet.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nama}
              </option>
            ))}
          </select>
        </Label>

        {f.tipe === "transfer" && (
          <Label teks="Ke dompet">
            <select
              className="field"
              value={f.wallet_tujuan_id}
              onChange={(e) => set("wallet_tujuan_id")(e.target.value)}
            >
              <option value="">Pilih dompet</option>
              {dompet.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nama}
                </option>
              ))}
            </select>
          </Label>
        )}

        <Label teks="Tanggal">
          <input
            type="date"
            className="field num"
            value={f.tanggal}
            onChange={(e) => set("tanggal")(e.target.value)}
          />
        </Label>

        <Label teks="Catatan">
          <input
            className="field"
            value={f.catatan}
            onChange={(e) => set("catatan")(e.target.value)}
            placeholder="Nasi goreng depan kantor"
          />
        </Label>

        {galat && (
          <p
            className="border-2 border-line px-3 py-2 text-sm"
            style={{ background: "color-mix(in srgb, var(--brick) 25%, transparent)" }}
          >
            {galat}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          {awal && (
            <button type="button" onClick={hapus} className="btn" disabled={sibuk}>
              Hapus
            </button>
          )}
          <button className="btn-utama flex-1" disabled={sibuk}>
            {sibuk ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </form>
    </Panel>
  );
}
