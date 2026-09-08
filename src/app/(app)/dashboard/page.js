"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";
import { Kartu, Memuat, Kosong, Bilah } from "@/components/ui";
import { useSaldoTampil, SALDO_SAMAR } from "@/lib/saldo";
import Ikon from "@/components/Ikon";
import { prosesBerulang, catatBerulang, lewatiBerulang } from "@/lib/prosesBerulang";
import { waktuLalu } from "@/lib/waktu";
import {
  uang, uangRingkas, hariIni, periodeSekarang, labelPeriode, geserPeriode,
  rentangPeriode, tanggalPendek, warnaTipe, tandaTipe,
} from "@/lib/format";

export default function Dashboard() {
  const supabase = getSupabase();
  const [periode, setPeriode] = useState(periodeSekarang());
  const [data, setData] = useState(null);
  const [nama, setNama] = useState("");
  const [me, setMe] = useState(null);
  const [pencatat, setPencatat] = useState({});
  const [pending, setPending] = useState([]);
  const [toast, setToast] = useState(null);
  const [saldoTampil, ubahSaldo] = useSaldoTampil();

  const muat = useCallback(async () => {
    setData(null);
    const { awal, akhir } = rentangPeriode(periode);
    const { data: { user } } = await supabase.auth.getUser();
    setMe(user.id);

    // langganan otomatis dicatat dulu supaya ikut terhitung di bawah
    let perlu = [];
    try { perlu = await prosesBerulang(); } catch (e) {}
    setPending(perlu);

    const [saldo, trx, kat, anggaran, target, profil, cepat, anggota] = await Promise.all([
      supabase.from("wallet_balances").select("*").order("urutan"),
      supabase.from("transactions").select("*").gte("tanggal", awal).lte("tanggal", akhir).order("tanggal", { ascending: false }),
      supabase.from("categories").select("*"),
      supabase.from("budgets").select("*").eq("periode", periode),
      supabase.from("goals").select("*").order("created_at"),
      supabase.from("profiles").select("nama").eq("id", user.id).maybeSingle(),
      supabase.from("quick_txns").select("*").order("urutan").order("created_at"),
      supabase.from("wallet_members").select("wallet_id,user_id"),
    ]);

    const wallets = saldo.data || [];
    const members = anggota.data || [];

    // dompet bersama: yang kuikuti + yang kumiliki dan punya anggota lain
    const idKuikuti = new Set(members.filter((m) => m.user_id === user.id).map((m) => m.wallet_id));
    const adaAnggota = new Set(members.map((m) => m.wallet_id));
    const dompetBersama = new Set(
      wallets.filter((w) => idKuikuti.has(w.id) || (w.user_id === user.id && adaAnggota.has(w.id))).map((w) => w.id)
    );

    let aktivitas = [];
    if (dompetBersama.size) {
      const { data: akt } = await supabase
        .from("transactions").select("*")
        .in("wallet_id", [...dompetBersama])
        .neq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6);
      aktivitas = akt || [];
    }

    const trxData = trx.data || [];
    const orangIds = [...new Set(
      [...trxData, ...aktivitas].map((t) => t.user_id).filter((id) => id && id !== user.id)
    )];
    if (orangIds.length) {
      const { data: p } = await supabase.from("profiles").select("id,nama").in("id", orangIds);
      const peta = {};
      (p || []).forEach((x) => { peta[x.id] = x.nama || "Anggota"; });
      setPencatat(peta);
    } else {
      setPencatat({});
    }

    setNama(profil.data?.nama || "");
    setData({
      dompet: wallets,
      transaksi: trxData,
      kategori: kat.data || [],
      anggaran: anggaran.data || [],
      target: target.data || [],
      cepat: cepat.data || [],
      aktivitas,
    });
  }, [periode, supabase]);

  useEffect(() => { muat(); }, [muat]);

  const pesan = (t) => { setToast(t); setTimeout(() => setToast(null), 2200); };

  async function catatCepat(q) {
    const { data: { user } } = await supabase.auth.getUser();
    let wid = q.wallet_id;
    if (!wid) {
      const { data: w } = await supabase.from("wallets").select("id").order("urutan").limit(1);
      wid = w?.[0]?.id;
    }
    if (!wid) return pesan("Belum ada dompet");
    await supabase.from("transactions").insert({
      user_id: user.id, tipe: q.tipe, jumlah: q.jumlah, tanggal: hariIni(),
      catatan: q.catatan || q.label, wallet_id: wid, category_id: q.category_id,
    });
    pesan(`✓ ${q.label} dicatat`);
    muat();
  }

  async function konfirmasi(item, aksi) {
    if (aksi === "catat") await catatBerulang(item.rec, item.tanggal);
    else await lewatiBerulang(item.rec, item.tanggal);
    setPending((p) => p.filter((x) => !(x.rec.id === item.rec.id && x.tanggal === item.tanggal)));
    if (aksi === "catat") muat();
  }

  if (!data) return <Memuat jumlah={4} tinggi={90} />;

  const totalSaldo = data.dompet.reduce((s, d) => s + Number(d.saldo), 0);
  const masuk = jumlahkan(data.transaksi, "income");
  const keluar = jumlahkan(data.transaksi, "expense");
  const petaKategori = Object.fromEntries(data.kategori.map((k) => [k.id, k]));
  const petaDompet = Object.fromEntries(data.dompet.map((d) => [d.id, d]));

  const anggaranPakai = data.anggaran.map((a) => {
    const terpakai = data.transaksi
      .filter((t) => t.tipe === "expense" && t.category_id === a.category_id)
      .reduce((s, t) => s + Number(t.jumlah), 0);
    return { ...a, terpakai, kategori: petaKategori[a.category_id] };
  });
  const totalAnggaran = anggaranPakai.reduce((s, a) => s + Number(a.jumlah), 0);
  const terpakaiAnggaran = anggaranPakai.reduce((s, a) => s + a.terpakai, 0);
  const sisaAnggaran = totalAnggaran - terpakaiAnggaran;
  const saldoBayangan = totalSaldo - totalAnggaran;
  const anggaranTampil = [...anggaranPakai]
    .sort((a, b) => b.terpakai / b.jumlah - a.terpakai / a.jumlah)
    .slice(0, 3);
  const samar = (n) => (saldoTampil ? uang(n) : `Rp ${SALDO_SAMAR}`);

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
      <div className="frame p-5" style={{ background: "var(--teal)", color: "var(--paper)" }}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm opacity-80">Total saldo semua dompet</p>
          <button
            type="button"
            onClick={() => ubahSaldo()}
            aria-label={saldoTampil ? "Sembunyikan saldo" : "Tampilkan saldo"}
            className="press inline-flex items-center gap-1 border-2 px-2 py-0.5 text-xs"
            style={{ borderColor: "rgba(255,255,255,.45)" }}
          >
            <Ikon nama={saldoTampil ? "mata-tutup" : "mata"} size="1em" />
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
        {totalAnggaran > 0 && (
          <div className="mt-4 flex items-center justify-between border-t-2 pt-3" style={{ borderColor: "rgba(255,255,255,.3)" }}>
            <p className="text-xs opacity-80">Saldo bayangan<br />(saldo − total anggaran)</p>
            <p className="num text-xl font-semibold">{samar(saldoBayangan)}</p>
          </div>
        )}
      </div>

      {/* Transaksi cepat */}
      {data.cepat.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {data.cepat.map((q) => (
            <button key={q.id} onClick={() => catatCepat(q)}
              className="chip shrink-0 whitespace-nowrap">
              <span>{petaKategori[q.category_id]?.ikon || (q.tipe === "income" ? "➕" : "⚡")}</span>
              {q.label} · {uangRingkas(q.jumlah)}
            </button>
          ))}
          <Link href="/cepat" className="chip shrink-0 whitespace-nowrap">Atur ⚙</Link>
        </div>
      )}

      {toast && (
        <div className="frame-flat px-3 py-2 text-sm">{toast}</div>
      )}

      {/* Langganan jatuh tempo */}
      {pending.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Langganan jatuh tempo</h2>
          <div className="space-y-2">
            {pending.map((item) => (
              <Kartu key={`${item.rec.id}-${item.tanggal}`} datar className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.rec.nama}</p>
                    <p className="text-xs text-muted num">{tanggalPendek(item.tanggal)}</p>
                  </div>
                  <span className="num font-medium" style={{ color: warnaTipe(item.rec.tipe) }}>
                    {tandaTipe(item.rec.tipe)}{uang(item.rec.jumlah)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button className="btn-utama flex-1 py-1.5 text-sm" onClick={() => konfirmasi(item, "catat")}>Catat</button>
                  <button className="btn py-1.5 text-sm" onClick={() => konfirmasi(item, "lewati")}>Lewati</button>
                </div>
              </Kartu>
            ))}
          </div>
        </section>
      )}

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

      {/* Aktivitas dompet bersama */}
      {data.aktivitas.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Aktivitas keluarga</h2>
          <div className="space-y-2">
            {data.aktivitas.map((t) => {
              const k = petaKategori[t.category_id];
              return (
                <div key={t.id} className="frame-flat flex items-center gap-3 p-3">
                  <span className="text-lg">{t.tipe === "transfer" ? "🔁" : k?.ikon || "💸"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      <span className="font-medium">{pencatat[t.user_id] || "Anggota"}</span>{" "}
                      {t.tipe === "income" ? "terima" : "catat"} {t.catatan || k?.nama || "transaksi"}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {waktuLalu(t.created_at)}
                      {petaDompet[t.wallet_id] ? ` · ${petaDompet[t.wallet_id].nama}` : ""}
                    </p>
                  </div>
                  <span className="num text-sm font-medium" style={{ color: warnaTipe(t.tipe) }}>
                    {tandaTipe(t.tipe)}{uangRingkas(t.jumlah)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {totalAnggaran > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Anggaran bulan ini</h2>
            <Link href="/anggaran" className="text-sm underline">Atur</Link>
          </div>

          <Kartu datar className="mb-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{sisaAnggaran < 0 ? "Melebihi anggaran" : "Sisa anggaran"}</span>
              <span className="num font-semibold"
                style={{ color: sisaAnggaran < 0 ? "var(--brick)" : "var(--ink)" }}>
                {uang(Math.abs(sisaAnggaran))}
              </span>
            </div>
            <Bilah persen={(terpakaiAnggaran / totalAnggaran) * 100}
              warna={terpakaiAnggaran > totalAnggaran ? "var(--brick)"
                : terpakaiAnggaran > totalAnggaran * 0.8 ? "var(--mustard)" : "var(--teal)"} />
            <p className="text-xs text-muted num">
              Terpakai {uangRingkas(terpakaiAnggaran)} dari {uangRingkas(totalAnggaran)}
            </p>
          </Kartu>

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
