"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Ikon from "./Ikon";

const menu = [
  { href: "/dashboard", label: "Beranda", ikon: "beranda" },
  { href: "/transaksi", label: "Transaksi", ikon: "transaksi" },
  { href: "/anggaran", label: "Anggaran", ikon: "anggaran" },
  { href: "/lainnya", label: "Lainnya", ikon: "lainnya" },
];

export default function NavBawah() {
  const path = usePathname();

  return (
    <>
      <Link href="/transaksi#baru" aria-label="Catat transaksi" className="fab">
        <Ikon nama="tambah" size="1.6em" />
      </Link>

      <nav className="nav-bawah">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {menu.map((m) => {
            const aktif = path.startsWith(m.href);
            return (
              <Link
                key={m.href}
                href={m.href}
                aria-current={aktif ? "page" : undefined}
                className={`nav-item ${aktif ? "nav-item-aktif" : ""}`}
              >
                <span className="nav-ikon"><Ikon nama={m.ikon} /></span>
                <span>{m.label}</span>
              </Link>
            );
          })}
        </div>
        <div style={{ height: "env(safe-area-inset-bottom)" }} />
      </nav>
    </>
  );
}
