"use client";
import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { Judul, Kartu, Memuat, Kosong } from "@/components/ui";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Legend,
} from "recharts";
import {
  uang, uangRingkas, periodeSekarang, labelPeriode, geserPeriode, rentangPeriode,
} from "@/lib/format";

const PALET = ["#0F6E63", "#D9A21B", "#B5462B", "#4C6E9F", "#7A6A9B", "#5C8A3A", "#C2763F", "#8C8577"];

export default function Laporan() {
  const supabase = getSupabase();
  const [periode, setPeriode] = useState(periodeSekarang());
  const [data, setData] = useState(null);

  const muat = useCallback(async () => {
    const { awal } = rentangPeriode(periode);
    const mulai6 = rentangPeriode(geserPeriode(periode, -5)).awal;
    const { akhir } = rentangPeriode(periode);

    const [kat, bulanIni, enamBulan] = await Promise.all([
      supabase.from("categories").select("*"),
      supabase.from("transactions").select("*").gte("tanggal", awal).lte("tanggal", akhir),
      supabase.from("transactions").select("tipe,jumlah,tanggal").gte("tanggal", mulai6).lte("tanggal", akhir),
    ]);
    setData({ kategori: kat.data || [], bulanIni: bulanIni.data || [], enamBulan: enamBulan.data || [] });
  }, [periode, supabase]);

  useEffect(() => { muat(); }, [muat]);
  if (!data) return <Memuat jumlah={3} tinggi={140} />;

  const peta = Object.fromEntries(data.kategori.map((k) => [k.id, k]));

  const perKategori = Object.entries(
    data.bulanIni.filter((t) => t.tipe === "expense").reduce((acc, t) => {
      const nama = peta[t.category_id]?.nama || "Tanpa kategori";
      acc[nama] = (acc[nama] || 0) + Number(t.jumlah);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const totalKeluar = perKategori.reduce((s, d) => s + d.value, 0);
  const totalMasuk = data.bulanIni.filter((t) => t.tipe === "income").reduce((s, t) => s + Number(t.jumlah), 0);

  const bulanan = Array.from({ length: 6 }, (_, i) => {
    const p = geserPeriode(periode, i - 5);
    const list = data.enamBulan.filter((t) => t.tanggal.startsWith(p));
    return {
      bulan: labelPeriode(p).slice(0, 3),
      Masuk: list.filter((t) => t.tipe === "income").reduce((s, t) => s + Number(t.jumlah), 0),
      Keluar: list.filter((t) => t.tipe === "expense").reduce((s, t) => s + Number(t.jumlah), 0),
    };
  });

  const selisih = totalMasuk - totalKeluar;

  return (
    <div className="space-y-6">
      <Judul anak="Laporan" keterangan="Ke mana uangmu pergi" />

      <div className="flex items-center justify-between">
        <button onClick={() => setPeriode(geserPeriode(periode, -1))} className="chip">Sebelumnya</button>
        <span className="text-sm font-medium">{labelPeriode(periode)}</span>
        <button onClick={() => setPeriode(geserPeriode(periode, 1))} className="chip">Berikutnya</button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Kartu datar className="text-center">
          <p className="text-xs text-muted">Masuk</p>
          <p className="num text-sm font-medium" style={{ color: "var(--teal)" }}>{uangRingkas(totalMasuk)}</p>
        </Kartu>
        <Kartu datar className="text-center">
          <p className="text-xs text-muted">Keluar</p>
          <p className="num text-sm font-medium" style={{ color: "var(--brick)" }}>{uangRingkas(totalKeluar)}</p>
        </Kartu>
        <Kartu datar className="text-center">
          <p className="text-xs text-muted">Selisih</p>
          <p className="num text-sm font-medium">{uangRingkas(selisih)}</p>
        </Kartu>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Pengeluaran per kategori</h2>
        {perKategori.length === 0 ? (
          <Kosong judul="Belum ada pengeluaran bulan ini" />
        ) : (
          <Kartu>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={perKategori} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} stroke="var(--line)" strokeWidth={2}>
                    {perKategori.map((_, i) => (
                      <Cell key={i} fill={PALET[i % PALET.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => uang(v)} contentStyle={kotakTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-3 space-y-2">
              {perKategori.map((d, i) => (
                <li key={d.name} className="flex items-center gap-2 text-sm">
                  <span className="h-3 w-3 border-2 border-line" style={{ background: PALET[i % PALET.length] }} />
                  <span className="flex-1">{d.name}</span>
                  <span className="text-muted num">{Math.round((d.value / totalKeluar) * 100)}%</span>
                  <span className="num font-medium">{uangRingkas(d.value)}</span>
                </li>
              ))}
            </ul>
          </Kartu>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Enam bulan terakhir</h2>
        <Kartu>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bulanan}>
                <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={{ stroke: "var(--line)" }} tickLine={false} />
                <Tooltip formatter={(v) => uang(v)} contentStyle={kotakTooltip} cursor={{ fill: "transparent" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Masuk" fill="#0F6E63" stroke="var(--line)" strokeWidth={2} />
                <Bar dataKey="Keluar" fill="#B5462B" stroke="var(--line)" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Kartu>
      </section>
    </div>
  );
}

const kotakTooltip = {
  background: "var(--raised)",
  border: "2px solid var(--line)",
  borderRadius: 0,
  color: "var(--ink)",
  fontSize: 12,
};
