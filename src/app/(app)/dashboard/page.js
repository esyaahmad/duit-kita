"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";
import { Kartu, Memuat, Kosong, Bilah } from "@/components/ui";
import { useSaldoTampil, SALDO_SAMAR } from "@/lib/saldo";
import {
  uang, uangRingkas, periodeSekarang, labelPeriode, geserPeriode,
  rentangPeriode, tanggalPendek, warnaTipe, tandaTipe,
} from "@/lib/format";

export default function Dashboard() {
  const supabase = getSupabase();
  const [periode, setPeriode] = useState(periodeSekarang());
  const [data, setData] = useState(null);
  const [nama, setNama] = useState("");
  const [me, setMe] = useState(null);
  const [pencatat, setPencatat] = useState({});
  const [saldoTampil, ubahSaldo] = useSaldoTampil();

  const muat = useCallback(async () => {
    setData(null);
    const { awal, akhir } = rentangPeriode(periode);
    const { data: { user } } = await supabase.auth.getUser();
    setMe(user.id);

    const [saldo, trx, kat, anggaran, target, profil] = await Promise.all([
      supabase.from("wallet_balances").select("*").order("urutan"),
      supabase.from("transactions").select("*").gte("tanggal", awal).lte("tanggal", akhir).order("tanggal", { ascending: false }),
      supabase.from("categories").select("*"),
      supabase.from("budgets").select("*").eq("periode", periode),
      supabase.from("goals").select("*").order("created_at"),
      supabase.from("profiles").select("nama").eq("id", user.id).maybeSingle(),
    ]);

    const trxData = trx.data || [];
    const lainIds = [...new Set(trxData.map((t) => t.user_id).filter((id) => id && id !== user.id))];
    if (lainIds.length) {
      const { data: p } = await supabase.from("profiles").select("id,nama").in("id", lainIds);
      const peta = {};
      (p || []).forEach((x) => { peta[x.id] = x.nama || "Anggota"; });
      setPencatat(peta);
    } else {
      setPencatat({});
    }

    setNama(profil.data?.nama || "");
    setData({
      dompet: saldo.data || [],
      transaksi: trx.data || [],
      kategori: kat.data || [],
      anggaran: anggaran.data || [],
      target: target.data || [],
    });
  }, [periode, supabase]);

  useEffect(() => { muat(); }, [muat]);

  if (!data) return <Memuat jumlah={4} tinggi={90} />;

  const totalSaldo = data.dompet.reduce((s, d) => s + Number(d.saldo), 0);
  const masuk = jumlahkan(data.transaksi, "income");
  const keluar = jumlahkan(data.transaksi, "expense");
  const petaKategori = Object.fromEntries(data.kategori.map((k) => [k.id, k]));

  const anggaranTampil = data.anggaran
    .map((a) => {
      const terpakai = data.transaksi
        .filter((t) => t.tipe === "expense" && t.category_id === a.category_id)
        .reduce((s, t) => s + Number(t.jumlah), 0);
      return { ...a, terpakai, kategori: petaKategori[a.category_id] };
    })
    .sort((a, b) => b.terpakai / b.jumlah - a.terpakai / a.jumlah)
    .slice(0, 3);

  const jam = new Date().getHours();
  const sapaan = jam < 11 ? "Selamat pagi" : jam < 15 ? "Selamat siang" : jam < 19 ? "Selamat sore" : "Selamat malam";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{sapaan}</p>
          <h1 className="text-2xl font-semibold leading-tight">{nama || "Selamat datang"}</h1>
        </div>
        <Link href="/profil" className="chip">Profil</Link>
      </div>

      {/* Saldo — elemen utama halaman */}
      <div
        className="border-2 border-line p-5"
        style={{ background: "var(--teal)", color: "var(--paper)", boxShadow: "4px 4px 0 var(--shadow)" }}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm opacity-80">Total saldo semua dompet</p>
          <button
            type="button"
            onClick={() => ubahSaldo()}
            aria-label={saldoTampil ? "Sembunyikan saldo" : "Tampilkan saldo"}
            className="border-2 px-2 py-0.5 text-xs press"
            style={{ borderColor: "rgba(255,255,255,.45)" }}
          >
            {saldoTampil ? "Sembunyikan" : "Lihat"}
          </button>
        </div>
        <p className="mt-1 text-[2.6rem] font-semibold leading-none num">
          {saldoTampil ? uang(totalSaldo) : `Rp ${SALDO_SAMAR}`}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t-2 pt-4" style={{ borderColor: "rgba(255,255,255,.3)" }}>
          <div>
            <p className="text-xs opacity-80">Masuk bulan ini</p>
            <p className="text-lg num">{uangRingkas(masuk)}</p>
          </div>
          <div>
            <p className="text-xs opacity-80">Keluar bulan ini</p>
            <p className="text-lg num">{uangRingkas(keluar)}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={() => setPeriode(geserPeriode(periode, -1))} className="chip">Sebelumnya</button>
        <span className="text-sm font-medium">{labelPeriode(periode)}</span>
        <button
          onClick={() => setPeriode(geserPeriode(periode, 1))}
          className="chip"
          disabled={periode >= periodeSekarang()}
          style={{ opacity: periode >= periodeSekarang() ? 0.4 : 1 }}
        >
          Berikutnya
        </button>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Dompet</h2>
        <div className="space-y-2">
          {data.dompet.map((d) => (
            <div key={d.id} className="frame-flat flex items-center gap-3 p-3">
              <span className="h-8 w-3 border-2 border-line" style={{ background: d.warna }} />
              <span className="flex-1">{d.nama}</span>
              <span className="num font-medium">{saldoTampil ? uang(d.saldo) : SALDO_SAMAR}</span>
            </div>
          ))}
          {!data.dompet.length && (
            <Kosong judul="Belum ada dompet" ajakan="Tambahkan dompet tunai atau rekeningmu."
              aksi={<Link href="/dompet" className="btn">Atur dompet</Link>} />
          )}
        </div>
      </section>

      {anggaranTampil.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Anggaran terketat</h2>
            <Link href="/anggaran" className="text-sm underline">Semua</Link>
          </div>
          <div className="space-y-3">
            {anggaranTampil.map((a) => {
              const persen = (a.terpakai / a.jumlah) * 100;
              return (
                <Kartu key={a.id} datar className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{a.kategori?.ikon} {a.kategori?.nama}</span>
                    <span className="num">{uangRingkas(a.terpakai)} / {uangRingkas(a.jumlah)}</span>
                  </div>
                  <Bilah persen={persen} warna={persen > 100 ? "var(--brick)" : persen > 80 ? "var(--mustard)" : "var(--teal)"} />
                </Kartu>
              );
            })}
          </div>
        </section>
      )}

      {data.target.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Target tabungan</h2>
            <Link href="/target" className="text-sm underline">Semua</Link>
          </div>
          <div className="space-y-3">
            {data.target.slice(0, 2).map((g) => (
              <Kartu key={g.id} datar className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{g.ikon} {g.nama}</span>
                  <span className="num">{uangRingkas(g.terkumpul)} / {uangRingkas(g.target)}</span>
                </div>
                <Bilah persen={(g.terkumpul / g.target) * 100} warna="var(--mustard)" />
              </Kartu>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Transaksi terakhir</h2>
          <Link href="/transaksi" className="text-sm underline">Semua</Link>
        </div>
        {data.transaksi.length ? (
          <div className="space-y-2">
            {data.transaksi.slice(0, 6).map((t) => {
              const k = petaKategori[t.category_id];
              return (
                <div key={t.id} className="frame-flat flex items-center gap-3 p-3">
                  <span className="text-xl">{t.tipe === "transfer" ? "🔁" : k?.ikon || "💸"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{t.catatan || k?.nama || "Pindah dana"}</p>
                    <p className="truncate text-xs text-muted">
                      <span className="num">{tanggalPendek(t.tanggal)}</span>
                      {t.user_id && me && t.user_id !== me && ` · oleh ${pencatat[t.user_id] || "anggota"}`}
                    </p>
                  </div>
                  <span className="num text-sm font-medium" style={{ color: warnaTipe(t.tipe) }}>
                    {tandaTipe(t.tipe)}{uangRingkas(t.jumlah)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <Kosong judul="Bulan ini masih kosong" ajakan="Ketuk tombol + untuk mencatat pengeluaran pertama." />
        )}
      </section>
    </div>
  );
}

const jumlahkan = (list, tipe) =>
  list.filter((t) => t.tipe === tipe).reduce((s, t) => s + Number(t.jumlah), 0);
