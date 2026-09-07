import { getSupabase } from "@/lib/supabase/client";
import { jatuhTempo } from "@/lib/berulang";
import { hariIni } from "@/lib/format";

// Dipanggil saat Beranda dimuat. Langganan "otomatis" langsung dicatat;
// sisanya dikembalikan sebagai daftar yang perlu konfirmasi manual.
export async function prosesBerulang() {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: recs } = await supabase
    .from("recurring").select("*").eq("aktif", true);
  if (!recs?.length) return [];

  const hi = hariIni();
  const perluKonfirmasi = [];
  const autoInsert = [];
  const majukan = [];

  for (const r of recs) {
    const tgls = jatuhTempo(r, hi);
    if (!tgls.length) continue;
    if (r.otomatis) {
      for (const tgl of tgls) autoInsert.push(barisTransaksi(user.id, r, tgl));
      majukan.push({ id: r.id, tgl: tgls[tgls.length - 1] });
    } else {
      for (const tgl of tgls) perluKonfirmasi.push({ rec: r, tanggal: tgl });
    }
  }

  if (autoInsert.length) await supabase.from("transactions").insert(autoInsert);
  for (const m of majukan)
    await supabase.from("recurring").update({ terakhir_dibuat: m.tgl }).eq("id", m.id);

  return perluKonfirmasi.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
}

export async function catatBerulang(rec, tanggal) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("transactions").insert(barisTransaksi(user.id, rec, tanggal));
  await majukanTerakhir(rec, tanggal);
}

export async function lewatiBerulang(rec, tanggal) {
  await majukanTerakhir(rec, tanggal);
}

function barisTransaksi(userId, rec, tanggal) {
  return {
    user_id: userId,
    tipe: rec.tipe,
    jumlah: rec.jumlah,
    tanggal,
    catatan: rec.catatan || rec.nama,
    wallet_id: rec.wallet_id,
    category_id: rec.category_id,
  };
}

async function majukanTerakhir(rec, tanggal) {
  const supabase = getSupabase();
  if (!rec.terakhir_dibuat || tanggal > rec.terakhir_dibuat) {
    await supabase.from("recurring").update({ terakhir_dibuat: tanggal }).eq("id", rec.id);
  }
}
