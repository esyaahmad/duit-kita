"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { Judul } from "@/components/ui";

const menu = [
  { href: "/laporan", ikon: "📊", judul: "Laporan", ket: "Grafik pengeluaran dan tren enam bulan" },
  { href: "/dompet", ikon: "👛", judul: "Dompet", ket: "Tunai, rekening, e-wallet" },
  { href: "/kategori", ikon: "🏷️", judul: "Kategori", ket: "Atur pengelompokan transaksi" },
  { href: "/target", ikon: "🎯", judul: "Target tabungan", ket: "Rencana yang sedang dikumpulkan" },
  { href: "/profil", ikon: "⚙️", judul: "Profil & tampilan", ket: "Nama, tema gelap, ekspor data" },
];

export default function Lainnya() {
  const router = useRouter();
  const supabase = getSupabase();

  async function keluar() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div>
      <Judul anak="Lainnya" keterangan="Pengaturan dan alat bantu" />
      <div className="space-y-3">
        {menu.map((m) => (
          <Link key={m.href} href={m.href} className="frame flex items-center gap-3 p-4 press">
            <span className="text-2xl">{m.ikon}</span>
            <div className="flex-1">
              <p className="font-medium">{m.judul}</p>
              <p className="text-xs text-muted">{m.ket}</p>
            </div>
          </Link>
        ))}
      </div>
      <button onClick={keluar} className="btn mt-8 w-full">Keluar dari akun</button>
      <p className="mt-6 text-center text-xs text-muted num">Duit Kita v1.0</p>
    </div>
  );
}
