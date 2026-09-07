"use client";
import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { Judul, Kartu, Memuat, Panel, Label } from "@/components/ui";
import { uang } from "@/lib/format";
import { useSaldoTampil, SALDO_SAMAR } from "@/lib/saldo";

const JENIS = [
  { n: "cash", l: "Tunai" }, { n: "bank", l: "Rekening bank" },
  { n: "ewallet", l: "E-wallet" }, { n: "kartu", l: "Kartu kredit" },
  { n: "investasi", l: "Investasi" },
];
const WARNA = ["#0F6E63", "#D9A21B", "#B5462B", "#4C6E9F", "#7A6A9B", "#5C8A3A"];
const kosong = { nama: "", jenis: "cash", saldo_awal: "", warna: "#0F6E63" };

function bagikanKode(kode) {
  const teks = `Yuk catat pengeluaran bareng di Duit Kita. Kode gabung dompet: ${kode}`;
  if (navigator.share) navigator.share({ text: teks }).catch(() => {});
  else if (navigator.clipboard) navigator.clipboard.writeText(kode).then(() => alert("Kode disalin."));
  else alert(kode);
}

export default function Dompet() {
  const supabase = getSupabase();
  const [me, setMe] = useState(null);
  const [list, setList] = useState(null);
  const [anggota, setAnggota] = useState({});   // wallet_id -> [user_id]
  const [undangan, setUndangan] = useState({}); // wallet_id -> baris undangan
  const [nama, setNama] = useState({});         // user_id -> nama
  const [form, setForm] = useState(null);
  const [gabung, setGabung] = useState(null);
  const [saldoTampil, ubahSaldo] = useSaldoTampil();

  const muat = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setMe(user.id);

    const [wb, wm, wi] = await Promise.all([
      supabase.from("wallet_balances").select("*").order("urutan"),
      supabase.from("wallet_members").select("wallet_id,user_id"),
      supabase.from("wallet_invites").select("*").is("dipakai_oleh", null),
    ]);

    const wallets = wb.data || [];
    const members = wm.data || [];

    const perDompet = {};
    members.forEach((m) => (perDompet[m.wallet_id] ||= []).push(m.user_id));

    const undMap = {};
    (wi.data || []).forEach((u) => { undMap[u.wallet_id] = u; });

    const perluNama = new Set();
    members.forEach((m) => perluNama.add(m.user_id));
    wallets.forEach((w) => { if (w.user_id !== user.id) perluNama.add(w.user_id); });
    perluNama.delete(user.id);

    let namaMap = {};
    if (perluNama.size) {
      const { data } = await supabase.from("profiles").select("id,nama").in("id", [...perluNama]);
      (data || []).forEach((p) => { namaMap[p.id] = p.nama || "Anggota"; });
    }

    setList(wallets);
    setAnggota(perDompet);
    setUndangan(undMap);
    setNama(namaMap);
  }, [supabase]);

  useEffect(() => { muat(); }, [muat]);

  const namaOrang = (id) => (id === me ? "Kamu" : nama[id] || "Anggota");

  async function simpan(e) {
    e.preventDefault();
    const baris = {
      nama: form.nama,
      jenis: form.jenis,
      warna: form.warna,
      saldo_awal: Number(String(form.saldo_awal).replace(/\D/g, "")) || 0,
    };
    if (form.id) await supabase.from("wallets").update(baris).eq("id", form.id);
    else await supabase.from("wallets").insert({ ...baris, user_id: me, urutan: (list?.length || 0) + 1 });
    setForm(null);
    muat();
  }

  async function hapus(id) {
    if (!confirm("Hapus dompet ini? Transaksinya tetap ada tapi kehilangan dompet.")) return;
    await supabase.from("wallets").delete().eq("id", id);
    setForm(null);
    muat();
  }

  async function undang(id) {
    const { error } = await supabase.rpc("buat_undangan_dompet", { p_wallet_id: id });
    if (error) return alert(error.message);
    muat();
  }

  async function batalUndangan(id) {
    await supabase.from("wallet_invites").delete().eq("wallet_id", id).is("dipakai_oleh", null);
    muat();
  }

  async function keluarkanAnggota(walletId, userId) {
    if (!confirm(`Keluarkan ${namaOrang(userId)} dari dompet ini?`)) return;
    await supabase.from("wallet_members").delete().eq("wallet_id", walletId).eq("user_id", userId);
    muat();
  }

  async function keluarDompet(walletId) {
    if (!confirm("Keluar dari dompet bersama ini? Kamu tidak akan bisa melihatnya lagi.")) return;
    await supabase.from("wallet_members").delete().eq("wallet_id", walletId).eq("user_id", me);
    setForm(null);
    muat();
  }

  async function prosesGabung(e) {
    e.preventDefault();
    const kode = (gabung.kode || "").trim().toUpperCase();
    if (kode.length < 4) return setGabung((g) => ({ ...g, galat: "Kode belum lengkap." }));
    setGabung((g) => ({ ...g, sibuk: true, galat: null }));
    const { error } = await supabase.rpc("join_wallet_with_code", { p_kode: kode });
    if (error) return setGabung((g) => ({ ...g, sibuk: false, galat: error.message }));
    setGabung(null);
    muat();
  }

  if (!list) return <Memuat jumlah={3} />;

  const total = list.reduce((s, d) => s + Number(d.saldo), 0);
  const sayaPemilik = !form?.id || form.user_id === me;
  const anggotaForm = form?.id ? (anggota[form.id] || []) : [];
  const undanganForm = form?.id ? undangan[form.id] : null;

  return (
    <div>
      <Judul
        anak="Dompet"
        keterangan={
          <button type="button" onClick={() => ubahSaldo()} className="underline decoration-dotted underline-offset-2">
            {saldoTampil ? `Total ${uang(total)}` : `Total Rp ${SALDO_SAMAR} · ketuk untuk lihat`}
          </button>
        }
        aksi={
          <div className="flex gap-2">
            <button className="chip" onClick={() => setGabung({ kode: "" })}>Gabung</button>
            <button className="btn" onClick={() => setForm({ ...kosong })}>Tambah</button>
          </div>
        }
      />

      <div className="space-y-3">
        {list.map((d) => {
          const ikutan = d.user_id !== me;
          const punyaAnggota = (anggota[d.id] || []).length > 0;
          const bersama = ikutan || punyaAnggota;
          return (
            <button key={d.id} className="w-full text-left press"
              onClick={() => setForm({ ...d, saldo_awal: String(Math.round(d.saldo_awal)) })}>
              <Kartu className="flex items-center gap-3">
                <span className="h-10 w-3 border-2 border-line" style={{ background: d.warna }} />
                <div className="flex-1">
                  <p className="font-medium">{d.nama}</p>
                  <p className="text-xs text-muted">
                    {JENIS.find((j) => j.n === d.jenis)?.l}
                    {bersama && ` · 🤝 ${ikutan ? `dari ${namaOrang(d.user_id)}` : "bersama"}`}
                  </p>
                </div>
                <span className="num font-medium">{saldoTampil ? uang(d.saldo) : SALDO_SAMAR}</span>
              </Kartu>
            </button>
          );
        })}
      </div>

      <Panel
        buka={!!form}
        tutup={() => setForm(null)}
        judul={!form?.id ? "Dompet baru" : sayaPemilik ? "Ubah dompet" : "Dompet bersama"}
      >
        {form && sayaPemilik && (
          <form onSubmit={simpan} className="space-y-4">
            <Label teks="Nama dompet">
              <input className="field" required value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="BCA" />
            </Label>
            <Label teks="Jenis">
              <select className="field" value={form.jenis}
                onChange={(e) => setForm({ ...form, jenis: e.target.value })}>
                {JENIS.map((j) => <option key={j.n} value={j.n}>{j.l}</option>)}
              </select>
            </Label>
            <Label teks="Saldo awal">
              <input inputMode="numeric" className="field num"
                value={form.saldo_awal ? Number(form.saldo_awal).toLocaleString("id-ID") : ""}
                onChange={(e) => setForm({ ...form, saldo_awal: e.target.value.replace(/\D/g, "") })} />
            </Label>
            <Label teks="Warna">
              <div className="flex gap-2">
                {WARNA.map((w) => (
                  <button key={w} type="button" onClick={() => setForm({ ...form, warna: w })}
                    className="h-9 w-9 border-2 border-line press"
                    style={{ background: w, outline: form.warna === w ? "2px solid var(--ink)" : "none", outlineOffset: 2 }} />
                ))}
              </div>
            </Label>
            <div className="flex gap-2">
              {form.id && <button type="button" className="btn" onClick={() => hapus(form.id)}>Hapus</button>}
              <button className="btn-utama flex-1">Simpan</button>
            </div>
          </form>
        )}

        {form && form.id && sayaPemilik && (
          <div className="mt-6 space-y-3 border-t-2 border-line pt-4">
            <p className="text-sm font-medium">Dompet bersama</p>

            {anggotaForm.length === 0 && !undanganForm && (
              <>
                <p className="text-xs text-muted">
                  Undang satu orang supaya bisa mencatat pengeluaran di dompet yang sama.
                </p>
                <button type="button" className="btn w-full" onClick={() => undang(form.id)}>
                  Buat kode undangan
                </button>
              </>
            )}

            {undanganForm && (
              <div className="space-y-2">
                <p className="text-xs text-muted">Bagikan kode ini — berlaku 7 hari, sekali pakai.</p>
                <div className="flex items-center gap-2">
                  <span className="flex-1 border-2 border-line bg-raised px-3 py-3 text-center text-2xl font-semibold tracking-[0.3em] num">
                    {undanganForm.kode}
                  </span>
                  <button type="button" className="chip" onClick={() => bagikanKode(undanganForm.kode)}>Bagikan</button>
                </div>
                <button type="button" className="text-xs text-muted underline" onClick={() => batalUndangan(form.id)}>
                  Batalkan undangan
                </button>
              </div>
            )}

            {anggotaForm.map((uid) => (
              <div key={uid} className="flex items-center justify-between border-2 border-line bg-raised px-3 py-2">
                <span className="text-sm">🤝 {namaOrang(uid)}</span>
                <button type="button" className="text-xs underline" onClick={() => keluarkanAnggota(form.id, uid)}>
                  Keluarkan
                </button>
              </div>
            ))}
          </div>
        )}

        {form && form.id && !sayaPemilik && (
          <div className="space-y-4">
            <Kartu datar className="space-y-1">
              <p className="font-medium">{form.nama}</p>
              <p className="text-xs text-muted">
                {JENIS.find((j) => j.n === form.jenis)?.l} · dari {namaOrang(form.user_id)}
              </p>
              <p className="num text-lg">{saldoTampil ? uang(form.saldo) : `Rp ${SALDO_SAMAR}`}</p>
            </Kartu>
            <p className="text-xs text-muted">
              Kamu bisa mencatat dan mengubah transaksi di dompet ini. Setelan dompet
              (nama, jenis, saldo awal) hanya bisa diubah pemiliknya.
            </p>
            <button type="button" className="btn w-full" onClick={() => keluarDompet(form.id)}>
              Keluar dari dompet bersama
            </button>
          </div>
        )}
      </Panel>

      <Panel buka={!!gabung} tutup={() => setGabung(null)} judul="Gabung dompet bersama">
        {gabung && (
          <form onSubmit={prosesGabung} className="space-y-4">
            <Label teks="Kode undangan">
              <input
                className="field num text-center text-2xl uppercase tracking-[0.3em]"
                autoFocus
                maxLength={6}
                value={gabung.kode}
                onChange={(e) =>
                  setGabung((g) => ({ ...g, kode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") }))
                }
                placeholder="ABC123"
              />
            </Label>
            <p className="text-xs text-muted">
              Minta kodenya dari pemilik dompet: buka Dompet → pilih dompet → Buat kode undangan.
            </p>
            {gabung.galat && (
              <p className="border-2 border-line px-3 py-2 text-sm"
                style={{ background: "color-mix(in srgb, var(--brick) 25%, transparent)" }}>
                {gabung.galat}
              </p>
            )}
            <button className="btn-utama w-full" disabled={gabung.sibuk}>
              {gabung.sibuk ? "Menggabungkan…" : "Gabung"}
            </button>
          </form>
        )}
      </Panel>
    </div>
  );
}
