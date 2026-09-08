"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { Judul, Kartu, Memuat, Kosong, Bilah } from "@/components/ui";
import {
  uang, uangRingkas, periodeSekarang, labelPeriode, geserPeriode, rentangPeriode,
} from "@/lib/format";

const angka = (s) => Number(String(s ?? "").replace(/\D/g, "")) || 0;
const grup = (s) => (angka(s) ? angka(s).toLocaleString("id-ID") : "");

export default function Anggaran() {
  const supabase = getSupabase();
  const [periode, setPeriode] = useState(periodeSekarang());
  const [scope, setScope] = useState("pribadi");
  const [mode, setMode] = useState("lihat");
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState({});
  const [sibuk, setSibuk] = useState(false);

  const muat = useCallback(async () => {
    setData(null);
    const { awal, akhir } = rentangPeriode(periode);
    const rl = rentangPeriode(geserPeriode(periode, -1));
    const { data: { user } } = await supabase.auth.getUser();

    const [kat, wm, wb, budg, trx, trxL] = await Promise.all([
      supabase.from("categories").select("id,nama,tipe,ikon,user_id"),
      supabase.from("wallet_members").select("wallet_id,user_id"),
      supabase.from("wallet_balances").select("id,nama,user_id"),
      supabase.from("budgets").select("*").eq("periode", periode),
      supabase.from("transactions").select("category_id,jumlah,wallet_id")
        .eq("tipe", "expense").gte("tanggal", awal).lte("tanggal", akhir),
      supabase.from("transactions").select("category_id,jumlah,wallet_id")
        .eq("tipe", "expense").gte("tanggal", rl.awal).lte("tanggal", rl.akhir),
    ]);

    const wallets = wb.data || [];
    const members = wm.data || [];
    const kuikuti = new Set(members.filter((m) => m.user_id === user.id).map((m) => m.wallet_id));
    const adaAnggota = new Set(members.map((m) => m.wallet_id));
    const bersama = wallets
      .filter((w) => kuikuti.has(w.id) || (w.user_id === user.id && adaAnggota.has(w.id)))
      .map((w) => ({ id: w.id, nama: w.nama }));

    const sc = scope === "pribadi" || bersama.some((w) => w.id === scope) ? scope : "pribadi";
    if (sc !== scope) setScope("pribadi");

    const sharedByWallet = {};
    if (bersama.length) {
      const { data: sb } = await supabase.from("shared_budgets")
        .select("*").in("wallet_id", bersama.map((w) => w.id)).eq("periode", periode);
      (sb || []).forEach((b) => { (sharedByWallet[b.wallet_id] ||= []).push(b); });
    }

    setData({
      me: user.id,
      kategori: kat.data || [],
      bersama,
      budgets: budg.data || [],
      sharedByWallet,
      sharedBudgets: sharedByWallet[sc] || [],
      trx: trx.data || [],
      trxLalu: trxL.data || [],
      sc,
    });
  }, [periode, scope, supabase]);

  useEffect(() => { muat(); }, [muat]);
  useEffect(() => { setMode("lihat"); }, [scope, periode]);

  const rows = useMemo(() => {
    if (!data) return [];
    const namaKat = Object.fromEntries(data.kategori.map((k) => [k.id, k.nama]));
    const ikonByNama = {};
    data.kategori.filter((k) => k.tipe === "expense").forEach((k) => {
      if (!ikonByNama[k.nama]) ikonByNama[k.nama] = k.ikon;
    });
    const sum = (list, cocok) =>
      list.reduce((s, t) => (cocok(t) ? s + Number(t.jumlah) : s), 0);

    if (data.sc === "pribadi") {
      const anggaranPer = Object.fromEntries(data.budgets.map((b) => [b.category_id, Number(b.jumlah)]));
      return data.kategori
        .filter((k) => k.tipe === "expense" && k.user_id === data.me)
        .sort((a, b) => a.nama.localeCompare(b.nama))
        .map((k) => ({
          key: k.id, nama: k.nama, ikon: k.ikon,
          anggaran: anggaranPer[k.id] || 0,
          terpakai: sum(data.trx, (t) => t.category_id === k.id),
          bulanLalu: sum(data.trxLalu, (t) => t.category_id === k.id),
        }));
    }

    const anggaranPer = Object.fromEntries(data.sharedBudgets.map((b) => [b.kategori_nama, Number(b.jumlah)]));
    return [...new Set(data.kategori.filter((k) => k.tipe === "expense").map((k) => k.nama))]
      .sort((a, b) => a.localeCompare(b))
      .map((n) => ({
        key: n, nama: n, ikon: ikonByNama[n] || "📦",
        anggaran: anggaranPer[n] || 0,
        terpakai: sum(data.trx, (t) => t.wallet_id === data.sc && namaKat[t.category_id] === n),
        bulanLalu: sum(data.trxLalu, (t) => t.wallet_id === data.sc && namaKat[t.category_id] === n),
      }));
  }, [data]);

  function bukaAtur() {
    const d = {};
    rows.forEach((r) => { d[r.key] = r.anggaran > 0 ? String(Math.round(r.anggaran)) : ""; });
    setDraft(d);
    setMode("atur");
  }

  function isiBulanLalu() {
    setDraft((prev) => {
      const d = { ...prev };
      rows.forEach((r) => { if (r.bulanLalu > 0) d[r.key] = String(Math.round(r.bulanLalu)); });
      return d;
    });
  }

  // Salin nilai anggaran dari scope lain (Pribadi / dompet bersama lain),
  // dicocokkan berdasarkan nama kategori.
  function salinDari(sumber) {
    const map = {};
    if (sumber === "pribadi") {
      const namaById = Object.fromEntries(
        data.kategori.filter((k) => k.user_id === data.me).map((k) => [k.id, k.nama])
      );
      data.budgets.forEach((b) => {
        const n = namaById[b.category_id];
        if (n) map[n] = Number(b.jumlah);
      });
    } else {
      (data.sharedByWallet[sumber] || []).forEach((b) => { map[b.kategori_nama] = Number(b.jumlah); });
    }
    setDraft((prev) => {
      const d = { ...prev };
      rows.forEach((r) => { if (map[r.nama] > 0) d[r.key] = String(Math.round(map[r.nama])); });
      return d;
    });
  }

  async function simpanAtur() {
    setSibuk(true);
    const { data: { user } } = await supabase.auth.getUser();
    const ops = [];
    for (const r of rows) {
      const n = angka(draft[r.key]);
      if (data.sc === "pribadi") {
        if (n > 0) {
          ops.push(supabase.from("budgets").upsert(
            { user_id: user.id, category_id: r.key, periode, jumlah: n },
            { onConflict: "user_id,category_id,periode" }));
        } else if (r.anggaran > 0) {
          ops.push(supabase.from("budgets").delete()
            .eq("user_id", user.id).eq("category_id", r.key).eq("periode", periode));
        }
      } else {
        if (n > 0) {
          ops.push(supabase.from("shared_budgets").upsert(
            { wallet_id: data.sc, kategori_nama: r.key, periode, jumlah: n, oleh: user.id, updated_at: new Date().toISOString() },
            { onConflict: "wallet_id,kategori_nama,periode" }));
        } else if (r.anggaran > 0) {
          ops.push(supabase.from("shared_budgets").delete()
            .eq("wallet_id", data.sc).eq("kategori_nama", r.key).eq("periode", periode));
        }
      }
    }
    const res = await Promise.all(ops);
    setSibuk(false);
    const err = res.find((x) => x && x.error);
    if (err) {
      alert("Gagal menyimpan anggaran bersama. Jalankan supabase/anggaran-bersama.sql di Supabase dulu.\n\n" + err.error.message);
      return;
    }
    setMode("lihat");
    muat();
  }

  if (!data) return <Memuat jumlah={5} />;

  const bersamaMode = data.sc !== "pribadi";
  const dompetNama = data.bersama.find((w) => w.id === data.sc)?.nama || "";
  const berAnggaran = rows.filter((r) => r.anggaran > 0);
  const totalAnggaran = berAnggaran.reduce((s, r) => s + r.anggaran, 0);
  const totalTerpakai = berAnggaran.reduce((s, r) => s + r.terpakai, 0);
  const sisa = totalAnggaran - totalTerpakai;
  const totalDraft = rows.reduce((s, r) => s + angka(draft[r.key]), 0);

  return (
    <div>
      <Judul
        anak="Anggaran"
        keterangan={bersamaMode ? `Bersama · ${dompetNama}` : "Batas belanja per kategori tiap bulan"}
      />

      {data.bersama.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setScope("pribadi")}
            className={`chip shrink-0 ${data.sc === "pribadi" ? "chip-aktif" : ""}`}>Pribadi</button>
          {data.bersama.map((w) => (
            <button key={w.id} onClick={() => setScope(w.id)}
              className={`chip shrink-0 whitespace-nowrap ${data.sc === w.id ? "chip-aktif" : ""}`}>
              🤝 {w.nama}
            </button>
          ))}
        </div>
      )}

      <div className="mb-5 flex items-center justify-between">
        <button onClick={() => setPeriode(geserPeriode(periode, -1))} className="chip">Sebelumnya</button>
        <span className="text-sm font-medium">{labelPeriode(periode)}</span>
        <button onClick={() => setPeriode(geserPeriode(periode, 1))} className="chip">Berikutnya</button>
      </div>

      {mode === "atur" ? (
        <>
          {bersamaMode && (
            <p className="mb-3 text-xs text-muted">
              Anggaran ini dipakai berdua. Perhitungan terpakai dari semua transaksi di
              dompet <b>{dompetNama}</b>, dicocokkan lewat nama kategori.
            </p>
          )}
          <div className="mb-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              <button className="chip" onClick={isiBulanLalu}>Isi dari belanja bulan lalu</button>
              <button className="chip" onClick={() => setDraft(Object.fromEntries(rows.map((r) => [r.key, ""])))}>
                Kosongkan
              </button>
            </div>
            {(data.sc !== "pribadi" || data.bersama.length > 0) && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted">Salin dari:</span>
                {data.sc !== "pribadi" && (
                  <button className="chip" onClick={() => salinDari("pribadi")}>Anggaran pribadi</button>
                )}
                {data.bersama
                  .filter((w) => w.id !== data.sc)
                  .map((w) => (
                    <button key={w.id} className="chip whitespace-nowrap" onClick={() => salinDari(w.id)}>
                      🤝 {w.nama}
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.key} className="frame-flat p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{r.ikon}</span>
                  <span className="flex-1 text-sm">{r.nama}</span>
                </div>
                <div className="mt-2 flex items-center border-2 border-line bg-raised">
                  <span className="px-2 text-xs text-muted num">Rp</span>
                  <input inputMode="numeric" placeholder="0"
                    className="w-full bg-transparent px-1 py-2 text-right num outline-none"
                    value={grup(draft[r.key])}
                    onChange={(e) => setDraft((d) => ({ ...d, [r.key]: e.target.value.replace(/\D/g, "") }))} />
                </div>
                {r.bulanLalu > 0 && (
                  <button type="button" className="mt-1.5 text-xs text-muted underline"
                    onClick={() => setDraft((d) => ({ ...d, [r.key]: String(Math.round(r.bulanLalu)) }))}>
                    Bulan lalu {uangRingkas(r.bulanLalu)} — pakai angka ini
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="sticky bottom-[76px] z-10 mt-4 flex items-center gap-2 border-2 border-line bg-surface p-2"
            style={{ boxShadow: "3px 3px 0 var(--shadow)" }}>
            <span className="px-1 text-sm num">Total {uangRingkas(totalDraft)}</span>
            <button className="btn ml-auto py-1.5 text-sm" onClick={() => setMode("lihat")}>Batal</button>
            <button className="btn-utama py-1.5 text-sm" disabled={sibuk} onClick={simpanAtur}>
              {sibuk ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="frame mb-6 p-5"
            style={{ background: sisa < 0 ? "var(--brick)" : "var(--surface)", color: sisa < 0 ? "var(--paper)" : "var(--ink)" }}>
            <p className="text-sm opacity-80">{sisa < 0 ? "Melebihi anggaran" : "Sisa anggaran bulan ini"}</p>
            <p className="mt-1 text-4xl font-semibold num">{uang(Math.abs(sisa))}</p>
            <p className="mt-2 text-sm opacity-80 num">
              Terpakai {uangRingkas(totalTerpakai)} dari {uangRingkas(totalAnggaran)}
            </p>
          </div>

          <button className="btn-utama mb-5 w-full" onClick={bukaAtur}>
            {berAnggaran.length ? "Atur anggaran" : "Buat anggaran"}
          </button>

          {berAnggaran.length === 0 ? (
            <Kosong
              judul={bersamaMode ? "Belum ada anggaran bersama" : "Belum ada anggaran bulan ini"}
              ajakan="Ketuk tombol di atas — semua kategori muncul sekaligus, tinggal isi angkanya. Ada tombol “isi dari belanja bulan lalu” juga."
            />
          ) : (
            <div className="space-y-3">
              {berAnggaran.map((r) => {
                const persen = (r.terpakai / r.anggaran) * 100;
                return (
                  <Kartu key={r.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>{r.ikon} {r.nama}</span>
                      <span className="num text-sm">{Math.round(persen)}%</span>
                    </div>
                    <Bilah persen={persen}
                      warna={persen > 100 ? "var(--brick)" : persen > 80 ? "var(--mustard)" : "var(--teal)"} />
                    <p className="text-xs text-muted num">
                      {uang(r.terpakai)} dari {uang(r.anggaran)} · sisa {uang(r.anggaran - r.terpakai)}
                    </p>
                  </Kartu>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
