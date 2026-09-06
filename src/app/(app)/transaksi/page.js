"use client";
import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { Judul, Memuat, Kosong } from "@/components/ui";
import FormTransaksi from "@/components/FormTransaksi";
import {
  uang, periodeSekarang, labelPeriode, geserPeriode, rentangPeriode,
  tanggalPanjang, warnaTipe, tandaTipe,
} from "@/lib/format";

export default function Transaksi() {
  const supabase = getSupabase();
  const [periode, setPeriode] = useState(periodeSekarang());
  const [saring, setSaring] = useState("semua");
  const [cari, setCari] = useState("");
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ buka: false, awal: null });

  const muat = useCallback(async () => {
    const { awal, akhir } = rentangPeriode(periode);
    const [trx, kat, dom] = await Promise.all([
      supabase.from("transactions").select("*").gte("tanggal", awal).lte("tanggal", akhir)
        .order("tanggal", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("nama"),
      supabase.from("wallets").select("*").order("urutan"),
    ]);
    setData({ transaksi: trx.data || [], kategori: kat.data || [], dompet: dom.data || [] });
  }, [periode, supabase]);

  useEffect(() => { muat(); }, [muat]);

  useEffect(() => {
    if (window.location.hash === "#baru") {
      setForm({ buka: true, awal: null });
      history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  if (!data) return <Memuat jumlah={5} />;

  const petaKategori = Object.fromEntries(data.kategori.map((k) => [k.id, k]));
  const petaDompet = Object.fromEntries(data.dompet.map((d) => [d.id, d]));

  const terpilih = data.transaksi.filter((t) => {
    if (saring !== "semua" && t.tipe !== saring) return false;
    if (!cari.trim()) return true;
    const teks = `${t.catatan || ""} ${petaKategori[t.category_id]?.nama || ""}`.toLowerCase();
    return teks.includes(cari.toLowerCase());
  });

  const perHari = terpilih.reduce((acc, t) => {
    (acc[t.tanggal] ||= []).push(t);
    return acc;
  }, {});

  const totalKeluar = terpilih.filter((t) => t.tipe === "expense").reduce((s, t) => s + Number(t.jumlah), 0);

  return (
    <div>
      <Judul anak="Transaksi" keterangan={`${terpilih.length} catatan · keluar ${uang(totalKeluar)}`} />

      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => setPeriode(geserPeriode(periode, -1))} className="chip">Sebelumnya</button>
        <span className="text-sm font-medium">{labelPeriode(periode)}</span>
        <button onClick={() => setPeriode(geserPeriode(periode, 1))} className="chip"
          disabled={periode >= periodeSekarang()}
          style={{ opacity: periode >= periodeSekarang() ? 0.4 : 1 }}>
          Berikutnya
        </button>
      </div>

      <input className="field mb-3" placeholder="Cari catatan atau kategori"
        value={cari} onChange={(e) => setCari(e.target.value)} />

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {[
          { n: "semua", l: "Semua" },
          { n: "expense", l: "Pengeluaran" },
          { n: "income", l: "Pemasukan" },
          { n: "transfer", l: "Pindah dana" },
        ].map((o) => (
          <button key={o.n} onClick={() => setSaring(o.n)}
            className={`chip whitespace-nowrap ${saring === o.n ? "chip-aktif" : ""}`}>
            {o.l}
          </button>
        ))}
      </div>

      {Object.keys(perHari).length === 0 ? (
        <Kosong judul="Tidak ada transaksi di sini"
          ajakan="Ganti bulan, ubah filter, atau catat transaksi baru dengan tombol +." />
      ) : (
        <div className="space-y-6">
          {Object.entries(perHari).map(([tanggal, list]) => (
            <section key={tanggal}>
              <div className="mb-2 flex items-baseline justify-between border-b-2 border-line pb-1">
                <h2 className="text-sm font-medium">{tanggalPanjang(tanggal)}</h2>
                <span className="text-xs text-muted num">
                  {uang(list.reduce((s, t) => s + (t.tipe === "income" ? 1 : t.tipe === "expense" ? -1 : 0) * Number(t.jumlah), 0))}
                </span>
              </div>
              <div className="space-y-2">
                {list.map((t) => {
                  const k = petaKategori[t.category_id];
                  return (
                    <button key={t.id} onClick={() => setForm({ buka: true, awal: t })}
                      className="frame-flat flex w-full items-center gap-3 p-3 text-left press">
                      <span className="text-xl">{t.tipe === "transfer" ? "🔁" : k?.ikon || "💸"}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{t.catatan || k?.nama || "Pindah dana"}</p>
                        <p className="truncate text-xs text-muted">
                          {t.tipe === "transfer"
                            ? `${petaDompet[t.wallet_id]?.nama || "?"} ke ${petaDompet[t.wallet_tujuan_id]?.nama || "?"}`
                            : `${k?.nama || "Tanpa kategori"} · ${petaDompet[t.wallet_id]?.nama || "?"}`}
                        </p>
                      </div>
                      <span className="num font-medium" style={{ color: warnaTipe(t.tipe) }}>
                        {tandaTipe(t.tipe)}{uang(t.jumlah)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <FormTransaksi
        buka={form.buka}
        awal={form.awal}
        tutup={() => setForm({ buka: false, awal: null })}
        dompet={data.dompet}
        kategori={data.kategori}
        selesai={muat}
      />
    </div>
  );
}
