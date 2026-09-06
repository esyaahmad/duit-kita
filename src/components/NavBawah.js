"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  { href: "/dashboard", label: "Beranda", ikon: "🏠" },
  { href: "/transaksi", label: "Transaksi", ikon: "🧾" },
  { href: "/anggaran", label: "Anggaran", ikon: "🎚️" },
  { href: "/lainnya", label: "Lainnya", ikon: "⋯" },
];

export default function NavBawah() {
  const path = usePathname();

  return (
    <>
      <Link
        href="/transaksi#baru"
        aria-label="Catat transaksi"
        className="fixed bottom-[88px] right-4 z-30 flex h-14 w-14 items-center justify-center border-2 border-line text-2xl press"
        style={{ background: "var(--mustard)", boxShadow: "3px 3px 0 var(--shadow)", color: "#201d1a" }}
      >
        +
      </Link>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-line bg-surface">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {menu.map((m) => {
            const aktif = path.startsWith(m.href);
            return (
              <Link
                key={m.href}
                href={m.href}
                className="flex flex-col items-center gap-0.5 px-2 py-3 text-xs"
                style={{
                  color: aktif ? "var(--ink)" : "var(--muted)",
                  background: aktif ? "color-mix(in srgb, var(--teal) 14%, transparent)" : "transparent",
                }}
              >
                <span className="text-lg leading-none">{m.ikon}</span>
                <span className={aktif ? "font-semibold" : ""}>{m.label}</span>
              </Link>
            );
          })}
        </div>
        <div style={{ height: "env(safe-area-inset-bottom)" }} />
      </nav>
    </>
  );
}
